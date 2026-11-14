export async function questObjectivesScenarios(scenario, expect, output) {
  for (const lang of ['ru', 'en']) {
    const en = lang === 'en'
    const title = en ? 'Quest objectives' : 'Цели задания'
    await scenario(
      `quest objectives save progress and retain drafts after conflict ${lang}`,
      {
        mobile: !en,
        width: 320,
        url: `/?screen=questObjectives&lang=${lang}${en ? '&theme=light' : ''}`,
      },
      async (page) => {
        const section = page.getByRole('region', { name: title })
        await expect(section.getByText(en ? '1 of 2 completed' : '1 из 2 выполнено')).toBeVisible()
        expect(await page.evaluate(() => window.__uiLab.entityUpdates)).toEqual([])
        await section.getByRole('checkbox', { name: 'Find the old tower' }).check()
        await expect
          .poll(async () => (await page.evaluate(() => window.__uiLab.entityUpdates)).length)
          .toBe(1)
        let request = await page.evaluate(() => window.__uiLab.entityUpdates[0])
        expect(request.expected.objectives[0].done).toBe(false)
        expect(request.data.data_json.objectives[0].done).toBe(true)
        expect(request.data.data_json.status).toBe('active')
        expect(request.data.data_json.notes).toBe('Existing notes')
        await section
          .getByRole('textbox', { name: en ? 'New objective' : 'Новая цель' })
          .fill('Recover the silver key')
        await section.getByRole('textbox').press('Enter')
        await expect
          .poll(async () => (await page.evaluate(() => window.__uiLab.entityUpdates)).length)
          .toBe(2)
        request = await page.evaluate(() => window.__uiLab.entityUpdates[1])
        expect(request.expected.objectives[0].done).toBe(true)
        expect(request.data.data_json.objectives).toHaveLength(3)
        await page.evaluate(() => {
          window.__uiLab.entitySaveFails = true
        })
        await section.getByRole('checkbox', { name: 'Recover the silver key' }).check()
        await expect(page.getByRole('alert')).toHaveText(
          'Synthetic conflict: copy edits and reload'
        )
        await expect(
          section.getByRole('checkbox', { name: 'Recover the silver key' })
        ).toBeChecked()
        await expect(section.getByText(en ? '3 of 3 completed' : '3 из 3 выполнено')).toBeVisible()
        await section.screenshot({ path: `${output}/quest-objectives-${lang}.png` })
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
        await page.evaluate(() => {
          window.__uiLab.entitySaveFails = false
        })
        await page.getByRole('button', { name: en ? 'Retry' : 'Повторить', exact: true }).click()
        await expect.poll(() => page.evaluate(() => window.__uiLab.entityUpdates.length)).toBe(4)
        const retried = await page.evaluate(() => window.__uiLab.entityUpdates.slice(2))
        expect(retried[1].expected).toEqual(retried[0].expected)
        expect(retried[1].data).toEqual(retried[0].data)
        await expect(page.getByRole('alert')).toHaveCount(0)
      }
    )
  }
  await scenario(
    'quest objectives are read-only for players and malformed lists are preserved',
    { mobile: true, width: 320, url: '/?screen=questObjectives&lang=en&role=player' },
    async (page) => {
      const section = page.getByRole('region', { name: 'Quest objectives' })
      await expect(section.getByRole('checkbox').first()).toBeDisabled()
      await expect(section.getByRole('checkbox').last()).toBeChecked()
      await expect(section.getByRole('button')).toHaveCount(0)
      await expect(section.getByRole('textbox')).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.entityUpdates)).toEqual([])
      await page.goto(page.url().replace('&role=player', '&malformed'))
      await expect(page.getByRole('alert')).toContainText('remain unchanged')
      await expect(
        page.getByRole('region', { name: 'Quest objectives' }).getByRole('button')
      ).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.entityUpdates)).toEqual([])
    }
  )
  await scenario(
    'queued quest changes use the acknowledged snapshot and never overlap writes',
    { url: '/?screen=questObjectives&lang=en&empty' },
    async (page) => {
      const section = page.getByRole('region', { name: 'Quest objectives' })
      await page.evaluate(() => {
        window.__uiLab.entitySaveDeferred = true
      })
      await section.getByRole('textbox').fill('First step')
      await section.getByRole('button', { name: 'Add objective' }).click()
      await expect.poll(() => page.evaluate(() => window.__uiLab.entitySavePending.length)).toBe(1)
      await section.getByRole('checkbox', { name: 'First step' }).check()
      // Let the existing debounce expire while the first write is still pending.
      await page.waitForTimeout(1200)
      expect(await page.evaluate(() => window.__uiLab.entityUpdates.length)).toBe(1)
      await page.evaluate(() => {
        window.__uiLab.entitySaveDeferred = false
        window.__uiLab.entitySavePending.shift()()
      })
      await expect.poll(() => page.evaluate(() => window.__uiLab.entityUpdates.length)).toBe(2)
      const requests = await page.evaluate(() => window.__uiLab.entityUpdates)
      expect(requests[1].expected).toEqual(requests[0].data.data_json)
      expect(requests[1].data.data_json.objectives[0].done).toBe(true)
      await section.getByRole('button', { name: 'Remove objective 1' }).click()
      await expect(
        section.getByText('Every journey starts with a step. No objectives yet.')
      ).toBeVisible()
      await expect.poll(() => page.evaluate(() => window.__uiLab.entityUpdates.length)).toBe(3)
      expect(
        await page.evaluate(() => window.__uiLab.entityUpdates[2].data.data_json.objectives)
      ).toEqual([])
    }
  )
}
