import { describe, expect, it } from 'vitest'
import { addInterval, describeRecurrence, nextDeadline, nextInstance } from './recurrence'
import type { Task } from '../types'

describe('addInterval', () => {
  it.each([
    ['2026-11-08', { unit: 'day', interval: 1 }, '2026-11-09'],
    ['2026-12-31', { unit: 'day', interval: 1 }, '2027-01-01'],
    ['2026-11-08', { unit: 'week', interval: 2 }, '2026-11-22'],
    ['2026-11-08', { unit: 'month', interval: 1 }, '2026-12-08'],
    ['2026-01-31', { unit: 'month', interval: 1 }, '2026-02-28'],
    ['2028-01-31', { unit: 'month', interval: 1 }, '2028-02-29'],
    ['2028-02-29', { unit: 'year', interval: 1 }, '2029-02-28'],
  ] as const)('%s + %o = %s', (date, r, expected) => {
    expect(addInterval(date, r)).toBe(expected)
  })
})

describe('nextDeadline', () => {
  it('steps once when completed on time', () => {
    const now = new Date(2026, 10, 8, 9)
    expect(nextDeadline({ date: '2026-11-08', time: '17:00' }, { unit: 'day', interval: 1 }, now)).toEqual({
      date: '2026-11-09',
      time: '17:00',
    })
  })

  it('skips ahead past today when completed late', () => {
    const now = new Date(2026, 10, 8, 9)
    expect(nextDeadline({ date: '2026-11-01' }, { unit: 'day', interval: 1 }, now)).toEqual({ date: '2026-11-08' })
  })
})

it('describeRecurrence', () => {
  expect(describeRecurrence({ unit: 'week', interval: 1 })).toBe('Weekly')
  expect(describeRecurrence({ unit: 'day', interval: 3 })).toBe('Every 3 days')
})

describe('nextInstance', () => {
  const task: Task = {
    id: 'orig',
    title: 'Water plants',
    description: 'All of them',
    status: 'done',
    priority: 'high',
    projectId: 'p',
    tagIds: ['t'],
    deadline: { date: '2026-11-08', time: '18:00' },
    createdAt: 0,
    completedAt: 1,
    effortMinutes: 15,
    checklist: [{ id: 'c1', text: 'Balcony', done: true }],
    reminders: [
      { id: 'r1', kind: 'relative', minutesBefore: 60 },
      { id: 'r2', kind: 'absolute', at: new Date(2026, 10, 8, 8).getTime() },
    ],
    recurrence: { unit: 'week', interval: 1 },
  }

  it('copies fields, resets checklist and shifts reminders', () => {
    const now = new Date(2026, 10, 8, 18, 30)
    const next = nextInstance(task, now)
    expect(next).toMatchObject({
      title: 'Water plants',
      description: 'All of them',
      status: 'todo',
      priority: 'high',
      projectId: 'p',
      tagIds: ['t'],
      deadline: { date: '2026-11-15', time: '18:00' },
      createdAt: now.getTime(),
      effortMinutes: 15,
      checklist: [{ text: 'Balcony', done: false }],
      recurrence: { unit: 'week', interval: 1 },
    })
    expect(next.id).not.toBe('orig')
    expect(next.completedAt).toBeUndefined()
    expect(next.reminders[0]).toMatchObject({ kind: 'relative', minutesBefore: 60 })
    expect(next.reminders[1]).toMatchObject({ kind: 'absolute', at: new Date(2026, 10, 15, 8).getTime() })
  })
})
