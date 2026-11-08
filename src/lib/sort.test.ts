import { expect, it } from 'vitest'
import { defaultSort } from './sort'
import type { Task } from '../types'

const base: Omit<Task, 'id' | 'title'> = {
  description: '',
  status: 'todo',
  priority: 'medium',
  tagIds: [],
  checklist: [],
  reminders: [],
  createdAt: 0,
}
const t = (title: string, extra: Partial<Task> = {}): Task => ({ ...base, id: title, title, ...extra })

it('orders overdue, then deadline ascending (none last), then priority', () => {
  const now = new Date(2026, 10, 8, 12)
  const tasks = [
    t('no-deadline-urgent', { priority: 'urgent' }),
    t('next-week', { deadline: { date: '2026-11-15' } }),
    t('tomorrow-low', { deadline: { date: '2026-11-09' }, priority: 'low' }),
    t('tomorrow-high', { deadline: { date: '2026-11-09' }, priority: 'high' }),
    t('overdue', { deadline: { date: '2026-11-01' } }),
    t('no-deadline-low', { priority: 'low' }),
  ]
  expect(defaultSort(tasks, now).map((x) => x.title)).toEqual([
    'overdue',
    'tomorrow-high',
    'tomorrow-low',
    'next-week',
    'no-deadline-urgent',
    'no-deadline-low',
  ])
})
