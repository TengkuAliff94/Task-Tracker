// The open filter panel is two named jobs, "Show" and "Arrange", and a long tag list folds behind
// a searchable "N more" (seventh critique P2, step 36).
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const section = (page: import('@playwright/test').Page, name: string) => page.getByRole('region', { name, exact: true })

test('the panel names its two jobs: Show narrows, Arrange orders', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  const show = section(page, 'Show')
  const arrange = section(page, 'Arrange')
  await expect(show.getByLabel('Filter by project')).toBeVisible()
  for (const name of ['Priority', 'Status', 'Tags']) await expect(show.getByRole('group', { name, exact: true })).toBeVisible()
  await expect(show.getByLabel(/Show completed/)).toBeVisible()
  await expect(arrange.getByLabel('Sort by')).toBeVisible()
  await expect(arrange.getByLabel('Group by')).toBeVisible()
  // Arrange comes after Show: below it, or (from lg) beside it on the right.
  const [a, b] = await Promise.all([show.boundingBox(), arrange.boundingBox()])
  expect(a!.y + a!.height <= b!.y || a!.x + a!.width <= b!.x).toBe(true)
})

const TAGS = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel']

for (const width of [390, 1280]) {
  test(`past ${4 + 1} tags, the rest fold behind a search at ${width}px`, async ({ app, page }) => {
    await page.setViewportSize({ width, height: 900 })
    await app.open()
    await app.quickAdd(`Many tags ${TAGS.map((t) => `#${t}`).join(' ')}`)
    await page.keyboard.press('Escape')
    await app.openFilters()
    const tags = page.getByRole('group', { name: 'Tags', exact: true })
    await expect(tags.getByRole('button', { name: /^#/ })).toHaveCount(4)
    const more = tags.getByRole('button', { name: '4 more tags' })
    await more.click()

    const find = tags.getByRole('searchbox', { name: 'Find a tag' })
    await expect(find).toBeFocused()
    await expect(tags.getByRole('button', { name: /^#/ })).toHaveCount(8)
    await find.fill('hot')
    await expect(tags.getByRole('button', { name: /^#/ })).toHaveCount(1)
    await tags.getByRole('button', { name: '#hotel' }).click()
    await find.fill('zzz')
    await expect(tags.getByText('No tag matches “zzz”.')).toBeVisible()

    // Esc folds it again and focus returns to "N more"; the picked tag stays in view.
    await find.press('Escape')
    await expect(tags.getByRole('searchbox')).toHaveCount(0)
    await expect(tags.getByRole('button', { name: '#hotel' })).toHaveAttribute('aria-pressed', 'true')
    await expect(tags.getByRole('button', { name: /more tags$/ })).toBeFocused()
    await expect(page.getByRole('button', { name: /^Filters/ })).toHaveAttribute('aria-expanded', 'true')
    expect(await app.scrollsSideways()).toBe(false)
  })
}

test('five tags or fewer all show, with no fold', async ({ app, page }) => {
  await app.open()
  await app.quickAdd(`Few tags ${TAGS.slice(0, 5).map((t) => `#${t}`).join(' ')}`)
  await page.keyboard.press('Escape')
  await app.openFilters()
  const tags = page.getByRole('group', { name: 'Tags', exact: true })
  await expect(tags.getByRole('button', { name: /^#/ })).toHaveCount(5)
  await expect(tags.getByRole('button', { name: /more tags$/ })).toHaveCount(0)
})
