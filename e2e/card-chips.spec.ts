// Card metadata on phones is lighter (step 31, #54): tags drop their tint and ring to a dot and the
// name, the small counts wait for `sm`, and grouped by priority the cards don't repeat the badge.
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

test.describe('at 390', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('tags are a dot and a name, with no tint or ring; the project keeps its chip', async ({ app }) => {
    await app.loadSampleData()
    const row = app.taskRow('Pay rent')
    const tag = row.locator('[data-tag]').first()
    await expect(tag).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(tag).not.toHaveCSS('box-shadow', /1px inset/) // the ring is 0px wide
    const project = row.locator('[data-meta="label"]:not([data-tag])')
    await expect(project).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  })

  test('the small counts (reminders, checklist, attachments, effort) wait for wider screens', async ({ app }) => {
    await app.loadSampleData()
    const counts = app.page.locator('[data-task-id] [data-meta="count"]')
    expect(await counts.count()).toBeGreaterThan(3)
    for (const c of await counts.all()) await expect(c).toBeHidden()
    expect(await app.scrollsSideways()).toBe(false)
  })
})

test('from sm, tags keep their chip and the counts show', async ({ app, page }) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await app.loadSampleData()
  const row = app.taskRow('Pay rent')
  await expect(row.locator('[data-tag]').first()).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(row.locator('[data-meta="count"]').first()).toBeVisible()
})

test('grouped by priority, cards leave out the priority badge the heading already says', async ({ app, page }) => {
  await app.loadSampleData()
  await expect(app.taskRow('Pay rent').locator('[data-priority]')).toHaveCount(1)
  await app.openFilters()
  await page.getByLabel('Group by').selectOption({ label: 'Priority' })
  await expect(page.getByRole('list', { name: /^High tasks$/ })).toBeVisible()
  await expect(page.locator('[data-task-id] [data-priority]')).toHaveCount(0)
  // Urgent keeps its stripe: that's a different mark.
  await expect(app.taskRow('Renew car insurance').locator('[data-priority-stripe]')).toHaveCount(1)
})
