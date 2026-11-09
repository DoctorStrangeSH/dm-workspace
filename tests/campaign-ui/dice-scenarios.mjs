export async function diceScenarios(scenario, expect, output) {
  for (const [lang, theme, session, mobile, role] of [
    ['ru', 'dark', false, false, 'dm'],
    ['en', 'light', false, true, 'player'],
    ['ru', 'light', true, true, 'player'],
    ['en', 'dark', true, false, 'dm'],
  ]) {
    await scenario(
      'dice workbench ' + [lang, theme, session, role].join(' '),
      {
        url: (session ? '/session' : '/') + '?lang=' + lang + '&theme=' + theme + '&role=' + role,
        mobile,
        width: 320,
      },
      async (page) => {
        const panel = page.locator(session ? '#campaign-session-chat' : '#campaign-chat')
        if (!session || mobile)
          await page
            .getByRole('button', { name: lang === 'ru' ? 'Чат' : 'Chat', exact: true })
            .first()
            .click()
        else
          await page
            .getByRole('button', {
              name: lang === 'ru' ? 'Показать чат' : 'Show chat',
              exact: true,
            })
            .click()
        await panel
          .getByRole('button', {
            name: lang === 'ru' ? 'Бросить кубики' : 'Roll dice',
            exact: true,
          })
          .click()
        const count = panel.getByRole('textbox', {
          name: lang === 'ru' ? 'Количество' : 'Count',
          exact: true,
        })
        const bonus = panel.getByRole('textbox', {
          name: lang === 'ru' ? 'Бонус' : 'Bonus',
          exact: true,
        })
        await count.fill('2')
        await bonus.fill('-')
        await expect(bonus).toHaveValue('-')
        await expect(bonus).toHaveAttribute('aria-invalid', 'true')
        await expect(
          panel.getByRole('button', { name: lang === 'ru' ? 'Бросить d6' : 'Roll d6', exact: true })
        ).toBeDisabled()
        await bonus.fill('3')
        await page.evaluate(() => {
          let n = 0
          Math.random = () => (n++ % 2 ? 0.999 : 0)
          window.__uiLab.delay = 600
        })
        const ordinary = panel.getByRole('button', {
          name: lang === 'ru' ? 'Бросить 2d6+3' : 'Roll 2d6+3',
          exact: true,
        })
        await ordinary.evaluate((button) => {
          button.click()
          button.click()
        })
        await expect(ordinary).toBeDisabled()
        await expect(count).toBeDisabled()
        await expect(ordinary).toBeEnabled()
        await expect.poll(() => page.evaluate(() => window.__uiLab.sentRolls.length)).toBe(1)
        const normal = await page.evaluate(() => window.__uiLab.sentRolls[0].roll)
        expect(normal).toMatchObject({ expression: '2d6+3', rolls: [1, 6], total: 10, modifier: 3 })
        for (const [mode, expected] of [
          ['advantage', 23],
          ['disadvantage', 4],
        ]) {
          const name =
            lang === 'ru'
              ? mode === 'advantage'
                ? /^С преимуществом: бросить/
                : /^С помехой: бросить/
              : mode === 'advantage'
                ? /^Advantage: roll/
                : /^Disadvantage: roll/
          const special = panel.getByRole('button', { name })
          await special.focus()
          await page.keyboard.press('Enter')
          await expect(special).toBeDisabled()
          await expect(special).toBeEnabled()
          const roll = await page.evaluate(() => window.__uiLab.sentRolls.at(-1).roll)
          expect(roll).toMatchObject({
            rolls: [1, 20],
            total: expected,
            modifier: 3,
            advantage: mode === 'advantage',
            disadvantage: mode === 'disadvantage',
          })
          await expect(panel.getByRole('log')).toContainText(
            lang === 'ru'
              ? mode === 'advantage'
                ? 'выбрано большее'
                : 'выбрано меньшее'
              : mode === 'advantage'
                ? 'higher kept'
                : 'lower kept'
          )
        }
        await count.fill('')
        await expect(
          panel.getByRole('button', {
            name: lang === 'ru' ? 'Бросить d20' : 'Roll d20',
            exact: true,
          })
        ).toBeDisabled()
        // A d20 check is independent of the general dice count, as its description states.
        await expect(
          panel.getByRole('button', {
            name: lang === 'ru' ? /^С преимуществом: бросить/ : /^Advantage: roll/,
          })
        ).toBeEnabled()
        await count.fill('20')
        await bonus.fill('-100')
        await expect(
          panel.getByRole('button', {
            name: lang === 'ru' ? 'Бросить 20d100-100' : 'Roll 20d100-100',
            exact: true,
          })
        ).toBeEnabled()
        expect(await page.evaluate(() => window.__uiLab.sentRolls.length)).toBe(3)
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
          false
        )
        expect(await panel.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(false)
        await count.fill('1')
        await bonus.fill('3')
        await count.evaluate((el) => {
          el.closest('[id]').scrollTop = 0
        })
        expect(await panel.evaluate((el) => el.scrollHeight > el.clientHeight + 1)).toBe(false)
        const inputBounds = await panel
          .getByRole('textbox', { name: lang === 'ru' ? 'Сообщение…' : 'Message…' })
          .boundingBox()
        const panelBounds = await panel.boundingBox()
        expect(inputBounds.y + inputBounds.height).toBeLessThanOrEqual(
          panelBounds.y + panelBounds.height + 1
        )
        await page.screenshot({ path: output + '/dice-' + lang + '-' + theme + '.png' })
      }
    )
  }
  for (const session of [false, true])
    await scenario(
      'dice uncertain delivery does not resend and preserves the draft',
      { mobile: true, width: 320, url: session ? '/session' : '/' },
      async (page) => {
        await page.getByRole('button', { name: 'Чат', exact: true }).first().click()
        const panel = page.locator(session ? '#campaign-session-chat' : '#campaign-chat')
        await panel.getByRole('button', { name: 'Бросить кубики', exact: true }).click()
        await panel.getByRole('textbox', { name: 'Бонус', exact: true }).fill('-5')
        await page.evaluate(() => {
          window.__uiLab.throwNextMessage = true
        })
        await panel.getByRole('button', { name: 'Бросить 1d20-5', exact: true }).click()
        await expect(panel.getByRole('alert')).toContainText('Проверьте чат')
        await expect(panel.getByRole('textbox', { name: 'Бонус', exact: true })).toHaveValue('-5')
        expect(await page.evaluate(() => window.__uiLab.sentRolls.length)).toBe(1)
        expect(await panel.getByRole('log').innerText()).not.toContain('1d20-5')
        await page.evaluate(() => {
          window.__uiLab.failNext = true
        })
        await panel.getByRole('button', { name: 'Бросить 1d20-5', exact: true }).click()
        await expect(panel.getByRole('alert')).toContainText('Synthetic send failure')
        expect(await page.evaluate(() => window.__uiLab.sentRolls.length)).toBe(2)
        await panel.getByRole('button', { name: 'Бросить 1d20-5', exact: true }).click()
        await expect(panel.getByRole('alert')).toHaveCount(0)
        await expect(panel.getByRole('log')).toContainText('1d20-5')
        expect(await page.evaluate(() => window.__uiLab.sentRolls.length)).toBe(3)
      }
    )
}
