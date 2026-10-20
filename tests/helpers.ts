import { Page, expect } from '@playwright/test'

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL ?? 'test@dm-workspace.dev',
  password: process.env.TEST_USER_PASSWORD ?? 'test-password-123',
}

export async function login(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30_000 })

  const emailInput = page.locator('input#email')
  const passwordInput = page.locator('input#password')

  await expect(emailInput).toBeVisible({ timeout: 20_000 })
  await expect(passwordInput).toBeVisible({ timeout: 20_000 })

  // Заполняем через pressSequentially (гарантирует onChange)
  await emailInput.click()
  await emailInput.pressSequentially(TEST_USER.email, { delay: 5 })
  await expect(emailInput).toHaveValue(TEST_USER.email, { timeout: 5_000 })

  await passwordInput.click()
  await passwordInput.pressSequentially(TEST_USER.password, { delay: 5 })
  await expect(passwordInput).toHaveValue(TEST_USER.password, { timeout: 5_000 })

  // Клик + ожидание, с повтором если URL не сменился
  const submitButton = page.getByRole('button', { name: /войти/i })
  await submitButton.click()

  try {
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })
  } catch {
    const errorText = await page
      .locator('.text-red-400')
      .textContent()
      .catch(() => null)
    if (errorText) {
      throw new Error(`Логин упал с ошибкой Supabase: ${errorText}`)
    }
    // Повторный клик (форма могла не отправиться из-за гидратации)
    await submitButton.click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })
  }

  await expect(page.getByRole('heading', { name: /мои кампании/i })).toBeVisible({
    timeout: 20_000,
  })
}

export async function loginAndOpenFirstCampaign(page: Page): Promise<string> {
  await login(page)

  // CHANGES: ждём, пока дашборд полностью загрузится (networkidle),
  // прежде чем искать ссылку на кампанию. Это решает flaky на тяжёлых страницах.
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {
    // networkidle может не наступить из-за Realtime — игнорируем таймаут
  })

  const firstCampaignLink = page.locator('a[href^="/campaign/"]').first()
  await expect(firstCampaignLink).toBeVisible({ timeout: 20_000 })

  const href = await firstCampaignLink.getAttribute('href')
  if (!href) throw new Error('Не удалось получить href кампании')

  const campaignId = href.split('/')[2]
  if (!campaignId) throw new Error(`Не удалось извлечь campaignId из href: ${href}`)

  await page.goto(href, { waitUntil: 'commit', timeout: 60_000 })
  await expect(page).toHaveURL(new RegExp(`/campaign/${campaignId}`), {
    timeout: 30_000,
  })
  return campaignId
}
