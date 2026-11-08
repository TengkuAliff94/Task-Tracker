// Keyboard users can always see where they are: every control reached with Tab shows a visible
// focus outline, on whatever panel colour it sits, in both themes.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

/** Tabs through the page from the top and names every focused control that shows no outline. */
async function controlsWithoutFocusRing(page: Page, maxStops = 80): Promise<string[]> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  const missing: string[] = []
  const seen = new Set<string>()
  for (let i = 0; i < maxStops; i++) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const s = getComputedStyle(el)
      const name = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 40) ?? ''
      return {
        id: `${el.tagName}:${name}:${el.getBoundingClientRect().top + window.scrollY}`,
        name: `${el.tagName.toLowerCase()} "${name}"`,
        visible: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2,
      }
    })
    if (!stop || seen.has(stop.id)) break // wrapped back round to the start
    seen.add(stop.id)
    if (!stop.visible) missing.push(stop.name)
  }
  return missing
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme, reducedMotion: 'reduce' })

    test(`every control on the task list shows a focus ring (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      expect(await controlsWithoutFocusRing(page)).toEqual([])
    })

    test(`every control in the task editor shows a focus ring (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      await app.taskRow('Prepare quarterly review slides').getByRole('button').click()
      await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
      expect(await controlsWithoutFocusRing(page)).toEqual([])
    })

    for (const dialog of ['Projects & tags', 'Backup & restore', 'Keyboard shortcuts']) {
      test(`every control in the ${dialog} dialog shows a focus ring (${colorScheme})`, async ({ app, page }) => {
        await app.loadSampleData()
        await page.getByRole('banner').getByRole('button', { name: dialog, exact: true }).click()
        await expect(page.getByRole('dialog', { name: dialog })).toBeVisible()
        expect(await controlsWithoutFocusRing(page)).toEqual([])
      })
    }
  })
}
