export async function characterWorkspaceScenarios(scenario, expect, output) {
  for (const [lang, theme, mobile] of [
    ['ru', 'dark', false],
    ['en', 'light', true],
    ['ru', 'light', true],
    ['en', 'dark', false],
  ]) {
    await scenario(
      `character play workspace layout and tactical tools ${lang} ${theme}`,
      {
        url: `/?screen=character-sheet&hp=valid&library=populated&workspace&lang=${lang}&theme=${theme}`,
        mobile,
        width: 320,
      },
      async (page) => {
        const ru = lang === 'ru'
        const dock = page.getByRole('complementary', {
          name: ru ? 'Панель действий' : 'Action panel',
          exact: true,
        })
        await dock.getByLabel(ru ? 'Режим броска d20' : 'd20 roll mode').selectOption('advantage')
        await page.evaluate(() => {
          const values = [0, 0.95]
          Math.random = () => values.shift() ?? 0.5
        })
        await dock.getByRole('button', { name: ru ? 'Атака +5' : 'Attack +5', exact: true }).click()
        await expect(dock.getByRole('status')).toContainText('25')
        await expect(dock.getByRole('status')).toContainText('[1, 20]')
        await dock
          .getByLabel(ru ? 'Режим броска d20' : 'd20 roll mode')
          .selectOption('disadvantage')
        await page.evaluate(() => {
          const values = [0, 0.95]
          Math.random = () => values.shift() ?? 0.5
        })
        await dock.getByRole('button', { name: ru ? 'Атака +5' : 'Attack +5', exact: true }).click()
        await expect(dock.getByRole('status')).toContainText('6')
        await page.evaluate(() => {
          Math.random = () => 0
        })
        await dock
          .getByRole('button', { name: ru ? 'Урон 1d8+3' : 'Damage 1d8+3', exact: true })
          .click()
        await expect(dock.getByRole('status')).toContainText('4')
        await dock
          .getByRole('button', { name: ru ? 'Урон 1d8+1d4' : 'Damage 1d8+1d4', exact: true })
          .click()
        await expect(dock.getByRole('alert')).toBeVisible()
        await dock.getByRole('heading', { level: 2 }).scrollIntoViewIfNeeded()
        await page.screenshot({ path: `${output}/character-actions-${lang}-${theme}.png` })
        const spells = page.getByRole('tab', { name: ru ? 'Заклинания' : 'Spells', exact: true })
        await spells.click()
        await page.getByRole('button', { name: 'Acid Arrow: Acid Arrow', exact: true }).click()
        const panel = page.getByRole('tabpanel')
        await expect(panel).toContainText(ru ? 'Воплощение' : 'Evocation')
        await expect(panel).toContainText(ru ? 'Мгновенно' : 'instantaneous')
        await expect(panel).toContainText(ru ? '90 фт' : '90 feet')
        await expect(panel).not.toContainText('school.')
        await panel
          .getByRole('group', { name: ru ? 'Тактический фильтр' : 'Tactical filter' })
          .getByRole('button', { name: ru ? 'Концентрация' : 'Concentration', exact: true })
          .click()
        await expect(panel.getByRole('button', { name: 'Focus: Focus', exact: true })).toBeVisible()
        await expect(
          panel.getByRole('button', { name: 'Acid Arrow: Acid Arrow', exact: true })
        ).toHaveCount(0)
        await panel
          .getByRole('group', { name: ru ? 'Тактический фильтр' : 'Tactical filter' })
          .getByRole('button', { name: ru ? 'Ритуалы' : 'Rituals', exact: true })
          .click()
        await expect(
          panel.getByRole('button', { name: 'Ritual: Ritual', exact: true })
        ).toBeVisible()
        await page.getByRole('tab', { name: ru ? 'Инвентарь' : 'Inventory', exact: true }).click()
        await panel
          .getByRole('group', { name: ru ? 'Все вещи' : 'All items', exact: true })
          .getByRole('button', { name: ru ? 'В рюкзаке' : 'Backpack', exact: true })
          .click()
        await expect(panel).toContainText('Healing potion')
        await expect(panel).not.toContainText('Moonblade')
        await panel.getByLabel(ru ? 'Порядок предметов' : 'Item order').selectOption('weight')
        await panel
          .getByRole('group', { name: ru ? 'Все вещи' : 'All items', exact: true })
          .scrollIntoViewIfNeeded()
        await page.screenshot({ path: `${output}/character-inventory-${lang}-${theme}.png` })
        await page.getByRole('tab', { name: ru ? 'Особенности' : 'Features', exact: true }).click()
        await expect(panel).toContainText('Second Wind')
        await expect(panel).toContainText('Darkvision')
        await panel.getByRole('heading', { level: 2 }).scrollIntoViewIfNeeded()
        await page.screenshot({ path: `${output}/character-features-${lang}-${theme}.png` })
        await spells.click()
        await expect(
          panel
            .getByRole('group', { name: ru ? 'Тактический фильтр' : 'Tactical filter' })
            .getByRole('button', { name: ru ? 'Ритуалы' : 'Rituals', exact: true })
        ).toHaveAttribute('aria-pressed', 'true')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
        await page.screenshot({
          path: `${output}/character-workspace-${lang}-${theme}.png`,
          fullPage: true,
        })
        if (!mobile)
          expect(
            await panel.evaluate((element) => element.getBoundingClientRect().width)
          ).toBeGreaterThan(600)
      }
    )
  }
  for (const outcome of ['error', 'throw', 'success']) {
    await scenario(
      `character abilities editor ${outcome} preserves CAS snapshot and drafts`,
      {
        url: '/?screen=character-sheet&hp=valid&library=populated&workspace&lang=en',
        mobile: true,
        width: 320,
      },
      async (page) => {
        await page.getByRole('tab', { name: 'Features', exact: true }).click()
        const panel = page.getByRole('tabpanel')
        await panel.getByRole('button', { name: 'Edit abilities', exact: true }).click()
        await panel
          .getByRole('textbox', { name: 'Character notes', exact: true })
          .fill('New play notes')
        await panel
          .getByRole('textbox', { name: 'Abilities 1', exact: true })
          .fill('Second Wind\nOnce per rest — track manually.')
        await panel.getByRole('button', { name: 'Add attack', exact: true }).click()
        await panel
          .getByRole('textbox', { name: 'Attack name', exact: true })
          .last()
          .fill('Unarmed strike')
        await panel.getByRole('textbox', { name: 'Attack bonus', exact: true }).last().fill('-')
        await panel.getByRole('button', { name: 'Save', exact: true }).click()
        await expect(panel.getByRole('alert')).toBeVisible()
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
        await panel.getByRole('textbox', { name: 'Attack bonus', exact: true }).last().fill('5')
        await page.getByRole('tab', { name: 'Inventory', exact: true }).click()
        await page.getByRole('tab', { name: 'Features', exact: true }).click()
        await expect(
          panel.getByRole('textbox', { name: 'Character notes', exact: true })
        ).toHaveValue('New play notes')
        await page.evaluate((value) => {
          window.__uiLab.sheetOutcome = value
          window.__uiLab.sheetDelay = 350
        }, outcome)
        await panel.getByRole('button', { name: 'Save', exact: true }).evaluate((button) => {
          button.click()
          button.click()
        })
        await expect(panel.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled()
        await expect.poll(() => page.evaluate(() => window.__uiLab.characterActions.length)).toBe(1)
        const call = await page.evaluate(() => window.__uiLab.characterActions[0])
        expect(call.name).toBe('updateCharacter')
        const payload = call.args[2]
        const original = await page.evaluate(() => window.__characterFixture.data_json)
        expect(payload.expected_data_json).toEqual(original)
        expect(payload.data_json.hp).toEqual(original.hp)
        expect(payload.data_json.spells).toEqual(original.spells)
        expect(payload.data_json.inventory).toEqual(original.inventory)
        expect(payload.data_json.notes).toBe('New play notes')
        expect(payload.data_json.attacks.at(-1).name).toBe('Unarmed strike')
        if (outcome === 'success') {
          await expect(panel.getByRole('status')).toContainText('Saved')
          await page.evaluate(
            (data) =>
              window.dispatchEvent(
                new CustomEvent('offline-character-data', {
                  detail: { ...window.__characterFixture, data_json: data },
                })
              ),
            payload.data_json
          )
          await expect(panel).toContainText('New play notes')
          await expect(
            page.getByRole('complementary', { name: 'Action panel', exact: true })
          ).toContainText('Unarmed strike')
        } else {
          await expect(panel.getByRole('alert')).toContainText(
            outcome === 'throw' ? 'Could not confirm' : 'Offline character'
          )
          await expect(
            panel.getByRole('textbox', { name: 'Character notes', exact: true })
          ).toHaveValue('New play notes')
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
      }
    )
  }
  await scenario(
    'character abilities editor rejects refreshed stale data locally',
    { url: '/?screen=character-sheet&hp=valid&workspace&lang=en' },
    async (page) => {
      await page.getByRole('tab', { name: 'Features', exact: true }).click()
      const panel = page.getByRole('tabpanel')
      await panel.getByRole('button', { name: 'Edit abilities', exact: true }).click()
      await panel.getByRole('textbox', { name: 'Character notes', exact: true }).fill('Local draft')
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-character-data', {
            detail: {
              ...window.__characterFixture,
              data_json: { ...window.__characterFixture.data_json, notes: 'Remote edit' },
            },
          })
        )
      )
      await panel.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(panel.getByRole('alert')).toContainText('character changed')
      await expect(
        panel.getByRole('textbox', { name: 'Character notes', exact: true })
      ).toHaveValue('Local draft')
      expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
    }
  )
  for (const url of ['&readonly=true&hp=valid', '&hp=string']) {
    await scenario(
      'character features editing gate ' + url,
      { url: '/?screen=character-sheet&workspace&lang=en' + url },
      async (page) => {
        await page.getByRole('tab', { name: 'Features', exact: true }).click()
        await expect(page.getByRole('button', { name: 'Edit abilities', exact: true })).toHaveCount(
          0
        )
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
      }
    )
  }
}
