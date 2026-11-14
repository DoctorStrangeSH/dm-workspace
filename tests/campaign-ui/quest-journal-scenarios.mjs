export async function questJournalScenarios(scenario, expect, output) {
  for (const options of [
    { lang: 'ru', mobile: false, player: false },
    { lang: 'en', mobile: true, player: true },
    { lang: 'ru', mobile: true, player: false },
    { lang: 'en', mobile: false, player: true },
  ]) {
    const en = options.lang === 'en'
    await scenario(
      `quest journal filters and summary ${options.lang} ${options.mobile ? 'mobile' : 'desktop'}`,
      {
        mobile: options.mobile,
        width: 320,
        url: `/?screen=entities&questJournal&lang=${options.lang}&theme=${en ? 'light' : 'dark'}${options.player ? '&role=player' : ''}`,
      },
      async (page) => {
        const library = page.getByRole('region', {
          name: en ? 'Campaign library' : 'Библиотека кампании',
          exact: true,
        })
        const journal = page.getByRole('region', {
          name: en ? 'Quest journal' : 'Журнал заданий',
          exact: true,
        })
        const states = journal.getByRole('group', {
          name: en ? 'Quest state' : 'Состояние заданий',
        })
        const cards = library.getByTestId('entity-library-results').getByRole('link')
        await expect(cards).toHaveCount(options.player ? 6 : 7)
        await expect(cards.filter({ hasText: 'Caravan' }).getByRole('progressbar')).toHaveAttribute(
          'aria-valuenow',
          '1'
        )
        await expect(cards.filter({ hasText: 'Caravan' }).getByRole('progressbar')).toHaveAttribute(
          'aria-valuemax',
          '2'
        )
        await expect(library.getByText('Private objective detail')).toHaveCount(0)
        await states.getByRole('button', { name: en ? /No status/ : /Без статуса/ }).click()
        await expect(cards).toHaveCount(2)
        await expect(cards.filter({ hasText: 'Legacy' })).toHaveCount(1)
        const active = states.getByRole('button', { name: en ? /In progress/ : /В работе/ })
        await active.focus()
        await page.keyboard.press('Enter')
        await expect(active).toHaveAttribute('aria-pressed', 'true')
        await expect(cards).toHaveCount(options.player ? 1 : 2)
        const caravan = cards.filter({ hasText: 'Caravan' })
        await expect(caravan).toContainText('Альма Alma')
        await expect(caravan).toContainText('50 золотых Gold')
        await expect(caravan).toContainText('Старая башня Tower')
        await expect(caravan).toHaveAttribute('href', '/campaign/test/entities/active')
        const search = library.getByLabel(en ? 'Search library' : 'Поиск по библиотеке')
        for (const text of ['ALMA', 'tower', 'Gold']) {
          await search.fill(text)
          await expect(cards).toHaveCount(1)
        }
        await search.fill('Secret')
        if (options.player) {
          await expect(library.getByText('No matches', { exact: true })).toBeVisible()
          await expect(library.getByText('SECRET REWARD', { exact: true })).toHaveCount(0)
          await expect(library.getByRole('button', { name: 'New entity' })).toHaveCount(0)
        } else await expect(cards).toHaveCount(1)
        await search.fill('')
        for (const label of en
          ? ['Completed', 'On hold', 'Failed']
          : ['Завершены', 'Отложены', 'Провалены']) {
          await states.getByRole('button', { name: new RegExp(label) }).click()
          await expect(cards).toHaveCount(1)
        }
        await states.getByRole('button', { name: en ? /All quests/ : /Все задания/ }).click()
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({
          path: `${output}/quest-journal-${options.lang}-${options.mobile ? 'mobile' : 'desktop'}.png`,
        })
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
        await library
          .getByRole('button', { name: en ? 'Reset filters' : 'Сбросить фильтры' })
          .click()
        await library
          .getByRole('button', { name: en ? 'Quest journal' : 'Журнал заданий', exact: true })
          .click()
        await expect(
          states.getByRole('button', { name: en ? /All quests/ : /Все задания/ })
        ).toHaveAttribute('aria-pressed', 'true')
        expect(await page.evaluate(() => window.__uiLab.entityCreates)).toEqual([])
      }
    )
  }
}
