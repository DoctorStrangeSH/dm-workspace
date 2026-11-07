import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('../../', import.meta.url))
const results = path.join(root, 'test-results')
await mkdir(results, { recursive: true })
const fixture = await mkdtemp(path.join(results, 'public-landing-'))
const next = path.join(root, 'node_modules/next/dist/bin/next')
let server
let browser
let serverLog = ''
const failures = []
const externalRequests = []

async function runNext(args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [next, ...args], {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-placeholder',
      },
    })
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Next exited with ${code}`))
    )
  })
}

try {
  await mkdir(path.join(fixture, 'app'))
  await writeFile(path.join(fixture, 'package.json'), '{"private":true}')
  // Reuse the real configuration, including loader rules and RegExp conditions.
  // Only the isolated app's compilation root differs. Never add a test route to src/app.
  const config = await readFile(path.join(root, 'next.config.ts'), 'utf8')
  assert.ok(config.includes('export default nextConfig'))
  await writeFile(
    path.join(fixture, 'next.config.ts'),
    config.replace(
      'export default nextConfig',
      `export default {...nextConfig, turbopack: {...nextConfig.turbopack, root: ${JSON.stringify(root)}}}`
    )
  )
  await writeFile(
    path.join(fixture, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'esnext'],
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        resolveJsonModule: true,
        isolatedModules: true,
        paths: { '@/*': ['../../src/*'] },
      },
      include: ['app/**/*.tsx', 'next-env.d.ts', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    })
  )
  await writeFile(
    path.join(fixture, 'app/layout.tsx'),
    `import './globals.css'
