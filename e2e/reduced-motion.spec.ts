// With reduced motion on, nothing should animate into place: content shows in its final state
// at once, so no count-up, reveal or exit animation can leave something hidden, partial or lingering.
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
  await expect(overview.getByRole('progressbar', { name: 'Tasks completed' })).toHaveAttribute('aria-valuenow', '30', AT_ONCE)
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
