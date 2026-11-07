export async function onboardingScenarios(scenario, expect, output) {
  const invitation = '/join/synthetic8'
  const url = (screen, extra = '') =>
    '/?screen=' + screen + '&lang=en&next=' + encodeURIComponent(invitation) + extra
  async function fill(page, signup = false) {
    if (signup) await page.locator('#username').fill('Synthetic Adventurer')
    await page.locator('#email').fill('synthetic@example.invalid')
    await page.locator('#password').fill('synthetic-password')
  }
  for (const screen of ['login', 'signup']) {
    await scenario(
      screen + ' keeps invitation and sends only once while pending',
      { url: url(screen) },
      async (page) => {
        await expect(page.getByText('Invitation saved', { exact: true })).toBeVisible()
        const other = screen === 'login' ? 'signup' : 'login'
        await expect(page.locator('a[href^="/' + other + '"]')).toHaveAttribute(
          'href',
          '/' + other + '?next=%2Fjoin%2Fsynthetic8'
        )
        await fill(page, screen === 'signup')
        await page.evaluate(() => {
          window.__authLab.deferred = true
        })
        // Two immediate submits exercise the synchronous guard as well as disabled UI.
        await page.locator('form').evaluate((form) => {
          form.requestSubmit()
          form.requestSubmit()
        })
        await expect.poll(() => page.evaluate(() => window.__authLab.calls.length)).toBe(1)
        await expect(page.locator('button[type=submit]')).toBeDisabled()
        await page.evaluate(() => window.__authLab.pending[0]())
        await expect.poll(() => page.evaluate(() => window.__uiLab.navigated)).toEqual([invitation])
        expect(await page.evaluate(() => window.__uiLab.refreshes)).toBe(1)
      }
    )
    for (const outcome of ['error', 'throw'])
      await scenario(
        screen + ' reports ' + outcome + ' without navigating',
        { url: url(screen) },
        async (page) => {
          await fill(page, screen === 'signup')
          await page.evaluate((value) => {
            window.__authLab.outcome = value
          }, outcome)
          await page.locator('button[type=submit]').click()
          await expect(page.getByRole('alert')).toBeVisible()
          await expect(page.locator('button[type=submit]')).toBeEnabled()
          expect(await page.evaluate(() => window.__uiLab.navigated)).toEqual([])
          expect(await page.evaluate(() => window.__authLab.calls.length)).toBe(1)
        }
      )
    await scenario(
      screen + ' rejects external next and does not show invitation',
      { url: '/?screen=' + screen + '&lang=en&next=//evil.test' },
      async (page) => {
        await expect(page.getByText('Invitation saved', { exact: true })).toHaveCount(0)
        await fill(page, screen === 'signup')
        await page.locator('button[type=submit]').click()
        await expect
          .poll(() => page.evaluate(() => window.__uiLab.navigated))
          .toEqual(['/dashboard'])
      }
    )
  }
  for (const [lang, theme, mobile] of [
    ['en', 'light', true],
    ['ru', 'dark', false],
  ]) {
    await scenario(
      'signup email confirmation keeps invitation ' + lang,
      {
        url: url('signup', '&theme=' + theme).replace('lang=en', 'lang=' + lang),
        mobile,
        width: 320,
      },
      async (page) => {
        await fill(page, true)
        await page.evaluate(() => {
          window.__authLab.outcome = 'confirm'
        })
        await page.locator('button[type=submit]').click()
        await expect(
          page.getByRole('heading', {
            name: lang === 'en' ? 'Check your email' : 'Проверьте почту',
          })
        ).toBeVisible()
        expect(await page.evaluate(() => window.__uiLab.navigated)).toEqual([])
        await expect(page.locator('a[href^="/login"]')).toHaveAttribute(
          'href',
          '/login?next=%2Fjoin%2Fsynthetic8'
        )
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
          false
        )
        await page.screenshot({
          path: output + '/onboarding-confirm-' + lang + '.png',
          fullPage: true,
        })
        await page.getByRole('button').click()
        await expect(page.locator('#email')).toHaveValue('synthetic@example.invalid')
        await expect(page.locator('#password')).toHaveValue('')
        expect(await page.evaluate(() => window.__authLab.calls.length)).toBe(1)
      }
    )
  }
  await scenario(
    'join renders without mutation and joins once after keyboard confirmation',
    { url: url('join') },
    async (page) => {
      const submit = page.locator('button[type=submit]')
      await expect(submit).toBeVisible()
      expect(await page.evaluate(() => window.__uiLab.joinCalls)).toEqual([])
      await page.evaluate(() => {
        window.__uiLab.joinDeferred = true
      })
      await submit.focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Enter')
      await expect.poll(() => page.evaluate(() => window.__uiLab.joinCalls)).toEqual(['synthetic8'])
      await expect(submit).toBeDisabled()
      await page.evaluate(() => window.__uiLab.joinPending[0]())
      await expect
        .poll(() => page.evaluate(() => window.__uiLab.navigated))
        .toEqual(['/campaign/synthetic-campaign'])
    }
  )
  for (const outcome of ['invalid_invite', 'auth_required', 'uncertain', 'throw']) {
    await scenario(
      'join handles ' + outcome + ' without automatic retry',
      { url: url('join', '&theme=light'), mobile: true, width: 320 },
      async (page) => {
        await page.evaluate((value) => {
          window.__uiLab.joinOutcome = value
        }, outcome)
        await page.locator('button[type=submit]').click()
        await expect(page.getByRole('alert')).toBeVisible()
        expect(await page.evaluate(() => window.__uiLab.joinCalls)).toEqual(['synthetic8'])
        expect(await page.evaluate(() => window.__uiLab.navigated)).toEqual([])
        if (outcome === 'auth_required')
          await expect(page.locator('a[href^="/login"]')).toHaveAttribute(
            'href',
            '/login?next=%2Fjoin%2Fsynthetic8'
          )
        if (outcome === 'uncertain' || outcome === 'throw')
          await expect(page.getByRole('alert')).toContainText('My campaigns')
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
          false
        )
        if (outcome === 'uncertain')
          await page.screenshot({
            path: output + '/onboarding-join-uncertain-en.png',
            fullPage: true,
          })
      }
    )
  }
  for (const role of ['dm', 'player'])
    await scenario(
      'empty overview offers role-specific first steps ' + role,
      { url: '/?screen=overview&stats=empty&lang=en&role=' + role },
      async (page) => {
        const section = page.locator('section[aria-labelledby="campaign-empty-title"]')
        await expect(section.getByRole('heading')).toHaveText('The next step for your party')
        const links = await section
          .locator('a')
          .evaluateAll((elements) => elements.map((el) => el.getAttribute('href')))
        expect(links).toEqual(
          role === 'dm'
            ? ['/campaign/test/chapters', '/campaign/test/scenes']
            : ['/campaign/test/characters', '/campaign/test/chat']
        )
      }
    )
}
