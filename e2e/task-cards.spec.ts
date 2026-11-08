// Tasks show as separate cards in a responsive grid, read row by row, with J/K following that order.
import { box, expect, test } from './fixtures'

// Layout checks measure where cards settle, so they run with reduced motion: mid-entrance, cards
// are offset and staggered.
test.describe('wide screen', () => {
  test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })

  test('cards sit side by side, and J/K move through them row by row', async ({ app, page }) => {
    await app.loadSampleData()
    const cards = app.taskCards()
    const first = await box(cards.nth(0))
    const second = await box(cards.nth(1))
    const third = await box(cards.nth(2))

    expect(second.x, 'the second card is beside the first').toBeGreaterThan(first.x + first.width)
    expect(Math.abs(second.y - first.y), 'on the same row').toBeLessThan(2)
    expect(third.y, 'the third card starts the next row').toBeGreaterThan(first.y + first.height)

    // J/K follow the same reading order: across the row, then down.
    await page.keyboard.press('j')
    await expect(cards.nth(0)).toHaveAttribute('aria-current', 'true')
    await page.keyboard.press('j')
    await expect(cards.nth(1)).toHaveAttribute('aria-current', 'true')
    await expect(cards.nth(0)).not.toHaveAttribute('aria-current', 'true')
    await page.keyboard.press('k')
    await expect(cards.nth(0)).toHaveAttribute('aria-current', 'true')
  })
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme })

    test(`the selected card is outlined, not just tinted (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      const card = app.taskCards().first()
      const outline = () => card.evaluate((el) => getComputedStyle(el).boxShadow)
      const before = await outline()

      await page.keyboard.press('j')
      await expect(card).toHaveAttribute('aria-current', 'true')
      // The outline is drawn as a ring (a box-shadow), so the card's shadow must change and be real.
      await expect.poll(outline).not.toBe(before)
      expect(await outline()).not.toBe('none')
    })
  })
}

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })

  test('cards stack in one column without sideways scrolling', async ({ app, page }) => {
    await app.loadSampleData()
    const cards = app.taskCards()
    const first = await box(cards.nth(0))
    const second = await box(cards.nth(1))

    expect(second.y, 'the second card is below the first').toBeGreaterThan(first.y + first.height - 1)
    expect(Math.abs(second.x - first.x)).toBeLessThan(2)
    expect(await app.scrollsSideways()).toBe(false)
  })
})

test.describe('short screen, with motion', () => {
  // Most of the sample list starts below the fold, so those cards reveal on scroll.
  test.use({ viewport: { width: 1000, height: 500 }, reducedMotion: 'no-preference' })

  test('cards below the fold reveal fully as you scroll to them', async ({ app, page }) => {
    await app.loadSampleData()
    const last = app.taskCards().last()
    await last.scrollIntoViewIfNeeded()
    // Playwright counts a see-through element as visible, so check it really ends up opaque.
    await expect(last).toHaveCSS('opacity', '1')
    await expect(last).toBeInViewport()
  })
})

test.describe('with motion', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('completing a card counts at once, and unticking it again leaves it unticked', async ({ app, page }) => {
    await app.loadSampleData()
    await page.getByText(/^Show completed/).click()
    const overview = page.getByRole('region', { name: 'Overview' })
    const meter = overview.getByRole('progressbar', { name: 'Tasks completed' })
    await expect(meter).toHaveAttribute('aria-valuenow', '20')

    // The celebration plays alongside the change; it doesn't hold the task back from being done.
    await page.getByLabel('Mark "Book dentist appointment" as done').click()
    await expect(meter).toHaveAttribute('aria-valuenow', '30', { timeout: 300 })
    const untick = page.getByLabel('Mark "Book dentist appointment" as not done')
    await expect(untick).toBeChecked()

    await untick.click()
    const tick = page.getByLabel('Mark "Book dentist appointment" as done')
    await expect(tick).not.toBeChecked()
    await expect(meter).toHaveAttribute('aria-valuenow', '20')
  })
})

test('grouping by project heads each group with its name and open-task count', async ({ app, page }) => {
  await app.loadSampleData()
  await page.getByLabel('Group by').selectOption('project')

  // Open sample tasks by project: Home 3 (Pay rent, Renew car insurance, Grocery run),
  // Work 2, Health 2, and 1 with no project.
  for (const [name, count] of [['Home', 3], ['Work', 2], ['Health', 2], ['No project', 1]] as const) {
    await expect(page.getByRole('heading', { level: 2, name: new RegExp(`^${name}\\s*${count}$`) })).toBeVisible()
    await expect(app.taskCards(`${name} tasks`)).toHaveCount(count)
  }
})
