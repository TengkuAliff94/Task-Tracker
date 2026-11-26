// A moved card doesn't vanish (eighth critique P2, step 40, #63): Move and T re-sort the list, so
// once the new deadline is listed the card is selected, keeps focus and is scrolled into view.
// At FIXED_NOW the sample set's first card is "Renew car insurance" (2 days overdue); a week on, it
// sorts near the end of the list, well below the fold on a short phone screen.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce', viewport: { width: 390, height: 700 } })

const moveButton = (page: Page, title: string) => page.getByRole('button', { name: `Move “${title}” to…` })

test('Move → Next week with the mouse: the card is selected, focused and in view where it lands', async ({ app, page }) => {
  await app.loadSampleData()
  const before = await app.taskCards().allInnerTexts()
  await moveButton(page, 'Renew car insurance').click()
  await page.getByRole('menuitem', { name: 'Next week' }).click()

  const row = app.taskRow('Renew car insurance')
  await expect(row).toContainText('In 7 days')
  // It really did move a long way down, out of the first screen.
  const after = await app.taskCards().allInnerTexts()
  expect(after.findIndex((t) => t.includes('Renew car insurance'))).toBeGreaterThan(before.findIndex((t) => t.includes('Renew car insurance')) + 3)

  await expect(row).toHaveAttribute('aria-current', 'true')
  await expect(row.locator('[data-card-edit]')).toBeFocused()
  await expect(row).toBeInViewport()
  // Clear of the move toast in the bottom corner, not underneath it.
  const toast = page.getByRole('status').filter({ hasText: /” moved(?! to Trash)/ })
  await expect(toast).toBeVisible()
  const [card, t] = [await row.boundingBox(), await toast.boundingBox()]
  expect(card!.y + card!.height, 'the card ends above the toast').toBeLessThanOrEqual(t!.y)
})

test('T on the selected card: it stays selected and in view after the re-sort', async ({ app, page }) => {
  await app.loadSampleData()
  await page.keyboard.press('j')
  const row = app.taskRow('Renew car insurance')
  await expect(row).toHaveAttribute('aria-current', 'true')
  // Scroll the card off screen first (as after reading further down), so the move has to bring it back.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect(row).not.toBeInViewport()
  await page.keyboard.press('t')
  await expect(row).toContainText('Tomorrow')
  await expect(row).toHaveAttribute('aria-current', 'true')
  await expect(row.locator('[data-card-edit]')).toBeFocused()
  await expect(row).toBeInViewport()
})

test('T with focus on the checkbox keeps focus on the checkbox', async ({ app, page }) => {
  await app.loadSampleData()
  await page.keyboard.press('j')
  await page.keyboard.press('Shift+Tab')
  const row = app.taskRow('Renew car insurance')
  await expect(row.locator('input[type="checkbox"]')).toBeFocused()
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect(row).not.toBeInViewport()
  await page.keyboard.press('t')
  await expect(row).toContainText('Tomorrow')
  await expect(row).toHaveAttribute('aria-current', 'true')
  await expect(row.locator('input[type="checkbox"]')).toBeFocused()
  await expect(row).toBeInViewport()
})

test('a move that takes the card off a picked tile is not revealed later', async ({ app, page }) => {
  await app.loadSampleData()
  const overdue = page.getByRole('button', { name: /^Overdue/ })
  await overdue.click()
  await moveButton(page, 'Renew car insurance').click()
  await page.getByRole('menuitem', { name: 'Tomorrow' }).click()
  await expect(app.taskRow('Renew car insurance')).toHaveCount(0)
  await overdue.click()
  const row = app.taskRow('Renew car insurance')
  await expect(row).toBeVisible()
  await expect(row).not.toHaveAttribute('aria-current', 'true')
  await expect(row.locator('[data-card-edit]')).not.toBeFocused()
})
