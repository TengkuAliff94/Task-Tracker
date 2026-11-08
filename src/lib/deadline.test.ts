import { describe, expect, it } from 'vitest'
import { formatDate, formatDeadline, isOverdue } from './deadline'

const at = (y: number, m: number, d: number, hh = 0, mm = 0) => new Date(y, m - 1, d, hh, mm)

describe('isOverdue', () => {
  it('is false without a deadline', () => {
    expect(isOverdue({ status: 'todo' }, at(2026, 11, 8))).toBe(false)
  })

  it('treats a date-only deadline as due at the end of that day', () => {
    const task = { status: 'todo' as const, deadline: { date: '2026-11-08' } }
    expect(isOverdue(task, at(2026, 11, 8, 23, 59))).toBe(false)
    expect(isOverdue(task, at(2026, 11, 9, 0, 0))).toBe(true)
  })

  it('uses the exact time when one is set', () => {
    const task = { status: 'in_progress' as const, deadline: { date: '2026-11-08', time: '17:00' } }
    expect(isOverdue(task, at(2026, 11, 8, 16, 59))).toBe(false)
    expect(isOverdue(task, at(2026, 11, 8, 17, 0))).toBe(true)
  })

  it('is never overdue once done', () => {
    expect(isOverdue({ status: 'done', deadline: { date: '2020-01-01' } }, at(2026, 11, 8))).toBe(false)
  })
})

describe('formatDeadline', () => {
  const now = at(2026, 11, 8, 10)
  it.each([
    ['2026-11-08', 'Today'],
    ['2026-11-09', 'Tomorrow'],
    ['2026-11-07', 'Yesterday'],
    ['2026-11-11', 'In 3 days'],
    ['2026-11-06', '2 days ago'],
    ['2026-12-25', '25/12/2026'],
  ])('%s -> %s', (date, label) => {
    expect(formatDeadline({ date }, now)).toBe(label)
  })

  it('appends the time in 24h format', () => {
    expect(formatDeadline({ date: '2026-11-09', time: '17:30' }, now)).toBe('Tomorrow 17:30')
  })

  it('formatDate uses DD/MM/YYYY', () => {
    expect(formatDate({ date: '2026-01-05' })).toBe('05/01/2026')
  })
})
