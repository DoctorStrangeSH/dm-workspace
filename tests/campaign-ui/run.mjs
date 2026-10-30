import { build } from 'esbuild'
import { compile } from '@tailwindcss/node'
import { Scanner } from '@tailwindcss/oxide'
import { chromium, expect } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

const root = process.cwd()
const output = path.join(root, 'test-results/campaign-ui')
await mkdir(output, { recursive: true })
const result = await build({
  entryPoints: ['tests/campaign-ui/fixture.tsx'],
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'iife',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [
    {
      name: 'offline-boundaries',
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^(?:next\/(?:link|navigation)|@\/lib\/actions\/(?:messages|settings|chapter-content|export|characters)|@\/lib\/hooks\/use-realtime-messages)$/,
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
const styles = css.build(candidates)
const html =
  '<!doctype html><html lang="ru" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><title>Offline campaign UI tests</title></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
const server = createServer((request, response) => {
  const route = request.url?.split('?')[0]
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
      ? result.outputFiles[0].contents
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
      viewport: options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
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
      await page.goto(origin + (options.url ?? '/'))
      await body(page)
      expect(errors).toEqual([])
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
      await expect(page.getByRole('heading', { name: 'Build your campaign world' })).toBeVisible()
      await expect(page.getByText('Updated chapters and entities will appear here.')).toBeVisible()
      await page.goto(origin + '/?screen=overview&stats=unavailable&lang=en')
      await expect(page.getByRole('status')).toContainText('Statistics are unavailable')
      await expect(page.getByRole('heading', { name: 'Build your campaign world' })).toHaveCount(0)
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
        expect(await page.evaluate(() => window.__uiLab.navigated)).toEqual([
          '/campaign/test/characters/offline-character',
        ])
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
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
