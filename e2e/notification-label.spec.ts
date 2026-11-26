import { expect, test } from '@playwright/test'

/** Fakes Notification.permission before the app reads it. */
function permission(page: import('@playwright/test').Page, value: NotificationPermission) {
  return page.addInitScript((v) => Object.defineProperty(Notification, 'permission', { get: () => v }), value)
}

const words = (el: import('@playwright/test').Locator) => el.evaluate((b) => (b as HTMLElement).innerText.trim())

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('once notifications are blocked the bell is a bare glyph, square like the other icons', async ({ page }) => {
    await permission(page, 'denied')
    await page.goto('/')
    const bell = page.getByRole('button', { name: 'Notifications blocked' })
    await expect(bell).toBeVisible()
    expect(await words(bell)).toBe('')
    const box = (await bell.boundingBox())!
    expect(Math.abs(box.width - box.height)).toBeLessThan(1)
    await expect(bell).toHaveAttribute('title', 'Notifications blocked')
  })

  test('the ask reads "Turn on reminders"', async ({ page }) => {
    await permission(page, 'default')
    await page.goto('/')
    const ask = page.getByRole('button', { name: 'Turn on reminders' })
    await expect(ask).toBeVisible()
    expect(await words(ask)).toBe('Turn on reminders')
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the ask keeps its name when its words are hidden', async ({ page }) => {
    await permission(page, 'default')
    await page.goto('/')
    const ask = page.getByRole('button', { name: 'Turn on reminders' })
    await expect(ask).toBeVisible()
    expect(await words(ask)).toBe('')
  })
})
