// Editor gaps from the third critique (#38): the tag field keeps a prompt, "Added" reads like
// every other date in the app, and a passed deadline reads as late.
import type { Page } from '@playwright/test'
import { expect, openMoreDetails, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

async function edit(page: Page, title: string) {
  await page.getByRole('list', { name: /tasks$/i }).getByRole('listitem').filter({ hasText: title }).locator('[data-card-edit]').click()
  return page.getByRole('dialog', { name: 'Edit task' })
}

test('the tag field still prompts once a tag is there', async ({ app, page }) => {
  await app.loadSampleData()
  const editor = await edit(page, 'Pay rent')
  await expect(editor.getByLabel('Add tag')).toHaveAttribute('placeholder', 'Add another…')
})

test('"Added" reads like the app\'s other dates, without seconds', async ({ app, page }) => {
  await app.loadSampleData()
  const editor = await edit(page, 'Pay rent')
  await expect(editor.getByText(/^Added /)).toHaveText(/^Added (Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`a passed deadline reads as late while the task is open (${colorScheme})`, async ({ app, page }) => {
    await page.emulateMedia({ colorScheme })
    await app.loadSampleData()
    const danger = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--danger').trim())
    const hex = (rgb: string) => '#' + rgb.match(/\d+/g)!.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('')

    const late = await edit(page, 'Renew car insurance')
    const readout = late.getByTestId('deadline-readout')
    await expect(readout).toHaveAttribute('data-overdue', 'true')
    expect(hex(await readout.evaluate((el) => getComputedStyle(el).color))).toBe(danger)

    // Marking it done in the editor takes the alarm away before Save.
    await openMoreDetails(late)
    await late.getByLabel('Status').selectOption('done')
    await expect(readout).not.toHaveAttribute('data-overdue')
  })
}

test('a deadline still to come keeps the quiet reading', async ({ app, page }) => {
  await app.loadSampleData()
  const editor = await edit(page, 'Pay rent')
  await expect(editor.getByTestId('deadline-readout')).not.toHaveAttribute('data-overdue')
})

test('the tag prompt is never clipped beside tags on a phone', async ({ app, page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await app.loadSampleData()
  const field = (await edit(page, 'Renew car insurance')).getByLabel('Add tag')
  await field.scrollIntoViewIfNeeded()
  // The placeholder's own width fits inside the input's content box.
  const fits = await field.evaluate((el: HTMLInputElement) => {
    const probe = document.createElement('span')
    probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${getComputedStyle(el).font}`
    probe.textContent = el.placeholder
    document.body.append(probe)
    const w = probe.getBoundingClientRect().width
    probe.remove()
    return w <= el.clientWidth
  })
  expect(fits).toBe(true)
})
