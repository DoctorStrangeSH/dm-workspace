async function hero(page, expect, ru) {
  await page.getByLabel(ru ? 'Имя персонажа' : 'Character name').fill('Sherlock')
  await page.getByLabel(ru ? /^Раса/ : /^Race/).selectOption('human')
  await page.getByLabel(ru ? /^Класс/ : /^Class/).selectOption('sorcerer')
  await page.getByLabel(ru ? 'Уровень' : 'Level', { exact: true }).fill('5')
  await page.getByRole('button', { name: ru ? 'Далее' : 'Next', exact: true }).click()
  await page
    .getByRole('button', {
      name: ru ? 'Распределить под мой класс' : 'Suggest scores for my class',
      exact: true,
    })
    .click()
  await expect(page.getByRole('button', { name: ru ? 'Далее' : 'Next', exact: true })).toBeEnabled()
}
async function skills(page, expect, ru) {
  await page.getByRole('button', { name: ru ? 'Далее' : 'Next', exact: true }).click()
  // Built-in background names remain source names in both interface languages.
  await page.getByRole('button', { name: 'Солдат', exact: true }).click()
  await page.getByRole('button', { name: ru ? 'Обман ХАР' : 'Deception CHA', exact: true }).click()
  await page
    .getByRole('button', { name: ru ? 'Проницательность МДР' : 'Insight WIS', exact: true })
    .click()
  await page.getByRole('button', { name: 'Послушник', exact: true }).click()
  await expect(
    page.getByRole('button', { name: ru ? 'Далее' : 'Next', exact: true })
  ).toBeDisabled()
  await page.getByRole('button', { name: ru ? 'Магия ИНТ' : 'Arcana INT', exact: true }).click()
  await page.getByRole('button', { name: ru ? 'Далее' : 'Next', exact: true }).click()
  await expect(page.getByText('HP', { exact: true }).locator('..')).toHaveText('HP32')
}
export async function preparationScenarios(scenario, expect, output) {
  await scenario(
    'preparation SRD class suggestion prioritizes casting ability',
    { url: '/?screen=character-create&lang=en' },
    async (page) => {
      await page.getByLabel('Character name').fill('Caster')
      await page.getByLabel(/^Race/).selectOption('srd-2024_human')
      await page.getByLabel(/^Class/).selectOption('srd-2024_sorcerer')
      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await page.getByRole('button', { name: 'Suggest scores for my class', exact: true }).click()
      const preview = page.getByRole('complementary', { name: 'Your hero', exact: true })
      await expect(preview.getByText('CHA', { exact: true }).locator('..')).toContainText('15')
      expect(await page.evaluate(() => window.__uiLab.createdCharacters)).toEqual([])
    }
  )
  for (const [lang, theme, mobile] of [
    ['ru', 'dark', false],
    ['en', 'light', true],
    ['ru', 'light', true],
    ['en', 'dark', false],
  ]) {
    const ru = lang === 'ru'
    await scenario(
      `preparation hero ${lang} ${theme}`,
      {
        url: `/?screen=character-create&catalog=fallback&lang=${lang}&theme=${theme}`,
        mobile,
        width: 320,
      },
      async (page) => {
        await hero(page, expect, ru)
        const preview = page.getByRole('complementary', {
          name: ru ? 'Твой герой' : 'Your hero',
          exact: true,
        })
        await expect(preview).toContainText('Sherlock')
        await expect(preview).toContainText('32')
        await page
          .getByRole('heading', { name: ru ? 'Характеристики' : 'Abilities', exact: true })
          .scrollIntoViewIfNeeded()
        await page.screenshot({ path: `${output}/preparation-hero-${lang}-${theme}.png` })
        await skills(page, expect, ru)
        await page
          .getByRole('button', { name: ru ? 'Создать персонажа' : 'Create character', exact: true })
          .click()
        await expect
          .poll(() => page.evaluate(() => window.__uiLab.createdCharacters.length))
          .toBe(1)
        const result = await page.evaluate(() => window.__uiLab.createdCharacters[0])
        expect(result.data.level).toBe(5)
        expect(result.data.hp.max).toBe(32)
        expect(new Set(result.data.proficientSkills).size).toBe(4)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
      }
    )
    await scenario(
      `preparation scenes ${lang} ${theme}`,
      { url: `/?screen=scene-library&lang=${lang}&theme=${theme}`, mobile, width: 320 },
      async (page) => {
        const scope = page.getByRole('group', { name: ru ? 'Тип сцены' : 'Scene type' })
        await scope
          .getByRole('button', { name: ru ? 'С картой' : 'With a map', exact: true })
          .click()
        await expect(
          page.getByRole('heading', { name: 'Ancient ruins', exact: true })
        ).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Observatory', exact: true })).toHaveCount(0)
        await page.getByLabel(ru ? 'Найти сцену' : 'Find a scene', { exact: true }).fill('missing')
        await expect(page.getByRole('status')).toContainText('0 / 3')
        await page
          .getByRole('button', { name: ru ? 'Сбросить фильтры' : 'Clear filters', exact: true })
          .click()
        await expect(page.getByRole('heading', { name: 'Observatory', exact: true })).toBeVisible()
        await page.screenshot({ path: `${output}/preparation-scenes-${lang}-${theme}.png` })
        expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
        await page.evaluate(() => {
          window.__uiLab.mapOutcome = 'error'
          window.__uiLab.mapDelay = 200
        })
        await page
          .getByRole('button', {
            name: ru ? 'Удалить сцену: Ancient ruins' : 'Delete scene: Ancient ruins',
            exact: true,
          })
          .click()
        const dialog = page.getByRole('dialog')
        await dialog
          .getByRole('button', { name: ru ? 'Удалить' : 'Delete', exact: true })
          .evaluate((b) => {
            b.click()
            b.click()
          })
        await expect(dialog.getByRole('alert')).toContainText('Offline')
        expect(await page.evaluate(() => window.__uiLab.mapActions.length)).toBe(1)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
      }
    )
  }
  for (const outcome of ['error', 'throw'])
    await scenario(
      `preparation creation ${outcome} retains draft and blocks duplicate submit`,
      { url: '/?screen=character-create&catalog=fallback&lang=ru', mobile: true, width: 320 },
      async (page) => {
        await hero(page, expect, true)
        await skills(page, expect, true)
        await page.evaluate((value) => {
          window.__uiLab.createOutcome = value
          window.__uiLab.createDelay = 200
        }, outcome)
        const button = page.getByRole('button', { name: 'Создать персонажа', exact: true })
        await button.evaluate((b) => {
          b.click()
          b.click()
        })
        await expect(page.getByRole('alert')).toContainText(
          outcome === 'error' ? 'Offline' : 'Не удалось подтвердить'
        )
        expect(await page.evaluate(() => window.__uiLab.createdCharacters.length)).toBe(1)
        expect(await page.evaluate(() => window.__uiLab.navigated)).toEqual([])
        if (outcome === 'throw') await expect(button).toBeDisabled()
        else await expect(button).toBeEnabled()
      }
    )
  for (const lang of ['ru', 'en'])
    await scenario(
      `preparation chapter starter ${lang}`,
      { url: `/?screen=chapter-start&lang=${lang}`, mobile: true, width: 320 },
      async (page) => {
        const title =
          lang === 'ru' ? 'Завязка: неожиданное приглашение' : 'Hook: an unexpected invitation'
        await page.getByRole('button', { name: new RegExp(title) }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog.getByLabel(lang === 'ru' ? 'Название' : 'Name')).toHaveValue(title)
        expect(await page.evaluate(() => window.__uiLab.chapterCreates)).toEqual([])
        await dialog
          .getByRole('button', { name: lang === 'ru' ? 'Создать' : 'Create', exact: true })
          .click()
        await expect(dialog.getByRole('alert')).toContainText('Offline')
        expect(await page.evaluate(() => window.__uiLab.chapterCreates)).toEqual([
          { campaignId: 'test', title },
        ])
        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
      }
    )
  await scenario(
    'preparation player scenes have no write controls',
    { url: '/?screen=scene-library&role=player&lang=en', mobile: true, width: 320 },
    async (page) => {
      await expect(
        page.getByRole('button', { name: /Delete scene|Activate|New scene/ })
      ).toHaveCount(0)
      await page
        .getByRole('group', { name: 'Scene type' })
        .getByRole('button', { name: 'Blank grid', exact: true })
        .click()
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'preparation standard suggestion and keyboard back navigation retain identity',
    { url: '/?screen=character-create&catalog=fallback&lang=en', mobile: true, width: 320 },
    async (page) => {
      await hero(page, expect, false)
      await page.getByRole('button', { name: 'Standard Array', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled()
      await page.getByRole('button', { name: 'Suggest scores for my class', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled()
      const steps = page.getByRole('navigation', { name: 'Character creation steps' })
      await steps.getByRole('button', { name: 'Basics', exact: true }).focus()
      await page.keyboard.press('Enter')
      await expect(page.getByLabel('Character name')).toHaveValue('Sherlock')
      await page.getByLabel('Level', { exact: true }).fill('1.5')
      await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled()
      expect(await page.evaluate(() => window.__uiLab.createdCharacters)).toEqual([])
    }
  )
}
