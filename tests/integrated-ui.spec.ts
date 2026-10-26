import { expect, test, type Page } from '@playwright/test'
import { loginAndOpenFirstCampaign } from './helpers'

// Read-only integration smoke test for PR #51. Uses existing test account/campaign.
// Do not add mutations here until Preview -> DEV Supabase is independently verified.
const sections = [
  { path: '', label: 'overview' },
  { path: '/characters', label: 'characters' },
  { path: '/bestiary', label: 'bestiary' },
  { path: '/chapters', label: 'chapters' },
] as const

async function assertPageIsUsable(page: Page, label: string) {
  await expect(page.locator('h1').first(), `${label}: page heading`).toBeVisible({
    timeout: 20_000,
  })

  // A narrow viewport must not create document-wide horizontal scrolling.
  const overflow = await page.evaluate(() =>
    Math.max(
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth
    )
  )
  expect(overflow, `${label}: horizontal overflow in pixels`).toBeLessThanOrEqual(2)
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`PR #51 integration: ${viewport.name} section navigation stays usable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const campaignId = await loginAndOpenFirstCampaign(page)

    for (const section of sections) {
      const url = `/campaign/${campaignId}${section.path}`
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
      await expect(page).toHaveURL(new RegExp(`${url.replaceAll('/', '\\/')}$`))
      await assertPageIsUsable(page, section.label)
    }
  })
}
