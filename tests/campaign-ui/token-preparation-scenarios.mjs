import path from 'node:path'

export async function tokenPreparationScenarios(scenario, expect, output) {
  for (const lang of ['ru', 'en'])
    for (const mobile of [false, true]) {
      const ru = lang === 'ru'
      const add = ru ? 'Добавить токен' : 'Add token'
      const confirm = ru ? 'Добавить на сцену' : 'Add to scene'
      const monster = ru ? 'Монстр' : 'Monster'
      await scenario(
        `token preparation preview search cancel and confirm ${lang} ${mobile}`,
        { mobile, width: 320, url: '/?screen=map&mapImage&tokenPreparation&lang=' + lang },
        async (page) => {
          const trigger = page.getByRole('button', { name: ru ? 'Токен' : 'Token', exact: true })
          await trigger.click()
          const dialog = page.getByRole('dialog', { name: add, exact: true })
          await dialog.getByRole('button', { name: 'Zero hero', exact: true }).click()
          await expect(dialog).toContainText('HP 0 / 8')
          expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
          await page.keyboard.press('Escape')
          await expect(dialog).toHaveCount(0)
          await expect(trigger).toBeFocused()
          await trigger.click()
          await dialog.getByRole('button', { name: monster, exact: true }).click()
          await dialog.getByRole('searchbox').fill('dice')
          await expect(dialog.getByRole('listitem')).toHaveCount(1)
          await dialog.getByRole('button', { name: 'Dice goblin', exact: true }).click()
          await expect(dialog).toContainText('HP 13 / 13')
          await dialog
            .getByLabel(ru ? 'Имя на карте' : 'Map name', { exact: true })
            .fill('Gate guard')
          await dialog
            .getByLabel(ru ? 'Размер токена' : 'Token size', { exact: true })
            .selectOption('2')
          await dialog.getByRole('button', { name: ru ? 'Цвет 2' : 'Color 2', exact: true }).click()
          expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          const box = await dialog.boundingBox()
          expect(box.width).toBeLessThanOrEqual(mobile ? 320 : 1440)
          expect(box.height).toBeLessThanOrEqual(mobile ? 844 : 1000)
          await page.screenshot({
            path: path.join(output, `token-preparation-${lang}-${mobile}.png`),
            fullPage: true,
          })
          await dialog.getByRole('button', { name: confirm, exact: true }).click()
          await expect(dialog).toHaveCount(0)
          expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([
            {
              name: 'createToken',
              args: [
                'offline-scene',
                {
                  name: 'Gate guard',
                  x: 11,
                  y: 7,
                  size: 2,
                  color: '#38bdf8',
                  entityId: 'dice-monster',
                  hp_current: 13,
                  hp_max: 13,
                },
              ],
            },
          ])
        }
      )
    }
  await scenario(
    'token preparation errors preserve draft and uncertain result prevents duplicates',
    { url: '/?screen=map&tokenPreparation&lang=en' },
    async (page) => {
      await page.getByRole('button', { name: 'Token', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Add token', exact: true })
      await dialog.getByRole('button', { name: 'Custom', exact: true }).click()
      await dialog.getByLabel('Map name', { exact: true }).fill('Ally')
      const hp = dialog.getByLabel('HP (optional)', { exact: true })
      const submit = dialog.getByRole('button', { name: 'Add to scene', exact: true })
      await hp.fill('1.5')
      await expect(submit).toBeDisabled()
      await hp.fill('20')
      await page.evaluate(() => {
        window.__uiLab.mapOutcome = 'error'
      })
      await submit.click()
      await expect(dialog.getByRole('alert')).toContainText('Offline map action failed')
      await expect(dialog.getByLabel('Map name', { exact: true })).toHaveValue('Ally')
      await page.evaluate(() => {
        window.__uiLab.mapDeferred = true
        window.__uiLab.mapOutcome = 'throw'
      })
      await submit.click()
      await expect.poll(() => page.evaluate(() => window.__uiLab.mapPending.length)).toBe(1)
      await page.keyboard.press('Escape')
      await expect(dialog).toBeVisible()
      await expect(submit).toBeDisabled()
      await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled()
      await page.evaluate(() => window.__uiLab.mapPending[0].resolve())
      await expect(dialog.getByRole('alert')).toContainText('Could not confirm creation')
      await expect(submit).toBeDisabled()
      expect(await page.evaluate(() => window.__uiLab.mapActions.length)).toBe(2)
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
      await expect(dialog).toHaveCount(0)
    }
  )
  await scenario(
    'token preparation fullscreen invalid source and live occupied placement',
    { url: '/?screen=map&tokenPreparation&lang=en' },
    async (page) => {
      await page.getByRole('button', { name: 'Full screen battle table', exact: true }).click()
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
      await page
        .getByRole('complementary', { name: 'Scene participants' })
        .getByRole('button', { name: 'Add', exact: true })
        .click()
      const dialog = page.getByRole('dialog', { name: 'Add token', exact: true })
      expect(await dialog.evaluate((el) => document.fullscreenElement.contains(el))).toBe(true)
      await dialog.getByRole('button', { name: 'Monster', exact: true }).click()
      await dialog.getByRole('button', { name: 'Unknown creature', exact: true }).click()
      await expect(dialog).toContainText('Source HP could not be read')
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-token-data', {
            detail: [{ ...window.__turnEntries[0].token, x: 11, y: 7, size: 2 }],
          })
        )
      )
      await expect(dialog.getByRole('status')).not.toContainText('column 12, row 8')
      await dialog.getByRole('button', { name: 'Add to scene', exact: true }).click()
      const calls = await page.evaluate(() => window.__uiLab.mapActions)
      expect(calls).toHaveLength(1)
      expect(calls[0].args[1]).not.toHaveProperty('hp_current')
      expect(calls[0].args[1]).not.toHaveProperty('hp_max')
      expect(calls[0].args[1]).not.toMatchObject({ x: 11, y: 7 })
    }
  )
}
