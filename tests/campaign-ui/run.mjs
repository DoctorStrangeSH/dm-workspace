import { sessionPlanningScenarios } from './session-planning-scenarios.mjs'
import { diceScenarios } from './dice-scenarios.mjs'
import { generatorScenarios } from './generator-scenarios.mjs'
import { characterWorkspaceScenarios } from './character-workspace-scenarios.mjs'
import { preparationScenarios } from './preparation-scenarios.mjs'
import { build } from 'esbuild'
import { compile } from '@tailwindcss/node'
import { Scanner } from '@tailwindcss/oxide'
import { chromium, expect } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { initiativeSyncScenarios } from './initiative-sync-scenarios.mjs'
import { combatFinderScenarios } from './combat-finder-scenarios.mjs'
import { spellAreaScenarios } from './spell-area-scenarios.mjs'
import { onboardingScenarios } from './onboarding-scenarios.mjs'
import { routeScenarios } from './route-scenarios.mjs'

const root = process.cwd()
const output = path.join(root, 'test-results/campaign-ui')
await mkdir(output, { recursive: true })
const result = await build({
  entryPoints: ['tests/campaign-ui/fixture.tsx'],
  bundle: true,
  write: false,
  outfile: path.join(output, 'fixture.js'),
  platform: 'browser',
  format: 'iife',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [
    {
      name: 'offline-boundaries',
      setup(builder) {
        builder.onResolve({ filter: /^@\/lib\/supabase\/client$/ }, (args) => ({
          path: path.join(
            root,
            'tests/campaign-ui/',
            args.importer.includes('/(auth)/') || args.importer.includes('\\(auth)\\')
              ? 'auth-transport.ts'
              : args.importer.endsWith('use-realtime-initiative.ts')
                ? 'initiative-transport.ts'
                : 'token-transport.ts'
          ),
        }))
        builder.onResolve({ filter: /^next\/image$/ }, () => ({
          path: path.join(root, 'tests/campaign-ui/image-mock.tsx'),
        }))
        builder.onResolve(
          {
            filter:
              /^(?:next\/(?:link|navigation)|@\/lib\/actions\/(?:chapters|scenes|combat|fog|walls|tokens|token-owners|summon|messages|sessions|campaigns|settings|chapter-content|export|characters|items-search|add-item-to-character|add-item-to-campaign|spells-search|bestiary-search|bestiary|add-spell-to-character)|@\/lib\/hooks\/use-realtime-(?:messages|initiative|token-owners|fog|walls|summons))$/,
          },
          () => ({ path: path.join(root, 'tests/campaign-ui/mocks.tsx') })
        )
      },
    },
  ],
})
const css = await compile(await readFile('src/app/globals.css', 'utf8'), {
  base: path.join(root, 'src/app'),
  onDependency() {},
})
const candidates = new Scanner({
  sources: [
    { base: path.join(root, 'src'), pattern: '**/*.{ts,tsx}', negated: false },
    { base: path.join(root, 'tests/campaign-ui'), pattern: '*.tsx', negated: false },
  ],
}).scan()
const styles =
  css.build(candidates) +
  (result.outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? '')
const html =
  '<!doctype html><html lang="ru" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><title>Offline campaign UI tests</title></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
