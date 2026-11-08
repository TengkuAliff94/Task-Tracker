// With reduced motion on, nothing should animate into place: content shows in its final state
// at once, so no count-up, reveal or exit animation can leave something hidden, partial or lingering.
import type { Locator } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

/**
 * "At once" in these checks. Long enough to absorb the IndexedDB write and re-render,
 * too short for any entrance, count-up or exit animation to finish first.
 */
const AT_ONCE = { timeout: 750 }

test('sample data shows in its final state, and completing a task hides it at once', async ({ app, page }) => {
  await app.loadSampleData()

  // Expected counts at FIXED_NOW (Tue 10 Mar, 09:00), worked out from the sample set:
  // 10 tasks, 2 done. Due today: "Reply to recruiter email" (18:00) and "Morning run" (07:00).
  // Past due: "Renew car insurance" (2 days ago) and "Morning run".
  // The Overview and the list render from the same data in one go, so the moment a row shows, the
  // numbers must already be final. Read them once, without retrying, so a count-up can't catch up first.
  const overview = page.getByRole('region', { name: 'Overview' })
  const shown = await overview.innerText()
  expect(shown).toMatch(/Open\s*8/)
  expect(shown).toMatch(/Due today\s*2/)
  expect(shown).toMatch(/Past due\s*2/)
  expect(shown).toMatch(/Completed\s*2/)
  await expect(overview.getByRole('progressbar', { name: 'Tasks completed' })).toHaveAttribute('aria-valuenow', '20', AT_ONCE)
  await expect(app.taskRow('Book dentist appointment')).toBeVisible(AT_ONCE)

  await page.getByLabel('Mark "Book dentist appointment" as done').click()
  await expect(app.taskRow('Book dentist appointment')).toBeHidden(AT_ONCE)
  expect(await overview.innerText()).toMatch(/Completed\s*3/)
  const meter = overview.getByRole('progressbar', { name: 'Tasks completed' })
  await expect(meter).toHaveAttribute('aria-valuenow', '30', AT_ONCE)
  // The bar itself, not just its value: it must already be drawn at 30%, not still filling.
  expect(await filledFraction(meter)).toBeCloseTo(0.3, 2)
})

/** How much of a progress bar is drawn filled, from 0 to 1, as it looks on screen right now. */
async function filledFraction(meter: Locator): Promise<number> {
  const track = await meter.boundingBox()
  const fill = await meter.locator(':scope > *').boundingBox()
  if (!track || !fill) throw new Error('progress bar not rendered')
  return fill.width / track.width
}

test.describe('short screen', () => {
  // Short enough that most of the sample list starts below the fold.
  test.use({ viewport: { width: 1000, height: 500 } })

  test('cards below the fold are fully shown once scrolled to', async ({ app, page }) => {
    await app.loadSampleData()
    const last = app.taskCards().last()
    await last.scrollIntoViewIfNeeded()
    // Playwright counts a see-through element as visible, so check it really is opaque.
    await expect(last).toHaveCSS('opacity', '1', AT_ONCE)
    await expect(last).toBeInViewport()
  })
})

test('cards stay put under the pointer', async ({ app }) => {
  await app.loadSampleData()
  const card = app.taskCards().first()
  await card.hover()
  // Give a hover lift time to show if there were one.
  await card.page().waitForTimeout(300)
  expect(await card.evaluate((el) => getComputedStyle(el).transform)).toBe('none')
})

test('the task editor opens and closes at once', async ({ app, page }) => {
  await app.quickAdd('Water the plants')

  await app.taskRow('Water the plants').getByRole('button').click()
  const editor = page.getByRole('dialog', { name: 'Edit task' })
  await expect(editor).toBeVisible(AT_ONCE)
  await expect(editor.getByLabel('Title')).toHaveValue('Water the plants')

  await page.keyboard.press('Escape')
  await expect(editor).toBeHidden(AT_ONCE)
  await expect(app.taskRow('Water the plants')).toBeVisible(AT_ONCE)
})
