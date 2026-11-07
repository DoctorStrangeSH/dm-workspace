import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('../../', import.meta.url))
const results = path.join(root, 'test-results')
await mkdir(results, { recursive: true })
const fixture = await mkdtemp(path.join(results, 'production-layout-'))
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
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
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
export default function Layout({children}: {children: React.ReactNode}) {
  return <html lang="ru"><body>{children}</body></html>
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
    "export {default} from '../../../tests/production-layout/fixture'"
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
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(origin)
    const queue = page.getByRole('list', { name: 'Очередь инициативы' })
    const measure = () =>
      queue.evaluate((element) => {
        const cards = [...element.children].map((child) => child.getBoundingClientRect())
        const viewport = document.querySelector('[data-testid="map-viewport"]')
        return {
          display: getComputedStyle(element).display,
          className: element.className,
          cardWidth: cards[0].width,
          buttonDisplay: getComputedStyle(element.children[0].firstElementChild).display,
          firstTop: cards[0].top,
          secondTop: cards[1].top,
          lastTop: cards.at(-1).top,
          railHeight: element.getBoundingClientRect().height,
          viewportHeight: viewport.getBoundingClientRect().height,
          containerType: getComputedStyle(document.querySelector('main')).containerType,
          layoutDisplay: getComputedStyle(element.closest('main').firstElementChild).display,
          pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
        }
      })
    let metrics = await measure()
    assert.equal(metrics.display, 'flex', JSON.stringify(metrics))
    assert.ok(metrics.className, 'CSS Module must export scoped classes')
    assert.equal(metrics.cardWidth, 124)
    assert.equal(metrics.buttonDisplay, 'flex', 'Production Tailwind utilities must also load')
    assert.equal(metrics.firstTop, metrics.secondTop)
    assert.equal(metrics.firstTop, metrics.lastTop)
    assert.ok(metrics.railHeight < 300)
    assert.equal(metrics.viewportHeight, 620)
    assert.equal(metrics.containerType, 'inline-size')
    assert.equal(metrics.layoutDisplay, 'grid')
    assert.equal(metrics.pageOverflow, false)
    measurements.push({ width, mode: 'collapsed', ...metrics })
    await page.screenshot({ path: path.join(results, `production-layout-${width}-collapsed.png`) })
    await queue.locator('button').first().click()
    await page.getByTestId('focused-token').filter({ hasText: 'battle-0' }).waitFor()
    await page.getByRole('button', { name: 'Панель боя', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Панель открыта' }).waitFor()
    const toggle = page.getByRole('button', { expanded: false }).first()
    await toggle.click()
    await page.getByRole('button', { expanded: true }).waitFor()
    metrics = await measure()
    assert.equal(metrics.display, 'grid')
    assert.ok(metrics.cardWidth >= 104 && metrics.cardWidth < 200)
    assert.equal(metrics.pageOverflow, false)
    if (width === 390) assert.ok(metrics.lastTop > metrics.firstTop)
    measurements.push({ width, mode: 'expanded', ...metrics })
    await page.screenshot({ path: path.join(results, `production-layout-${width}-expanded.png`) })
    await page.getByRole('button', { expanded: true }).click()
    assert.equal((await measure()).display, 'flex')
  }
  assert.deepEqual(failures, [], 'No browser exceptions')
  assert.deepEqual(externalRequests, [], 'No external services used')
  await writeFile(
    path.join(results, 'production-layout.json'),
    JSON.stringify(measurements, null, 2)
  )
  console.log(
    'PASS: real Next production CSS, desktop/mobile collapsed/expanded, map sizing and controls'
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
  await rm(fixture, { recursive: true, force: true })
}
