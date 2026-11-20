// The filter bar: search always in view, everything else behind a Filters disclosure. While it's
// collapsed, each active filter shows as a chip that removes it, so nothing narrows the list unseen.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const chip = (page: Page, label: string) => page.getByRole('button', { name: `Remove ${label} filter`, exact: true })

test('the filter panel is a disclosure, closed by default and operable from the keyboard', async ({ app, page }) => {
  await app.loadSampleData()
  const toggle = app.filtersToggle
  const priority = page.getByRole('group', { name: 'Priority' })

  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(priority).toBeHidden()
  await expect(page.getByLabel('Search tasks')).toBeVisible()

  // The panel it controls exists in both states.
  const panelId = await toggle.getAttribute('aria-controls')
  await expect(page.locator(`[id="${panelId}"]`)).toHaveCount(1)

  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(priority).toBeVisible()
  await expect(toggle, 'focus stays on the toggle').toBeFocused()

  // Tab goes from the toggle straight into the panel.
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Filter by project')).toBeFocused()

  await toggle.focus()
  await page.keyboard.press('Space')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(priority).toBeHidden()
})

test('active filters show as chips while collapsed, and each chip removes its filter', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  await page.getByLabel('Filter by project').selectOption({ label: 'Home' })
  await page.getByRole('button', { name: 'High', exact: true }).click()
  await page.getByRole('button', { name: '#finance', exact: true }).click()
  await expect(app.taskCards()).toHaveCount(1)
  await expect(app.taskRow('Pay rent')).toBeVisible()

  await app.filtersToggle.click()
  await expect(app.filtersToggle).toHaveAccessibleName('Filters 3 active')
  for (const label of ['Home', 'High', '#finance']) await expect(chip(page, label)).toBeVisible()

  // Taking off High brings back the urgent Home finance task; focus moves to the next chip.
  await chip(page, 'High').click()
  await expect(chip(page, 'High')).toHaveCount(0)
  await expect(app.taskRow('Renew car insurance')).toBeVisible()
  await expect(chip(page, '#finance')).toBeFocused()
  await expect(app.filtersToggle).toHaveAccessibleName('Filters 2 active')

  // Taking off the last chip moves focus back to the one before it, never onto Clear filters.
  await page.keyboard.press('Enter')
  await expect(chip(page, 'Home')).toBeFocused()
  await page.keyboard.press('Enter')

  // Nothing left to remove: the chip row goes and focus returns to the Filters button.
  await expect(page.getByRole('button', { name: /^Remove .* filter$/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0)
  await expect(app.filtersToggle).toBeFocused()
  await expect(app.filtersToggle).toHaveAccessibleName('Filters')
  await expect(app.taskCards()).toHaveCount(8)
})

test('Clear filters stays reachable while collapsed, and hands focus back to the Filters button', async ({ app, page }) => {
  await app.loadSampleData()
  await page.getByLabel('Search tasks').fill('rent')
  const clear = page.getByRole('button', { name: 'Clear filters' })
  await expect(clear).toBeVisible()

  // With search still filtering, taking off the last chip leaves focus on Clear filters.
  await app.openFilters()
  await page.getByRole('button', { name: 'High', exact: true }).click()
  await app.filtersToggle.click()
  await chip(page, 'High').click()
  await expect(clear).toBeFocused()

  await clear.click()
  await expect(page.getByLabel('Search tasks')).toHaveValue('')
  await expect(app.filtersToggle).toBeFocused()
})

// The Sort select's chosen value must show in full, not "Sort: Smart (…".
for (const width of [390, 768, 1280]) {
  test(`the sort value is fully readable at ${width}px`, async ({ app, page }) => {
    await page.setViewportSize({ width, height: 900 })
    await app.loadSampleData()
    await app.openFilters()
    const sortBy = page.getByLabel('Sort by')
    for (const value of ['smart', 'deadline', 'priority', 'created', 'title']) {
      await sortBy.selectOption(value)
      const room = await sortBy.evaluate((el: HTMLSelectElement) => {
        const style = getComputedStyle(el)
        const ctx = document.createElement('canvas').getContext('2d')!
        ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
        const text = ctx.measureText(el.selectedOptions[0].text).width
        return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - text
      })
      expect(room, `"${value}" fits`).toBeGreaterThanOrEqual(0)
    }
    expect(await app.scrollsSideways()).toBe(false)
  })
}

test('deleting a tag that is picked as a filter takes the filter off too', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  await page.getByRole('button', { name: '#errand', exact: true }).click()
  await expect(app.taskCards()).toHaveCount(3)

  await page.getByRole('button', { name: 'Projects & tags' }).click()
  await page.getByRole('button', { name: 'Delete errand' }).click()
  await page.getByRole('alertdialog', { name: 'Delete this tag?' }).getByRole('button', { name: 'Delete tag' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()

  await expect(page.getByRole('button', { name: '#errand', exact: true })).toHaveCount(0)
  await expect(app.taskCards()).toHaveCount(8)
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0)
})

// WCAG 2.4.11: tabbing back up into the filter row on a phone, the header slides back in; the
// focused control must stop below it, not under it.
test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 640 } })

  test('Shift+Tab back into the filter row stops clear of the header', async ({ app, page }) => {
    await app.loadSampleData()
    await app.openFilters()
    for (const name of ['Low', 'Medium', 'High']) await page.getByRole('button', { name, exact: true }).click()
    await app.filtersToggle.click()

    const clear = page.getByRole('button', { name: 'Clear filters' })
    // Scroll well past the filter row, then back up until Clear filters sits right at the top,
    // where the returning header covers it. Focus the first card without scrolling, then Shift+Tab.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const top = await clear.evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
    await page.mouse.move(180, 400)
    await page.mouse.wheel(0, -(await page.evaluate(() => window.scrollY)) + top - 20)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(top)
    await page.getByRole('banner').waitFor()
    await app.taskCards().first().getByRole('checkbox').evaluate((el: HTMLElement) => el.focus({ preventScroll: true }))
    await page.keyboard.press('Shift+Tab')
    await expect(clear).toBeFocused()

    const header = await page.getByRole('banner').boundingBox()
    await expect.poll(async () => (await clear.boundingBox())!.y).toBeGreaterThanOrEqual(header!.y + header!.height)
  })
})
