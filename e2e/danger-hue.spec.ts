// At night, overdue and danger are rose, not the brand orange (fifth critique P2, step 25): a late
// task mustn't read as a branded one, nor a destructive button as New task. Light keeps its reds.
import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

/** A token's colour as the browser resolves it, e.g. "rgb(242, 122, 143)". */
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

const channels = (c: string) => c.match(/[\d.]+/g)!.slice(0, 3).map(Number)

function linear(v: number) {
  const s = v / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = channels(c).map(linear)
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** OKLCH hue in degrees. */
function hue(c: string): number {
  const [r, g, b] = channels(c).map(linear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360
}

const hueGap = (a: string, b: string) => {
  const d = Math.abs(hue(a) - hue(b)) % 360
  return Math.min(d, 360 - d)
}

/** The card's spread-only box-shadows (rings), as their colours. */
const rings = (card: Locator) =>
  card.evaluate((el) =>
    [...getComputedStyle(el).boxShadow.matchAll(/(rgba?\([^)]*\)) 0px 0px 0px (\d+)px/g)]
      .filter((m) => m[2] !== '0')
      .map((m) => m[1]),
  )

test.describe('dark', () => {
  test.use({ colorScheme: 'dark' })

  test('the overdue ring and date are rose, well clear of the brand orange', async ({ app, page }) => {
    await app.loadSampleData()
    const [primary, bg, surface] = await Promise.all(['--primary', '--bg', '--surface'].map((t) => tokenColour(page, t)))
    const row = app.taskRow('Renew car insurance')
    const date = row.locator('[data-meta="when"][data-overdue]')
    const dateColour = await date.evaluate((e) => getComputedStyle(e).color)
    const [ring] = await rings(row.locator('xpath=ancestor-or-self::li[1]'))
    for (const [what, c] of [['date', dateColour], ['ring', ring]] as const) {
      expect(c, `${what} is drawn`).toBeTruthy()
      expect(hueGap(c, primary), `${what} sits 30° or more of hue from the brand orange`).toBeGreaterThanOrEqual(30)
      // Rose: OKLCH hue between about 350° and 20°.
      const h = hue(c)
      expect(h < 20 || h > 350, `${what} hue ${h.toFixed(1)}° is rose`).toBe(true)
    }
    expect(contrast(dateColour, surface), 'the date reads on the card').toBeGreaterThanOrEqual(4.5)
    expect(contrast(ring, bg), 'the ring reads on the canvas').toBeGreaterThanOrEqual(3)
    expect(contrast(ring, surface), 'the ring reads against the card').toBeGreaterThanOrEqual(3)
  })

  test('danger text and the solid danger button keep AA and leave the brand orange', async ({ page, app }) => {
    void app
    const [danger, hover, onDanger, primary, raised, subtle] = await Promise.all(
      ['--danger', '--danger-hover', '--on-danger', '--primary', '--raised', '--subtle'].map((t) => tokenColour(page, t)),
    )
    for (const c of [danger, hover]) {
      expect(hueGap(c, primary)).toBeGreaterThanOrEqual(30)
      expect(contrast(c, raised)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(c, subtle)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(onDanger, c), 'ink on the solid button').toBeGreaterThanOrEqual(4.5)
    }
  })
})

test.describe('light', () => {
  test.use({ colorScheme: 'light' })

  test('the day red is unchanged, and the overdue ring uses it (step 27)', async ({ page, app }) => {
    void app
    expect(await tokenColour(page, '--danger')).toBe('rgb(180, 35, 24)')
    expect(await tokenColour(page, '--alert-outline')).toBe('rgb(180, 35, 24)')
  })
})
