// Touch screens never show a `title` tooltip, so a bare header glyph has no name you can see there
// (fifth critique P3, step 26). On a screen without hover the header keeps the phone pattern below
// `lg` (bell, Trash with its word, and a labelled More menu), and from `lg` Theme carries its word.
// With a mouse the header is unchanged.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const header = (page: Page) => page.getByRole('banner')

/** The header's visible buttons, other than the bell, with the words each one shows. */
const visibleButtons = (page: Page) =>
  header(page)
    .getByRole('button')
    .evaluateAll((els) =>
      els
        .filter((el) => {
          const box = el.getBoundingClientRect()
          return box.width > 0 && getComputedStyle(el).visibility !== 'hidden'
        })
        .map((el) => ({ name: el.getAttribute('aria-label') ?? el.textContent!.trim(), words: (el as HTMLElement).innerText.trim() }))
        .filter((b) => !/notifications/i.test(b.name)),
    )

const noSidewaysScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true })

  test('the emulated screen has no hover', async ({ page, app }) => {
    void app
    expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true)
  })

  for (const width of [640, 768, 1023]) {
    test(`at ${width}px every header button shows a word, and More holds the rest`, async ({ app, page }) => {
      await page.setViewportSize({ width, height: 800 })
      await app.loadSampleData()
      const buttons = await visibleButtons(page)
      expect(buttons.map((b) => b.name)).toEqual(['Trash (0)', 'More', 'New task'])
      for (const b of buttons) expect(b.words, `${b.name} shows a word`).not.toBe('')
      await header(page).getByRole('button', { name: 'More' }).click()
      for (const item of ['Projects & tags', 'Backup & restore']) await expect(page.getByRole('menuitem', { name: item })).toBeVisible()
      await expect(page.getByRole('menuitemradio', { name: 'Dark' })).toBeVisible()
      await page.keyboard.press('Escape')
      expect(await noSidewaysScroll(page)).toBe(true)
    })
  }

  test('at 1280px Theme shows its word and the shortcuts button stands aside', async ({ app, page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await app.loadSampleData()
    const buttons = await visibleButtons(page)
    expect(buttons.map((b) => b.name)).toEqual(['Projects & tags', 'Backup & restore', 'Trash (0)', 'Theme: System', 'New task'])
    for (const b of buttons) expect(b.words, `${b.name} shows a word`).not.toBe('')
    expect(await header(page).getByRole('button', { name: 'Theme: System' }).evaluate((el) => (el as HTMLElement).innerText.trim())).toBe('Theme')
    expect(await noSidewaysScroll(page)).toBe(true)
  })
})

test.describe('with a mouse', () => {
  for (const [width, names] of [
    [640, ['Projects & tags', 'Backup & restore', 'Trash (0)', 'Theme: System', 'Keyboard shortcuts', 'New task']],
    [1280, ['Projects & tags', 'Backup & restore', 'Trash (0)', 'Theme: System', 'Keyboard shortcuts', 'New task']],
  ] as const) {
    test(`at ${width}px the header is as before`, async ({ app, page }) => {
      await page.setViewportSize({ width, height: 800 })
      await app.loadSampleData()
      expect((await visibleButtons(page)).map((b) => b.name)).toEqual(names)
      // Theme stays a bare glyph with a tooltip where a pointer can hover.
      expect(await header(page).getByRole('button', { name: 'Theme: System' }).evaluate((el) => (el as HTMLElement).innerText.trim())).toBe('')
    })
  }
})
