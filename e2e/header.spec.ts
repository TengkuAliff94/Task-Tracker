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

/** Picks Dark from the header's theme menu (System, light in these tests, until then). */
async function switchToDark(page: Page) {
  await header(page).getByRole('button', { name: 'Theme: System' }).click()
  await page.getByRole('menuitemradio', { name: 'Dark' }).click()
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
  // A new task wouldn't show in Trash, so the button that makes one isn't offered there; it keeps its
  // space, so the Trash button doesn't move out from under the pointer.
  const trashButton = bar.getByRole('button', { name: /^Trash \(/ })
  await expect(bar.getByRole('button', { name: 'New task' })).toBeHidden()
  const inTrash = (await trashButton.boundingBox())!
  await trashButton.click()
  await expect(bar.getByRole('button', { name: 'New task' })).toBeVisible()
  expect((await trashButton.boundingBox())!.x).toBe(inTrash.x)
})

test.describe('phone', () => {
  test.use({ viewport: { width: 360, height: 740 } })

  for (const view of ['tasks', 'trash'] as const) {
    test(`the header fits the screen in the ${view} view`, async ({ app, page }) => {
      if (view === 'trash') await header(page).getByRole('button', { name: 'Trash (0)' }).click()
      for (const button of await header(page).getByRole('button').all()) {
        if (!(await button.isVisible())) continue
        const box = (await button.boundingBox())!
        expect(box.x + box.width, `${await button.getAttribute('aria-label')} is fully on screen`).toBeLessThanOrEqual(360)
      }
      expect(await app.scrollsSideways()).toBe(false)
    })
  }
})

test.describe('labels', () => {
  /** The words a header button shows, as opposed to its accessible name. */
  const shownText = (page: Page, name: string) =>
    header(page).getByRole('button', { name, exact: true }).evaluate((el) => (el as HTMLElement).innerText.trim())

  test('Backup and Trash say what they are from md, and Projects & tags from lg', async ({ app, page }) => {
    await app.quickAdd('Old errand')
    await app.taskRow('Old errand').getByRole('button').click()
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()

    await page.setViewportSize({ width: 700, height: 600 })
    expect(await shownText(page, 'Backup & restore')).toBe('')
    expect(await shownText(page, 'Trash (1)')).toBe('1')

    await page.setViewportSize({ width: 800, height: 600 })
    expect(await shownText(page, 'Backup & restore')).toBe('Backup')
    expect(await shownText(page, 'Trash (1)')).toMatch(/^Trash\s*1$/)
    expect(await shownText(page, 'Projects & tags')).toBe('')

    await page.setViewportSize({ width: 1100, height: 600 })
    expect(await shownText(page, 'Projects & tags')).toBe('Projects & tags')
    expect(await app.scrollsSideways()).toBe(false)
  })
})

