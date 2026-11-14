import path from 'node:path'

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
  'base64'
)
export async function sceneDeckScenarios(scenario, expect, output) {
  await scenario(
    'scene deck fullscreen prioritizes map and restores turn timeline',
    { url: '/?screen=map&mapImage&combat&current&manyTokens' },
    async (page) => {
      const timeline = page.getByRole('list', { name: 'Очередь инициативы' })
      const fullscreen = page.getByRole('button', {
        name: 'Полноэкранный игровой стол',
        exact: true,
      })
      await fullscreen.click()
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
      await expect(timeline).toBeHidden()
      const viewport = page.getByRole('region', {
        name: 'Игровая карта — используйте стрелки для прокрутки',
      })
      expect((await viewport.boundingBox()).height).toBeGreaterThan(750)
      await fullscreen.click()
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false)
      await expect(timeline).toBeVisible()
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  for (const lang of ['ru', 'en'])
    for (const mobile of [false, true]) {
      const ru = lang === 'ru'
      await scenario(
        `scene deck search, live roster and local focus ${lang} ${mobile}`,
        { mobile, width: 320, url: '/?screen=map&mapImage&combat&current&manyTokens&lang=' + lang },
        async (page) => {
          const roster = page.getByRole('complementary', {
            name: ru ? 'Участники сцены' : 'Scene participants',
          })
          await expect(roster.getByRole('listitem')).toHaveCount(11)
          await page.screenshot({
            path: path.join(output, `scene-deck-full-${lang}-${mobile}.png`),
            fullPage: true,
          })
          await roster.getByRole('button', { name: ru ? 'Герои' : 'Heroes', exact: true }).click()
          await expect(roster.getByRole('listitem')).toHaveCount(3)
          await roster
            .getByRole('button', { name: ru ? 'Существа' : 'Creatures', exact: true })
            .click()
          await expect(roster.getByRole('listitem')).toHaveCount(8)
          await roster.getByRole('button', { name: ru ? 'Все' : 'All', exact: true }).click()
          const name = await roster
            .getByRole('listitem')
            .first()
            .getByRole('button')
            .getAttribute('aria-label')
          const firstName = name.split(': ').slice(1).join(': ')
          await roster.getByRole('searchbox').fill(firstName)
          await expect(roster.getByRole('listitem')).toHaveCount(1)
          await roster.getByRole('listitem').getByRole('button').click()
          await expect(
            page.getByRole('region', {
              name: ru
                ? 'Игровая карта — используйте стрелки для прокрутки'
                : 'Battle map — use arrow keys to scroll',
            })
          ).toBeFocused()
          await roster.getByRole('searchbox').fill('no matches here')
          await expect(roster.getByRole('listitem')).toHaveCount(0)
          await roster.getByRole('searchbox').fill('')
          await page.evaluate(() =>
            window.dispatchEvent(
              new CustomEvent('offline-token-data', {
                detail: [{ ...window.__turnEntries[0].token, name: 'Новое имя' }],
              })
            )
          )
          await expect(roster.getByRole('listitem')).toHaveCount(1)
          await expect(roster).toContainText('Новое имя')
          const toggle = page.getByRole('button', {
            name: ru ? 'Участники' : 'Participants',
            exact: true,
          })
          await toggle.click()
          await expect(roster).toHaveCount(0)
          await toggle.click()
          await expect(roster).toBeVisible()
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
          await page.screenshot({
            path: path.join(output, `scene-deck-${lang}-${mobile}.png`),
            fullPage: true,
          })
        }
      )
    }
  await scenario(
    'scene deck hidden participants never appear for a player',
    { url: '/?screen=map&mapImage&manyTokens&role=player' },
    async (page) => {
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-token-data', {
            detail: window.__turnEntries.map((e, index) => ({
              ...e.token,
              is_hidden: index === 0,
              name: index === 0 ? 'Secret creature' : e.token.name,
            })),
          })
        )
      )
      await expect(page.getByRole('complementary', { name: 'Участники сцены' })).not.toContainText(
        'Secret creature'
      )
      await expect(page.locator('[data-token-id]')).toHaveCount(10)
    }
  )
  await scenario(
    'scene deck PNG preview, cancel and failed upload preserve retry',
    { url: '/?screen=map&mapImage' },
    async (page) => {
      await page.locator('[data-token-id]').first().press('Enter')
      const appearance = page.getByRole('region', { name: 'Внешний вид токена' })
      await appearance.locator('input[type=file]').setInputFiles({
        name: 'bad.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from('<svg/>'),
      })
      await expect(appearance.getByRole('alert')).toContainText('до 2 МБ')
      await appearance
        .locator('input[type=file]')
        .setInputFiles({ name: 'hero.png', mimeType: 'image/png', buffer: png })
      await expect(appearance.getByAltText('Предпросмотр токена')).toBeVisible()
      await expect(appearance.getByAltText('Предпросмотр токена')).toHaveCSS(
        'object-fit',
        'contain'
      )
      await appearance.getByRole('button', { name: 'Отмена', exact: true }).click()
      await expect(appearance.getByRole('button', { name: 'Сохранить изображение' })).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
      await appearance
        .locator('input[type=file]')
        .setInputFiles({ name: 'hero.png', mimeType: 'image/png', buffer: png })
      await page.evaluate(() => {
        window.__uiLab.mapOutcome = 'error'
      })
      await appearance.getByRole('button', { name: 'Сохранить изображение' }).click()
      await expect(appearance.getByRole('alert')).toContainText('Offline map action failed')
      await expect(appearance.getByRole('button', { name: 'Сохранить изображение' })).toBeEnabled()
      expect(await page.evaluate(() => window.__uiLab.mapActions.map((c) => c.name))).toEqual([
        'uploadTokenArt',
      ])
    }
  )
  await scenario(
    'scene deck owner saves PNG once and other tokens remain read only',
    { mobile: true, width: 320, url: '/?screen=map&mapImage&role=player&lang=en' },
    async (page) => {
      await page.locator('[data-token-id]').first().press('Enter')
      const appearance = page.getByRole('region', { name: 'Token appearance' })
      await appearance
        .locator('input[type=file]')
        .setInputFiles({ name: 'hero.png', mimeType: 'image/png', buffer: png })
      await appearance.getByRole('button', { name: 'Save image', exact: true }).click()
      await expect(appearance.getByRole('status')).toHaveText('Image saved')
      await expect(appearance.getByRole('button', { name: 'Save image', exact: true })).toHaveCount(
        0
      )
      expect(await page.evaluate(() => window.__uiLab.mapActions.map((c) => c.name))).toEqual([
        'uploadTokenArt',
      ])
      await page.getByRole('button', { name: 'Close', exact: true }).click()
      await page.locator('[data-token-id]').nth(1).press('Enter')
      await expect(appearance).toBeVisible()
      await expect(appearance.locator('input[type=file]')).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      )
    }
  )
}