const server = createServer((request, response) => {
  const route = request.url?.split('?')[0]
  if (route?.startsWith('/api/scenes/')) {
    response.setHeader('Content-Type', 'image/svg+xml')
    response.end(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><radialGradient id="g"><stop stop-color="#3f6263"/><stop offset="1" stop-color="#142b32"/></radialGradient></defs><rect width="1200" height="800" fill="url(#g)"/><path d="M0 580 Q300 350 500 550 T1200 400" fill="none" stroke="#80b4b0" stroke-width="95" opacity=".3"/><g fill="#35424c" stroke="#a5abb1" stroke-width="8"><path d="M350 150h300v230h-90V240H440v140h-90z"/><circle cx="500" cy="270" r="70"/><path d="M800 520h140v140H800z"/></g><g fill="#496f5a"><circle cx="150" cy="190" r="85"/><circle cx="1000" cy="200" r="100"/><circle cx="250" cy="700" r="100"/></g></svg>'
    )
    return
  }
  response.setHeader(
    'Content-Type',
    route === '/bundle.js'
      ? 'text/javascript'
      : route === '/styles.css'
        ? 'text/css'
        : 'text/html; charset=utf-8'
  )
  response.end(
    route === '/bundle.js'
      ? result.outputFiles.find((file) => file.path.endsWith('.js')).contents
      : route === '/styles.css'
        ? styles
        : html
  )
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true }).catch(async (error) => {
  await new Promise((resolve) => server.close(resolve))
  throw error
})
async function scenario(name, options, body) {
  await test(name, async () => {
    const context = await browser.newContext({
      viewport: options.mobile
        ? { width: options.width ?? 390, height: 844 }
        : { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
      ...(options.timezoneId ? { timezoneId: options.timezoneId } : {}),
    })
    const page = await context.newPage()
    page.setDefaultTimeout(5000)
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await context.route('**/*', (route) =>
      route
        .request()
        .url()
        .startsWith(origin + '/')
        ? route.continue()
        : route.abort('blockedbyclient')
    )
    try {
      if (options.clockTime) await page.clock.install({ time: new Date(options.clockTime) })
      await page.goto(origin + (options.url ?? '/'))
      await body(page)
      expect(errors).toEqual([])
    } catch (error) {
      console.error({
        scenario: name,
        pageErrors: errors,
        focus: await page.evaluate(() => document.activeElement?.outerHTML?.slice(0, 350)),
        body: (await page.locator('body').innerText()).slice(0, 1500),
      })
      throw error
    } finally {
      await context.close()
    }
  })
}
const openChat = async (page) => {
  await page.getByRole('button', { name: 'Чат', exact: true }).first().click()
  await expect(page.locator('#campaign-chat')).toBeVisible()
  await expect
    .poll(() =>
      page.getByRole('log').evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight)
    )
    .toBeLessThan(5)
}
try {
  await preparationScenarios(scenario, expect, output)
  await characterWorkspaceScenarios(scenario, expect, output)
  await generatorScenarios(scenario, expect, output)
  await diceScenarios(scenario, expect, output)
  await sessionPlanningScenarios(scenario, expect, output)
  await onboardingScenarios(scenario, expect, output)
  await routeScenarios(scenario, expect, output)
  await spellAreaScenarios(scenario, expect, output)
  await combatFinderScenarios(scenario, expect, output)
  await initiativeSyncScenarios(scenario, expect)
  await scenario(
    'map combat drawer survives pending Escape and shortcuts, then closes safely',
    { url: '/?screen=map&combat' },
    async (page) => {
      await page.getByRole('button', { name: 'Порядок ходов', exact: false }).first().click()
      const drawer = page.getByRole('dialog', { name: 'Панель боя', exact: true })
      await page.evaluate(() => {
        window.__uiLab.mapDeferred = true
      })
      await drawer.getByRole('button', { name: 'Начать первый ход' }).click()
      await expect(drawer).toHaveAttribute('data-busy', 'true')
      await page.keyboard.press('Escape')
      await page.keyboard.press('Control+b')
      await expect(drawer).toBeVisible()
      await expect(drawer.getByRole('button', { name: 'Закрыть', exact: true })).toBeDisabled()
      await page.evaluate(() => window.__uiLab.mapPending[0].resolve())
      await expect(drawer.getByRole('button', { name: 'Начать первый ход' })).toBeEnabled()
      await page.keyboard.press('Escape')
      await expect(drawer).toHaveCount(0)
    }
  )
  await scenario(
    'map combat drawer and nested confirmation work in native fullscreen',
    { url: '/?screen=map&combat&current' },
    async (page) => {
      await page.getByRole('button', { name: 'Полноэкранный игровой стол', exact: true }).click()
      await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)
      await page.getByRole('button', { name: 'Панель боя', exact: true }).click()
      const drawer = page.getByRole('dialog', { name: 'Панель боя', exact: true })
      await expect(drawer).toBeInViewport()
      expect(await drawer.evaluate((el) => document.fullscreenElement.contains(el))).toBe(true)
      await drawer.getByRole('button', { name: 'Завершить бой', exact: true }).click()
      await expect(page.getByRole('dialog')).toHaveCount(2)
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(1)
      await expect(drawer).toBeVisible()
      await expect(drawer).toHaveAttribute('data-busy', 'false')
      await page.keyboard.press('Escape')
      await expect(drawer).toHaveCount(0)
      await page.evaluate(() => document.exitFullscreen())
    }
  )
  await scenario(
    'token rapid moves resist delayed events, stale refresh and reconnect using real hook',
    { url: '/?screen=map&mapImage' },
    async (page) => {
      const token = page.locator('[data-token-id="hero"]')
      const drag = async (dx, cancel = false) =>
        token.evaluate(
          (el, { dx, cancel }) => {
            const r = el.getBoundingClientRect()
            const event = (type, x) =>
              new PointerEvent(type, {
                bubbles: true,
                isPrimary: true,
                pointerId: 1,
                pointerType: 'mouse',
                button: 0,
                clientX: r.x + 10 + x,
                clientY: r.y + 10,
              })
            el.dispatchEvent(event('pointerdown', 0))
            window.dispatchEvent(event('pointermove', dx))
            window.dispatchEvent(event(cancel ? 'pointercancel' : 'pointerup', dx))
          },
          { dx, cancel }
        )
      await page.evaluate(() => {
        window.__uiLab.moveDeferred = true
      })
      await drag(50)
      await expect.poll(() => page.evaluate(() => window.__uiLab.movePending.length)).toBe(1)
      await drag(100)
      await expect(token).toHaveCSS('left', '300px')
      await drag(50, true)
      await expect(token).toHaveCSS('left', '300px')
      await page.waitForTimeout(650)
      await page.evaluate(() => window.__tokenLab.emit('UPDATE', window.__tokenLab.rows[0]))
      await expect(token).toHaveCSS('left', '300px')
      expect(
        await page.evaluate(
          () => window.__uiLab.mapActions.filter((x) => x.name === 'moveToken').length
        )
      ).toBe(1)
      await page.evaluate(() => window.__uiLab.movePending[0].resolve({}))
      await expect.poll(() => page.evaluate(() => window.__uiLab.movePending.length)).toBe(2)
      await expect(token).toHaveCSS('left', '300px')
      await page.evaluate(() => window.__uiLab.movePending[1].resolve({}))
      await expect(token).toHaveCSS('left', '300px')
      await page.evaluate(() => {
        const old = {
          ...window.__tokenLab.rows[0],
          x: 4,
          updated_at: '2030-01-01T00:00:00.000001Z',
        }
        window.__tokenLab.emit('UPDATE', old)
        window.dispatchEvent(
          new CustomEvent('offline-token-data', { detail: [old, window.__tokenLab.rows[1]] })
        )
        window.__tokenLab.rows[0] = old
        window.__tokenLab.reconnect()
      })
      await expect(token).toHaveCSS('left', '300px')
      await page.evaluate(() => {
        const next = {
          ...window.__tokenLab.rows[0],
          x: 9,
          updated_at: '2030-01-01T00:00:00.000003Z',
        }
        window.__tokenLab.emit('UPDATE', next)
        window.__tokenLab.deferSnapshots = true
        window.__tokenLab.reconnect()
      })
      await expect(token).toHaveCSS('left', '450px')
      await page.evaluate(() => {
        window.__tokenLab.emit('UPDATE', {
          ...window.__tokenLab.rows[0],
          x: 10,
          updated_at: '2030-01-01T00:00:00.000004Z',
        })
        window.__tokenLab.snapshots[0](window.__tokenLab.rows)
      })
      await expect(token).toHaveCSS('left', '500px')
    }
  )
  await scenario(
    'map combat drawer traps focus, prepares empty combat and appends reinforcements',
    { mobile: true, url: '/?screen=map&combat&current' },
    async (page) => {
      const trigger = page.getByRole('button', { name: 'Порядок ходов', exact: false }).first()
      await trigger.click()
      const drawer = page.getByRole('dialog', { name: 'Панель боя', exact: true })
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab')
        expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true)
      }
      await drawer.getByRole('button', { name: 'Добавить новые токены в бой' }).click()
      await expect(
        drawer.getByRole('status').filter({ hasText: 'Добавлено участников: 3' })
      ).toBeVisible()
      expect(await page.evaluate(() => window.__uiLab.mapActions[0])).toEqual({
        name: 'addCombatParticipants',
        args: ['offline-scene'],
      })
      await page.keyboard.press('Escape')
      await expect(trigger).toBeFocused()
      await page.getByRole('button', { name: 'Панель боя', exact: true }).click()
      await expect(drawer).toBeInViewport()
      await page.keyboard.press('Escape')
      for (let i = 0; i < 6; i++) {
        const opener =
          i % 2 ? trigger : page.getByRole('button', { name: 'Панель боя', exact: true })
        await opener.click()
        // Disabled pending controls or native modal teardown can leave focus on body.
        await page.evaluate(() => document.activeElement.blur())
        await page.keyboard.press('Escape')
        await expect(opener).toBeFocused()
      }
    }
  )
  await scenario(
    'map empty combat panel prepares tokens visibly',
    { url: '/?screen=map' },
    async (page) => {
      await page.getByRole('button', { name: 'Порядок ходов', exact: false }).first().click()
      await page
        .getByRole('dialog', { name: 'Панель боя' })
        .getByRole('button', { name: 'Подготовить бой' })
        .click()
      expect(await page.evaluate(() => window.__uiLab.mapActions[0])).toEqual({
        name: 'startCombat',
        args: ['offline-scene'],
      })
    }
  )
  await scenario(
    'desktop tools are distinct; switching panels, Escape and adjacent layout',
    {},
    async (page) => {
      const chatButton = page.getByRole('button', { name: 'Чат', exact: true }).first()
      const dmButton = page.getByRole('button', { name: 'Экран ГМа', exact: true }).first()
      const first = await chatButton.boundingBox(),
        second = await dmButton.boundingBox()
      expect(first.height).toBeGreaterThanOrEqual(44)
      expect(second.x).toBeGreaterThanOrEqual(first.x + first.width)
      await openChat(page)
      expect(await page.locator('#campaign-chat').evaluate((el) => el.matches(':modal'))).toBe(
        false
      )
      const main = await page.getByTestId('workspace-main').boundingBox(),
        panel = await page.locator('#campaign-chat').boundingBox()
      expect(main.x + main.width).toBeLessThanOrEqual(panel.x + 1)
      await page.screenshot({ path: path.join(output, 'desktop-chat.png') })
      await page.locator('#campaign-chat').getByRole('button', { name: 'Экран ГМа' }).click()
      await expect(page.locator('#campaign-chat')).not.toBeVisible()
      await expect(page.locator('#campaign-dm')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.locator('#campaign-dm')).not.toBeVisible()
      await page.keyboard.press('Control+m')
      await expect(page.locator('#campaign-dm')).toBeVisible()
    }
  )
  await scenario(
    'failed send retains text; retry succeeds; Shift+Enter, IME and duplicate submit',
    {},
    async (page) => {
      await openChat(page)
      const input = page.getByRole('textbox', { name: 'Сообщение…' })
      await input.fill('План группы')
      await input.press('Shift+Enter')
      await input.press('A')
      expect(await input.inputValue()).toContain('\n')
      await input.evaluate((el) =>
        el.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })
        )
      )
      expect(await page.evaluate(() => window.__uiLab.sent.length)).toBe(0)
      await page.evaluate(() => {
        window.__uiLab.failNext = true
        window.__uiLab.delay = 150
      })
      const draft = await input.inputValue()
      await input.press('Enter')
      await page.keyboard.press('Enter')
      await expect(page.getByRole('alert').first()).toContainText('Текст сохранён')
      expect(await page.evaluate(() => window.__uiLab.sent.length)).toBe(1)
      await expect(input).toHaveValue(draft)
      await input.press('Enter')
      await expect(input).toHaveValue('')
      expect(await page.evaluate(() => window.__uiLab.sent.length)).toBe(2)
      await expect(page.getByRole('log')).toContainText(draft)
    }
  )
  await scenario(
    'reading history survives new messages; latest button; draft survives panel switch',
    {},
    async (page) => {
      await openChat(page)
      const log = page.getByRole('log')
      await log.evaluate((el) => {
        el.scrollTop = 0
        el.dispatchEvent(new Event('scroll', { bubbles: true }))
      })
      await page.evaluate(() => window.__uiLab.incoming())
      await expect(
        page.getByRole('button', { name: 'К новым сообщениям', exact: true })
      ).toBeVisible()
      expect(await log.evaluate((el) => el.scrollTop)).toBe(0)
      await page.getByRole('button', { name: 'К новым сообщениям', exact: true }).click()
      expect(
        await log.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight)
      ).toBeLessThan(5)
      await page.getByRole('textbox', { name: 'Сообщение…' }).fill('Черновик')
      await page.locator('#campaign-chat').getByRole('button', { name: 'Экран ГМа' }).click()
      await page.locator('#campaign-dm').getByRole('button', { name: 'Чат', exact: true }).click()
      await expect(page.getByRole('textbox', { name: 'Сообщение…' })).toHaveValue('Черновик')
    }
  )
  await scenario(
    'mobile modal fits viewport, traps focus, restores focus and exposes dice',
    { mobile: true },
    async (page) => {
      await openChat(page)
      const panel = page.locator('#campaign-chat')
      expect(await panel.evaluate((el) => el.matches(':modal'))).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390
      )
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab')
        expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true)
      }
      await panel.getByRole('button', { name: 'Бросить кубики', exact: true }).click()
      await expect(panel.getByRole('button', { name: 'Бросить 1d20', exact: true })).toBeVisible()
      await page.screenshot({ path: path.join(output, 'mobile-chat.png') })
      await page.keyboard.press('Escape')
      await expect(panel).not.toBeVisible()
      await expect(page.getByRole('button', { name: 'Чат', exact: true }).first()).toBeFocused()
    }
  )
  await scenario(
    'Russian SRD labels ignore missing translations and preserve IDs',
    {},
    async (page) => {
      await expect(page.getByRole('combobox', { name: 'Раса' })).toContainText('Голиаф')
      await expect(page.getByRole('combobox', { name: 'Класс*', exact: true })).toContainText(
        'Воин'
      )
      await page
        .getByRole('combobox', { name: 'Класс*', exact: true })
        .selectOption('srd-2024_wizard')
      await expect(page.getByRole('combobox', { name: 'Класс*', exact: true })).toHaveValue(
        'srd-2024_wizard'
      )
      await expect(page.getByRole('combobox', { name: 'Подкласс (необязательно)' })).toContainText(
        'Школа воплощения'
      )
      await page.screenshot({ path: path.join(output, 'desktop-workspace.png') })
    }
  )
  await scenario(
    'nested confirmation Escape keeps mobile chat open; resize switches modal mode',
    { mobile: true },
    async (page) => {
      await openChat(page)
      const panel = page.locator('#campaign-chat')
      await panel.getByRole('button', { name: 'Удалить сообщение', exact: true }).last().click()
      await expect(panel.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(panel.getByRole('dialog')).toHaveCount(0)
      await expect(panel).toBeVisible()
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
      await page.setViewportSize({ width: 1440, height: 1000 })
      await expect.poll(() => panel.evaluate((el) => el.matches(':modal'))).toBe(false)
      expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
      await page.setViewportSize({ width: 390, height: 844 })
      await expect.poll(() => panel.evaluate((el) => el.matches(':modal'))).toBe(true)
    }
  )
  await scenario(
    'English/light/player view uses English labels and omits GM tools',
    { mobile: true, url: '/?lang=en&theme=light&role=player' },
    async (page) => {
      await expect(page.getByRole('button', { name: 'DM Screen', exact: true })).toHaveCount(0)
      await expect(page.getByRole('combobox', { name: 'Class*', exact: true })).toContainText(
        'Fighter'
      )
      await expect(page.getByRole('combobox', { name: 'Race*', exact: true })).toContainText(
        'Goliath'
      )
      await page.getByRole('button', { name: 'Chat', exact: true }).first().click()
      await expect(page.getByRole('textbox', { name: 'Message…' })).toBeVisible()
      await page.screenshot({ path: path.join(output, 'mobile-light-chat.png') })
    }
  )
  await scenario(
    'mobile session switches between scene, chapter and exactly one chat',
    { mobile: true, url: '/session' },
    async (page) => {
      await expect(page.getByTestId('scene')).toBeVisible()
      await expect(page.getByTestId('chapter')).not.toBeVisible()
      await page.getByRole('button', { name: 'Глава', exact: true }).click()
      await expect(page.getByTestId('chapter')).toBeVisible()
      await page.getByRole('button', { name: 'Чат', exact: true }).last().click()
      await expect(page.getByRole('log')).toHaveCount(1)
      await expect(page.getByRole('log')).toBeVisible()
      await expect(page.locator('#campaign-chat')).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390
      )
      await page.getByRole('button', { name: 'Карта', exact: true }).click()
      await expect(page.getByRole('log')).not.toBeVisible()
      await expect(page.getByTestId('scene')).toBeVisible()
    }
  )
  await scenario(
    'desktop session chat toggle removes the third pane without an orphan grid row',
    { url: '/session' },
    async (page) => {
      await expect(page.getByTestId('scene')).toBeVisible()
      await expect(page.getByTestId('chapter')).toBeVisible()
      await page.getByRole('button', { name: 'Чат', exact: true }).first().click()
      await expect(page.getByRole('log')).toBeVisible()
      await page.getByRole('button', { name: 'Скрыть чат', exact: true }).click()
      await expect(page.getByRole('log')).not.toBeVisible()
      await expect(page.getByTestId('scene')).toBeVisible()
      await expect(page.getByTestId('chapter')).toBeVisible()
    }
  )
  await scenario(
    'mobile navigation shares triggers, hides closed links and restores focus',
    { mobile: true },
    async (page) => {
      const drawer = page.locator('#campaign-navigation')
      const more = page.getByRole('button', { name: 'Ещё', exact: true })
      const menu = page.locator('button[aria-controls="campaign-navigation"]').first()
      await expect(drawer).not.toBeVisible()
      for (let i = 0; i < 25; i++) {
        await page.keyboard.press('Tab')
        expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(false)
      }
      await more.click()
      expect(await drawer.evaluate((el) => el.matches(':modal'))).toBe(true)
      await expect(menu).toHaveAttribute('aria-expanded', 'true')
      await expect(drawer.getByRole('link')).toHaveCount(12)
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
      for (let i = 0; i < 18; i++) {
        await page.keyboard.press('Tab')
        expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true)
      }
      await page.screenshot({ path: path.join(output, 'mobile-navigation.png') })
      await page.keyboard.press('Escape')
      await expect(drawer).not.toBeVisible()
      await expect(more).toBeFocused()
      expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
      await menu.click()
      await expect(more).toHaveAttribute('aria-expanded', 'true')
      await page.mouse.click(365, 400)
      await expect(drawer).not.toBeVisible()
      await expect(menu).toBeFocused()
      await more.click()
      await page.setViewportSize({ width: 768, height: 844 })
      await expect(drawer).not.toBeVisible()
      expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
    }
  )
  await scenario(
    'player menu filters GM routes; route selection and active descendants',
    { mobile: true, url: '/campaign/test/spells/acid?lang=en&role=player' },
    async (page) => {
      const more = page.getByRole('button', { name: 'More', exact: true })
      expect(await more.evaluate((el) => getComputedStyle(el).color)).not.toBe(
        await page
          .locator('[aria-label="Quick navigation"] a')
          .first()
          .evaluate((el) => getComputedStyle(el).color)
      )
      await more.click()
      const drawer = page.locator('#campaign-navigation')
      await expect(drawer.locator('a[aria-current="page"]')).toHaveAttribute(
        'href',
        '/campaign/test/spells'
      )
      await expect(drawer.locator('a[href$="/settings"], a[href$="/generators"]')).toHaveCount(0)
      await expect(drawer.getByRole('link')).toHaveCount(10)
      await drawer.locator('a[href$="/entities"]').click()
      await expect(drawer).not.toBeVisible()
      await expect(page).toHaveURL(/\/campaign\/test\/entities$/)
    }
  )
  await scenario(
    'measured header and sidebar remain aligned as workspace width changes',
    {},
    async (page) => {
      const header = page.locator('[data-campaign-shell] > header')
      const sidebar = page.locator('aside').first()
      const aligned = async () => {
        // ResizeObserver and viewport CSS settle on the next animation frame.
        await expect
          .poll(() =>
            header.evaluate((el) => {
              const bounds = el.parentElement.querySelector('aside').getBoundingClientRect()
              return Math.max(
                Math.abs(el.getBoundingClientRect().bottom - bounds.top),
                Math.abs(bounds.bottom - innerHeight)
              )
            })
          )
          .toBeLessThan(2)
        await expect(sidebar).toBeVisible()
      }
      await aligned()
      await openChat(page)
      await aligned()
      await page.keyboard.press('Escape')
      await page.screenshot({ path: path.join(output, 'desktop-navigation.png') })
      await page.setViewportSize({ width: 768, height: 844 })
      await aligned()
    }
  )
  await scenario(
    'appearance disclosure supports keyboard and outside closure; narrow layouts fit',
    { mobile: true },
    async (page) => {
      const summary = page.locator('summary')
      const details = page.locator('details')
      await summary.focus()
      await page.keyboard.press('Enter')
      await expect(details).toHaveAttribute('open', '')
      await page.getByRole('button', { name: 'EN', exact: true }).focus()
      await page.keyboard.press('Escape')
      await expect(details).not.toHaveAttribute('open')
      await expect(summary).toBeFocused()
      await summary.click()
      await page.getByRole('heading', { level: 1 }).click()
      await expect(details).not.toHaveAttribute('open')
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 844 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width
        )
      }
      await page.setViewportSize({ width: 320, height: 844 })
      await page.screenshot({ path: path.join(output, 'narrow-workspace.png') })
    }
  )
  await scenario(
    'overview DM actions, translated statistics and preparation links',
    { url: '/?screen=overview' },
    async (page) => {
      const overview = page.getByTestId('campaign-overview')
      await expect(overview.getByRole('link', { name: 'Открыть игровой стол' })).toHaveAttribute(
        'href',
        '/campaign/test/session'
      )
      await expect(overview.locator('a[href="/campaign/test/scenes/active"]')).toContainText(
        'The abandoned observatory'
      )
      await expect(overview.getByText('Видимых: 9 · скрытых: 3')).toBeVisible()
      await expect(overview.getByRole('heading', { name: 'Подготовка к игре' })).toBeVisible()
      await expect(
        overview.getByRole('link', { name: 'Монстры без КД/ОЗ: 1', exact: true })
      ).toHaveAttribute('href', '/campaign/test/entities?type=monster')
      await expect(overview.locator('a[href="/campaign/test/entities?type=note"]')).toBeVisible()
      await expect(overview.getByText('2 минуты назад')).toBeVisible()
      await page.screenshot({ path: path.join(output, 'desktop-overview.png'), fullPage: true })
    }
  )
  await scenario(
    'English player overview has useful shortcuts without GM actions or checklist',
    { mobile: true, url: '/?screen=overview&lang=en&role=player&theme=light&long' },
    async (page) => {
      const overview = page.getByTestId('campaign-overview')
      await expect(
        overview.getByRole('link', { name: 'Open characters', exact: true })
      ).toHaveAttribute('href', '/campaign/test/characters')
      await expect(
        overview.locator('a[href="/campaign/test/session"], a[href="/campaign/test/scenes/active"]')
      ).toHaveCount(0)
      await expect(overview.getByRole('heading', { name: 'Preparation checklist' })).toHaveCount(0)
      await expect(
        overview.getByRole('region', { name: 'Campaign statistics' }).getByText(/hidden/)
      ).toHaveCount(0)
      await expect(
        overview.getByRole('navigation', { name: 'Continue your adventure' }).getByRole('link')
      ).toHaveCount(4)
      await expect(overview.getByText('2 minutes ago')).toBeVisible()
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 844 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width
        )
      }
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(origin + '/?screen=overview&lang=en&role=player&theme=light')
      await page.screenshot({
        path: path.join(output, 'mobile-player-overview.png'),
      })
      const main = page.getByTestId('workspace-main')
      expect(
        await main.evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom))
      ).toBeGreaterThanOrEqual(80)
      await overview
        .getByRole('link', { name: /The keeper of forgotten stars/ })
        .scrollIntoViewIfNeeded()
      const last = await overview
        .getByRole('link', { name: /The keeper of forgotten stars/ })
        .boundingBox()
      const bottom = await page.getByRole('navigation', { name: 'Quick navigation' }).boundingBox()
      expect(last.y + last.height).toBeLessThanOrEqual(bottom.y)
      await page.screenshot({ path: path.join(output, 'mobile-overview-activity.png') })
    }
  )
  await scenario(
    'overview distinguishes empty materials, unavailable statistics and passing preparation checks',
    { mobile: true, url: '/?screen=overview&stats=empty&lang=en' },
    async (page) => {
      await expect(
        page.getByRole('heading', { name: 'The next step for your party' })
      ).toBeVisible()
      await expect(page.getByText('Updated chapters and entities will appear here.')).toBeVisible()
      await page.goto(origin + '/?screen=overview&stats=unavailable&lang=en')
      await expect(page.getByRole('status')).toContainText('Statistics are unavailable')
      await expect(page.getByRole('heading', { name: 'The next step for your party' })).toHaveCount(
        0
      )
      await expect(
        page.getByRole('navigation', { name: 'Continue your adventure' }).getByRole('link')
      ).toHaveCount(4)
      await page.goto(origin + '/?screen=overview&stats=ready&lang=en')
      await expect(
        page.getByText('No missing content or combat statistics were found by these checks.')
      ).toBeVisible()
    }
  )
  await scenario(
    'mobile real editor exposes labelled touch targets and hides formatting in preview',
    { mobile: true, url: '/?screen=editor&lang=en' },
    async (page) => {
      const formatting = page.getByRole('group', { name: 'Text formatting' })
      await expect(formatting.getByRole('button')).toHaveCount(6)
      for (const button of await formatting.getByRole('button').all()) {
        expect(await button.getAttribute('aria-label')).toBeTruthy()
        const box = await button.boundingBox()
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
      await page.locator('.cm-content').click()
      await page.keyboard.press('Control+a')
      await page.getByRole('button', { name: 'Bold (Ctrl+B)', exact: true }).click()
      await expect(page.locator('.cm-content')).toContainText('**The observatory**')
      await page.getByRole('button', { name: 'Preview', exact: true }).click()
      await expect(formatting).toHaveCount(0)
      await expect(page.locator('.cm-content')).toHaveCount(0)
      await expect(page.locator('.prose')).toContainText('The observatory')
      await expect(page.getByRole('button', { name: 'Preview', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      await page.screenshot({ path: path.join(output, 'mobile-chapter-preview.png') })
      await page.getByRole('button', { name: 'Editor', exact: true }).click()
      await expect(formatting).toBeVisible()
      await expect(page.locator('.cm-content')).toContainText('**The observatory**')
      await page.keyboard.press('Control+s')
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.__uiLab.chapterSaves.some((value) => value.includes('**The observatory**'))
          )
        )
        .toBe(true)
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width
        )
      }
    }
  )
  await scenario(
    'desktop real editor preserves content across view modes and exposes save failure',
    { url: '/?screen=editor&lang=en' },
    async (page) => {
      const group = page.getByRole('group', { name: 'Editor view' })
      await expect(group.getByRole('button', { name: 'Split', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      await group.getByRole('button', { name: 'Preview', exact: true }).click()
      await expect(page.getByRole('group', { name: 'Text formatting' })).toHaveCount(0)
      await expect(page.locator('.prose')).toContainText('The observatory')
      await group.getByRole('button', { name: 'Editor', exact: true }).click()
      await page.evaluate(() => {
        window.__uiLab.chapterSaveFails = true
      })
      await page.locator('.cm-content').fill('A new chapter draft')
      await page.keyboard.press('Control+s')
      await expect(page.getByRole('alert')).toContainText('Offline save failure')
      await expect(page.locator('.cm-content')).toContainText('A new chapter draft')
      await page.screenshot({ path: path.join(output, 'desktop-chapter-editor.png') })
    }
  )
  await scenario(
    'read-only chapter has no formatting and cannot autosave',
    { mobile: true, url: '/?screen=editor&lang=en&readonly=true' },
    async (page) => {
      await expect(page.getByRole('group', { name: 'Text formatting' })).toHaveCount(0)
      await expect(page.locator('.cm-content')).toHaveAttribute('aria-readonly', 'true')
      await page.locator('.cm-content').click()
      await page.keyboard.type('This must not change the chapter')
      await expect(page.locator('.cm-content')).toHaveText('The observatory')
      await page.keyboard.press('Control+s')
      expect(await page.evaluate(() => window.__uiLab.chapterSaves)).toEqual([])
    }
  )
  for (const { mobile, fallback } of [
    { mobile: false, fallback: false },
    { mobile: true, fallback: false },
    { mobile: false, fallback: true },
    { mobile: true, fallback: true },
  ]) {
    await scenario(
      'real character wizard preserves numeric HP and canonical class through submit (' +
        (fallback ? 'fallback, ' : 'SRD, ') +
        (mobile ? 'mobile' : 'desktop') +
        ')',
      { mobile, url: '/?screen=character-create' + (fallback ? '&catalog=fallback' : '') },
      async (page) => {
        await page.getByLabel('Имя персонажа').fill('Holmes')
        await page.getByLabel(/^Раса/).selectOption(fallback ? 'human' : 'srd-2024_human')
        await page.getByLabel(/^Класс/).selectOption(fallback ? 'sorcerer' : 'srd-2024_sorcerer')
        await page.getByRole('button', { name: 'Далее', exact: true }).click()
        // Point buy: STR15, DEX14, CON15, INT8, WIS10, CHA8 uses all 27 points.
        for (const [ability, count] of [
          ['Сила', 7],
          ['Ловкость', 6],
          ['Телосложение', 7],
          ['Мудрость', 2],
        ]) {
          for (let n = 0; n < count; n++)
            await page.getByRole('button', { name: 'Увеличить ' + ability, exact: true }).click()
        }
        await page.getByRole('button', { name: 'Далее', exact: true }).click()
        await page.getByRole('button', { name: 'Артист', exact: true }).click()
        await page.getByRole('button', { name: 'Магия ИНТ', exact: true }).click()
        await page
          .getByRole('button', { name: fallback ? 'Религия ИНТ' : 'Природа ИНТ', exact: true })
          .click()
        await page.getByRole('button', { name: 'Далее', exact: true }).click()
        const hpCard = page.getByText('HP', { exact: true }).locator('..')
        await expect(hpCard).toHaveText(fallback ? 'HP9' : 'HP8')
        await expect(page.getByTestId('workspace-main')).not.toContainText('D62')
        await page.screenshot({
          path: path.join(
            output,
            (mobile ? 'mobile' : 'desktop') + (fallback ? '-fallback' : '') + '-character-hp.png'
          ),
        })
        await page.getByRole('button', { name: 'Создать персонажа', exact: true }).click()
        await expect
          .poll(() => page.evaluate(() => window.__uiLab.createdCharacters.length))
          .toBe(1)
        const created = await page.evaluate(() => window.__uiLab.createdCharacters[0])
        expect(created.name).toBe('Holmes')
        expect(created.data.class).toBe('sorcerer')
        const expectedHP = fallback ? 9 : 8
        expect(created.data.hp).toEqual({ current: expectedHP, max: expectedHP, temp: 0 })
        expect(created.data.abilities.con).toBe(fallback ? 16 : 15)
        await expect
          .poll(() => page.evaluate(() => window.__uiLab.navigated))
          .toEqual(['/campaign/test/characters/offline-character'])
      }
    )
  }

  for (const mobile of [false, true]) {
    await scenario(
      'legacy HP diagnosis keeps the actual sheet readable and write controls paused (' +
        (mobile ? 'mobile' : 'desktop') +
        ')',
      { mobile, url: '/?screen=character-sheet&hp=string' },
      async (page) => {
        for (const kind of [
          'string',
          'missing',
          'null',
          'empty',
          'object',
          'partial',
          'over',
          'temp',
        ]) {
          await page.goto(origin + '/?screen=character-sheet&hp=' + kind)
          await expect(page.getByRole('heading', { name: 'Holmes', exact: true })).toBeVisible()
          const notice = page.getByRole('region', { name: 'HP требуют проверки' })
          await expect(notice).toBeVisible()
          await expect(page.getByRole('button', { name: /^Level 1/ })).toBeDisabled()
          await expect(page.getByRole('button', { name: '+1', exact: true })).toHaveCount(0)
          await expect(page.getByText('Спасброски от смерти', { exact: true })).toHaveCount(0)
          await expect(page.getByTestId('workspace-main')).not.toContainText('NaN')
          await notice.getByText('Посмотреть сохранённые HP', { exact: true }).click()
          if (kind === 'string') await expect(notice).toContainText('«D62»')
          await page.getByRole('tab', { name: 'Заклинания', exact: true }).click()
          await expect(notice).toBeVisible()
          await expect(
            page.getByRole('button', { name: 'Длительный отдых', exact: true })
          ).toHaveCount(0)
          await page.getByRole('tab', { name: 'Инвентарь', exact: true }).click()
          await expect(notice).toBeVisible()
          expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
        }
        await page.goto(origin + '/?screen=character-sheet&hp=string')
        const before = await page.evaluate(() => window.__characterFixture)
        const downloadPromise = page.waitForEvent('download')
        await page.getByRole('button', { name: 'Скачать копию персонажа', exact: true }).click()
        const download = await downloadPromise
        expect(download.suggestedFilename()).toBe('character-offline-character-backup.json')
        const backup = JSON.parse(await readFile(await download.path(), 'utf8'))
        expect(backup.character).toEqual(before)
        expect(backup.character.data_json.hp).toEqual({ current: 'D62', max: 'D62', temp: 0 })
        expect(await page.evaluate(() => window.__characterFixture)).toEqual(before)
        await page.getByRole('button', { name: 'Обновить лист', exact: true }).click()
        expect(await page.evaluate(() => window.__uiLab.refreshes)).toBe(1)
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
        await page.getByRole('region', { name: 'HP требуют проверки' }).evaluate((el) => {
          const bottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0
          window.scrollBy({
            top: el.getBoundingClientRect().top - bottom - 12,
            behavior: 'instant',
          })
        })
        await page.screenshot({
          path: path.join(output, (mobile ? 'mobile' : 'desktop') + '-hp-diagnosis.png'),
        })
      }
    )
  }
  await scenario(
    'valid and legacy HP keep actual sheet controls; invalid English read-only view remains safe',
    { url: '/?screen=character-sheet&hp=legacy' },
    async (page) => {
      for (const kind of ['legacy', 'valid']) {
        await page.goto(origin + '/?screen=character-sheet&hp=' + kind)
        await expect(page.getByRole('region', { name: 'HP требуют проверки' })).toHaveCount(0)
        await expect(page.getByText('4 / 8', { exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: /^Level 1/ })).toBeEnabled()
        await page.getByRole('button', { name: '+1', exact: true }).click()
        await expect.poll(() => page.evaluate(() => window.__uiLab.characterActions.length)).toBe(1)
        expect(await page.evaluate(() => window.__uiLab.characterActions[0])).toEqual({
          name: 'updateCharacterHP',
          args: ['offline-character', 'test', { current: 5 }],
        })
      }
      await page.goto(origin + '/?screen=character-sheet&hp=zero')
      await expect(page.getByText('Спасброски от смерти', { exact: true })).toBeVisible()
      await page.goto(origin + '/?screen=character-sheet&hp=null&lang=en&readonly=true&role=player')
      await expect(page.getByRole('heading', { name: 'HP need checking' })).toBeVisible()
      await expect(page.getByRole('button', { name: /^Level 1/ })).toHaveCount(0)
      await expect(
        page.getByRole('button', { name: 'Download character backup', exact: true })
      ).toBeVisible()
      await page.getByText('View saved HP', { exact: true }).click()
      await expect(page.getByRole('region', { name: 'HP need checking' })).toContainText('Not set')
      expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
    }
  )

  for (const mobile of [false, true]) {
    await scenario(
      'class changes require review, preserve the draft on cancel and submit once (' +
        (mobile ? 'mobile' : 'desktop') +
        ')',
      { mobile, url: '/?screen=character-sheet&hp=valid&subclass=1' },
      async (page) => {
        const before = await page.evaluate(() => window.__characterFixture)
        await page.getByRole('button', { name: 'Изменить класс', exact: true }).click()
        const save = page.getByRole('button', { name: 'Сохранить', exact: true })
        await expect(save).toBeDisabled()
        await page.getByLabel('Класс персонажа', { exact: true }).selectOption('fighter')
        await expect(page.getByLabel('Подкласс персонажа', { exact: true })).toHaveValue('')
        await expect(
          page
            .getByLabel('Подкласс персонажа', { exact: true })
            .locator('option[value="srd-2024_draconic-sorcery"]')
        ).toHaveCount(0)
        await page
          .getByLabel('Подкласс персонажа', { exact: true })
          .selectOption('srd-2024_champion')
        await save.click()
        const dialog = page.getByRole('dialog', { name: 'Подтвердить изменение класса' })
        await expect(dialog).toBeVisible()
        for (const text of ['Сейчас', 'После изменения', 'Чародей', 'Воин', 'Чемпион'])
          await expect(dialog.getByText(text, { exact: true })).toBeVisible()
        await expect(dialog).toContainText(
          'HP, уровень, характеристики, владения, заклинания и снаряжение сохранятся.'
        )
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
        const close = dialog.getByRole('button', { name: 'Закрыть', exact: true })
        const confirm = dialog.getByRole('button', { name: 'Подтвердить изменение', exact: true })
        await expect(close).toBeFocused()
        await page.keyboard.press('Shift+Tab')
        await expect(confirm).toBeFocused()
        await page.keyboard.press('Tab')
        await expect(close).toBeFocused()
        await page.screenshot({
          path: path.join(output, (mobile ? 'mobile' : 'desktop') + '-class-confirmation.png'),
        })
        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
        await expect(save).toBeFocused()
        await expect(page.getByLabel('Класс персонажа', { exact: true })).toHaveValue('fighter')
        await save.click()
        await dialog.getByRole('button', { name: 'Отмена', exact: true }).click()
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
        await save.click()
        await page.evaluate(() => {
          window.__uiLab.identityOutcome = 'success'
          window.__uiLab.identityDelay = 1200
        })
        await confirm.evaluate((el) => {
          el.click()
          el.click()
        })
        await expect.poll(() => page.evaluate(() => window.__uiLab.characterActions.length)).toBe(1)
        await expect(close).toBeDisabled()
        await page.keyboard.press('Escape')
        await expect(dialog).toBeVisible()
        await page.keyboard.press('Tab')
        await expect(dialog).toBeFocused()
        await expect.poll(() => page.evaluate(() => window.__uiLab.refreshes)).toBe(1)
        await expect(dialog).toHaveCount(0)
        await expect(
          page.getByRole('button', { name: 'Изменить класс', exact: true })
        ).toBeVisible()
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([
          {
            name: 'updateCharacterIdentityAtomic',
            args: ['offline-character', 'test', 'fighter', 'srd-2024_champion'],
          },
        ])
        expect(await page.evaluate(() => window.__characterFixture)).toEqual(before)
      }
    )
  }
  await scenario(
    'subclass removal stays reviewable after server and transport errors, then retries without data replacement',
    { url: '/?screen=character-sheet&hp=valid&subclass=1' },
    async (page) => {
      const before = await page.evaluate(() => window.__characterFixture)
      await page.getByRole('button', { name: 'Изменить класс', exact: true }).click()
      await page.getByLabel('Подкласс персонажа', { exact: true }).selectOption('')
      await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Подтвердить изменение класса' })
      await expect(dialog.getByText('Без подкласса', { exact: true })).toBeVisible()
      const confirm = dialog.getByRole('button', { name: 'Подтвердить изменение', exact: true })
      await confirm.click()
      await expect(
        page.getByText('Offline character action boundary', { exact: true })
      ).toBeVisible()
      await expect(confirm).toBeEnabled()
      await expect(dialog).toBeVisible()
      expect(await page.evaluate(() => window.__uiLab.refreshes)).toBe(0)
      await page.evaluate(() => {
        window.__uiLab.identityOutcome = 'throw'
      })
      await confirm.click()
      await expect.poll(() => page.evaluate(() => window.__uiLab.characterActions.length)).toBe(2)
      await expect(confirm).toBeEnabled()
      await expect(dialog).toBeVisible()
      expect(await page.evaluate(() => window.__uiLab.refreshes)).toBe(0)
      await page.evaluate(() => {
        window.__uiLab.identityOutcome = 'success'
      })
      await confirm.click()
      await expect.poll(() => page.evaluate(() => window.__uiLab.refreshes)).toBe(1)
      await expect(dialog).toHaveCount(0)
      const calls = await page.evaluate(() => window.__uiLab.characterActions)
      expect(calls).toHaveLength(3)
      for (const call of calls) {
        expect(call.name).toBe('updateCharacterIdentityAtomic')
        expect(call.args.slice(0, 3)).toEqual(['offline-character', 'test', 'sorcerer'])
        expect(call.args[3]).toBeUndefined()
      }
      expect(await page.evaluate(() => window.__characterFixture)).toEqual(before)
    }
  )
  await scenario(
    'English class review supports prefixed legacy identity and read-only viewers have no edit control',
    { url: '/?screen=character-sheet&hp=valid&lang=en&prefixed=1' },
    async (page) => {
      await page.getByRole('button', { name: 'Change class', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Confirm class change' })
      await expect(dialog.getByText('Sorcerer', { exact: true })).toHaveCount(2)
      await expect(dialog).toContainText('proficiencies, spells and equipment will stay unchanged')
      await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeVisible()
      await expect(dialog).not.toContainText('srd-2024')
      await page.keyboard.press('Escape')
      expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
      await page.getByLabel('Character class', { exact: true }).selectOption('wizard')
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(dialog.getByText('Wizard', { exact: true })).toBeVisible()
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
      await page.goto(
        origin + '/?screen=character-sheet&hp=valid&lang=en&readonly=true&role=player'
      )
      await expect(page.getByRole('button', { name: 'Change class', exact: true })).toHaveCount(0)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
    }
  )
  await scenario(
    'inventory search, rarity and type preserve totals and make no writes',
    { url: '/?screen=character-sheet&hp=valid&library=populated' },
    async (page) => {
      await page.getByRole('tab', { name: 'Инвентарь', exact: true }).click()
      const panel = page.getByRole('tabpanel')
      const before = await page.evaluate(() => window.__characterFixture)
      await expect(panel.getByRole('heading', { name: 'Снаряжение героя' })).toBeVisible()
      await expect(
        panel.getByRole('link', { name: 'Справочник предметов', exact: true })
      ).toHaveAttribute('href', '/campaign/test/items')
      await expect(panel.locator('span').getByText('Редкий', { exact: true })).toBeVisible()
      const filters = panel.getByRole('region', { name: 'Фильтры инвентаря' })
      await filters.getByRole('searchbox').fill('  СВЕТИТСЯ  ')
      await expect(filters.getByRole('status')).toContainText('1 / 4')
      await expect(panel.getByText('Лунный клинок Moonblade', { exact: true })).toBeVisible()
      await expect(panel.getByText('Лечебное зелье Healing potion', { exact: true })).toHaveCount(0)
      await filters.getByRole('button', { name: 'Сбросить фильтры' }).click()
      await filters.getByLabel('Фильтр по типу').selectOption('other')
      await expect(panel.getByText('Верёвка Rope', { exact: true })).toBeVisible()
      await expect(filters.getByRole('status')).toContainText('1 / 4')
      await filters.getByLabel('Фильтр по редкости').selectOption('rare')
      await expect(panel).toContainText('По заданным фильтрам ничего не найдено.')
      await filters.getByRole('button', { name: 'Сбросить фильтры' }).click()
      await expect(filters.getByRole('status')).toContainText('4 / 4')
      expect(await page.evaluate(() => window.__characterFixture)).toEqual(before)
      expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
      expect(await page.evaluate(() => window.__uiLab.refreshes)).toBe(0)
      await page.screenshot({ path: path.join(output, 'desktop-inventory.png'), fullPage: true })
    }
  )
  await scenario(
    'spellbook combines search, levels and preparation without changing slots or data',
    { url: '/?screen=character-sheet&hp=valid&library=populated' },
    async (page) => {
      await page.getByRole('tab', { name: 'Заклинания', exact: true }).click()
      const panel = page.getByRole('tabpanel')
      const before = await page.evaluate(() => window.__characterFixture)
      await expect(
        panel.getByRole('link', { name: 'Справочник заклинаний', exact: true })
      ).toHaveAttribute('href', '/campaign/test/spells')
      const summary = panel.getByLabel('Сводка книги заклинаний')
      await expect(
        summary.locator('div').filter({ hasText: 'Подготовлено' }).locator('dd')
      ).toHaveText('3')
      const filters = panel.getByRole('region', { name: 'Фильтры книги заклинаний' })
      await filters.getByRole('searchbox').fill('  ЗАЩИТНЫЙ  ')
      await expect(filters.getByRole('status')).toHaveText('Найдено: 1 / 4')
      await expect(panel.getByText('Щит Shield', { exact: true })).toBeVisible()
      await filters.getByRole('button', { name: 'Сбросить фильтры' }).click()
      await filters.getByLabel('Уровень заклинания').selectOption('1')
      await filters.getByLabel('Подготовка', { exact: true }).selectOption('unprepared')
      await expect(filters.getByRole('status')).toHaveText('Найдено: 1 / 4')
      await expect(panel.getByText('Опознание Identify', { exact: true })).toBeVisible()
      await expect(panel.getByText('Щит Shield', { exact: true })).toHaveCount(0)
      await filters.getByRole('searchbox').fill('ничего')
      await expect(panel).toContainText('Измени запрос или сбрось фильтры.')
      await expect(panel.getByRole('img', { name: /0\/4/ })).toBeVisible()
      await expect(summary.locator('div').filter({ hasText: 'Всего' }).locator('dd')).toHaveText(
        '4'
      )
      await filters.getByRole('button', { name: 'Сбросить фильтры' }).click()
      await expect(filters.getByRole('status')).toHaveText('Найдено: 4 / 4')
      expect(await page.evaluate(() => window.__characterFixture)).toEqual(before)
      expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
      expect(await page.evaluate(() => window.__uiLab.refreshes)).toBe(0)
      await page.screenshot({ path: path.join(output, 'desktop-spellbook.png'), fullPage: true })
    }
  )
  await scenario(
    'empty libraries expose catalog links and disabled search',
    { mobile: true, url: '/?screen=character-sheet&hp=valid' },
    async (page) => {
      await page.getByRole('tab', { name: 'Инвентарь', exact: true }).click()
      const panel = page.getByRole('tabpanel')
      await expect(panel.getByRole('heading', { name: 'Снаряжение героя' })).toBeVisible()
      await expect(
        panel.getByRole('link', { name: 'Справочник предметов', exact: true })
      ).toBeVisible()
      await expect(panel.getByRole('searchbox')).toBeDisabled()
      await expect(
        panel.getByRole('button', { name: 'Добавить предмет', exact: true })
      ).toBeVisible()
      await page.getByRole('tab', { name: 'Заклинания', exact: true }).click()
      await expect(panel.getByRole('heading', { name: 'Книга заклинаний' })).toBeVisible()
      await expect(
        panel.getByRole('link', { name: 'Справочник заклинаний', exact: true })
      ).toBeVisible()
      await expect(panel.getByRole('searchbox')).toBeDisabled()
      await expect(
        panel.getByRole('button', { name: 'Добавить заклинание', exact: true })
      ).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      )
      expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
    }
  )
  for (const lang of ['ru', 'en']) {
    await scenario(
      `mobile ${lang} libraries fit 390px and allow read-only filtering`,
      {
        mobile: true,
        url: `/?screen=character-sheet&hp=valid&library=populated&readonly=true&role=player&lang=${lang}&theme=light`,
      },
      async (page) => {
        const panel = page.getByRole('tabpanel')
        await page
          .getByRole('tab', { name: lang === 'ru' ? 'Инвентарь' : 'Inventory', exact: true })
          .click()
        await expect(
          panel.getByRole('button', {
            name: lang === 'ru' ? 'Добавить предмет' : 'Add item',
            exact: true,
          })
        ).toHaveCount(0)
        await expect(
          panel.getByRole('link', {
            name: lang === 'ru' ? 'Справочник предметов' : 'Item catalog',
            exact: true,
          })
        ).toBeVisible()
        await panel.getByRole('searchbox').click()
        await panel.getByRole('searchbox').fill('Moonblade')
        await expect(panel.getByText('Лунный клинок Moonblade', { exact: true })).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
        await page.screenshot({
          path: path.join(output, `mobile-inventory-${lang}.png`),
          fullPage: false,
        })
        await page
          .getByRole('tab', { name: lang === 'ru' ? 'Заклинания' : 'Spells', exact: true })
          .click()
        const filters = panel.getByRole('region', {
          name: lang === 'ru' ? 'Фильтры книги заклинаний' : 'Spellbook filters',
        })
        for (const control of await filters.locator('input,select').all()) {
          expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(48)
        }
        await filters.getByRole('searchbox').click()
        await filters.getByRole('searchbox').fill('SHIELD')
        await expect(panel.getByText('Щит Shield', { exact: true })).toBeVisible()
        await expect(
          panel.getByRole('button', {
            name: lang === 'ru' ? 'Добавить заклинание' : 'Add spell',
            exact: true,
          })
        ).toHaveCount(0)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
        await page.screenshot({
          path: path.join(output, `mobile-spellbook-${lang}.png`),
          fullPage: false,
        })
      }
    )
  }

  await scenario(
    'catalog ignores late successes and late failures; input stays editable',
    { url: '/?screen=items' },
    async (page) => {
      const search = page.getByRole('searchbox')
      expect(await page.evaluate(() => window.__uiLab.catalogRequests)).toEqual([])
      await page.evaluate(() => {
        window.__uiLab.catalogMode = 'deferred'
      })
      await search.fill('amber')
      await expect.poll(() => page.evaluate(() => window.__uiLab.catalogPending.length)).toBe(1)
      await expect(search).toBeEnabled()
      await search.fill('azure')
      await expect.poll(() => page.evaluate(() => window.__uiLab.catalogPending.length)).toBe(2)
      await page.evaluate(() => {
        const p = window.__uiLab.catalogPending[1]
        p.resolve(window.__catalogPage(p.filters, p.offset))
      })
      await expect(page.getByRole('heading', { name: 'azure 001', exact: true })).toBeVisible()
      await page.evaluate(() => {
        const p = window.__uiLab.catalogPending[0]
        p.resolve(window.__catalogPage(p.filters, p.offset))
      })
      await expect(page.getByRole('heading', { name: 'amber 001', exact: true })).toHaveCount(0)
      await search.fill('slow')
      await expect.poll(() => page.evaluate(() => window.__uiLab.catalogPending.length)).toBe(3)
      await search.fill('fresh')
      await expect.poll(() => page.evaluate(() => window.__uiLab.catalogPending.length)).toBe(4)
      await page.evaluate(() => {
        const p = window.__uiLab.catalogPending[3]
        p.resolve(window.__catalogPage(p.filters, p.offset))
      })
      await expect(page.getByRole('heading', { name: 'fresh 001', exact: true })).toBeVisible()
      await page.evaluate(() => window.__uiLab.catalogPending[2].reject(new Error('late failure')))
      await expect(page.getByRole('alert')).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
    }
  )

  await scenario(
    'catalog failure, retry, empty result and page reset keep the search state',
    { url: '/?screen=items' },
    async (page) => {
      const search = page.getByRole('searchbox')
      await page.getByRole('button', { name: 'Далее', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Item 025', exact: true })).toBeVisible()
      await expect(page.getByRole('status')).toContainText('25–48')
      await page.getByRole('button', { name: 'Далее', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Item 049', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeDisabled()
      await page.getByRole('button', { name: 'Назад', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Item 025', exact: true })).toBeVisible()
      await page.evaluate(() => {
        window.__uiLab.catalogMode = 'error'
      })
      await search.fill('moon')
      await expect(page.getByRole('alert')).toContainText('Не удалось загрузить')
      await expect(search).toHaveValue('moon')
      await expect(page.getByText('Ничего не найдено', { exact: true })).toHaveCount(0)
      await page.evaluate(() => {
        window.__uiLab.catalogMode = 'normal'
      })
      await page.getByRole('button', { name: 'Повторить', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'moon 001', exact: true })).toBeVisible()
      expect(await page.evaluate(() => window.__uiLab.catalogRequests.at(-1).offset)).toBe(0)
      await search.fill('none')
      await expect(page.getByRole('status')).toHaveText('')
      await expect(
        page.getByRole('heading', { name: 'Ничего не найдено', exact: true })
      ).toBeVisible()
      await page.evaluate(() => {
        window.__uiLab.catalogMode = 'throw'
      })
      await search.fill('retry-me')
      await expect(page.getByRole('alert')).toBeVisible()
      await page.evaluate(() => {
        window.__uiLab.catalogMode = 'normal'
      })
      await page.getByRole('button', { name: 'Повторить', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'retry-me 001', exact: true })).toBeVisible()
      expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
    }
  )

  for (const lang of ['ru', 'en']) {
    await scenario(
      'mobile catalog filters and pages are usable in ' + lang,
      { mobile: true, url: '/?screen=items&lang=' + lang },
      async (page) => {
        const search = page.getByRole('searchbox')
        await page
          .getByRole('button', { name: lang === 'ru' ? 'Далее' : 'Next', exact: true })
          .click()
        await expect(page.getByRole('heading', { name: 'Item 025', exact: true })).toBeVisible()
        const filters = page.getByRole('button', {
          name: lang === 'ru' ? 'Фильтры' : 'Filters',
          exact: true,
        })
        await filters.click()
        const category = page.getByRole('button', {
          name: lang === 'ru' ? 'Волшебная палочка' : 'Wand',
          exact: true,
        })
        await category.click()
        await expect(category).toHaveAttribute('aria-pressed', 'true')
        await expect
          .poll(() => page.evaluate(() => window.__uiLab.catalogRequests.at(-1).filters.type))
          .toEqual(['Wand'])
        const rarity = page.getByRole('button', {
          name: lang === 'ru' ? 'Легендарный (Legendary)' : 'Legendary',
          exact: true,
        })
        await rarity.click()
        await expect(rarity).toHaveAttribute('aria-pressed', 'true')
        await expect(page.getByRole('status')).toContainText('1–10')
        expect(await page.evaluate(() => window.__uiLab.catalogRequests.at(-1).offset)).toBe(0)
        await search.fill('moon')
        await expect(page.getByRole('heading', { name: 'moon 001', exact: true })).toBeVisible()
        expect(
          await page.evaluate(() => window.__uiLab.catalogRequests.at(-1).filters.rarity)
        ).toEqual(['legendary'])
        const box = await filters.boundingBox()
        expect(box.height).toBeGreaterThanOrEqual(44)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
        await page.screenshot({
          path: path.join(output, 'mobile-catalog-' + lang + '.png'),
          fullPage: false,
        })
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
      }
    )
  }

  for (const lang of ['ru', 'en']) {
    for (const editor of [false, true]) {
      await scenario(
        'item cards keep long names, localized categories and read permissions in ' +
          lang +
          ' editor=' +
          editor,
        {
          mobile: true,
          url: '/?screen=items&catalogAppearance&lang=' + lang + (editor ? '&catalogEditor' : ''),
        },
        async (page) => {
          const longName = 'Ancient Wand of the Unbreakable Everlasting Celestial Constellation'
          const title = page.getByRole('heading', { name: longName, exact: true })
          await expect(title).toBeVisible()
          expect(
            await title.evaluate(
              (el) =>
                el.scrollWidth <= el.clientWidth && getComputedStyle(el).whiteSpace !== 'nowrap'
            )
          ).toBe(true)
          const unknownTitle = page.getByRole('heading', {
            name: 'Unbroken'.repeat(12),
            exact: true,
          })
          expect(await unknownTitle.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
          await expect(
            page.getByText(lang === 'ru' ? 'Волшебная палочка' : 'Wand', { exact: true })
          ).toBeVisible()
          await expect(page.getByText('Uncatalogued Relic', { exact: true })).toBeVisible()
          const details = page.getByRole('button', {
            name: lang === 'ru' ? 'Подробнее' : 'Details',
            exact: true,
          })
          expect((await details.first().boundingBox()).height).toBeGreaterThanOrEqual(44)
          const add = page.getByRole('button', {
            name: lang === 'ru' ? 'Добавить персонажу' : 'Add to character',
            exact: true,
          })
          await expect(add).toHaveCount(editor ? 2 : 0)
          if (editor) expect((await add.first().boundingBox()).height).toBeGreaterThanOrEqual(44)
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          await page.screenshot({
            path: path.join(
              output,
              'mobile-item-cards-' + lang + (editor ? '-editor' : '-reader') + '.png'
            ),
            fullPage: true,
          })
          if (editor) await add.first().click()
          else await details.first().click()
          const dialog = page.getByRole('dialog')
          await expect(dialog).toBeVisible()
          await expect(dialog).toContainText(lang === 'ru' ? 'Волшебная палочка' : 'Wand')
          await expect(dialog.getByRole('combobox')).toHaveCount(editor ? 1 : 0)
          await dialog
            .getByRole('button', { name: lang === 'ru' ? 'Закрыть' : 'Close', exact: true })
            .click()
          await details.nth(1).click()
          await expect(page.getByRole('dialog')).toContainText('Uncatalogued Relic')
          expect(
            await page
              .getByRole('dialog')
              .getByRole('heading')
              .evaluate((el) => el.scrollWidth <= el.clientWidth)
          ).toBe(true)
          await page.keyboard.press('Escape')
          expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
        }
      )
    }
  }

  for (const lang of ['ru', 'en']) {
    for (const view of ['mobile-reader', 'mobile-editor', 'desktop-reader']) {
      const editor = view === 'mobile-editor'
      await scenario(
        'spell cards expose parameters, preserve unknown values and open details in ' +
          lang +
          ' ' +
          view,
        {
          mobile: view.startsWith('mobile'),
          url: '/?screen=spells&spellAppearance&lang=' + lang + (editor ? '&spellEditor' : ''),
        },
        async (page) => {
          const original = await page.evaluate(() => window.__referencePage('spells'))
          const title = page.getByRole('heading', {
            name: 'Ancient Constellation of the Everlasting Celestial Guardian',
            exact: true,
          })
          await expect(title).toBeVisible()
          expect(
            await title.evaluate(
              (el) =>
                el.scrollWidth <= el.clientWidth && getComputedStyle(el).whiteSpace !== 'nowrap'
            )
          ).toBe(true)
          const card = title.locator('..').locator('..')
          await expect(card).toContainText(lang === 'ru' ? '3 ур.' : 'Lvl 3')
          await expect(card).toContainText(lang === 'ru' ? 'Воплощение' : 'Evocation')
          await expect(card).toContainText(lang === 'ru' ? 'Ритуал' : 'Ritual')
          await expect(card).toContainText(lang === 'ru' ? 'концентрация' : 'concentration')
          expect(await card.locator('dd').allTextContents()).toEqual([
            '1 action',
            '60 feet',
            'Up to 1 minute',
            'V, S, M (a silver star)',
          ])
          const missing = page
            .getByRole('heading', { name: 'Unbroken'.repeat(12), exact: true })
            .locator('..')
            .locator('..')
          await expect(missing).toContainText(lang === 'ru' ? 'Заговор' : 'Cantrip')
          expect(await missing.locator('dd').allTextContents()).toEqual(['—', '—', '—', '—'])
          expect(
            await missing.getByRole('heading').evaluate((el) => el.scrollWidth <= el.clientWidth)
          ).toBe(true)
          await expect(page.getByText('Custom Arcanum', { exact: true })).toBeVisible()
          await expect(page.locator('body')).not.toContainText('school.')
          const details = page.getByRole('button', {
            name: lang === 'ru' ? 'Подробнее' : 'Details',
            exact: true,
          })
          expect((await details.first().boundingBox()).height).toBeGreaterThanOrEqual(44)
          const add = page.getByRole('button', {
            name: lang === 'ru' ? 'Добавить персонажу' : 'Add to character',
            exact: true,
          })
          await expect(add).toHaveCount(editor ? 3 : 0)
          if (editor) {
            expect((await add.first().boundingBox()).height).toBeGreaterThanOrEqual(44)
            await expect(add.first()).toContainText(lang === 'ru' ? 'Добавить' : 'Add')
          }
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          await card.screenshot({
            path: path.join(output, 'spell-card-' + lang + '-' + view + '.png'),
          })
          if (editor) await add.first().click()
          else await details.first().click()
          const dialog = page.getByRole('dialog')
          await expect(dialog).toBeVisible()
          await expect(dialog).toContainText(
            lang === 'ru' ? 'Волшебник, Жрец, Mystic Sage' : 'Wizard, Cleric, Mystic Sage'
          )
          await expect(dialog).toContainText('Synthetic higher-level description')
          await expect(dialog.getByRole('combobox')).toHaveCount(editor ? 1 : 0)
          if (editor) {
            await expect(dialog.getByRole('combobox')).toHaveAttribute('aria-label', /.+/)
            await dialog.getByRole('combobox').selectOption('offline-other')
            await expect(dialog.getByRole('combobox')).toHaveValue('offline-other')
            expect(
              (await dialog.getByRole('combobox').boundingBox()).height
            ).toBeGreaterThanOrEqual(44)
          }
          expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
          await dialog.screenshot({
            path: path.join(output, 'spell-detail-' + lang + '-' + view + '.png'),
          })
          await dialog
            .getByRole('button', { name: lang === 'ru' ? 'Закрыть' : 'Close', exact: true })
            .click()
          await details.nth(2).click()
          await expect(page.getByRole('dialog')).toContainText('Custom Arcanum')
          await page.keyboard.press('Escape')
          expect(await page.evaluate(() => window.__referencePage('spells'))).toEqual(original)
          expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
        }
      )
    }
  }

  for (const lang of ['ru', 'en']) {
    for (const view of ['mobile-reader', 'mobile-editor', 'desktop-reader']) {
      const editor = view === 'mobile-editor'
      await scenario(
        'bestiary cards and details preserve source values and fit ' + lang + ' ' + view,
        {
          mobile: view.startsWith('mobile'),
          width: editor ? 390 : 320,
          url:
            '/?screen=bestiary&monsterAppearance&lang=' + lang + (editor ? '&monsterEditor' : ''),
        },
        async (page) => {
          const original = await page.evaluate(() => window.__referencePage('bestiary'))
          const title = page.getByRole('heading', {
            name: 'Ancient Guardian of the Everlasting Celestial Constellation',
            exact: true,
          })
          await expect(title).toBeVisible()
          expect(
            await title.evaluate(
              (el) =>
                el.scrollWidth <= el.clientWidth && getComputedStyle(el).whiteSpace !== 'nowrap'
            )
          ).toBe(true)
          const card = title.locator('..')
          await expect(card).toContainText(lang === 'ru' ? 'Дракон' : 'Dragon')
          await expect(card).toContainText(lang === 'ru' ? 'Большой (Large)' : 'Large')
          await expect(card).toContainText((lang === 'ru' ? 'ХП' : 'HP') + ' 123')
          await expect(card).toContainText((lang === 'ru' ? 'КД' : 'AC') + ' 17')
          const custom = page.getByRole('heading', { name: 'Unbroken'.repeat(12), exact: true })
          expect(await custom.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
          await expect(custom.locator('..')).toContainText('Custom Guardian')
          await expect(custom.locator('..')).toContainText((lang === 'ru' ? 'ХП' : 'HP') + ' 42')
          await expect(page.locator('body')).not.toContainText('monsterType.')
          await expect(page.locator('body')).not.toContainText('monsterSize.')
          const details = page.getByRole('button', {
            name: lang === 'ru' ? 'Подробнее' : 'Details',
            exact: true,
          })
          const add = page.getByRole('button', {
            name: lang === 'ru' ? 'Добавить в кампанию' : 'Add to campaign',
            exact: true,
          })
          expect((await details.first().boundingBox()).height).toBeGreaterThanOrEqual(44)
          await expect(add).toHaveCount(editor ? 3 : 0)
          if (editor) {
            expect((await add.first().boundingBox()).height).toBeGreaterThanOrEqual(44)
            await expect(add.first()).toContainText(lang === 'ru' ? 'Добавить' : 'Add')
          }
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          await card.screenshot({
            path: path.join(output, 'monster-card-' + lang + '-' + view + '.png'),
          })
          if (editor) await add.first().click()
          else await details.first().click()
          const dialog = page.getByRole('dialog')
          await expect(dialog).toBeVisible()
          expect(await dialog.locator('dd').allTextContents()).toEqual([
            '17',
            '123',
            '0 ft',
            '1/8',
            '25',
          ])
          const abilityGrid = dialog.locator('.grid').nth(1)
          expect(
            await abilityGrid.locator(':scope > div > div:nth-child(2)').allTextContents()
          ).toEqual(['23', '8', '16', '10', '19', '12'])
          expect(
            await abilityGrid.locator(':scope > div > div:nth-child(3)').allTextContents()
          ).toEqual(['+6', '-1', '+3', '+0', '+4', '+1'])
          const cells = await abilityGrid.locator(':scope > div').evaluateAll((els) =>
            els.map((el) => ({
              x: el.getBoundingClientRect().x,
              y: el.getBoundingClientRect().y,
            }))
          )
          expect(cells[3].y > cells[0].y).toBe(view.startsWith('mobile'))
          await expect(dialog).toContainText('Synthetic creature description.')
          expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
          const close = dialog
            .getByRole('button', { name: lang === 'ru' ? 'Закрыть' : 'Close', exact: true })
            .last()
          expect((await close.boundingBox()).height).toBeGreaterThanOrEqual(44)
          await expect(
            dialog.getByRole('button', {
              name: lang === 'ru' ? 'Добавить в кампанию' : 'Add to campaign',
              exact: true,
            })
          ).toHaveCount(editor ? 1 : 0)
          await dialog.screenshot({
            path: path.join(output, 'monster-detail-' + lang + '-' + view + '.png'),
          })
          await close.click()
          await details.nth(1).click()
          await expect(dialog).toContainText('Uncatalogued Size, Custom Guardian')
          expect(await dialog.locator('dd').allTextContents()).toEqual(['—', '42', '—', '—', '—'])
          expect(
            await dialog
              .locator('.grid')
              .nth(1)
              .locator(':scope > div > div:nth-child(2)')
              .allTextContents()
          ).toEqual(Array(6).fill('—'))
          expect(
            await dialog
              .locator('.grid')
              .nth(1)
              .locator(':scope > div > div:nth-child(3)')
              .allTextContents()
          ).toEqual(Array(6).fill('—'))
          expect(
            await dialog.getByRole('heading').evaluate((el) => el.scrollWidth <= el.clientWidth)
          ).toBe(true)
          await page.keyboard.press('Escape')
          await details.nth(2).click()
          expect(await dialog.locator('dd').allTextContents()).toEqual(Array(5).fill('—'))
          await page.keyboard.press('Escape')
          expect(await page.evaluate(() => window.__referencePage('bestiary'))).toEqual(original)
          expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
        }
      )
    }
  }

  for (const lang of ['ru', 'en']) {
    for (const view of ['mobile-player', 'mobile-dm', 'desktop-dm']) {
      const dm = view !== 'mobile-player'
      await scenario(
        'session cards fit and preserve browsing in ' + lang + ' ' + view,
        {
          mobile: view.startsWith('mobile'),
          width: dm ? 390 : 320,
          timezoneId: 'Europe/Moscow',
          url: '/?screen=sessions&lang=' + lang + '&role=' + (dm ? 'dm' : 'player'),
        },
        async (page) => {
          const original = await page.evaluate(() => window.__sessionFixtures)
          await page
            .locator('summary')
            .filter({ hasText: lang === 'ru' ? 'Прошлые игры' : 'Past games' })
            .click()
          const cards = page.getByRole('article')
          await expect(cards).toHaveCount(3)
          const first = cards.nth(0),
            past = cards.nth(1),
            invalid = cards.nth(2)
          for (const card of [first, past]) {
            expect(
              await card
                .getByRole('heading')
                .evaluate(
                  (el) =>
                    el.scrollWidth <= el.clientWidth && getComputedStyle(el).whiteSpace !== 'nowrap'
                )
            ).toBe(true)
            expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
          }
          await expect(first.locator('time')).toHaveAttribute('datetime', '2099-07-10T14:30:00Z')
          await expect(first.locator('time')).toContainText(lang === 'ru' ? '17:30' : '05:30 PM')
          await expect(first.locator('time')).toContainText(/(?:GMT|UTC)\+3|MSK/)
          await expect(first).toContainText(lang === 'ru' ? '180 мин' : '180 min')
          expect(await first.locator('dd').allTextContents()).toEqual(['2', '1', '1'])
          await expect(first.locator('dl')).toHaveAttribute(
            'aria-label',
            lang === 'ru' ? 'Ответы участников' : 'Participant responses'
          )
          for (const label of lang === 'ru'
            ? ['Иду', 'Может быть', 'Не иду']
            : ['Going', 'Maybe', 'Not going'])
            await expect(first.locator('dl')).toContainText(label)
          const response = first.getByRole('group', {
            name: lang === 'ru' ? 'Ваш ответ' : 'Your response',
            exact: true,
          })
          await expect(response.getByRole('button')).toHaveCount(3)
          for (const b of await response.getByRole('button').all())
            expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44)
          await expect(past).toContainText(lang === 'ru' ? 'Прошла' : 'Past')
          await expect(past.getByRole('group')).toHaveCount(0)
          await expect(invalid).toContainText(
            lang === 'ru' ? 'Дата недоступна' : 'Date unavailable'
          )
          await expect(invalid.locator('time')).toHaveCount(0)
          await expect(invalid.getByRole('group')).toHaveCount(0)
          const remove = first.getByRole('button', { name: /^(Удалить сессию|Delete session)/ })
          await expect(remove).toHaveCount(dm ? 1 : 0)
          if (dm) expect((await remove.boundingBox()).height).toBeGreaterThanOrEqual(44)
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          await first.screenshot({
            path: path.join(output, 'session-card-' + lang + '-' + view + '.png'),
          })
          if (dm) {
            await remove.click()
            const dialog = page.getByRole('dialog')
            await expect(dialog).toContainText(original[0].title)
            await expect(
              dialog.getByRole('button', { name: lang === 'ru' ? 'Закрыть' : 'Close', exact: true })
            ).toBeVisible()
            expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
            await dialog
              .getByRole('button', { name: lang === 'ru' ? 'Отмена' : 'Cancel', exact: true })
              .click()
            await expect(page.getByRole('dialog')).toHaveCount(0)
          }
          expect(await page.evaluate(() => window.__sessionFixtures)).toEqual(original)
          expect(await page.evaluate(() => window.__uiLab.sessionActions)).toEqual([])
          expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
          await page.goto(
            origin +
              '/?screen=sessions&sessionsEmpty&lang=' +
              lang +
              '&role=' +
              (dm ? 'dm' : 'player')
          )
          await expect(page.getByRole('article')).toHaveCount(0)
          await expect(
            page.getByRole('heading', {
              name: lang === 'ru' ? 'Пока нет ни одной сессии' : 'No sessions yet',
              exact: true,
            })
          ).toBeVisible()
          await expect(
            page.getByRole('button', {
              name: lang === 'ru' ? 'Создать сессию' : 'Create session',
              exact: true,
            })
          ).toHaveCount(dm ? 1 : 0)
          expect(await page.evaluate(() => window.__uiLab.sessionActions)).toEqual([])
        }
      )
    }
    await scenario(
      'session forms and deliberate actions retain data after failure in ' + lang,
      {
        mobile: true,
        width: 320,
        timezoneId: 'Europe/Moscow',
        url: '/?screen=sessions&lang=' + lang,
      },
      async (page) => {
        const first = page.getByRole('article').first()
        const going = first
          .getByRole('group')
          .getByRole('button', { name: lang === 'ru' ? 'Иду' : 'Going', exact: true })
        await page.evaluate(() => {
          window.__uiLab.sessionDelay = 600
        })
        await going.click()
        await expect(going).toBeDisabled()
        await expect(going).toBeEnabled()
        await expect(
          page.getByText('Offline session action boundary', { exact: true }).last()
        ).toBeVisible()
        expect(await page.evaluate(() => window.__uiLab.sessionActions)).toEqual([
          { name: 'setRsvp', args: ['offline-future-session', 'yes'] },
        ])
        await page.evaluate(() => {
          window.__uiLab.sessionDelay = 0
        })
        await first.getByRole('button', { name: /^(Удалить сессию|Delete session)/ }).click()
        const dialog = page.getByRole('dialog')
        await dialog
          .getByRole('button', { name: lang === 'ru' ? 'Удалить' : 'Delete', exact: true })
          .click()
        await expect(dialog.getByRole('alert')).toContainText('Offline session action boundary')
        await expect(dialog).toBeVisible()
        await expect(
          dialog.getByRole('button', { name: lang === 'ru' ? 'Удалить' : 'Delete', exact: true })
        ).toBeEnabled()
        expect(await page.evaluate(() => window.__uiLab.sessionActions.at(-1))).toEqual({
          name: 'deleteSession',
          args: ['offline-future-session', 'test'],
        })
        await page.evaluate(() => {
          window.__uiLab.sessionOutcome = 'success'
        })
        await dialog
          .getByRole('button', { name: lang === 'ru' ? 'Удалить' : 'Delete', exact: true })
          .click()
        await expect(dialog).toHaveCount(0)
        expect(await page.evaluate(() => window.__uiLab.refreshes)).toBe(1)
        await page
          .getByRole('button', {
            name: lang === 'ru' ? 'Создать сессию' : 'Create session',
            exact: true,
          })
          .click()
        await expect(dialog).toBeVisible()
        const title = dialog.getByLabel(lang === 'ru' ? 'Название' : 'Title', { exact: false })
        const date = dialog.getByLabel(lang === 'ru' ? 'Дата и время' : 'Date and time', {
          exact: false,
        })
        await title.fill('Synthetic retry session')
        await date.fill('2099-07-11T18:00')
        await dialog
          .getByLabel(lang === 'ru' ? 'Описание' : 'Description', { exact: true })
          .fill('Retain this draft')
        for (const input of await dialog.locator('input').all())
          expect((await input.boundingBox()).height).toBeGreaterThanOrEqual(44)
        expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
        await page.evaluate(() => {
          window.__uiLab.sessionOutcome = 'error'
        })
        await dialog
          .getByRole('button', { name: lang === 'ru' ? 'Создать' : 'Create', exact: true })
          .click()
        await expect(dialog.getByRole('alert')).toContainText('Offline session action boundary')
        await expect(title).toHaveValue('Synthetic retry session')
        await expect(date).toHaveValue('2099-07-11T18:00')
        await expect(
          dialog.getByRole('button', { name: lang === 'ru' ? 'Создать' : 'Create', exact: true })
        ).toBeEnabled()
        expect(await page.evaluate(() => window.__uiLab.sessionActions.at(-1))).toEqual({
          name: 'createSession',
          args: [
            'test',
            {
              title: 'Synthetic retry session',
              description: 'Retain this draft',
              startsAt: '2099-07-11T15:00:00.000Z',
              durationMinutes: 180,
            },
          ],
        })
        await expect(
          page.getByText(lang === 'ru' ? 'Сессия удалена' : 'Session deleted', { exact: true })
        ).toHaveCount(0)
        await dialog.screenshot({
          path: path.join(output, 'session-create-' + lang + '-mobile.png'),
        })
        await page.evaluate(() => {
          window.__uiLab.sessionOutcome = 'success'
        })
        await dialog
          .getByRole('button', { name: lang === 'ru' ? 'Создать' : 'Create', exact: true })
          .click()
        await expect(dialog).toHaveCount(0)
        expect(await page.evaluate(() => window.__uiLab.sessionActions.map((x) => x.name))).toEqual(
          ['setRsvp', 'deleteSession', 'deleteSession', 'createSession', 'createSession']
        )
        expect(await page.evaluate(() => window.__uiLab.refreshes)).toBe(2)
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
      }
    )
  }

  await scenario(
    'initial catalog error can be retried without losing the SSR boundary',
    { url: '/?screen=items&initialError' },
    async (page) => {
      await expect(page.getByRole('alert')).toBeVisible()
      expect(await page.evaluate(() => window.__uiLab.catalogRequests)).toEqual([])
      await page.getByRole('button', { name: 'Повторить', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Item 001', exact: true })).toBeVisible()
    }
  )

  for (const kind of ['spells', 'bestiary']) {
    await scenario(
      kind + ' ignores late responses and failures without blocking input',
      { url: '/?screen=' + kind },
      async (page) => {
        const search = page.getByRole('searchbox')
        expect(await page.evaluate(() => window.__uiLab.referenceRequests)).toEqual([])
        await page.evaluate(() => {
          window.__uiLab.catalogMode = 'deferred'
        })
        await search.fill('amber')
        await expect.poll(() => page.evaluate(() => window.__uiLab.referencePending.length)).toBe(1)
        await expect(search).toBeEnabled()
        await search.fill('azure')
        await expect.poll(() => page.evaluate(() => window.__uiLab.referencePending.length)).toBe(2)
        await page.evaluate(() => {
          const p = window.__uiLab.referencePending[1]
          p.resolve(window.__referencePage(p.kind, p.filters, p.offset))
        })
        await expect(page.getByRole('heading', { name: 'azure 001', exact: true })).toBeVisible()
        await page.evaluate(() => {
          const p = window.__uiLab.referencePending[0]
          p.resolve(window.__referencePage(p.kind, p.filters, p.offset))
        })
        await expect(page.getByRole('heading', { name: 'amber 001', exact: true })).toHaveCount(0)
        await search.fill('slow')
        await expect.poll(() => page.evaluate(() => window.__uiLab.referencePending.length)).toBe(3)
        await search.fill('fresh')
        await expect.poll(() => page.evaluate(() => window.__uiLab.referencePending.length)).toBe(4)
        await page.evaluate(() => {
          const p = window.__uiLab.referencePending[3]
          p.resolve(window.__referencePage(p.kind, p.filters, p.offset))
        })
        await expect(page.getByRole('heading', { name: 'fresh 001', exact: true })).toBeVisible()
        await page.evaluate(() =>
          window.__uiLab.referencePending[2].reject(new Error('late failure'))
        )
        await expect(page.getByRole('alert')).toHaveCount(0)
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
      }
    )

    await scenario(
      kind + ' pages, empty state and retry preserve criteria',
      { url: '/?screen=' + kind },
      async (page) => {
        const prefix = kind === 'spells' ? 'Spell' : 'Monster'
        await page.getByRole('button', { name: 'Далее', exact: true }).click()
        await expect(
          page.getByRole('heading', { name: prefix + ' 025', exact: true })
        ).toBeVisible()
        await expect(page.getByRole('status')).toContainText('25–48')
        await page.getByRole('button', { name: 'Далее', exact: true }).click()
        await expect(
          page.getByRole('heading', { name: prefix + ' 049', exact: true })
        ).toBeVisible()
        await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeDisabled()
        await page.getByRole('button', { name: 'Назад', exact: true }).click()
        await expect(
          page.getByRole('heading', { name: prefix + ' 025', exact: true })
        ).toBeVisible()
        await page.evaluate(() => {
          window.__uiLab.catalogMode = 'error'
        })
        await page.getByRole('searchbox').fill('moon')
        await expect(page.getByRole('alert')).toContainText('Не удалось загрузить')
        await expect(page.getByRole('searchbox')).toHaveValue('moon')
        await page.evaluate(() => {
          window.__uiLab.catalogMode = 'normal'
        })
        await page.getByRole('button', { name: 'Повторить', exact: true }).click()
        await expect(page.getByRole('heading', { name: 'moon 001', exact: true })).toBeVisible()
        expect(await page.evaluate(() => window.__uiLab.referenceRequests.at(-1).offset)).toBe(0)
        await page.getByRole('searchbox').fill('none')
        await expect(
          page.getByRole('heading', { name: 'Ничего не найдено', exact: true })
        ).toBeVisible()
        await page.evaluate(() => {
          window.__uiLab.catalogMode = 'throw'
        })
        await page.getByRole('searchbox').fill('again')
        await expect(page.getByRole('alert')).toBeVisible()
        await page.evaluate(() => {
          window.__uiLab.catalogMode = 'normal'
        })
        await page.getByRole('button', { name: 'Повторить', exact: true }).click()
        await expect(page.getByRole('heading', { name: 'again 001', exact: true })).toBeVisible()
        expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
      }
    )

    for (const lang of ['ru', 'en']) {
      await scenario(
        kind + ' mobile filters, reset and details in ' + lang,
        { mobile: true, url: '/?screen=' + kind + '&lang=' + lang },
        async (page) => {
          const next = page.getByRole('button', {
            name: lang === 'ru' ? 'Далее' : 'Next',
            exact: true,
          })
          await next.click()
          const prefix = kind === 'spells' ? 'Spell' : 'Monster'
          await expect(
            page.getByRole('heading', { name: prefix + ' 025', exact: true })
          ).toBeVisible()
          const toggle = page.getByRole('button', {
            name: lang === 'ru' ? 'Фильтры' : 'Filters',
            exact: true,
          })
          await toggle.click()
          const first = page.getByRole('button', {
            name: kind === 'spells' ? (lang === 'ru' ? 'Заговор' : 'Cantrip') : '1/8',
            exact: true,
          })
          await first.click()
          await expect(first).toHaveAttribute('aria-pressed', 'true')
          await expect(page.getByRole('status')).toContainText('1–10')
          const second = page.getByRole('button', {
            name:
              kind === 'spells'
                ? lang === 'ru'
                  ? 'Воплощение'
                  : 'Evocation'
                : lang === 'ru'
                  ? 'Дракон'
                  : 'Dragon',
            exact: true,
          })
          await second.click()
          await expect(second).toHaveAttribute('aria-pressed', 'true')
          await page.getByRole('searchbox').fill('moon')
          await expect(page.getByRole('heading', { name: 'moon 001', exact: true })).toBeVisible()
          const request = await page.evaluate(() => window.__uiLab.referenceRequests.at(-1))
          expect(request.offset).toBe(0)
          expect(kind === 'spells' ? request.filters.level : request.filters.cr).toEqual(
            kind === 'spells' ? [0] : ['1/8']
          )
          expect(kind === 'spells' ? request.filters.school : request.filters.type).toEqual(
            kind === 'spells' ? ['evocation'] : ['dragon']
          )
          expect((await first.boundingBox()).height).toBeGreaterThanOrEqual(44)
          if (kind === 'bestiary')
            await expect(page.getByRole('button', { name: '30', exact: true })).toBeVisible()
          await page
            .getByRole('button', {
              name:
                kind === 'bestiary'
                  ? lang === 'ru'
                    ? 'Сбросить фильтры'
                    : 'Reset filters'
                  : lang === 'ru'
                    ? 'Сбросить'
                    : 'Reset',
              exact: true,
            })
            .click()
          await expect(first).toHaveAttribute('aria-pressed', 'false')
          await expect(second).toHaveAttribute('aria-pressed', 'false')
          await expect(page.getByRole('searchbox')).toHaveValue('moon')
          await expect(page.getByRole('heading', { name: 'moon 001', exact: true })).toBeVisible()
          const resetRequest = await page.evaluate(() => window.__uiLab.referenceRequests.at(-1))
          expect(kind === 'spells' ? resetRequest.filters.level : resetRequest.filters.cr).toEqual(
            []
          )
          expect(
            kind === 'spells' ? resetRequest.filters.school : resetRequest.filters.type
          ).toEqual([])
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          await page.screenshot({
            path: path.join(output, 'mobile-' + kind + '-' + lang + '.png'),
            fullPage: false,
          })
          await toggle.click()
          await page
            .getByRole('button', { name: lang === 'ru' ? 'Подробнее' : 'Details', exact: true })
            .first()
            .click()
          await expect(page.getByRole('dialog')).toBeVisible()
          expect(await page.evaluate(() => window.__uiLab.characterActions)).toEqual([])
        }
      )
    }

    await scenario(
      kind + ' SSR failure waits for explicit retry',
      { url: '/?screen=' + kind + '&initialError' },
      async (page) => {
        await expect(page.getByRole('alert')).toBeVisible()
        expect(await page.evaluate(() => window.__uiLab.referenceRequests)).toEqual([])
        await page.getByRole('button', { name: 'Повторить', exact: true }).click()
        await expect(
          page.getByRole('heading', {
            name: (kind === 'spells' ? 'Spell' : 'Monster') + ' 001',
            exact: true,
          })
        ).toBeVisible()
      }
    )
  }

  for (const lang of ['ru', 'en']) {
    for (const [viewer, status] of [
      ['user-0', 'yes'],
      ['user-2', 'maybe'],
      ['user-3', 'no'],
      ['self', null],
    ]) {
      await scenario(
        'session saved personal response ' + lang + ' ' + (status ?? 'none'),
        {
          mobile: true,
          width: 320,
          url: '/?screen=sessions&role=player&lang=' + lang + '&viewer=' + viewer,
        },
        async (page) => {
          const card = page.getByRole('article').first()
          const buttons = card.getByRole('group').getByRole('button')
          const statuses = ['yes', 'maybe', 'no']
          const labels =
            lang === 'ru' ? ['Иду', 'Может быть', 'Не иду'] : ['Going', 'Maybe', 'Not going']
          for (let i = 0; i < 3; i++) {
            await expect(buttons.nth(i)).toHaveAttribute(
              'aria-pressed',
              String(status === statuses[i])
            )
            expect((await buttons.nth(i).boundingBox()).height).toBeGreaterThanOrEqual(44)
          }
          await expect(card.locator('[aria-live="polite"]')).toHaveText(
            (lang === 'ru' ? 'Ваш ответ: ' : 'Your response: ') +
              (status
                ? labels[statuses.indexOf(status)]
                : lang === 'ru'
                  ? 'Вы ещё не ответили'
                  : 'Not answered yet')
          )
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          expect(await page.evaluate(() => window.__uiLab.sessionActions)).toEqual([])
          await card.screenshot({
            path: path.join(output, 'session-rsvp-' + lang + '-' + (status ?? 'none') + '.png'),
          })
        }
      )
    }
    await scenario(
      'session saved response survives pending and errors, changes only with refreshed server props in ' +
        lang,
      { mobile: true, url: '/?screen=sessions&role=player&viewer=user-2&lang=' + lang },
      async (page) => {
        const card = page.getByRole('article').first()
        const buttons = card.getByRole('group').getByRole('button')
        const saved = card.locator('[aria-live="polite"]')
        const oldText = lang === 'ru' ? 'Ваш ответ: Может быть' : 'Your response: Maybe'
        await page.evaluate(() => {
          window.__uiLab.sessionDelay = 400
        })
        await buttons.nth(0).click()
        await expect(buttons.nth(0)).toBeDisabled()
        await expect(card.getByRole('status')).toHaveText(
          lang === 'ru' ? 'Сохраняем ответ…' : 'Saving response…'
        )
        await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true')
        await expect(saved).toHaveText(oldText)
        await expect(card.getByRole('alert')).toHaveText('Offline session action boundary')
        await expect(buttons.nth(0)).toBeEnabled()
        await expect(saved).toHaveText(oldText)
        expect(await page.evaluate(() => window.__uiLab.refreshes)).toBe(0)
        await page.evaluate(() => {
          window.__uiLab.sessionOutcome = 'throw'
        })
        await buttons.nth(0).click()
        await expect(card.getByRole('alert')).toHaveText(
          lang === 'ru'
            ? 'Не удалось сохранить ответ. Попробуйте ещё раз.'
            : 'Could not save your response. Please try again.'
        )
        await expect(saved).toHaveText(oldText)
        await page.evaluate(() => {
          window.__uiLab.sessionOutcome = 'success'
        })
        await buttons.nth(0).focus()
        await page.keyboard.press('Enter')
        await expect.poll(() => page.evaluate(() => window.__uiLab.refreshes)).toBe(1)
        await expect(card.getByRole('alert')).toHaveCount(0)
        await expect(saved).toHaveText(oldText)
        // Model an RSC refresh: actual server props replace the previously saved RSVP.
        await page.evaluate(() => {
          const rows = structuredClone(window.__sessionFixtures)
          rows[0].rsvps.find((r) => r.user_id === 'user-2').status = 'yes'
          window.dispatchEvent(new CustomEvent('offline-session-data', { detail: rows }))
        })
        await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true')
        await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'false')
        await expect(saved).toHaveText(lang === 'ru' ? 'Ваш ответ: Иду' : 'Your response: Going')
        expect(await card.locator('dd').allTextContents()).toEqual(['3', '0', '1'])
        expect(await page.evaluate(() => window.__uiLab.sessionActions)).toEqual(
          Array.from({ length: 3 }, () => ({
            name: 'setRsvp',
            args: ['offline-future-session', 'yes'],
          }))
        )
        await page.evaluate(() =>
          window.dispatchEvent(
            new CustomEvent('offline-session-data', { detail: window.__sessionFixtures })
          )
        )
        await expect(saved).toHaveText(oldText)
      }
    )
  }

  for (const lang of ['ru', 'en']) {
    for (const view of ['mobile-320', 'mobile-390', 'desktop']) {
      await scenario(
        'campaign cards preserve full names and expose labelled touch actions in ' +
          lang +
          ' ' +
          view,
        {
          mobile: view !== 'desktop',
          width: view === 'mobile-320' ? 320 : 390,
          url: '/?screen=dashboard&lang=' + lang,
        },
        async (page) => {
          const cards = page.getByRole('article')
          await expect(cards).toHaveCount(2)
          const first = cards.nth(0),
            player = cards.nth(1)
          const original = await page.evaluate(() => window.__campaignFixtures)
          for (let i = 0; i < 2; i++) {
            const card = cards.nth(i),
              heading = card.getByRole('heading')
            await expect(heading).toHaveText(original[i].name)
            expect(
              await heading.evaluate(
                (el) => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight
              )
            ).toBe(true)
            expect(
              await heading.locator('span').evaluate((el) => getComputedStyle(el).webkitLineClamp)
            ).toBe('none')
            const link = card.getByRole('link')
            await expect(link).toHaveAttribute('href', '/campaign/' + original[i].id)
            expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44)
            expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
          }
          await expect(player).toContainText(original[1].genre)
          await expect(player.getByRole('button')).toHaveCount(0)
          await expect(first.getByRole('button')).toHaveCount(3)
          const labels =
            lang === 'ru'
              ? ['Скопировать ссылку', 'Обновить ссылку', 'Удалить кампанию']
              : ['Copy link', 'Replace link', 'Delete campaign']
          for (const label of labels) {
            const button = first.getByRole('button', { name: label, exact: true })
            await expect(button).toBeVisible()
            expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44)
          }
          await first.getByRole('button', { name: labels[1], exact: true }).click()
          const dialog = page.getByRole('dialog')
          await expect(dialog).toContainText(original[0].name)
          await expect(dialog).toContainText(
            lang === 'ru' ? 'перестанет работать' : 'will stop working'
          )
          await expect(
            dialog.getByRole('button', { name: lang === 'ru' ? 'Закрыть' : 'Close', exact: true })
          ).toBeVisible()
          expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
          await dialog
            .getByRole('button', { name: lang === 'ru' ? 'Отмена' : 'Cancel', exact: true })
            .click()
          await expect(page.getByRole('dialog')).toHaveCount(0)
          expect(await page.evaluate(() => window.__uiLab.campaignActions)).toEqual([])
          expect(await page.evaluate(() => window.__campaignFixtures)).toEqual(original)
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          await first.screenshot({
            path: path.join(output, 'campaign-card-' + lang + '-' + view + '.png'),
          })
        }
      )
    }
    await scenario(
      'campaign invitation and deletion confirmations preserve state on failures in ' + lang,
      { mobile: true, width: 320, url: '/?screen=dashboard&lang=' + lang },
      async (page) => {
        const card = page.getByRole('article').first()
        const copy = card.getByRole('button', {
          name: lang === 'ru' ? 'Скопировать ссылку' : 'Copy link',
          exact: true,
        })
        const regenLabel = lang === 'ru' ? 'Обновить ссылку' : 'Replace link'
        await page.evaluate(() =>
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
              writeText: async (value) => {
                window.__uiLab.copiedLinks.push(value)
              },
            },
          })
        )
        await copy.click()
        await expect(card.getByRole('status')).toHaveText(
          lang === 'ru' ? 'Ссылка скопирована' : 'Link copied'
        )
        expect(await page.evaluate(() => window.__uiLab.copiedLinks)).toEqual([
          origin + '/join/oldcode8',
        ])
        await card.getByRole('button', { name: regenLabel, exact: true }).click()
        const dialog = page.getByRole('dialog')
        const confirm = dialog.getByRole('button', { name: regenLabel, exact: true })
        await page.evaluate(() => {
          window.__uiLab.campaignDelay = 500
        })
        await confirm.click()
        await expect(confirm).toBeDisabled()
        await expect(
          dialog.getByRole('button', { name: lang === 'ru' ? 'Закрыть' : 'Close', exact: true })
        ).toBeDisabled()
        await page.keyboard.press('Escape')
        await expect(dialog).toBeVisible()
        await expect(dialog.getByRole('alert')).toHaveText('Offline campaign action boundary')
        await expect(card.locator('code')).toHaveText('/join/oldcode8')
        await page.evaluate(() => {
          window.__uiLab.campaignOutcome = 'throw'
        })
        await confirm.click()
        await expect(dialog.getByRole('alert')).toContainText(
          lang === 'ru' ? 'Обновите страницу' : 'Refresh the page'
        )
        await expect(card.locator('code')).toHaveText('/join/oldcode8')
        await page.evaluate(() => {
          window.__uiLab.campaignOutcome = 'success'
        })
        await confirm.click()
        await expect(dialog).toHaveCount(0)
        await expect(card.locator('code')).toHaveText('/join/newcode8')
        await expect(card.getByRole('status')).toHaveCount(0)
        await copy.click()
        expect(await page.evaluate(() => window.__uiLab.copiedLinks.at(-1))).toBe(
          origin + '/join/newcode8'
        )
        await page.evaluate(() => {
          const rows = structuredClone(window.__campaignFixtures)
          rows[0].invite_code = 'external'
          window.dispatchEvent(new CustomEvent('offline-campaign-data', { detail: rows }))
        })
        await expect(card.locator('code')).toHaveText('/join/external')
        await expect(card.getByRole('status')).toHaveCount(0)
        await card
          .getByRole('button', {
            name: lang === 'ru' ? 'Удалить кампанию' : 'Delete campaign',
            exact: true,
          })
          .click()
        await expect(dialog).toContainText(await card.getByRole('heading').textContent())
        await page.evaluate(() => {
          window.__uiLab.campaignOutcome = 'error'
        })
        await dialog
          .getByRole('button', { name: lang === 'ru' ? 'Удалить' : 'Delete', exact: true })
          .click()
        await expect(dialog.getByRole('alert')).toHaveText('Offline campaign action boundary')
        await dialog.screenshot({
          path: path.join(output, 'campaign-delete-' + lang + '-mobile.png'),
        })
        await page.evaluate(() => {
          window.__uiLab.campaignOutcome = 'success'
        })
        await dialog
          .getByRole('button', { name: lang === 'ru' ? 'Удалить' : 'Delete', exact: true })
          .click()
        await expect(dialog).toHaveCount(0)
        expect(await page.evaluate(() => window.__uiLab.campaignActions)).toEqual([
          ...Array.from({ length: 3 }, () => ({
            name: 'regenerateInviteCode',
            args: ['offline-campaign'],
          })),
          ...Array.from({ length: 2 }, () => ({
            name: 'deleteCampaign',
            args: ['offline-campaign'],
          })),
        ])
        expect(await page.evaluate(() => window.__uiLab.refreshes)).toBe(2)
      }
    )
    await scenario(
      'campaign create preserves its draft and pending dialog through errors in ' + lang,
      { mobile: true, width: 320, url: '/?screen=dashboard&lang=' + lang },
      async (page) => {
        await page
          .getByRole('button', {
            name: lang === 'ru' ? 'Создать кампанию' : 'Create campaign',
            exact: true,
          })
          .click()
        const dialog = page.getByRole('dialog')
        const name = dialog.getByLabel(lang === 'ru' ? 'Название' : 'Name', { exact: false })
        const description = dialog.getByRole('textbox', {
          name: lang === 'ru' ? 'Описание' : 'Description',
          exact: true,
        })
        await name.fill('Synthetic campaign')
        await description.fill('Keep this draft')
        const submit = dialog.getByRole('button', {
          name: lang === 'ru' ? 'Создать' : 'Create',
          exact: true,
        })
        await page.evaluate(() => {
          window.__uiLab.campaignDelay = 500
        })
        await submit.click()
        await expect(submit).toBeDisabled()
        await page.keyboard.press('Escape')
        await expect(dialog).toBeVisible()
        await expect(dialog.getByRole('alert')).toHaveText('Offline campaign action boundary')
        await expect(name).toHaveValue('Synthetic campaign')
        await expect(description).toHaveValue('Keep this draft')
        await page.evaluate(() => {
          window.__uiLab.campaignOutcome = 'throw'
        })
        await submit.click()
        await expect(dialog.getByRole('alert')).toContainText(
          lang === 'ru' ? 'Обновите страницу' : 'Refresh the page'
        )
        await expect(name).toHaveValue('Synthetic campaign')
        expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
        await dialog.screenshot({
          path: path.join(output, 'campaign-create-' + lang + '-mobile.png'),
        })
        await page.evaluate(() => {
          window.__uiLab.campaignOutcome = 'success'
        })
        await submit.click()
        await expect(dialog).toHaveCount(0)
        expect(await page.evaluate(() => window.__uiLab.campaignActions)).toEqual(
          Array.from({ length: 3 }, () => ({
            name: 'createCampaign',
            args: [{ name: 'Synthetic campaign', genre: '', description: 'Keep this draft' }],
          }))
        )
        expect(await page.evaluate(() => window.__uiLab.refreshes)).toBe(1)
      }
    )
  }

  for (const lang of ['ru', 'en']) {
    for (const mobile of [false, true]) {
      await scenario(
        'map workspace starts at 100%, fits on request and opens visible combat drawer ' +
          lang +
          mobile,
        { mobile, width: 320, url: '/?screen=map&mapImage&combat&current&lang=' + lang },
        async (page) => {
          const ru = lang === 'ru'
          const viewport = page.getByRole('region', {
            name: ru
              ? 'Игровая карта — используйте стрелки для прокрутки'
              : 'Battle map — use arrow keys to scroll',
          })
          const stage = page.getByTestId('map-stage')
          await expect(
            page.getByRole('button', {
              name: ru ? 'Показать карту в масштабе 100%' : 'Show map at 100%',
            })
          ).toHaveText('100%')
          await page
            .getByRole('button', { name: ru ? 'Порядок ходов' : 'Turn order', exact: false })
            .first()
            .click()
          const queue = page.getByRole('complementary', {
            name: ru ? 'Порядок ходов' : 'Turn order',
          })
          await expect(queue).toBeVisible()
          const drawer = page.getByRole('dialog', {
            name: ru ? 'Панель боя' : 'Combat panel',
            exact: true,
          })
          expect(await drawer.evaluate((el) => el.matches(':modal'))).toBe(true)
          const qb = await drawer.boundingBox()
          expect(qb.y).toBeGreaterThanOrEqual(0)
          expect(qb.x + qb.width).toBeLessThanOrEqual(mobile ? 320 : 1440)
          await page.screenshot({
            path: path.join(output, 'combat-drawer-' + lang + mobile + '.png'),
          })
          await page.keyboard.press('Escape')
          const before = await stage.evaluate((el) => el.getBoundingClientRect().width)
          await page
            .getByRole('button', { name: ru ? 'Увеличить масштаб карты' : 'Zoom in', exact: true })
            .click()
          await expect
            .poll(async () => stage.evaluate((el) => el.getBoundingClientRect().width))
            .toBeGreaterThan(before)
          await page.getByRole('button', { name: ru ? 'Вписать' : 'Fit map', exact: true }).click()
          await expect
            .poll(async () => stage.evaluate((el) => el.getBoundingClientRect().width))
            .toBeLessThan(await viewport.evaluate((el) => el.clientWidth))
          expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          await page.evaluate(() => window.scrollTo(0, 0))
          await page.screenshot({
            fullPage: true,
            path: path.join(output, 'map-' + lang + (mobile ? '-mobile' : '-desktop') + '.png'),
          })
          if (mobile) {
            await viewport.scrollIntoViewIfNeeded()
            await page.screenshot({ path: path.join(output, 'map-' + lang + '-mobile-field.png') })
            await page
              .getByRole('button', { name: ru ? 'Панель боя' : 'Combat panel', exact: true })
              .click()
            await page.screenshot({ path: path.join(output, 'map-' + lang + '-mobile-queue.png') })
          }
        }
      )
    }
  }
  await scenario(
    'map ruler uses transformed bounds at different zooms without writes',
    { url: '/?screen=map&mapImage' },
    async (page) => {
      const stage = page.getByTestId('map-stage')
      const ruler = page.getByRole('button', { name: 'Линейка', exact: true })
      for (const zoom of ['fit', 'actual']) {
        if (zoom === 'actual')
          await page.getByRole('button', { name: 'Показать карту в масштабе 100%' }).click()
        await ruler.click()
        const bounds = await stage.boundingBox()
        const cell = bounds.width / 24
        await page.mouse.move(bounds.x + cell, bounds.y + cell)
        await page.mouse.down()
        await page.mouse.move(bounds.x + cell * 4, bounds.y + cell * 5, { steps: 8 })
        await page.mouse.up()
        await expect(stage.locator('svg text').first()).toContainText('25')
        await page.keyboard.press('Escape')
      }
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'map upload validates and previews, preserves geometry, pending dismissal and explicit upload',
    { mobile: true, url: '/?screen=map' },
    async (page) => {
      await page.getByRole('button', { name: 'Загрузить карту', exact: true }).first().click()
      const dialog = page.getByRole('dialog')
      const input = dialog.locator('input[type=file]')
      await input.setInputFiles({
        name: 'unsafe.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from('<svg/>'),
      })
      await expect(dialog.getByRole('alert')).toContainText('PNG')
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZKxEAAAAASUVORK5CYII=',
        'base64'
      )
      await input.setInputFiles({ name: 'my-map.png', mimeType: 'image/png', buffer: png })
      await expect(dialog.getByRole('img', { name: 'Предпросмотр карты с сеткой' })).toBeVisible()
      await expect(dialog).toContainText('1 × 1 px')
      await expect(dialog).toContainText('24 × 16')
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
      await dialog.screenshot({ path: path.join(output, 'map-upload-mobile.png') })
      await page.evaluate(() => {
        window.__uiLab.mapDelay = 300
      })
      await dialog.getByRole('button', { name: 'Загрузить карту', exact: true }).click()
      await page.keyboard.press('Escape')
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([
        {
          name: 'uploadMap',
          args: [
            'offline-scene',
            'test',
            { name: 'my-map.png', type: 'image/png', size: png.length },
          ],
        },
      ])
    }
  )
  await scenario(
    'map upload transport error blocks repeat and keeps preview',
    { url: '/?screen=map&mapImage' },
    async (page) => {
      await page.getByRole('button', { name: 'Заменить карту', exact: true }).click()
      const dialog = page.getByRole('dialog')
      await dialog.locator('input[type=file]').setInputFiles({
        name: 'map.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZKxEAAAAASUVORK5CYII=',
          'base64'
        ),
      })
      await expect(dialog).toContainText('1 × 1 px')
      await page.evaluate(() => {
        window.__uiLab.mapOutcome = 'throw'
      })
      await dialog.getByRole('button', { name: 'Заменить фон карты' }).click()
      await expect(dialog.getByRole('alert')).toContainText('Обновите страницу')
      await expect(dialog.getByRole('button', { name: 'Заменить фон карты' })).toBeDisabled()
      expect(await page.evaluate(() => window.__uiLab.mapActions.length)).toBe(1)
    }
  )
  await scenario(
    'map preparation starts first turn; zero initiative can be rerolled; failures retained',
    { url: '/?screen=map&combat' },
    async (page) => {
      await page.getByRole('button', { name: 'Порядок ходов', exact: false }).first().click()
      const queue = page.getByRole('complementary', { name: 'Порядок ходов' })
      await expect(queue).toContainText('Подготовка ходов')
      await queue
        .getByRole('button', {
          name: 'Бросить инициативу: Серебряная хранительница дальних звёзд',
          exact: true,
        })
        .click()
      expect(await page.evaluate(() => window.__uiLab.mapActions[0])).toEqual({
        name: 'rollInitiativeForToken',
        args: ['entry-0', 'offline-scene'],
      })
      await page.evaluate(() => {
        window.__uiLab.mapOutcome = 'error'
      })
      await queue.getByRole('button', { name: 'Начать первый ход' }).click()
      await expect(queue.getByRole('alert')).toContainText('Offline map action failed')
      await expect(queue.getByRole('button', { name: 'Начать первый ход' })).toBeEnabled()
    }
  )
  await scenario(
    'map player can inspect and focus, has no DM upload or turn mutations',
    { mobile: true, url: '/?screen=map&combat&current&role=player&lang=en' },
    async (page) => {
      await expect(page.getByRole('button', { name: 'Upload map', exact: true })).toHaveCount(0)
      await page.getByRole('button', { name: 'Turn order', exact: false }).first().click()
      const queue = page.getByRole('complementary', { name: 'Turn order' })
      await expect(queue.getByRole('button', { name: 'Next turn', exact: true })).toHaveCount(0)
      await expect(
        queue.getByRole('button', { name: 'Roll initiative:', exact: false })
      ).toHaveCount(0)
      await queue
        .getByRole('button', { name: 'Show on map: Серебряная хранительница дальних звёзд' })
        .click()
      await expect(
        page.getByRole('region', { name: 'Battle map — use arrow keys to scroll' })
      ).toBeFocused()
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
      await page
        .getByRole('button', { name: 'Серебряная хранительница дальних звёзд', exact: true })
        .focus()
      await page.keyboard.press('Enter')
      await expect(
        page.getByRole('heading', { name: 'Серебряная хранительница дальних звёзд', exact: true })
      ).toBeVisible()
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )

  await scenario(
    'map session embedding opens visible modal and keeps zoom when hidden',
    { url: '/?screen=map-session' },
    async (page) => {
      await page.getByRole('button', { name: 'Порядок ходов', exact: false }).first().click()
      const queue = page.getByRole('complementary', { name: 'Порядок ходов' })
      const viewport = page.getByRole('region', {
        name: 'Игровая карта — используйте стрелки для прокрутки',
      })
      await expect(queue).toBeInViewport()
      await page.keyboard.press('Escape')
      const zoom = page.getByRole('button', { name: 'Показать карту в масштабе 100%' })
      await expect(zoom).toHaveText('100%')
      await page.getByRole('button', { name: 'Вписать', exact: true }).click()
      const fitted = await zoom.textContent()
      await viewport.evaluate((el) => {
        el.style.display = 'none'
      })
      await page.waitForTimeout(100)
      await expect(zoom).toHaveText(fitted)
      await page
        .getByRole('region', {
          name: 'Игровая карта — используйте стрелки для прокрутки',
          includeHidden: true,
        })
        .evaluate((el) => {
          el.style.display = ''
        })
      await zoom.click()
      await expect(zoom).toHaveText('100%')
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'map panning and focus are local; reroll and end require confirmation',
    { url: '/?screen=map&mapImage&combat&current' },
    async (page) => {
      const queue = page.getByRole('complementary', { name: 'Порядок ходов' })
      await page.getByRole('button', { name: 'Показать карту в масштабе 100%' }).click()
      await page.getByRole('button', { name: 'Обзор', exact: true }).click()
      const viewport = page.getByRole('region', {
        name: 'Игровая карта — используйте стрелки для прокрутки',
      })
      await viewport.scrollIntoViewIfNeeded()
      const bounds = await viewport.boundingBox()
      const before = await viewport.evaluate((el) => el.scrollLeft)
      await page.mouse.move(bounds.x + bounds.width * 0.7, bounds.y + bounds.height * 0.6)
      await page.mouse.down()
      await page.mouse.move(bounds.x + bounds.width * 0.4, bounds.y + bounds.height * 0.6, {
        steps: 8,
      })
      await page.mouse.up()
      await expect.poll(() => viewport.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before)
      await page.getByRole('button', { name: 'Порядок ходов', exact: false }).first().click()
      await queue
        .getByRole('button', {
          name: 'Бросить инициативу: Серебряная хранительница дальних звёзд',
          exact: true,
        })
        .click()
      await expect(
        page.getByRole('dialog', { name: 'Перебросить инициативу?', exact: true })
      ).toContainText('Текущий ход сохранится')
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
      await page
        .getByRole('dialog', { name: 'Перебросить инициативу?', exact: true })
        .getByRole('button', { name: 'Отмена', exact: true })
        .click()
      await queue.getByRole('button', { name: 'Завершить бой', exact: true }).click()
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(1)
      await expect(queue).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
    }
  )
  await scenario(
    'map touch ruler and template cancel without moving tokens or writing',
    { mobile: true, url: '/?screen=map&mapImage' },
    async (page) => {
      const stage = page.getByTestId('map-stage')
      await page.getByRole('button', { name: 'Линейка', exact: true }).click()
      const layer = stage.locator('div.z-30')
      await stage.scrollIntoViewIfNeeded()
      const bounds = await stage.boundingBox(),
        cell = bounds.width / 24
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: bounds.x + cell, y: bounds.y + cell }],
      })
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: bounds.x + cell * 4, y: bounds.y + cell * 5 }],
      })
      await expect(layer.locator('text').first()).toContainText('25')
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
      await cdp.detach()
      await expect(layer.locator('text')).toHaveCount(0)
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: 'Области', exact: true }).click()
      await expect(page.getByRole('region', { name: 'Область заклинания' })).toBeVisible()
      await page.keyboard.press('Escape')
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'map corrupt image and returned upload failure preserve safe retry',
    { url: '/?screen=map' },
    async (page) => {
      await page.getByRole('button', { name: 'Загрузить карту', exact: true }).first().click()
      const dialog = page.getByRole('dialog'),
        input = dialog.locator('input[type=file]')
      await input.setInputFiles({
        name: 'broken.png',
        mimeType: 'image/png',
        buffer: Buffer.from('broken'),
      })
      await expect(dialog.getByRole('alert')).toContainText('Изображение не удалось открыть')
      await expect(
        dialog.getByRole('button', { name: 'Загрузить карту', exact: true })
      ).toBeDisabled()
      await input.setInputFiles({
        name: 'valid.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZKxEAAAAASUVORK5CYII=',
          'base64'
        ),
      })
      await expect(dialog).toContainText('1 × 1 px')
      await page.evaluate(() => {
        window.__uiLab.mapOutcome = 'error'
      })
      await dialog.getByRole('button', { name: 'Загрузить карту', exact: true }).click()
      await expect(dialog.getByRole('alert')).toContainText('Offline map action failed')
      await expect(
        dialog.getByRole('button', { name: 'Загрузить карту', exact: true })
      ).toBeEnabled()
      expect(await page.evaluate(() => window.__uiLab.mapActions.length)).toBe(1)
    }
  )

  for (const lang of ['ru', 'en']) {
    for (const mobile of [false, true]) {
      await scenario(
        'turn timeline shows 3 characters and 8 creatures ' + lang + ' ' + mobile,
        {
          mobile,
          width: 320,
          url:
            '/?screen=map&mapImage&combat&current&manyTokens&turn=2&lang=' +
            lang +
            (lang === 'en' ? '&theme=light' : ''),
        },
        async (page) => {
          const ru = lang === 'ru'
          const timeline = page.getByRole('region', { name: ru ? 'Лента ходов' : 'Turn timeline' })
          const list = timeline.getByRole('list', {
            name: ru ? 'Очередь инициативы' : 'Initiative queue',
          })
          await expect(list.getByRole('listitem')).toHaveCount(11)
          await expect(timeline).toContainText(ru ? 'Персонажи: 3' : 'Characters: 3')
          await expect(timeline).toContainText(ru ? 'Существа: 8' : 'Creatures: 8')
          await expect(list.locator('[aria-current="step"]')).toHaveCount(1)
          await expect(list.locator('[aria-current="step"]')).toHaveAttribute(
            'data-entry-id',
            'battle-entry-2'
          )
          await expect(list.locator('[data-entry-id="battle-entry-3"]')).toContainText(
            ru ? 'Следующий' : 'Up next'
          )
          expect(
            await list.locator('li').evaluateAll((els) => els.map((el) => el.dataset.entryId))
          ).toEqual(Array.from({ length: 11 }, (_, i) => 'battle-entry-' + i))
          await expect(list.locator('[data-entry-id="battle-entry-10"]')).toContainText('0')
          await timeline.scrollIntoViewIfNeeded()
          await page.screenshot({
            path: path.join(
              output,
              'turn-timeline-' + lang + (mobile ? '-mobile' : '-desktop') + '.png'
            ),
            fullPage: !mobile,
          })
          await timeline
            .getByRole('button', { name: ru ? 'Вся очередь' : 'Show all', exact: true })
            .click()
          await expect(
            timeline.getByRole('button', {
              name: ru ? 'Свернуть в ленту' : 'Collapse to strip',
              exact: true,
            })
          ).toHaveAttribute('aria-expanded', 'true')
          for (const item of await list.locator('li').all()) {
            const box = await item.boundingBox()
            expect(box.x >= 0 && box.x + box.width <= (mobile ? 320 : 1440)).toBe(true)
          }
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          if (mobile) {
            await list.scrollIntoViewIfNeeded()
            await page.screenshot({
              path: path.join(output, 'turn-timeline-' + lang + '-expanded.png'),
              fullPage: true,
            })
            await timeline.scrollIntoViewIfNeeded()
            await page.screenshot({
              path: path.join(output, 'turn-timeline-' + lang + '-expanded-start.png'),
            })
            await list.getByRole('listitem').last().scrollIntoViewIfNeeded()
            await page.screenshot({
              path: path.join(output, 'turn-timeline-' + lang + '-expanded-end.png'),
            })
          }
          const target = list.locator('[data-entry-id="battle-entry-4"]').getByRole('button')
          await target.focus()
          await page.keyboard.press('Enter')
          await expect(
            page.getByRole('region', {
              name: ru
                ? 'Игровая карта — используйте стрелки для прокрутки'
                : 'Battle map — use arrow keys to scroll',
            })
          ).toBeFocused()
          expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
        }
      )
    }
  }
  await scenario(
    'turn timeline follows server updates, scrolls only itself and wraps after last',
    { mobile: true, width: 320, url: '/?screen=map&combat&current&manyTokens' },
    async (page) => {
      const timeline = page.getByRole('region', { name: 'Лента ходов' })
      const list = timeline.getByRole('list')
      await timeline.scrollIntoViewIfNeeded()
      const before = await page.evaluate(() => scrollY)
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-turn-data', {
            detail: window.__turnEntries.map((e, i) => ({ ...e, is_current: i === 10 })),
          })
        )
      )
      await expect(list.locator('[aria-current="step"]')).toHaveAttribute(
        'data-entry-id',
        'battle-entry-10'
      )
      await expect(timeline.getByRole('status')).toContainText('Следующий: Аэлина')
      expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(2)
      const end = await list.locator('[data-entry-id="battle-entry-10"]').boundingBox(),
        rail = await list.boundingBox()
      expect(end.x >= rail.x && end.x + end.width <= rail.x + rail.width).toBe(true)
      const endScroll = await list.evaluate((el) => el.scrollLeft)
      await timeline.getByRole('button', { name: 'Прокрутить очередь назад', exact: true }).click()
      await expect.poll(() => list.evaluate((el) => el.scrollLeft)).toBeLessThan(endScroll)
      const backScroll = await list.evaluate((el) => el.scrollLeft)
      await timeline.getByRole('button', { name: 'Показать текущий ход в ленте' }).click()
      await expect.poll(() => list.evaluate((el) => el.scrollLeft)).toBeGreaterThan(backScroll)
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-turn-data', {
            detail: window.__turnEntries.filter((e) => !e.is_current),
          })
        )
      )
      await expect(list.getByRole('listitem')).toHaveCount(10)
      await expect(list.locator('[aria-current="step"]')).toHaveCount(0)
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent('offline-turn-data', { detail: [] }))
      )
      await expect(timeline).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'turn timeline preparation and conflicted current never invent a turn',
    { url: '/?screen=map&combat&manyTokens' },
    async (page) => {
      const timeline = page.getByRole('region', { name: 'Лента ходов' })
      await expect(timeline.getByRole('status')).toContainText('Подготовка ходов')
      await expect(timeline.getByRole('status')).toContainText('Первым ходит: Аэлина')
      await expect(timeline.locator('[aria-current="step"]')).toHaveCount(0)
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-turn-data', {
            detail: window.__turnEntries.map((e, i) => ({ ...e, is_current: i < 2 })),
          })
        )
      )
      await expect(timeline.getByRole('status')).toContainText('Дождитесь обновления очереди')
      await expect(timeline.locator('[aria-current="step"]')).toHaveCount(0)
      await timeline.getByRole('button', { name: 'Панель боя' }).click()
      await expect(
        page
          .getByRole('complementary', { name: 'Порядок ходов' })
          .getByRole('button', { name: 'Начать первый ход' })
      ).toBeDisabled()
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'turn timeline player conceals hidden portraits, names and stats in both views',
    { url: '/?screen=map&combat&current&turn=3&manyTokens&hideEnemy&role=player&lang=en' },
    async (page) => {
      const timeline = page.getByRole('region', { name: 'Turn timeline' })
      await expect(timeline.getByRole('listitem')).toHaveCount(10)
      await expect(timeline.locator('[data-entry-id="battle-entry-3"]')).toHaveCount(0)
      await expect(timeline.getByRole('status')).toContainText('Hidden participant')
      await expect(timeline.locator('[aria-current="step"]')).toHaveCount(0)
      await timeline.getByRole('button', { name: 'Combat panel' }).click()
      const panel = page.getByRole('complementary', { name: 'Turn order' })
      await expect(panel.getByRole('listitem')).toHaveCount(10)
      await expect(panel).toContainText('Hidden participant')
      await expect(panel.getByRole('button', { name: 'Next turn', exact: true })).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'turn timeline handles failed portraits and narrow session embedding',
    { url: '/?screen=map-session&current&manyTokens&brokenPortrait' },
    async (page) => {
      const timeline = page.getByRole('region', { name: 'Лента ходов' })
      await expect(timeline.getByRole('listitem')).toHaveCount(11)
      await expect(timeline.locator('[data-entry-id="battle-entry-0"] img')).toBeVisible()
      await expect(timeline.locator('[data-entry-id="battle-entry-1"] img')).toHaveCount(0)
      await expect(timeline.locator('[data-entry-id="battle-entry-1"] svg')).toHaveCount(1)
      const box = await timeline.boundingBox()
      expect(box.width).toBeLessThanOrEqual(700)
      await timeline.getByRole('button', { name: 'Вся очередь', exact: true }).click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      )
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'turn timeline supports one unlinked token and all-hidden player queue',
    { url: '/?screen=map&combat&current&manyTokens&role=player' },
    async (page) => {
      const timeline = page.getByRole('region', { name: 'Лента ходов' })
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-turn-data', {
            detail: [
              {
                ...window.__turnEntries[0],
                initiative: 0,
                token: {
                  ...window.__turnEntries[0].token,
                  character_id: null,
                  entity_id: null,
                  name: 'Одинокий жетон',
                },
              },
            ],
          })
        )
      )
      await expect(timeline.getByRole('listitem')).toHaveCount(1)
      await expect(timeline).toContainText('Жетоны: 1')
      await expect(timeline.getByRole('list').getByRole('button')).toHaveAccessibleName(
        /Инициатива 0/
      )
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
      await expect(timeline.getByRole('listitem')).toHaveCount(0)
      await expect(timeline).toContainText('Участники пока скрыты мастером')
      await expect(timeline).not.toContainText('Одинокий жетон')
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