test.describe('theme menu', () => {
  test('names the choice, offers all three, and shows the pick', async ({ app, page }) => {
    void app // opens the app
    const button = header(page).getByRole('button', { name: 'Theme: System' })
    await expect(button).toHaveAttribute('aria-haspopup', 'menu')
    await button.click()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    const menu = page.getByRole('menu', { name: 'Theme: System' })
    await expect(menu.getByRole('menuitemradio')).toHaveText(['System', 'Light', 'Dark'])
    await expect(menu.getByRole('menuitemradio', { name: 'System' })).toHaveAttribute('aria-checked', 'true')

    await menu.getByRole('menuitemradio', { name: 'Dark' }).click()
    await expect(page.getByRole('menu')).toBeHidden()
    await expect.poll(() => bodyBg(page)).toBe(DARK_BG)
    const renamed = header(page).getByRole('button', { name: 'Theme: Dark' })
    await expect(renamed).toBeFocused()
    await renamed.click()
    await expect(page.getByRole('menuitemradio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true')
  })

  test('works from the keyboard', async ({ app, page }) => {
    void app // opens the app
    const button = header(page).getByRole('button', { name: 'Theme: System' })
    const item = (name: string) => page.getByRole('menuitemradio', { name })
    await button.focus()
    await page.keyboard.press('Enter')
    // Opens on the current choice.
    await expect(item('System')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(item('Light')).toBeFocused()
    await page.keyboard.press('End')
    await expect(item('Dark')).toBeFocused()
    await page.keyboard.press('ArrowDown') // wraps round
    await expect(item('System')).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(item('Dark')).toBeFocused()
    await page.keyboard.press('Home')
    await expect(item('System')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toBeHidden()
    await expect(button).toBeFocused()
    await expect(button).toHaveAttribute('aria-expanded', 'false')

    // Tab closes it, with focus back on its button.
    await page.keyboard.press('Enter')
    await expect(item('System')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('menu')).toBeHidden()
    await expect(button).toBeFocused()

    // Shortcuts stand aside while it's open: N opens nothing.
    await page.keyboard.press('Enter')
    await expect(item('System')).toBeFocused()
    await page.keyboard.press('n')
    await expect(page.getByRole('dialog', { name: 'New task' })).toBeHidden()
  })

  test('keeps the header on screen while open, even scrolled down', async ({ app, page }) => {
    await app.loadSampleData()
    await page.mouse.wheel(0, 800)
    await expect(header(page)).not.toBeInViewport()
    const button = header(page).getByRole('button', { name: 'Theme: System' })
    await button.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menuitemradio', { name: 'System' })).toBeFocused()
    await page.mouse.wheel(0, 300)
    await expect(header(page)).toBeInViewport({ ratio: 1 })
    // The menu hangs just under its button, lined up with its right edge.
    const anchor = (await button.boundingBox())!
    const menu = (await page.getByRole('menu').boundingBox())!
    expect(menu.y).toBeGreaterThanOrEqual(anchor.y + anchor.height)
    expect(menu.y).toBeLessThanOrEqual(anchor.y + anchor.height + 12)
    expect(Math.abs(menu.x + menu.width - (anchor.x + anchor.width))).toBeLessThanOrEqual(1)
  })
})

test.describe('phone More menu', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('holds Projects & tags, Backup & restore and the theme, each with words', async ({ app, page }) => {
    void app // opens the app
    // Only the bell, Trash, More and New task stay in the bar.
    for (const name of ['Projects & tags', 'Backup & restore', 'Keyboard shortcuts']) {
      await expect(header(page).getByRole('button', { name, exact: true })).toBeHidden()
    }
    await expect(header(page).getByRole('button', { name: /^Theme:/ })).toBeHidden()

    const more = header(page).getByRole('button', { name: 'More' })
    await expect(more).toHaveText('More')
    await more.click()
    const menu = page.getByRole('menu', { name: 'More' })
    await expect(menu.getByRole('menuitem')).toHaveText(['Projects & tags', 'Backup & restore'])
    await expect(menu.getByRole('group', { name: 'Theme' }).getByRole('menuitemradio')).toHaveText(['System', 'Light', 'Dark'])
    // Every item takes a comfortable tap.
    for (const item of await menu.locator('[role^="menuitem"]').all()) {
      expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(40)
    }
    expect(await app.scrollsSideways()).toBe(false)
  })

  test('opens Backup & restore, and closing it returns focus to More', async ({ app, page }) => {
    void app // opens the app
    const more = header(page).getByRole('button', { name: 'More' })
    await more.click()
    await page.getByRole('menuitem', { name: 'Backup & restore' }).click()
    const dialog = page.getByRole('dialog', { name: 'Backup & restore' })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('menu')).toBeHidden()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(more).toBeFocused()
  })

  test('switches the theme', async ({ app, page }) => {
    void app // opens the app
    await header(page).getByRole('button', { name: 'More' }).click()
    await page.getByRole('menuitemradio', { name: 'Dark' }).click()
    await expect.poll(() => bodyBg(page)).toBe(DARK_BG)
  })
})
