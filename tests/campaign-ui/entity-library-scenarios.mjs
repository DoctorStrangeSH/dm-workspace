export async function entityLibraryScenarios(scenario, expect, output) {
  await scenario(
    'entity library combines search, type, visibility, sorting and reset',
    { url: '/?screen=entities' },
    async (page) => {
      const library = page.getByRole('region', { name: 'Библиотека кампании' })
      const cards = library.getByTestId('entity-library-results').getByRole('link')
      await expect(cards).toHaveCount(4)
      await expect(cards.first()).toContainText('Секрет')
      await library.getByLabel('Сортировка', { exact: true }).selectOption('name')
      await expect(cards.first()).toContainText('Альма')
      await library.getByLabel('Поиск по библиотеке').fill('  СТАРОЙ   торговка ')
      await expect(cards).toHaveCount(1)
      await expect(cards.first()).toContainText('Альма')
      await library.getByRole('button', { name: 'Сбросить фильтры' }).click()
      await library.getByLabel('Доступ игроков').selectOption('hidden')
      await expect(cards).toHaveCount(1)
      await library.getByLabel('Поиск по библиотеке').fill('ждет')
      await expect(cards).toHaveCount(1)
      await library.getByRole('button', { name: /Заметка/ }).click()
      await expect(cards).toHaveCount(1)
      await library.getByRole('button', { name: /Локация/ }).click()
      await expect(library.getByText('Ничего не найдено')).toBeVisible()
      await library.getByRole('button', { name: 'Сбросить фильтры' }).click()
      await expect(cards).toHaveCount(4)
      await library.screenshot({ path: `${output}/entity-library-ru-desktop.png` })
    }
  )
  await scenario(
    'entity library honours initial quest filter and creates that type',
    { url: '/?screen=entities&quest' },
    async (page) => {
      const library = page.getByRole('region', { name: 'Библиотека кампании' })
      await expect(library.getByTestId('entity-library-results').getByRole('link')).toHaveCount(1)
      await library.getByRole('button', { name: 'Новая сущность' }).click()
      const dialog = page.getByRole('dialog', { name: 'Новая сущность' })
      await expect(dialog.getByRole('button', { name: /Квест/ })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      await dialog.getByRole('textbox').first().fill('Новое задание')
      await dialog.getByRole('button', { name: 'Создать', exact: true }).click()
      await expect
        .poll(() => page.evaluate(() => window.__uiLab.entityCreates))
        .toEqual([{ campaignId: 'test', type: 'quest' }])
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('Synthetic save error')).toBeVisible()
    }
  )
  await scenario(
    'player library excludes hidden search and counts and has no creation',
    { url: '/?screen=entities&role=player&lang=en&theme=light', mobile: true, width: 320 },
    async (page) => {
      const library = page.getByRole('region', { name: 'Campaign library' })
      await expect(library.getByRole('status')).toHaveText('Showing 3 of 3')
      await expect(library.getByRole('button', { name: 'New entity' })).toHaveCount(0)
      await expect(library.getByLabel('Player access')).toHaveCount(0)
      await library.getByLabel('Search library').fill('Secret')
      await expect(library.getByText('No matches', { exact: true })).toBeVisible()
      await expect(library.getByText('Секрет Secret', { exact: true })).toHaveCount(0)
      await library.getByRole('button', { name: 'Reset filters' }).click()
      await library.screenshot({ path: `${output}/entity-library-en-mobile.png` })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      )
    }
  )
  await scenario(
    'empty library keeps creation reachable on narrow devices',
    { url: '/?screen=entities&empty', mobile: true, width: 320 },
    async (page) => {
      const library = page.getByRole('region', { name: 'Библиотека кампании' })
      await expect(library.getByText('Пока нет ни одной сущности')).toBeVisible()
      await library.getByRole('button', { name: /Локация/ }).click()
      await library.getByRole('button', { name: 'Новая сущность' }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByRole('button', { name: /Локация/ })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      )
    }
  )
}
