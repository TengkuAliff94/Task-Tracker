// Quick-add help: the grammar is findable without reading a placeholder. The first-run empty state
// offers the example to try (it fills the bar, so the preview shows what each token became), the
// bar's ? button opens the syntax, and the shortcuts sheet lists it too.
import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'

const EXAMPLE = 'Pay rent #finance @home !high ~30m tomorrow 5pm'

const helpButton = (page: Page) => page.getByRole('button', { name: 'Quick add syntax' })
const helpPopover = (page: Page) => page.locator('[popover]').filter({ has: page.getByRole('heading', { name: 'Quick add syntax' }) })

/** Every kind of token is named, with the forms the parser reads. */
async function expectSyntax(where: Locator) {
  for (const name of ['Tag.', 'Project.', 'Priority.', 'Effort.', 'Deadline.']) await expect(where.getByText(name, { exact: true })).toBeVisible()
  for (const token of ['#finance', '@home', '!high', '!urgent', '~30m', '~1h30m', 'fri 5pm', 'tomorrow', '25/12 17:30'])
    await expect(where.getByText(token, { exact: true })).toBeVisible()
  await expect(where).toContainText('Day first.')
  await expect(where).toContainText('The rest of the line is the title.')
}

test('the empty state’s Try fills quick add without saving, and Enter adds the task', async ({ app, page }) => {
  const tryIt = page.getByRole('button', { name: `Try: ${EXAMPLE}` })
  await tryIt.click()

  await expect(app.quickAddInput).toHaveValue(EXAMPLE)
  await expect(app.quickAddInput).toBeFocused()
  // The caret is at the end, so typing carries on the line.
  expect(await app.quickAddInput.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd])).toEqual([EXAMPLE.length, EXAMPLE.length])
  const preview = app.quickAddPreview
  await expect(preview.getByText('#finance', { exact: true })).toBeVisible()
  await expect(preview.getByText('@home', { exact: true })).toBeVisible()
  await expect(preview.getByText('High', { exact: true })).toBeVisible()
  await expect(preview.getByText('Tomorrow 17:00', { exact: true })).toBeVisible()
  // Nothing saved yet.
  await expect(page.getByText('No tasks yet')).toBeVisible()

  await app.quickAddInput.press('Enter')
  await expect(app.taskRow('Pay rent')).toBeVisible()
  await expect(tryIt).toBeHidden()
})

test('the ? in quick add opens the syntax, and Esc closes it back onto the button', async ({ app, page }) => {
  await helpButton(page).click()
  const popover = helpPopover(page)
  await expect(popover).toBeVisible()
  await expectSyntax(popover)

  // While it's open the page's shortcuts stand aside: Esc closes it and N doesn't jump to quick add.
  await page.keyboard.press('n')
  await expect(app.quickAddInput).not.toBeFocused()
  await page.keyboard.press('Escape')
  await expect(popover).toBeHidden()
  await expect(helpButton(page)).toBeFocused()
})

test('the ? is reachable by Tab straight after the quick-add field', async ({ app, page }) => {
  await app.quickAddInput.focus()
  await page.keyboard.press('Tab')
  await expect(helpButton(page)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(helpPopover(page)).toBeVisible()
})

test('the keyboard shortcuts sheet lists the quick-add syntax', async ({ app, page }) => {
  await page.keyboard.press('?')
  const sheet = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
  await expect(sheet.getByRole('heading', { name: 'Quick add syntax' })).toBeVisible()
  await expectSyntax(sheet)
  void app
})

for (const width of [320, 390, 1280]) {
  test(`at ${width}px the ? sits inside the bar, clear of the text, and the syntax keeps the 16px gutter`, async ({ app, page }) => {
    await page.setViewportSize({ width, height: 800 })
    await app.quickAddInput.fill('A long task title that runs right across the quick add bar and beyond')
    const button = await helpButton(page).boundingBox()
    const input = await app.quickAddInput.boundingBox()
    const padRight = await app.quickAddInput.evaluate((el) => parseFloat(getComputedStyle(el).paddingRight))
    expect(button && input).toBeTruthy()
    // Inside the bar, and the text stops before it.
    expect(button!.x + button!.width).toBeLessThanOrEqual(input!.x + input!.width)
    expect(input!.x + input!.width - padRight).toBeLessThanOrEqual(button!.x)
    expect(button!.width).toBeGreaterThanOrEqual(24)

    await helpButton(page).click()
    const box = await helpPopover(page).boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(16)
    expect(box!.x + box!.width).toBeLessThanOrEqual(width - 16)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}

test.describe('the example placeholder', () => {
  // Settled, so the panel isn't measured mid-entrance.
  test.use({ reducedMotion: 'reduce' })
  for (const width of [640, 768, 1024]) {
  test(`at ${width}px it fits beside the ? and the N key`, async ({ app, page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.evaluate(() => document.fonts.ready)
    const room = await app.quickAddInput.evaluate((el: HTMLInputElement) => {
      const style = getComputedStyle(el)
      const ctx = document.createElement('canvas').getContext('2d')!
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      const content = el.getBoundingClientRect().width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      return content - ctx.measureText(el.placeholder).width
    })
    expect(room).toBeGreaterThan(0)
  })
  }
})
