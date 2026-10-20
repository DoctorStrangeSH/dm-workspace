import { test, expect } from '@playwright/test'
import { login, loginAndOpenFirstCampaign } from './helpers'

test.describe('Smoke — базовая функциональность', () => {
  test('1. Неавторизованный редиректит на /login', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 })
  })

  test('2. Логин → /dashboard', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('heading', { name: /мои кампании/i })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('3. Дашборд показывает кампанию "Test Campaign"', async ({ page }) => {
    await login(page)
    await expect(page.getByText('Test Campaign')).toBeVisible({
      timeout: 20_000,
    })
  })

  test('4. Открыть кампанию → обзор', async ({ page }) => {
    const campaignId = await loginAndOpenFirstCampaign(page)
    await expect(page).toHaveURL(new RegExp(`/campaign/${campaignId}$`), {
      timeout: 20_000,
    })
  })

  test('5. Открыть главы → список', async ({ page }) => {
    const campaignId = await loginAndOpenFirstCampaign(page)
    await page.goto(`/campaign/${campaignId}/chapters`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    await expect(
      page.getByRole('heading', { name: /главы/i }).or(page.getByText(/пока нет ни одной главы/i))
    ).toBeVisible({ timeout: 20_000 })
  })

  test('6. Открыть главу → редактор', async ({ page }) => {
    const campaignId = await loginAndOpenFirstCampaign(page)
    await page.goto(`/campaign/${campaignId}/chapters`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    const firstChapter = page.locator('a[href*="/chapters/"]').first()
    if ((await firstChapter.count()) === 0) test.skip(true, 'Нет глав')
    await firstChapter.click()
    await page.waitForURL(/\/chapters\/[^/]+$/, { timeout: 30_000 })

    const isMobile = (page.viewportSize()?.width ?? 0) < 768
    if (isMobile) {
      const editTab = page.getByRole('button', { name: /редактор/i })
      if ((await editTab.count()) > 0) await editTab.click()
    }

    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 30_000 })
  })

  test('7. Открыть VTT → карта и токены', async ({ page }) => {
    const campaignId = await loginAndOpenFirstCampaign(page)
    await page.goto(`/campaign/${campaignId}/scenes`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    const firstScene = page.locator('a[href*="/scenes/"]').first()
    if ((await firstScene.count()) === 0) test.skip(true, 'Нет сцен')
    await firstScene.click()
    await page.waitForURL(/\/scenes\/[^/]+$/, { timeout: 30_000 })

    // CHANGES: level: 1 — матчит только <h1>, не <span> в хлебных крошках.
    await expect(page.getByRole('heading', { name: 'Тестовая сцена', level: 1 })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('8. /settings открывается', async ({ page }) => {
    await login(page)
    await page.goto('/settings', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    await expect(page.getByRole('heading', { name: 'Настройки', level: 1 })).toBeVisible({
      timeout: 20_000,
    })
  })
})
