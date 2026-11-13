import path from 'node:path'

export async function compactCombatScenarios(scenario, expect, output) {
  await scenario(
    'compact combat scrolls with keyboard in a short viewport',
    { url: '/?screen=map&combat&current&manyTokens&lang=en' },
    async (page) => {
      await page.setViewportSize({ width: 844, height: 390 })
      const timeline = page.getByRole('region', { name: 'Turn timeline' })
      await timeline.getByRole('button', { name: 'Combat panel', exact: true }).click()
      const panel = page.getByRole('complementary', { name: 'Turn order' })
      const content = panel.getByRole('region', { name: 'Combat participants and settings' })
      await content.focus()
      await page.keyboard.press('PageDown')
      await expect.poll(() => content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
      await expect(panel.getByRole('button', { name: 'Next turn', exact: true })).toBeInViewport()
      expect((await content.boundingBox()).height).toBeGreaterThan(100)
      await page.keyboard.press('Escape')
      await expect(
        timeline.getByRole('button', { name: 'Combat panel', exact: true })
      ).toBeFocused()
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  for (const lang of ['ru', 'en']) {
    for (const mobile of [false, true]) {
      const ru = lang === 'ru'
      await scenario(
        `compact combat keeps controls reachable ${lang} ${mobile}`,
        {
          mobile,
          width: 320,
          url: `/?screen=map&combat&current&manyTokens&lang=${lang}&theme=${mobile ? 'light' : 'dark'}`,
        },
        async (page) => {
          const timeline = page.getByRole('region', { name: ru ? 'Лента ходов' : 'Turn timeline' })
          const density = timeline.getByRole('button', {
            name: ru ? 'Компактный вид' : 'Compact view',
            exact: true,
          })
          const list = timeline.getByRole('list')
          const ids = () =>
            list.getByRole('listitem').evaluateAll((items) => items.map((el) => el.dataset.entryId))
          const initial = await ids()
          await expect(density).toHaveAttribute('aria-pressed', 'true')
          const card = list.locator('[aria-current="step"]')
          const compactHeight = (await card.boundingBox()).height
          await density.click()
          await expect(density).toHaveAttribute('aria-pressed', 'false')
          expect((await card.boundingBox()).height).toBeGreaterThan(compactHeight)
          expect(await ids()).toEqual(initial)
          await density.focus()
          await page.keyboard.press('Space')
          await expect(density).toHaveAttribute('aria-pressed', 'true')
          await timeline.scrollIntoViewIfNeeded()
          await page.screenshot({
            path: path.join(output, `compact-combat-${lang}-${mobile ? 'mobile' : 'desktop'}.png`),
          })
          await timeline
            .getByRole('button', { name: ru ? 'Вся очередь' : 'Show all', exact: true })
            .click()
          expect(await ids()).toEqual(initial)
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          await timeline
            .getByRole('button', { name: ru ? 'Панель боя' : 'Combat panel', exact: true })
            .click()
          const panel = page.getByRole('complementary', {
            name: ru ? 'Порядок ходов' : 'Turn order',
          })
          const controls = panel.locator('[data-combat-controls]')
          const scroller = panel.locator('[data-combat-scroll]')
          const before = (await controls.boundingBox()).y
          await scroller.evaluate((el) => (el.scrollTop = el.scrollHeight))
          expect(await scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
          expect((await controls.boundingBox()).y).toBe(before)
          await expect(
            panel.getByRole('button', { name: ru ? 'Следующий ход' : 'Next turn', exact: true })
          ).toBeInViewport()
          const last = panel.getByRole('listitem').last()
          const focus = last
            .getByRole('button', { name: ru ? /Показать на карте/ : /Show on map/ })
            .first()
          // Keyboard focus scrolls the one content surface, without covering it with controls.
          await focus.focus()
          await expect(focus).toBeInViewport()
          expect((await focus.boundingBox()).y).toBeGreaterThanOrEqual(
            (await controls.boundingBox()).height
          )
          await page.screenshot({
            path: path.join(
              output,
              `compact-combat-panel-${lang}-${mobile ? 'mobile' : 'desktop'}.png`
            ),
          })
          expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
          await panel.getByRole('button', { name: ru ? 'Закрыть' : 'Close', exact: true }).click()
          await expect(
            timeline.getByRole('button', { name: ru ? 'Панель боя' : 'Combat panel', exact: true })
          ).toBeFocused()
          await expect(density).toHaveAttribute('aria-pressed', 'true')
        }
      )
    }
  }
  await scenario(
    'compact combat hides player secrets in either density',
    {
      mobile: true,
      width: 320,
      url: '/?screen=map&combat&current&turn=3&manyTokens&hideEnemy&role=player&lang=en',
    },
    async (page) => {
      const timeline = page.getByRole('region', { name: 'Turn timeline' })
      const density = timeline.getByRole('button', { name: 'Compact view', exact: true })
      for (let i = 0; i < 2; i++) {
        await expect(timeline.locator('[data-entry-id="battle-entry-3"]')).toHaveCount(0)
        await expect(timeline.locator('[aria-current="step"]')).toHaveCount(0)
        expect(await timeline.getByRole('listitem').count()).toBe(10)
        await density.click()
      }
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
}
