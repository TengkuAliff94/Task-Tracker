import { describe, expect, it } from 'vitest'
import { dueReminders, reminderTime } from './reminders'
import type { Task } from '../types'

const task = (id: string, extra: Partial<Task> = {}): Task => ({
  id,
  title: id,
  description: '',
  status: 'todo',
  priority: 'medium',
  tagIds: [],
  checklist: [],
  reminders: [],
  createdAt: 0,
  ...extra,
})

const T = (h: number, m = 0) => new Date(2026, 10, 8, h, m).getTime()

describe('reminderTime', () => {
  it('uses the timestamp for absolute reminders', () => {
    expect(reminderTime({ id: 'r', kind: 'absolute', at: 123 }, {})).toBe(123)
  })
  it('counts back from the deadline for relative reminders', () => {
    expect(reminderTime({ id: 'r', kind: 'relative', minutesBefore: 60 }, { deadline: { date: '2026-11-08', time: '17:00' } })).toBe(T(16))
  })
  it('is undefined for a relative reminder without a deadline', () => {
    expect(reminderTime({ id: 'r', kind: 'relative', minutesBefore: 60 }, {})).toBeUndefined()
  })
})

describe('dueReminders', () => {
  const tasks = [
    task('a', { deadline: { date: '2026-11-08', time: '17:00' }, reminders: [{ id: 'a1', kind: 'relative', minutesBefore: 60 }] }),
    task('b', { reminders: [{ id: 'b1', kind: 'absolute', at: T(15) }, { id: 'b2', kind: 'absolute', at: T(20) }] }),
    task('done', { status: 'done', reminders: [{ id: 'd1', kind: 'absolute', at: T(15) }] }),
    task('trashed', { deletedAt: 1, reminders: [{ id: 't1', kind: 'absolute', at: T(15) }] }),
  ]

  it('returns reminders in (since, now], oldest first, skipping done and trashed tasks', () => {
    expect(dueReminders(tasks, T(14), T(16)).map((d) => d.reminder.id)).toEqual(['b1', 'a1'])
  })

  it('excludes reminders exactly at `since`', () => {
    expect(dueReminders(tasks, T(15), T(16)).map((d) => d.reminder.id)).toEqual(['a1'])
  })
})
