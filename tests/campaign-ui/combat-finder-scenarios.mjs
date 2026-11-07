import path from 'node:path'

export async function combatFinderScenarios(scenario, expect, output) {
  for (const lang of ['ru', 'en'])
    for (const mobile of [false, true]) {
      const ru = lang === 'ru'
      await scenario(
        'combat finder combines name, condition and source filters ' + lang + ' ' + mobile,
        {
          mobile,
          width: 320,
          url:
            '/?screen=map&mapImage&combat&current&manyTokens&withConditions&lang=' +
            lang +
            (ru ? '' : '&theme=light'),
        },
        async (page) => {
          const timeline = page.getByRole('region', { name: ru ? 'Лента ходов' : 'Turn timeline' })
          const current = timeline.locator('[aria-current="step"]')
          await expect(current).toContainText(ru ? 'Отравлен' : 'Poisoned')
          await expect(current).toContainText('+2')
          await expect(current.getByRole('button')).toHaveAccessibleName(
            /Благословение серебряной луны/
          )
          await timeline.getByRole('button', { name: ru ? 'Панель боя' : 'Combat panel' }).click()
          const panel = page.getByRole('complementary', {
            name: ru ? 'Порядок ходов' : 'Turn order',
          })
          const list = panel.getByRole('list', {
            name: ru ? 'Участники боя' : 'Combat participants',
          })
          const search = panel.getByRole('searchbox', {
            name: ru ? 'Найти участника' : 'Find a participant',
          })
          const kind = panel.getByRole('group', {
            name: ru ? 'Фильтры участников' : 'Participant filters',
          })
          await expect(list.getByRole('listitem')).toHaveCount(11)
          await expect(
            kind.getByRole('button', { name: ru ? 'Персонажи 3' : 'Characters 3', exact: true })
          ).toBeVisible()
          await search.fill('  ОРК   ')
          await expect(list.getByRole('listitem')).toHaveCount(1)
          await expect(list).toContainText('#6')
          await expect(list).toContainText('Орк-ветеран')
          await expect(list).toContainText(ru ? 'Отравлен' : 'Poisoned')
          await expect(panel).toContainText(ru ? 'Показано 1 из 11' : 'Showing 1 of 11')
          await expect(
            panel.getByRole('button', { name: ru ? 'Следующий ход' : 'Next turn', exact: true })
          ).toBeEnabled()
          // Search does not choose a new turn or roll an initiative.
          expect(await page.evaluate(() => window.__turnEntries.find((e) => e.is_current).id)).toBe(
            'battle-entry-0'
          )
          await search.fill(ru ? 'отравлён' : 'poisoned')
          await expect(list.getByRole('listitem')).toHaveCount(2)
          await kind
            .getByRole('button', { name: ru ? 'Существа 8' : 'Creatures 8', exact: true })
            .click()
          await expect(list.getByRole('listitem')).toHaveCount(1)
          await expect(list).toContainText('Орк-ветеран')
          await panel
            .getByRole('button', { name: ru ? 'Со состояниями' : 'With conditions', exact: true })
            .click()
          await expect(list.getByRole('listitem')).toHaveCount(1)
          await search.fill('Волк')
          await expect(list.getByRole('listitem')).toHaveCount(0)
          await expect(panel).toContainText(ru ? 'Участники не найдены' : 'No participants match')
          await panel
            .getByRole('button', { name: ru ? 'Сбросить фильтры' : 'Reset filters', exact: true })
            .click()
          await expect(search).toBeFocused()
          await expect(search).toHaveValue('')
          await expect(list.getByRole('listitem')).toHaveCount(11)
          await expect(
            kind.getByRole('button', { name: ru ? 'Все 11' : 'All 11', exact: true })
          ).toHaveAttribute('aria-pressed', 'true')
          await expect(
            panel.getByRole('button', {
              name: ru ? 'Со состояниями' : 'With conditions',
              exact: true,
            })
          ).toHaveAttribute('aria-pressed', 'false')
          await search.fill(ru ? 'схвачен' : 'grappled')
          await expect(list.getByRole('listitem')).toHaveCount(1)
          await expect(list).toContainText('Благословение серебряной луны')
          await search.scrollIntoViewIfNeeded()
          await page.screenshot({
            path: path.join(
              output,
              'combat-finder-' + lang + (mobile ? '-mobile' : '-desktop') + '.png'
            ),
          })
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          for (const button of await panel.getByRole('button').all()) {
            const box = await button.boundingBox()
            if (box) expect(box.height).toBeGreaterThanOrEqual(43)
          }
          expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
        }
      )
    }
  await scenario(
    'combat finder retains filters as server participants and current turn change',
    {
      url: '/?screen=map&combat&current&manyTokens&withConditions',
    },
    async (page) => {
      await page
        .getByRole('region', { name: 'Лента ходов' })
        .getByRole('button', { name: 'Панель боя' })
        .click()
      const panel = page.getByRole('complementary', { name: 'Порядок ходов' })
      const list = panel.getByRole('list', { name: 'Участники боя' })
      const search = panel.getByRole('searchbox', { name: 'Найти участника' })
      await search.fill('новый')
      await expect(list.getByRole('listitem')).toHaveCount(0)
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-turn-data', {
            detail: window.__turnEntries.map((e, i) => ({
              ...e,
              is_current: i === 4,
              token:
                i === 4
                  ? { ...e.token, name: 'Новый участник', conditions: [{ name: 'restrained' }] }
                  : e.token,
            })),
          })
        )
      )
      await expect(search).toHaveValue('новый')
      await expect(list.getByRole('listitem')).toHaveCount(1)
      await expect(list.locator('[aria-current="step"]')).toHaveAttribute(
        'data-entry-id',
        'battle-entry-4'
      )
      await expect(list).toContainText('#5')
      await expect(list).toContainText('Опутан')
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-turn-data', {
            detail: window.__turnEntries.filter((e) => e.id !== 'battle-entry-4'),
          })
        )
      )
      await expect(list.getByRole('listitem')).toHaveCount(0)
      await expect(panel).toContainText('Показано 0 из 10')
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'combat finder never includes a hidden player participant in counts, search or conditions',
    {
      url: '/?screen=map&combat&current&turn=3&manyTokens&withConditions&hideEnemy&role=player&lang=en',
    },
    async (page) => {
      const timeline = page.getByRole('region', { name: 'Turn timeline' })
      await expect(timeline).not.toContainText('Secret hidden omen')
      await timeline.getByRole('button', { name: 'Combat panel' }).click()
      const panel = page.getByRole('complementary', { name: 'Turn order' })
      const list = panel.getByRole('list', { name: 'Combat participants' })
      const search = panel.getByRole('searchbox', { name: 'Find a participant' })
      await expect(panel).toContainText('Showing 10 of 10')
      await expect(panel.getByRole('button', { name: 'Creatures 7', exact: true })).toBeVisible()
      await search.fill('Secret hidden omen')
      await expect(list.getByRole('listitem')).toHaveCount(0)
      await expect(panel).toContainText('Showing 0 of 10')
      await expect(panel.locator('[data-entry-id="battle-entry-3"]')).toHaveCount(0)
      await expect(panel.getByRole('button', { name: 'Next turn', exact: true })).toHaveCount(0)
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-turn-data', {
            detail: window.__turnEntries.map((e) => ({
              ...e,
              token: { ...e.token, is_hidden: true },
            })),
          })
        )
      )
      await expect(panel).toContainText('Participants are currently hidden by the DM.')
      await expect(panel).toContainText('Showing 0 of 0')
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'combat condition display tolerates malformed data and preserves custom labels without translation keys',
    {
      url: '/?screen=map&combat&current&manyTokens',
    },
    async (page) => {
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-turn-data', {
            detail: [
              {
                ...window.__turnEntries[0],
                token: {
                  ...window.__turnEntries[0].token,
                  conditions: [
                    null,
                    {},
                    'poisoned',
                    { name: 12 },
                    { name: '' },
                    { name: '  poisoned ' },
                    { name: 'POISONED' },
                    { name: 'A very long custom blessing '.repeat(10) },
                    { name: 'grappled' },
                  ],
                },
              },
              {
                ...window.__turnEntries[1],
                token: { ...window.__turnEntries[1].token, conditions: null },
              },
            ],
          })
        )
      )
      const timeline = page.getByRole('region', { name: 'Лента ходов' })
      await expect(timeline).toContainText('Отравлен')
      await expect(timeline.locator('[data-entry-id="battle-entry-0"]')).toContainText('+1')
      await timeline.getByRole('button', { name: 'Панель боя' }).click()
      const panel = page.getByRole('complementary', { name: 'Порядок ходов' })
      const list = panel.getByRole('list', { name: 'Участники боя' })
      await expect(list.getByText('Отравлен', { exact: true })).toHaveCount(1)
      await expect(list).not.toContainText('condition.')
      await panel.getByRole('searchbox').fill('very long custom')
      await expect(list.getByRole('listitem')).toHaveCount(1)
      await expect(list).toContainText('Схвачен')
      // Multiple current entries are a conflict, not a highlighted arbitrary participant.
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-turn-data', {
            detail: window.__turnEntries.map((e) => ({ ...e, is_current: true })),
          })
        )
      )
      await expect(list.locator('[aria-current="step"]')).toHaveCount(0)
      await expect(panel.getByRole('button', { name: 'Начать первый ход' })).toBeDisabled()
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
}
