// The header bar: it hides while you scroll down a long list, comes back when you scroll up or
// tab into it, and keeps every action reachable by name.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

// Short enough that the sample list scrolls well past the header.
test.use({ viewport: { width: 1000, height: 500 } })

const header = (page: Page) => page.getByRole('banner')

test('scrolling down hides the header and scrolling up brings it back', async ({ app, page }) => {
  await app.loadSampleData()
  // Clicking "Load sample data" scrolled down to reach it; start from the top of the page.
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(header(page)).toBeInViewport()

  await page.mouse.wheel(0, 800)
  await expect(header(page)).not.toBeInViewport()

  await page.mouse.wheel(0, -200)
  await expect(header(page)).toBeInViewport()
})

test('tabbing into a hidden header brings it back', async ({ app, page }) => {
  await app.loadSampleData()
  await page.mouse.wheel(0, 800)
  await expect(header(page)).not.toBeInViewport()

  // Start keyboard navigation from the top of the document, so the next Tab lands on the header's
  // first button (without scrolling the page, which would bring the header back by itself).
  await page.evaluate(() => {
    ;(document.activeElement as HTMLElement | null)?.blur()
    document.body.setAttribute('tabindex', '-1')
    document.body.focus({ preventScroll: true })
    document.body.removeAttribute('tabindex')
  })
  const scrolledTo = await page.evaluate(() => window.scrollY)
  await page.keyboard.press('Tab')
  await expect(header(page).locator(':focus')).toHaveCount(1)
  await expect(header(page)).toBeInViewport({ ratio: 1 })
  // The header slides back over the page where it is; the page doesn't jump to reveal it.
  expect(await page.evaluate(() => window.scrollY)).toBe(scrolledTo)
})

const LIGHT_BG = 'rgb(244, 241, 238)'
const DARK_BG = 'rgb(11, 10, 10)'
const bodyBg = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

/** Cycles the theme from "system" (light in these tests) to light, then to dark. */
async function switchToDark(page: Page) {
  const toggle = page.getByRole('button', { name: /theme \(click to change\)$/ })
  await toggle.click() // system → light: looks the same
  await toggle.click() // light → dark
}

test('switching theme fades the colours instead of snapping', async ({ app, page }) => {
  void app // opens the app
  await switchToDark(page)
  // A few frames into the fade (it lasts about a third of a second).
  await page.waitForTimeout(60)
  const justAfter = await bodyBg(page)
  expect(justAfter, 'mid-fade, the canvas is neither light nor dark yet').not.toBe(LIGHT_BG)
  expect(justAfter).not.toBe(DARK_BG)
  await expect.poll(() => bodyBg(page)).toBe(DARK_BG)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the header hides and shows without sliding', async ({ app, page }) => {
    await app.loadSampleData()
    await page.evaluate(() => window.scrollTo(0, 0))
    const banner = header(page)

    await page.mouse.wheel(0, 800)
    await expect(banner).toHaveAttribute('data-hidden', 'true')
    // Read once, without retrying: the moment it's hidden it must already be all the way out.
    expect((await banner.boundingBox())!.y + (await banner.boundingBox())!.height).toBeLessThanOrEqual(0)

    await page.mouse.wheel(0, -200)
    await expect(banner).toHaveAttribute('data-hidden', 'false')
    expect((await banner.boundingBox())!.y).toBe(0)
  })

  test('switching theme is instant', async ({ app, page }) => {
    void app // opens the app
    await switchToDark(page)
    expect(await bodyBg(page)).toBe(DARK_BG)
  })
})

test('every header action keeps its accessible name', async ({ app, page }) => {
  void app // opens the app
  const bar = header(page)
  for (const name of ['New task', 'Trash (0)', 'Backup & restore', 'Projects & tags', 'Keyboard shortcuts']) {
    await expect(bar.getByRole('button', { name, exact: true })).toBeVisible()
  }
  await bar.getByRole('button', { name: 'Trash (0)' }).click()
  await expect(bar.getByRole('button', { name: 'Back to tasks' })).toBeVisible()
})

test.describe('phone', () => {
  test.use({ viewport: { width: 360, height: 740 } })

  for (const view of ['tasks', 'trash'] as const) {
    test(`the header fits the screen in the ${view} view`, async ({ app, page }) => {
      if (view === 'trash') await header(page).getByRole('button', { name: 'Trash (0)' }).click()
      const newTask = await header(page).getByRole('button', { name: 'New task' }).boundingBox()
      expect(newTask!.x + newTask!.width, 'New task is fully on screen').toBeLessThanOrEqual(360)
      expect(await app.scrollsSideways()).toBe(false)
    })
  }
})
