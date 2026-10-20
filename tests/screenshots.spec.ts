import { test } from '@playwright/test'
import { login, loginAndOpenFirstCampaign } from './helpers'

test.describe('Screenshots — визуальный baseline', () => {
  test('01. /login', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await test.expect(page).toHaveScreenshot('01-login.png', { fullPage: true })
  })

  test('02. /signup', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    await test.expect(page).toHaveScreenshot('02-signup.png', { fullPage: true })
  })

  test('03. /dashboard', async ({ page }) => {
    await login(page)
    await page.waitForLoadState('networkidle')
    await test.expect(page).toHaveScreenshot('03-dashboard.png', { fullPage: true })
  })

  test('04. /campaign/[id]', async ({ page }) => {
    await loginAndOpenFirstCampaign(page)
    await page.waitForLoadState('networkidle')
    await test.expect(page).toHaveScreenshot('04-campaign-overview.png', { fullPage: true })
  })

  test('05. /campaign/[id]/chapters', async ({ page }) => {
    const campaignId = await loginAndOpenFirstCampaign(page)
    await page.goto(`/campaign/${campaignId}/chapters`)
    await page.waitForLoadState('networkidle')
    await test.expect(page).toHaveScreenshot('05-chapters.png', { fullPage: true })
  })

  test('06. /campaign/[id]/chapters/[chapterId]', async ({ page }) => {
    const campaignId = await loginAndOpenFirstCampaign(page)
    await page.goto(`/campaign/${campaignId}/chapters`)
    const firstChapter = page.locator('a[href*="/chapters/"]').first()
    if ((await firstChapter.count()) === 0) test.skip(true, 'Нет глав')
    await firstChapter.click()
    await page.waitForLoadState('networkidle')
    await test.expect(page).toHaveScreenshot('06-chapter-editor.png', { fullPage: true })
  })

  test('07. /campaign/[id]/characters/[characterId]', async ({ page }) => {
    const campaignId = await loginAndOpenFirstCampaign(page)
    await page.goto(`/campaign/${campaignId}/characters`)
    const firstChar = page.locator('a[href*="/characters/"]').first()
    if ((await firstChar.count()) === 0) test.skip(true, 'Нет персонажей')
    await firstChar.click()
    await page.waitForLoadState('networkidle')
    await test.expect(page).toHaveScreenshot('07-character-sheet.png', { fullPage: true })
  })

  test('08. /campaign/[id]/scenes/[sceneId] (VTT)', async ({ page }) => {
    const campaignId = await loginAndOpenFirstCampaign(page)
    await page.goto(`/campaign/${campaignId}/scenes`)
    const firstScene = page.locator('a[href*="/scenes/"]').first()
    if ((await firstScene.count()) === 0) test.skip(true, 'Нет сцен')
    await firstScene.click()
    await page.waitForLoadState('networkidle')
    await test.expect(page).toHaveScreenshot('08-vtt-scene.png', { fullPage: true })
  })

  test('09. /campaign/[id]/bestiary', async ({ page }) => {
    const campaignId = await loginAndOpenFirstCampaign(page)
    await page.goto(`/campaign/${campaignId}/bestiary`)
    await page.waitForLoadState('networkidle')
    await test.expect(page).toHaveScreenshot('09-bestiary.png', { fullPage: true })
  })

  test('10. /settings', async ({ page }) => {
    await login(page)
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await test.expect(page).toHaveScreenshot('10-settings.png', { fullPage: true })
  })

  test('11. mobile /dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await login(page)
    await page.waitForLoadState('networkidle')
    await test.expect(page).toHaveScreenshot('11-dashboard-mobile.png', { fullPage: true })
  })
})
