// Step 43: the eighth critique's minors.
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

test('No matches has no "0 tasks" above it, and a quiet tile', async ({ app, page }) => {
  await app.loadSampleData()
  await expect(page.locator('[data-empty-state]')).toHaveCount(0)
  await page.locator('#search').fill('zzzz')
  await expect(page.getByRole('heading', { name: 'No matches' })).toBeVisible()
  // Still the status region for screen readers, but off the page.
  const count = page.getByRole('status').filter({ hasText: /^0 tasks$/ })
  await expect(count).toHaveCount(1)
  const box = await count.boundingBox()
  expect(box!.width * box!.height).toBeLessThanOrEqual(1)
  await expect(page.locator('[data-empty-tile]')).toHaveAttribute('data-empty-tile', 'quiet')
})

test('the first run keeps its brand tile and its positioning line on the first screen at 1280×800', async ({ app, page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await app.open()
  await expect(page.locator('[data-empty-tile]')).toHaveAttribute('data-empty-tile', 'brand')
  for (const el of [page.locator('[data-first-run-note]'), page.getByRole('button', { name: 'Load sample data' })]) {
    const b = await el.boundingBox()
    expect(b!.y + b!.height).toBeLessThanOrEqual(800)
  }
})

test('the Trash subtitle wraps instead of being cut off at 390', async ({ app, page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await app.open()
  await page.getByRole('button', { name: /^Trash/ }).first().click()
  const subtitle = page.getByText('Restore or permanently delete')
  await expect(subtitle).toBeVisible()
  expect(await subtitle.evaluate((el) => el.scrollWidth <= el.clientWidth && getComputedStyle(el).textOverflow !== 'ellipsis')).toBe(true)
})

test('the Description field grows with its text instead of cutting a line in half', async ({ app, page }) => {
  await app.loadSampleData()
  await app.taskRow('Prepare quarterly review slides').locator('[data-card-edit]').click()
  const description = page.getByRole('dialog', { name: 'Edit task' }).getByLabel('Description')
  expect(await description.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true)
  // Empty, it keeps its four-line room.
  await description.fill('')
  expect(await description.evaluate((el) => el.clientHeight)).toBeGreaterThanOrEqual(90)
})

test('the discard bar names the fields that changed', async ({ app, page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await app.loadSampleData()
  await app.taskRow('Pay rent').locator('[data-card-edit]').click()
  const dialog = page.getByRole('dialog', { name: 'Edit task' })
  await dialog.getByLabel('Title').fill('Pay the rent')
  await dialog.getByLabel('Priority').selectOption('low')
  await page.keyboard.press('Escape')
  const bar = dialog.getByRole('group', { name: 'Discard your changes?' })
  await expect(bar).toHaveAccessibleDescription('Changed: Title, Priority')
  await expect(bar.locator('[data-changed-fields]')).toBeVisible()
})

test('the editor says Move to Trash, and says when unsaved changes are not kept', async ({ app, page }) => {
  await app.loadSampleData()
  await app.taskRow('Pay rent').locator('[data-card-edit]').click()
  const dialog = page.getByRole('dialog', { name: 'Edit task' })
  await dialog.getByLabel('Title').fill('Pay the rent')
  await dialog.getByRole('button', { name: 'Move to Trash' }).click()
  const toast = page.getByRole('status').filter({ hasText: 'moved to Trash' })
  await expect(toast).toContainText('“Pay rent” moved to Trash')
  await expect(toast).toContainText('Your unsaved changes weren’t kept.')

  // Untouched, the toast says nothing about changes.
  await app.taskRow('Grocery run').locator('[data-card-edit]').click()
  await dialog.getByRole('button', { name: 'Move to Trash' }).click()
  const second = page.getByRole('status').filter({ hasText: '“Grocery run” moved to Trash' })
  await expect(second).toBeVisible()
  await expect(second).not.toContainText('unsaved')
})

test('on a phone the backup reminder keeps its two answers together', async ({ app, page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await app.loadSampleData()
  await app.showBackupNudge()
  const [now, later] = await Promise.all([
    page.getByRole('button', { name: 'Back up now' }).boundingBox(),
    app.backupNudge.boundingBox(),
  ])
  expect(Math.abs(now!.y + now!.height / 2 - (later!.y + later!.height / 2))).toBeLessThanOrEqual(2)
})
