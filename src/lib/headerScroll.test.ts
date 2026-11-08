import { describe, expect, it } from 'vitest'
import { nextHeaderVisibility } from './headerScroll'

// The header is 72px tall in these examples; "near the top" means within that.
const step = (anchorY: number, y: number, hidden = false) => nextHeaderVisibility({ anchorY, y, hidden, topZone: 72 })

describe('nextHeaderVisibility', () => {
  it('hides when scrolling down past the top', () => {
    expect(step(200, 260).hidden).toBe(true)
  })

  it('shows again when scrolling up', () => {
    expect(step(600, 540, true).hidden).toBe(false)
  })

  it('stays visible near the top of the page, even scrolling down', () => {
    expect(step(10, 60).hidden).toBe(false)
    expect(step(40, 70, true).hidden).toBe(false)
  })

  it('ignores tiny jitters either way', () => {
    expect(step(400, 402, false).hidden).toBe(false)
    expect(step(400, 398, true).hidden).toBe(true)
  })

  it('adds up a slow scroll made of tiny steps', () => {
    let state = { anchorY: 400, hidden: false }
    for (const y of [401, 402, 403, 404, 405]) state = step(state.anchorY, y, state.hidden)
    expect(state.hidden).toBe(true)
  })

  it('shows at the very top after an overscroll bounce', () => {
    expect(step(0, -20, true).hidden).toBe(false)
  })
})
