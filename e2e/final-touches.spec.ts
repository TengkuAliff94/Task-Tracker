// The fourth critique's P3 and minor findings (#44).
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

async function tokenColour(page: Page, name: string) {
  return page.evaluate((v) => {
    const probe = document.createElement('span')
    probe.style.color = getComputedStyle(document.documentElement).getPropertyValue(v)
    document.body.append(probe)
    const out = getComputedStyle(probe).color
    probe.remove()
    return out
  }, name)
}

test('opening More details at 1280×900 brings its fields into view', async ({ app, page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await app.loadSampleData()
  await app.taskRow('Prepare quarterly review slides').locator('[data-card-edit]').click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('[data-details-toggle]').click()
  // Status, the first field behind it, and the start of Reminders are on screen without scrolling by hand.
  await expect(dialog.getByLabel('Status')).toBeInViewport({ ratio: 1 })
  await expect(dialog.getByText('Reminders', { exact: true })).toBeInViewport({ ratio: 1 })
})

test('Delete moves the selected task to Trash, with Undo', async ({ app, page }) => {
  await app.loadSampleData()
  await page.keyboard.press('j')
  const selected = page.locator('li[aria-current]')
  const title = (await selected.locator('[data-card-edit] > div').first().textContent())!.trim()
  await page.keyboard.press('Delete')
  const toast = page.getByRole('status').filter({ hasText: 'moved to Trash' })
  await expect(toast).toContainText(title)
  await expect(app.taskRow(title)).toHaveCount(0)
  await toast.getByRole('button', { name: 'Undo' }).click()
  await expect(app.taskRow(title)).toHaveCount(1)
})

test('Delete typed in the search field stays in the field', async ({ app, page }) => {
  await app.loadSampleData()
  await page.keyboard.press('j')
  await page.locator('#search').fill('rent')
  await page.locator('#search').press('Home')
  await page.locator('#search').press('Delete')
  await expect(page.locator('#search')).toHaveValue('ent')
  await expect(page.getByRole('status').filter({ hasText: 'moved to Trash' })).toHaveCount(0)
})

test('the shortcuts sheet lists Delete', async ({ app, page }) => {
  await app.loadSampleData()
  await page.keyboard.press('?')
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toContainText('Move selected task to Trash')
})

test('a toast balances its lines, so no word is left alone at the end', async ({ app, page }) => {
  await app.loadSampleData()
  await page.keyboard.press('j')
  await page.keyboard.press('Delete')
  const message = page.getByRole('status').filter({ hasText: 'moved to Trash' }).locator('p').first()
  expect(await message.evaluate((el) => getComputedStyle(el).textWrapStyle)).toBe('pretty')
})

test('restoring from Trash says so', async ({ app, page }) => {
  await app.loadSampleData()
  await app.taskRow('Pay rent').locator('[data-card-edit]').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: /^Trash/ }).first().click()
  await page.getByRole('button', { name: 'Restore "Pay rent"' }).click()
  await expect(page.getByRole('status').filter({ hasText: '“Pay rent” restored' })).toBeVisible()
})

test('Projects & tags spells each name with its sigil', async ({ app, page }) => {
  await app.loadSampleData()
  await page.getByRole('button', { name: 'Projects & tags' }).click()
  const dialog = page.getByRole('dialog', { name: 'Projects & tags' })
  const home = dialog.locator('li').filter({ has: page.getByLabel('Name of Home') })
  const errand = dialog.locator('li').filter({ has: page.getByLabel('Name of errand') })
  await expect(home.locator('[data-sigil]')).toHaveText('@')
  await expect(errand.locator('[data-sigil]')).toHaveText('#')
  // The sigil sits inside the well, just before the name.
  const [sigil, field] = await Promise.all([home.locator('[data-sigil]').boundingBox(), page.getByLabel('Name of Home').boundingBox()])
  expect(sigil!.x).toBeGreaterThan(field!.x)
  expect(sigil!.x).toBeLessThan(field!.x + 24)
  // Against the name, as #finance and @Home are spelt elsewhere: no drawn gap between sigil and text.
  for (const [row, name] of [[home, 'Home'], [errand, 'errand']] as const) {
    const gap = await row.evaluate((li, n) => {
      const s = li.querySelector('[data-sigil]')!.getBoundingClientRect()
      const input = li.querySelector<HTMLInputElement>(`[aria-label="Name of ${n}"]`)!
      return input.getBoundingClientRect().left + parseFloat(getComputedStyle(input).paddingLeft) - s.right
    }, name)
    expect(gap, name).toBeGreaterThanOrEqual(0)
    expect(gap, name).toBeLessThanOrEqual(1.5)
  }
})

test('the checklist bar fills in the done sage, on a track that reads as a meter', async ({ app, page }) => {
  await app.loadSampleData()
  await app.taskRow('Grocery run').locator('[data-card-edit]').click()
  const dialog = page.getByRole('dialog')
  const bar = dialog.locator('[data-checklist-bar]')
  const fill = bar.locator('div')
  expect(await fill.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColour(page, '--done-edge'))
  expect((await bar.boundingBox())!.height).toBeGreaterThanOrEqual(6)
})
