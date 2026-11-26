// Label colours keep clear of the colours that have a job (step 29, #52): a project or tag picks from
// the calm palette, never a free colour, and the sample Health project isn't red beside a red date.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const labelsDialog = (page: Page) => page.getByRole('dialog', { name: 'Projects & tags' })

async function openLabels(page: Page) {
  const header = page.getByRole('banner')
  const direct = header.getByRole('button', { name: 'Projects & tags' })
  if (await direct.isVisible()) await direct.click()
  else {
    await header.getByRole('button', { name: 'More' }).click()
    await page.getByRole('menuitem', { name: 'Projects & tags' }).click()
  }
  await expect(labelsDialog(page)).toBeVisible()
}

test('a label’s colour comes from the calm palette, picked from a radio group', async ({ app, page }) => {
  await app.loadSampleData()
  await openLabels(page)
  const dialog = labelsDialog(page)
  await expect(dialog.locator('input[type="color"]')).toHaveCount(0)

  await dialog.getByRole('button', { name: 'Color for Home' }).click()
  const group = page.getByRole('radiogroup', { name: 'Color for Home' })
  await expect(group).toBeVisible()
  await expect(group.getByRole('radio')).toHaveCount(7)
  await expect(group.getByRole('radio', { name: 'Sky' })).toBeChecked()
  await expect(group.getByRole('radio', { name: 'Sky' })).toBeFocused()

  // Arrow keys move and pick, as in any radio group; Enter closes.
  await page.keyboard.press('ArrowRight')
  await expect(group.getByRole('radio', { name: 'Blue' })).toBeFocused()
  await expect(group.getByRole('radio', { name: 'Blue' })).toBeChecked()
  await page.keyboard.press('Enter')
  await expect(group).toBeHidden()
  await expect(dialog.getByRole('button', { name: 'Color for Home' })).toBeFocused()

  // A click picks and closes too, and the card shows the new colour.
  await dialog.getByRole('button', { name: 'Color for Home' }).click()
  await group.getByRole('radio', { name: 'Fuchsia' }).click()
  await expect(group).toBeHidden()
  await expect(dialog.getByRole('button', { name: 'Color for Home' })).toHaveCSS('background-color', 'rgb(217, 70, 239)')
})

test('Esc closes the palette without changing the colour', async ({ app, page }) => {
  await app.loadSampleData()
  await openLabels(page)
  const swatch = labelsDialog(page).getByRole('button', { name: 'Color for Work' })
  await swatch.click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('radiogroup', { name: 'Color for Work' })).toBeHidden()
  await expect(labelsDialog(page)).toBeVisible()
  await expect(swatch).toHaveCSS('background-color', 'rgb(59, 130, 246)')
})

test('the sample Health project is calm, not red beside a red overdue date', async ({ app, page }) => {
  await app.loadSampleData()
  const dot = app.taskRow('Morning run').locator('span.ring-1', { hasText: '@Health' }).locator('[aria-hidden="true"]').first()
  await expect(dot).toHaveCSS('background-color', 'rgb(63, 170, 63)')
})

test('the palette closes when focus leaves it, so it never covers the next control', async ({ app, page }) => {
  await app.loadSampleData()
  await openLabels(page)
  await labelsDialog(page).getByRole('button', { name: 'Color for Home' }).click()
  const group = page.getByRole('radiogroup', { name: 'Color for Home' })
  await expect(group).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(group).toBeHidden()
  await expect(labelsDialog(page)).toBeVisible()
})

test('near the bottom of a short screen the palette opens above its swatch', async ({ app, page }) => {
  await page.setViewportSize({ width: 390, height: 640 })
  await app.loadSampleData()
  await openLabels(page)
  const swatch = labelsDialog(page).getByRole('button', { name: 'Color for reading' })
  await swatch.scrollIntoViewIfNeeded()
  await swatch.click()
  const group = page.getByRole('radiogroup', { name: 'Color for reading' })
  await expect(group).toBeVisible()
  const pop = (await group.boundingBox())!
  const sw = (await swatch.boundingBox())!
  expect(pop.y + pop.height).toBeLessThanOrEqual(640)
  if (sw.y + sw.height + 8 + pop.height > 640 - 16) expect(pop.y + pop.height).toBeLessThanOrEqual(sw.y)
})
