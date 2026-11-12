export async function generatorScenarios(scenario, expect, output) {
  await scenario(
    'generator clipboard unavailable in English and keyboard retry',
    { url: '/?screen=generators&lang=en&theme=light' },
    async (page) => {
      await page.evaluate(() =>
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
      )
      const panel = page.getByRole('tabpanel')
      await panel.getByRole('button').first().click()
      const copy = panel.getByRole('button', { name: 'Copy', exact: true })
      await copy.focus()
      await page.keyboard.press('Enter')
      await expect(panel.getByRole('alert')).toContainText('Could not copy')
      await expect(copy).toBeEnabled()
      await page.evaluate(() =>
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText: async (text) => {
              window.lastCopy = text
            },
          },
        })
      )
      await page.keyboard.press('Enter')
      await expect(panel.getByRole('button', { name: 'Copied', exact: true })).toBeVisible()
      expect(await page.evaluate(() => window.lastCopy)).toContain('Treasure')
    }
  )
  await scenario(
    'generator new result resets clipboard feedback without replacing other tools',
    { url: '/?screen=generators&lang=en' },
    async (page) => {
      await page.evaluate(() =>
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: async () => {} },
        })
      )
      await page.getByRole('tab').nth(3).click()
      const panel = page.getByRole('tabpanel')
      await page.evaluate(() => {
        Math.random = () => 0
      })
      await panel.getByRole('button').first().click()
      await expect(panel.locator('h3')).toHaveText('d100 = 1')
      await panel.getByRole('button', { name: 'Copy', exact: true }).click()
      await expect(panel.getByRole('button', { name: 'Copied', exact: true })).toBeVisible()
      await page.evaluate(() => {
        Math.random = () => 0.99
      })
      await panel.getByRole('button').first().click()
      await expect(panel.locator('h3')).toHaveText('d100 = 100')
      await expect(panel.getByRole('button', { name: 'Copy', exact: true })).toBeVisible()
    }
  )
  for (const [lang, theme, mobile] of [
    ['ru', 'dark', false],
    ['en', 'light', true],
    ['ru', 'light', true],
    ['en', 'dark', false],
  ]) {
    await scenario(
      `generator workbench retains all results ${lang} ${theme}`,
      { url: `/?screen=generators&lang=${lang}&theme=${theme}`, mobile, width: 320 },
      async (page) => {
        const tabs = page.getByRole('tab')
        await expect(tabs).toHaveCount(5)
        const snapshots = []
        for (let i = 0; i < 5; i++) {
          await tabs.nth(i).click()
          const panel = page.getByRole('tabpanel')
          await expect(panel).toHaveCount(1)
          const select = panel.getByRole('combobox').first()
          if (await select.count()) await select.selectOption({ index: 1 })
          await panel.getByRole('button').first().click()
          await expect(
            panel.getByRole('button', { name: lang === 'ru' ? 'Копировать' : 'Copy', exact: true })
          ).toBeVisible()
          snapshots.push({
            text: await panel.innerText(),
            value: (await select.count()) ? await select.inputValue() : null,
          })
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
        }
        for (let i = 0; i < 5; i++) {
          await tabs.nth(i).click()
          const panel = page.getByRole('tabpanel')
          expect(await panel.innerText()).toBe(snapshots[i].text)
          if (snapshots[i].value)
            await expect(panel.getByRole('combobox').first()).toHaveValue(snapshots[i].value)
        }
        await tabs.nth(0).click()
        await page.screenshot({ path: `${output}/generators-${lang}-${theme}.png`, fullPage: true })
        await page.reload()
        await expect(
          page
            .getByRole('tabpanel')
            .getByRole('button', { name: lang === 'ru' ? 'Копировать' : 'Copy', exact: true })
        ).toHaveCount(0)
      }
    )
  }
  await scenario(
    'generator keyboard navigation and associated panels',
    { url: '/?screen=generators&lang=en' },
    async (page) => {
      const tabs = page.getByRole('tab')
      await tabs.first().focus()
      for (const [key, index] of [
        ['ArrowRight', 1],
        ['End', 4],
        ['ArrowRight', 0],
        ['ArrowLeft', 4],
        ['Home', 0],
      ]) {
        await page.keyboard.press(key)
        await expect(tabs.nth(index)).toBeFocused()
        await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true')
        const panel = page.getByRole('tabpanel')
        await expect(panel).toHaveAttribute(
          'id',
          await tabs.nth(index).getAttribute('aria-controls')
        )
        await expect(panel).toHaveAttribute(
          'aria-labelledby',
          await tabs.nth(index).getAttribute('id')
        )
      }
      await page.keyboard.press('Tab')
      await expect(page.getByRole('tabpanel')).toBeFocused()
    }
  )
  await scenario(
    'generator copy rejection pending double click and explicit retry',
    { url: '/?screen=generators&lang=ru&theme=light', mobile: true, width: 320 },
    async (page) => {
      await page.evaluate(() => {
        window.copyAttempts = []
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText(text) {
              window.copyAttempts.push(text)
              return new Promise((resolve, reject) => {
                window.finishCopy = resolve
                window.failCopy = () => reject(new Error('denied'))
              })
            },
          },
        })
      })
      const tabs = page.getByRole('tab')
      for (let i = 0; i < 5; i++) {
        await tabs.nth(i).click()
        const panel = page.getByRole('tabpanel')
        await panel.getByRole('button').first().click()
        const copy = panel.getByRole('button', { name: 'Копировать', exact: true })
        const headingBefore = await panel.locator('h3').innerText()
        await copy.evaluate((button) => {
          button.click()
          button.click()
        })
        await expect(
          panel.getByRole('button', { name: 'Копирование…', exact: true })
        ).toBeDisabled()
        expect(await page.evaluate(() => window.copyAttempts.length)).toBe(i * 2 + 1)
        await page.evaluate(() => window.failCopy())
        await expect(panel.getByRole('alert')).toContainText('Не удалось скопировать')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
        await copy.click()
        await page.evaluate(() => window.finishCopy())
        await expect(panel.getByRole('button', { name: 'Скопировано', exact: true })).toBeVisible()
        await expect(panel.getByRole('alert')).toHaveCount(0)
        const attempts = await page.evaluate(() => window.copyAttempts)
        expect(attempts[i * 2]).toBe(attempts[i * 2 + 1])
        expect(attempts[i * 2].length).toBeGreaterThan(10)
        expect(await panel.locator('h3').innerText()).toBe(headingBefore)
      }
    }
  )
}
