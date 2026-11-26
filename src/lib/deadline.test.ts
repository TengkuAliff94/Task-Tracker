import { describe, expect, it } from 'vitest'
import { describeDeadline, formatDate, formatDateTime, formatDeadline, isOverdue, movedDeadline } from './deadline'

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

describe('describeDeadline', () => {
  const now = at(2026, 11, 8, 10)

  it('spells out the weekday, DD/MM/YYYY and the 24-hour time, then how soon', () => {
    expect(describeDeadline({ date: '2026-11-09', time: '17:30' }, now)).toBe('Mon 09/11/2026, 17:30 · Tomorrow')
  })

  it('leaves out the time when there is none, and the relative day when it is over a week away', () => {
    expect(describeDeadline({ date: '2026-12-25' }, now)).toBe('Fri 25/12/2026')
  })
})

describe('formatDateTime', () => {
  it('uses DD/MM/YYYY and a 24-hour clock', () => {
    expect(formatDateTime(at(2026, 3, 5, 7, 5))).toBe('Thu 05/03/2026, 07:05')
    expect(formatDateTime(at(2026, 3, 5, 19, 45))).toBe('Thu 05/03/2026, 19:45')
  })
})

describe('movedDeadline (#53)', () => {
  const now = new Date(2026, 2, 31, 22, 15) // Tue 31 Mar, late evening

  it('moves to a day after today, keeping the time of day', () => {
    expect(movedDeadline({ date: '2026-03-20', time: '07:00' }, 1, now)).toEqual({ date: '2026-04-01', time: '07:00' })
    expect(movedDeadline({ date: '2026-03-20', time: '07:00' }, 7, now)).toEqual({ date: '2026-04-07', time: '07:00' })
  })

  it('leaves a date-only deadline date-only, and gives a task with none a date', () => {
    expect(movedDeadline({ date: '2026-03-20' }, 1, now)).toEqual({ date: '2026-04-01' })
    expect(movedDeadline(undefined, 1, now)).toEqual({ date: '2026-04-01' })
  })
})
