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
              /^(?:next\/(?:link|navigation)|@\/lib\/actions\/(?:messages|settings)|@\/lib\/hooks\/use-realtime-messages)$/,
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
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
