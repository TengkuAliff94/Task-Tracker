import { expect, test } from './fixtures'

// "tomorrow 5pm" is relative, but the fixture pins the clock, so it always lands on 11 March 2026.
test('quick-add parses tokens, shows the task and keeps it after a reload', async ({ app, page }) => {
  await app.quickAddInput.fill('Pay rent #finance @home !high ~30m tomorrow 5pm')

  const preview = app.quickAddPreview
  await expect(preview).toContainText('Pay rent')
  await expect(preview.getByText('@home', { exact: true })).toBeVisible()
  await expect(preview.getByText('#finance', { exact: true })).toBeVisible()
  await expect(preview.getByText('High', { exact: true })).toBeVisible()
  await expect(preview.getByText('~30m', { exact: true })).toBeVisible()
  await expect(preview.getByText('Tomorrow 17:00', { exact: true })).toBeVisible()

  await app.quickAddInput.press('Enter')
  await expect(app.quickAddInput).toHaveValue('')
  await expect(preview).toBeHidden()

  const expectRow = async () => {
    const row = app.taskRow('Pay rent')
    await expect(row).toBeVisible()
    await expect(row.getByText('High', { exact: true })).toBeVisible()
    await expect(row.getByText('@home')).toBeVisible()
    await expect(row.getByText('#finance')).toBeVisible()
    await expect(row.getByText('30m', { exact: true })).toBeVisible()
    await expect(row.getByText('Tomorrow 17:00', { exact: true })).toBeVisible()
  }
  await expectRow()
  // The new project shows up as a filter option.
  await app.openFilters()
  await expect(page.getByLabel('Filter by project')).toContainText('home')

  // A reload drops all in-memory state, so the task can only come back from IndexedDB.
  await page.reload()
  await expectRow()
})

test('new tags on one quick-add line each get their own colour (#46)', async ({ app }) => {
  await app.quickAdd('Plan trip #flights #hotel #visa')
  const card = app.taskRow('Plan trip')
  const dots = ['flights', 'hotel', 'visa'].map((n) =>
    // The chip (outlined pill) named "#<tag>", and its colour dot.
    card.locator('span.ring-1', { hasText: new RegExp(`^#${n}$`) }).locator('> span[aria-hidden]'),
  )
  const colours = await Promise.all(dots.map((d) => d.evaluate((el) => getComputedStyle(el).backgroundColor)))
  expect(new Set(colours).size).toBe(3)
})