import { I18nProvider } from '@/lib/i18n'
export default function Layout({children}: {children: React.ReactNode}) {
  return <html lang="ru" data-theme="dark" style={{'--font-inter':'Arial', '--font-jetbrains-mono':'monospace'} as React.CSSProperties}><body><I18nProvider>{children}</I18nProvider></body></html>
}`
  )
  // Tailwind scans the isolated app by default. Include the real application
  // sources as the production project root does, without replacing its CSS.
  await writeFile(
    path.join(fixture, 'app/globals.css'),
    "@import '../../../src/app/globals.css';\n@source '../../../src';\n"
  )
  await writeFile(
    path.join(fixture, 'app/page.tsx'),
    "export {default} from '../../../src/app/page'"
  )
  await copyFile(path.join(root, 'src/proxy.ts'), path.join(fixture, 'proxy.ts'))
  for (const name of ['login', 'signup']) {
    await mkdir(path.join(fixture, 'app/(auth)', name), { recursive: true })
    await writeFile(
      path.join(fixture, 'app/(auth)', name, 'page.tsx'),
      `export {default} from '../../../../../src/app/(auth)/${name}/page'`
    )
  }
  await writeFile(
    path.join(fixture, 'app/(auth)/layout.tsx'),
    "export {default} from '../../../../src/app/(auth)/layout'"
  )
  await runNext(['build', fixture])

  const port = await new Promise((resolve, reject) => {
    const socket = net.createServer()
    socket.on('error', reject)
    socket.listen(0, '127.0.0.1', () => {
      const { port } = socket.address()
      socket.close(() => resolve(port))
    })
  })
  const origin = `http://127.0.0.1:${port}`
  server = spawn(
    process.execPath,
    [next, 'start', fixture, '-H', '127.0.0.1', '-p', String(port)],
    {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-placeholder',
      },
    }
  )
  server.stdout.on('data', (chunk) => {
    serverLog += chunk
  })
  server.stderr.on('data', (chunk) => {
    serverLog += chunk
  })
  await new Promise((resolve, reject) => {
    const deadline = Date.now() + 30_000
    server.on('error', reject)
    const check = () => {
      if (serverLog.includes('Ready in')) return resolve()
      if (server.exitCode !== null || Date.now() > deadline) return reject(new Error(serverLog))
      setTimeout(check, 100)
    }
    check()
  })
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin === origin) return route.continue()
    externalRequests.push(route.request().url())
    return route.abort()
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => failures.push(error.message))
  const measurements = []
  const mutations = []
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method()))
      mutations.push(request.method() + ' ' + request.url())
  })
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(origin)
    await page
      .getByRole('heading', { level: 1, name: 'История — ваша. Остальное — под рукой.' })
      .waitFor()
    const grid = page.getByRole('grid')
    await grid.getByRole('gridcell').nth(32).waitFor()
    assert.equal(await grid.getByRole('gridcell').count(), 60)
    const metrics = await grid.evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      cell: element.querySelector('button').getBoundingClientRect().width,
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
      scrollerOverflow:
        element.parentElement.parentElement.scrollWidth >
        element.parentElement.parentElement.clientWidth,
      tabStops: [...element.querySelectorAll('button')].filter((b) => b.tabIndex === 0).length,
    }))
    assert.ok(metrics.cell >= 44, JSON.stringify(metrics))
    assert.equal(metrics.pageOverflow, false)
    assert.equal(metrics.tabStops, 1)
    if (width < 740) assert.equal(metrics.scrollerOverflow, true)
    measurements.push({ width, ...metrics })
    await page.screenshot({
      path: path.join(results, 'public-landing-' + width + '-ru-dark.png'),
      fullPage: true,
    })
    const next = page.getByRole('button', { name: 'Следующий ход', exact: true })
    await next.click()
    await page.getByRole('status').filter({ hasText: 'Раунд 1 · Ход: Бран' }).waitFor()
    assert.match(await page.locator('li[aria-current="step"]').textContent(), /Бран/)
    for (let i = 0; i < 5; i++) await next.click()
    await page.getByRole('status').filter({ hasText: 'Раунд 2 · Ход: Лира' }).waitFor()
    await page.getByRole('button', { name: 'Начать заново', exact: true }).click()
    const cell = (x, y) => grid.getByRole('gridcell').nth(y * 10 + x)
    await cell(2, 3).focus()
    await page.keyboard.press('ArrowRight')
    assert.equal(await cell(3, 3).evaluate((el) => el === document.activeElement), true)
    await page.keyboard.press('Enter')
    await page.getByRole('status').filter({ hasText: 'Лира: перемещение в клетку 4, 4' }).waitFor()
    assert.match(await cell(3, 3).getAttribute('aria-label'), /Лира/)
    assert.match(await cell(2, 3).getAttribute('aria-label'), /свободна/)
    // An occupied cell selects its participant instead of overwriting a token.
    await cell(3, 4).click()
    await page.getByRole('status').filter({ hasText: 'Выбрана: Бран' }).waitFor()
    assert.equal(await grid.locator('[aria-selected="true"]').count(), 1)
    assert.match(await cell(3, 3).getAttribute('aria-label'), /Лира/)
    await page.getByRole('button', { name: 'Маршрут', exact: true }).click()
    await cell(6, 4).click()
    await page.getByRole('status').filter({ hasText: 'Длина маршрута: 15 фт' }).waitFor()
    await page.getByRole('button', { name: 'Маршрут', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Длина маршрута: 15 фт' }).waitFor()
    await page.getByRole('button', { name: 'Убрать точку', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Длина маршрута: 0 фт' }).waitFor()
    await page.getByRole('button', { name: 'Очистить', exact: true }).click()
    assert.equal(
      await page.getByRole('button', { name: 'Очистить', exact: true }).isDisabled(),
      true
    )
    assert.match(await cell(3, 4).getAttribute('aria-label'), /Бран/)
    await page.getByRole('button', { name: 'Начать заново', exact: true }).click()
    assert.equal(
      await page.getByRole('button', { name: 'Фигурки', exact: true }).getAttribute('aria-pressed'),
      'true'
    )
    assert.match(await cell(2, 3).getAttribute('aria-label'), /Лира/)
    await cell(2, 3).focus()
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowUp')
    assert.equal(await cell(0, 0).evaluate((el) => el === document.activeElement), true)
    await page.keyboard.press('Control+End')
    assert.equal(await cell(9, 5).evaluate((el) => el === document.activeElement), true)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false
    )
    await page.getByRole('button', { name: 'English', exact: true }).click()
    await page
      .getByRole('heading', { level: 1, name: 'Your story. Everything else, at hand.' })
      .waitFor()
    assert.equal(await page.locator('html').getAttribute('lang'), 'en')
    assert.ok((await context.cookies()).some((c) => c.name === 'dm-lang' && c.value === 'en'))
    assert.equal(
      await page.getByRole('link', { name: 'Log in', exact: true }).getAttribute('href'),
      '/login'
    )
    assert.equal(
      await page.getByRole('link', { name: 'Create a campaign', exact: true }).getAttribute('href'),
      '/signup'
    )
    if (width === 1440) {
      // Client navigation must carry the language into the actual auth forms.
      await page.getByRole('link', { name: 'Log in', exact: true }).click()
      await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor()
      await page.getByRole('link', { name: '← DM Workspace', exact: true }).click()
      await page.reload()
      await page
        .getByRole('heading', { level: 1, name: 'Your story. Everything else, at hand.' })
        .waitFor()
      await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
      await page.screenshot({
        path: path.join(results, 'public-landing-' + width + '-en-light.png'),
        fullPage: true,
      })
      if (width < 740) {
        await page.locator('#demo').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: path.join(results, 'public-landing-' + width + '-en-demo.png'),
        })
        await page.getByRole('button', { name: 'Next turn', exact: true }).scrollIntoViewIfNeeded()
        await page.screenshot({
          path: path.join(results, 'public-landing-' + width + '-en-queue.png'),
        })
      }
      await page.getByRole('button', { name: 'Русский', exact: true }).waitFor()
    }
    await page.getByRole('button', { name: 'Русский', exact: true }).click()
  }
  // Touch uses the same native buttons; scrolling does not move a token.
  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })
  await touch.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : (externalRequests.push(route.request().url()), route.abort())
  )
  const touchPage = await touch.newPage()
  touchPage.on('pageerror', (error) => failures.push(error.message))
  await touchPage.goto(origin)
  await touchPage.getByRole('gridcell', { name: 'Клетка 3, 4: Лира', exact: true }).tap()
  await touchPage.getByRole('gridcell', { name: 'Клетка 4, 4: свободна', exact: true }).tap()
  await touchPage
    .getByRole('status')
    .filter({ hasText: 'Лира: перемещение в клетку 4, 4' })
    .waitFor()
  await touch.close()
  // The exact real proxy runs in this isolated Next app with dummy configuration.
  // No real campaigns, auth endpoints, joins or Supabase services are reached.
  for (const route of [
    '/dashboard',
    '/campaign/synthetic/scenes/synthetic',
    '/api/private',
    '/join/synthetic',
    '/demo',
  ]) {
    const response = await context.request.get(origin + route, { maxRedirects: 0 })
    assert.equal(response.status(), 307, route)
    assert.equal(new URL(response.headers().location, origin).pathname, '/login', route)
  }
  const noJS = await browser.newContext({ javaScriptEnabled: false })
  const noJSPage = await noJS.newPage()
  await noJSPage.goto(origin)
  await noJSPage
    .getByRole('heading', { level: 1, name: 'История — ваша. Остальное — под рукой.' })
    .waitFor()
  assert.equal(
    await noJSPage
      .getByRole('link', { name: 'Создать кампанию', exact: true })
      .getAttribute('href'),
    '/signup'
  )
  await noJS.close()
  assert.deepEqual(mutations, [], 'Demo interactions must not call server actions')
  assert.deepEqual(failures, [], 'No browser exceptions or hydration failures')
  assert.deepEqual(externalRequests, [], 'No external services used')
  await writeFile(
    path.join(results, 'public-landing.json'),
    JSON.stringify({ measurements, mutations, failures, externalRequests }, null, 2)
  )
  console.log(
    'PASS: real Next public home/proxy, RU/EN dark/light 1440/390/320, turns, local moves, route, keyboard/touch/reset, no server writes'
  )
} finally {
  await browser?.close()
  if (server && server.exitCode === null) {
    await new Promise((resolve) => {
      server.once('exit', resolve)
      server.kill()
    })
  }
  assert.ok(fixture.startsWith(results + path.sep), 'Cleanup must stay inside test-results')
  await rm(fixture, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 })
}
