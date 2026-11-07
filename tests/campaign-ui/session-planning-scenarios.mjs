import { readFile } from 'node:fs/promises'
export async function sessionPlanningScenarios(scenario, expect, output) {
  for (const [lang, theme, role, mobile] of [
    ['ru', 'dark', 'dm', false],
    ['en', 'light', 'player', true],
    ['ru', 'light', 'player', true],
    ['en', 'dark', 'dm', false],
  ]) {
    await scenario(
      'session planning groups and local calendar ' + [lang, theme, role].join(' '),
      {
        url: '/?screen=sessions&lang=' + lang + '&theme=' + theme + '&role=' + role,
        mobile,
        width: 320,
        timezoneId: 'Europe/Moscow',
      },
      async (page) => {
        const original = await page.evaluate(() => window.__sessionFixtures)
        const next = page.locator('section[aria-labelledby="session-group-next"]')
        await expect(next.getByRole('article')).toHaveCount(1)
        await expect(next.locator('time')).toHaveText(/17:30|05:30 PM/)
        const archive = page
          .locator('details')
          .filter({ hasText: lang === 'ru' ? 'Прошлые игры' : 'Past games' })
        await expect(archive).not.toHaveAttribute('open')
        await expect(page.getByRole('article')).toHaveCount(2)
        const tools = page.getByRole('navigation', {
          name: lang === 'ru' ? 'К игре под рукой' : 'Ready for the game',
        })
        expect(
          await tools.locator('a').evaluateAll((els) => els.map((el) => el.getAttribute('href')))
        ).toEqual(
          role === 'dm'
            ? ['/campaign/test/characters', '/campaign/test/scenes', '/campaign/test/session']
            : ['/campaign/test/characters', '/campaign/test/chat', '/campaign/test/chapters']
        )
        const exportButton = next.getByRole('button', {
          name: lang === 'ru' ? /^Добавить «/ : /^Add .* to calendar$/,
        })
        const downloadPromise = page.waitForEvent('download')
        await exportButton.focus()
        await page.keyboard.press('Enter')
        const download = await downloadPromise
        expect(download.suggestedFilename()).toBe('dm-workspace-session-offline-future-session.ics')
        const contents = await readFile(await download.path(), 'utf8')
        expect(contents).toContain('DTSTART:20990710T143000Z\r\n')
        expect(contents).toContain('DTEND:20990710T173000Z\r\n')
        expect(contents).not.toMatch(/ATTENDEE|ORGANIZER/)
        const undated = page.locator('section[aria-labelledby="session-group-undated"]')
        await expect(
          undated
            .locator('button')
            .filter({ hasText: lang === 'ru' ? 'В личный календарь' : 'Add to calendar' })
        ).toHaveCount(0)
        await archive.locator('summary').focus()
        await page.keyboard.press('Enter')
        await expect(archive).toHaveAttribute('open', '')
        await expect(archive.getByRole('article')).toHaveCount(1)
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
          false
        )
        await archive.locator('summary').click()
        await next.scrollIntoViewIfNeeded()
        await page.screenshot({ path: output + '/session-plan-' + lang + '-' + theme + '.png' })
        expect(await page.evaluate(() => window.__uiLab.sessionActions)).toEqual([])
        expect(await page.evaluate(() => window.__sessionFixtures)).toEqual(original)
      }
    )
  }
  await scenario(
    'session clock preserves in-progress game and archives it only at end',
    { url: '/?screen=sessions&lang=en', clockTime: '2099-07-10T15:00:00Z' },
    async (page) => {
      await page.evaluate(() => window.dispatchEvent(new Event('focus')))
      const next = page.locator('section[aria-labelledby="session-group-next"]')
      await expect(next).toContainText('In progress')
      await expect(next.getByRole('group', { name: 'Your response', exact: true })).toBeVisible()
      await page.clock.setFixedTime(new Date('2099-07-10T17:30:00Z'))
      await page.clock.runFor(30_001)
      await expect(next).toHaveCount(0)
      await expect(page.getByRole('heading', { name: 'No upcoming games yet' })).toBeVisible()
      const archive = page.locator('details').filter({ hasText: 'Past games' })
      await archive.locator('summary').click()
      await expect(archive.getByRole('article')).toHaveCount(2)
      await expect(archive.getByRole('group')).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.sessionActions)).toEqual([])
    }
  )
  await scenario(
    'refreshed sessions reorder without losing the saved response',
    { url: '/?screen=sessions&lang=en&role=player&viewer=user-0' },
    async (page) => {
      await expect(page.locator('#session-group-next')).toBeVisible()
      await page.evaluate(() => {
        const original = window.__sessionFixtures[0]
        const later = {
          ...original,
          id: 'later',
          title: 'Later adventure',
          starts_at: '2099-07-15T12:00:00Z',
        }
        const earliest = {
          ...original,
          id: 'earlier',
          title: 'First adventure',
          starts_at: '2099-07-01T12:00:00Z',
        }
        window.dispatchEvent(
          new CustomEvent('offline-session-data', { detail: [later, earliest, original] })
        )
      })
      const next = page.locator('section[aria-labelledby="session-group-next"]')
      await expect(next.getByRole('heading', { level: 3 })).toHaveText('First adventure')
      await expect(next.getByRole('button', { name: 'Going', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      expect(
        await page
          .locator('section[aria-labelledby="session-group-later"]')
          .getByRole('heading', { level: 3 })
          .allTextContents()
      ).toEqual([await page.evaluate(() => window.__sessionFixtures[0].title), 'Later adventure'])
      expect(await page.evaluate(() => window.__uiLab.sessionActions)).toEqual([])
    }
  )
  await scenario(
    'calendar failure is local, readable and permits deliberate retry',
    { url: '/?screen=sessions&lang=en&role=player' },
    async (page) => {
      const next = page.locator('section[aria-labelledby="session-group-next"]')
      await page.evaluate(() => {
        window.__originalCalendarUrl = URL.createObjectURL
        URL.createObjectURL = () => {
          throw Error('Synthetic download failure')
        }
      })
      const button = next.getByRole('button', { name: /^Add .* to calendar$/ })
      await button.click()
      await expect(next.getByRole('alert')).toContainText('Could not download')
      await expect(button).toBeEnabled()
      await page.evaluate(() => {
        URL.createObjectURL = window.__originalCalendarUrl
      })
      const download = page.waitForEvent('download')
      await button.click()
      await download
      await expect(next.getByRole('alert')).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.sessionActions)).toEqual([])
    }
  )
}
