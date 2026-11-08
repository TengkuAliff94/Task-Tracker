// Regenerates the README images: `npm run screenshots`.
import { expect, test, type Page } from '@playwright/test'

/** Loads the demo tasks and hides the backup nudge, which would otherwise top every shot. */
async function loadSample(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'load sample data' }).click()
  // The load is one transaction, so the first rows to appear are the full set.
  await expect(page.locator('li[data-task-id]').first()).toBeVisible()
  await page.getByRole('button', { name: 'Remind me later' }).click()
}

const OUT = 'docs/screenshots'

for (const scheme of ['light', 'dark'] as const) {
  test(`list view (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.setViewportSize({ width: 1000, height: 900 })
    await loadSample(page)
    await page.screenshot({ path: `${OUT}/list-${scheme}.png` })
  })
}

test('task editor', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 1100 })
  await loadSample(page)
  await page.locator('li[data-task-id]').filter({ hasText: 'Prepare quarterly review slides' }).getByRole('button').click()
  await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
  await page.screenshot({ path: `${OUT}/editor.png` })
})

test('mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await loadSample(page)
  await page.screenshot({ path: `${OUT}/mobile.png` })
})
