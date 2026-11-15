import path from 'node:path'

export async function rosterConditionsScenarios(scenario, expect, output) {
  for (const lang of ['ru', 'en'])
    for (const mobile of [false, true]) {
      const ru = lang === 'ru'
      await scenario(
        `roster conditions combined search filters live updates ${lang} ${mobile}`,
        { mobile, width: 320, url: '/?screen=map&mapImage&manyTokens&lang=' + lang },
        async (page) => {
          await page.evaluate(() =>
            window.dispatchEvent(
              new CustomEvent('offline-token-data', {
                detail: window.__turnEntries.map((entry, index) => ({
                  ...entry.token,
                  conditions:
                    index === 0
                      ? [{ name: 'POISONED' }, { name: 'poisoned' }, null, { name: 'Лунная метка' }]
                      : index === 3
                        ? [{ name: 'prone' }]
                        : [],
                })),
              })
            )
          )
          const roster = page.getByRole('complementary', {
            name: ru ? 'Участники сцены' : 'Scene participants',
          })
          const effects = roster.getByLabel(
            ru ? 'Состояния участников' : 'Participant conditions',
            { exact: true }
          )
          const search = roster.getByRole('searchbox')
          await expect(roster.getByRole('listitem')).toHaveCount(11)
          await expect(roster.getByText(ru ? 'Отравлен' : 'Poisoned', { exact: true })).toHaveCount(
            1
          )
          await effects.selectOption('affected')
          await expect(roster.getByRole('listitem')).toHaveCount(2)
          await roster.getByRole('button', { name: ru ? 'Герои' : 'Heroes', exact: true }).click()
          await expect(roster.getByRole('listitem')).toHaveCount(1)
          await search.fill(ru ? 'отравлен лунная' : 'poisoned лунная')
          await expect(roster.getByRole('listitem')).toHaveCount(1)
          const focus = roster.getByRole('listitem').getByRole('button')
          await expect(focus).toHaveAccessibleDescription(/Лунная метка/)
          await focus.click()
          await expect(
            page.getByRole('region', {
              name: ru
                ? 'Игровая карта — используйте стрелки для прокрутки'
                : 'Battle map — use arrow keys to scroll',
            })
          ).toBeFocused()
          await search.fill('unmatched condition')
          await expect(roster.getByRole('listitem')).toHaveCount(0)
          await expect(roster).toContainText(ru ? 'сбросьте фильтры' : 'reset the filters')
          await roster.getByRole('button', { name: ru ? 'Сбросить' : 'Reset', exact: true }).click()
          await expect(search).toHaveValue('')
          await expect(effects).toHaveValue('all')
          await expect(roster.getByRole('listitem')).toHaveCount(11)
          await effects.selectOption('clear')
          await expect(roster.getByRole('listitem')).toHaveCount(9)
          await page.evaluate(() =>
            window.dispatchEvent(
              new CustomEvent('offline-token-data', {
                detail: window.__turnEntries.map((entry) => ({
                  ...entry.token,
                  conditions: [{ name: 'blinded' }],
                })),
              })
            )
          )
          await expect(roster.getByRole('listitem')).toHaveCount(0)
          await effects.selectOption('affected')
          await expect(roster.getByRole('listitem')).toHaveCount(11)
          await expect(
            roster
              .getByRole('group', { name: ru ? 'Состояния' : 'Conditions', exact: true })
              .getByText(ru ? 'Ослеплён' : 'Blinded', { exact: true })
          ).toHaveCount(11)
          expect(await roster.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
          await page.screenshot({
            path: path.join(output, `roster-conditions-${lang}-${mobile}.png`),
            fullPage: true,
          })
        }
      )
    }
  await scenario(
    'roster conditions player excludes hidden and ignores malformed conditions',
    { url: '/?screen=map&manyTokens&role=player&lang=en' },
    async (page) => {
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-token-data', {
            detail: window.__turnEntries.map((entry, index) => ({
              ...entry.token,
              is_hidden: index === 0,
              name: index === 0 ? 'Secret enemy' : entry.token.name,
              conditions:
                index === 0
                  ? [{ name: 'Secret curse' }]
                  : index === 1
                    ? [null, {}, { name: 12 }, { name: ' ' }]
                    : null,
            })),
          })
        )
      )
      const roster = page.getByRole('complementary', { name: 'Scene participants' })
      await expect(roster.getByRole('listitem')).toHaveCount(10)
      await expect(roster).not.toContainText('Secret')
      await roster.getByLabel('Participant conditions', { exact: true }).selectOption('affected')
      await expect(roster.getByRole('listitem')).toHaveCount(0)
      await roster.getByLabel('Participant conditions', { exact: true }).selectOption('clear')
      await expect(roster.getByRole('listitem')).toHaveCount(10)
      await roster.getByRole('searchbox').fill('Secret')
      await expect(roster.getByRole('listitem')).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
}
