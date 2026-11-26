import { describe, expect, it } from 'vitest'
import { asideFitsNarrow, urgencyAside, urgencyLine } from './HeadingPanel'

describe('the heading urgency', () => {
  it('leads with the most urgent', () => {
    expect(urgencyLine({ overdue: 2, dueToday: 1, open: 8 })).toBe('2 overdue')
    expect(urgencyLine({ overdue: 0, dueToday: 1, open: 8 })).toBe('1 due today')
    expect(urgencyLine({ overdue: 0, dueToday: 0, open: 8 })).toBe('On track')
    expect(urgencyLine({ overdue: 0, dueToday: 0, open: 0 })).toBe('All done')
  })

  it('adds what is due today on phones only when something is overdue too', () => {
    expect(urgencyAside({ overdue: 2, dueToday: 1, open: 8 })).toBe('· 1 today')
    expect(urgencyAside({ overdue: 2, dueToday: 0, open: 8 })).toBeNull()
    // "1 due today" already says it.
    expect(urgencyAside({ overdue: 0, dueToday: 1, open: 8 })).toBeNull()
  })

  it('keeps the aside off the narrowest phones once a count reaches two digits', () => {
    expect(asideFitsNarrow({ overdue: 9, dueToday: 9, open: 20 })).toBe(true)
    expect(asideFitsNarrow({ overdue: 12, dueToday: 1, open: 20 })).toBe(false)
    expect(asideFitsNarrow({ overdue: 2, dueToday: 10, open: 20 })).toBe(false)
  })
})
