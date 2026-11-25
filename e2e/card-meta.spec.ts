// The card's metadata row has a hierarchy (fifth critique P2, step 24): when → what → labels,
// counts last. Overdue is said once (the ring and the red date, no badge), Medium (the default)
// isn't drawn, and tags stop at three with a "+N" for the rest.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

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

const RANK = { when: 0, what: 1, label: 2, count: 3 } as const

test('an overdue card says so with its ring and red date, not a badge', async ({ app, page }) => {
  await app.loadSampleData()
  const row = app.taskRow('Renew car insurance')
  await expect(row.getByText('Overdue', { exact: true })).toBeHidden()
  const date = row.locator('[data-meta="when"][data-overdue]')
  await expect(date).toHaveCount(1)
  expect(await date.evaluate((e) => getComputedStyle(e).color)).toBe(await tokenColour(page, '--danger'))
  // Not colour alone: assistive tech hears the word, and the tooltip names it too.
  await expect(row.locator('[data-card-edit]')).toHaveAccessibleName(/Overdue, due 2 days ago/)
  await expect(date).toHaveAttribute('title', 'Overdue')
  // A task that isn't late keeps the plain date.
  await expect(app.taskRow('Pay rent').locator('[data-meta="when"][data-overdue]')).toHaveCount(0)
})

test('Medium, the default, is not drawn; the other priorities are', async ({ app }) => {
  await app.loadSampleData()
  await expect(app.taskRow('Grocery run').locator('[data-priority]')).toHaveCount(0)
  await expect(app.taskRow('Reply to recruiter email').locator('[data-priority="low"]')).toHaveCount(1)
  await expect(app.taskRow('Pay rent').locator('[data-priority="high"]')).toHaveCount(1)
  await expect(app.taskRow('Renew car insurance').locator('[data-priority="urgent"]')).toHaveCount(1)
})

test('every card reads when, then what, then labels, then counts', async ({ app, page }) => {
  await app.loadSampleData()
  const rows = page.locator('[data-task-id]')
  const n = await rows.count()
  expect(n).toBeGreaterThan(5)
  let sawCount = false
  for (let i = 0; i < n; i++) {
    const kinds = await rows.nth(i).locator('[data-meta]').evaluateAll((els) => els.map((e) => e.getAttribute('data-meta')))
    const ranks = kinds.map((k) => RANK[k as keyof typeof RANK])
    expect(ranks, `card ${i}: ${kinds.join(' → ')}`).toEqual([...ranks].sort((a, b) => a - b))
    if (kinds.includes('count')) sawCount = true
  }
  expect(sawCount, 'the sample set has a card with counts').toBe(true)
})

test('counts are quiet: muted, regular weight, after the labels', async ({ app, page }) => {
  await app.quickAdd('Plan trip #travel ~30m')
  const count = app.taskRow('Plan trip').locator('[data-meta="count"]')
  await expect(count).toHaveCount(1)
  const style = await count.evaluate((e) => ({ color: getComputedStyle(e).color, weight: getComputedStyle(e).fontWeight }))
  expect(style.color).toBe(await tokenColour(page, '--muted'))
  expect(Number(style.weight)).toBeLessThan(500)
})

test('tags stop at three, with +N naming the rest', async ({ app }) => {
  await app.quickAdd('Many tags #one #two #three #four #five')
  const row = app.taskRow('Many tags')
  await expect(row.locator('[data-meta="label"][data-tag]')).toHaveCount(3)
  const more = row.locator('[data-tag-more]')
  await expect(more).toHaveText(/\+2/)
  await expect(more).toHaveAttribute('title', '#four, #five')
  await expect(row.locator('[data-card-edit]')).toHaveAccessibleName(/2 more tags: #four, #five/)
})

test('three tags show in full, with no +N', async ({ app }) => {
  await app.quickAdd('Three tags #one #two #three')
  const row = app.taskRow('Three tags')
  await expect(row.locator('[data-meta="label"][data-tag]')).toHaveCount(3)
  await expect(row.locator('[data-tag-more]')).toHaveCount(0)
})
