import { describe, expect, it } from 'vitest'
import { applyFilters, EMPTY_FILTERS, hasActiveFilters, matchesScope, NO_PROJECT, type Filters } from './filter'
import type { Label, Task } from '../types'

const tags: Label[] = [
  { id: 't-fin', name: 'finance', color: '#000' },
  { id: 't-home', name: 'home', color: '#000' },
]
const tagsById = new Map(tags.map((t) => [t.id, t]))

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

const tasks = [
  task('rent', { tagIds: ['t-fin', 't-home'], projectId: 'p-life', priority: 'high' }),
  task('taxes', { tagIds: ['t-fin'], description: 'File the LHDN form' }),
  task('groceries', { checklist: [{ id: 'c', text: 'Eggs', done: false }], projectId: 'p-life' }),
  task('old', { status: 'done' }),
]

const run = (f: Partial<Filters>) => applyFilters(tasks, { ...EMPTY_FILTERS, ...f }, tagsById).map((t) => t.id)

describe('applyFilters', () => {
  it('hides completed tasks unless asked', () => {
    expect(run({})).toEqual(['rent', 'taxes', 'groceries'])
    expect(run({ showCompleted: true })).toContain('old')
    expect(run({ statuses: ['done'] })).toEqual(['old'])
  })

  it('filters by project and by "no project"', () => {
    expect(run({ projectId: 'p-life' })).toEqual(['rent', 'groceries'])
    expect(run({ projectId: NO_PROJECT })).toEqual(['taxes'])
  })

  it('requires every selected tag', () => {
    expect(run({ tagIds: ['t-fin'] })).toEqual(['rent', 'taxes'])
    expect(run({ tagIds: ['t-fin', 't-home'] })).toEqual(['rent'])
  })

  it('filters by priority', () => {
    expect(run({ priorities: ['high'] })).toEqual(['rent'])
  })

  it('searches title, description, tag names and checklist items', () => {
    expect(run({ query: 'lhdn' })).toEqual(['taxes'])
    expect(run({ query: 'eggs' })).toEqual(['groceries'])
    expect(run({ query: 'home' })).toEqual(['rent'])
    expect(run({ query: 'finance rent' })).toEqual(['rent'])
  })
})

describe('scope (the Overview tiles as filters)', () => {
  // Tue 10 Mar 2026, 09:00 local.
  const now = new Date(2026, 2, 10, 9, 0)
  const scoped = [
    task('late', { deadline: { date: '2026-03-08' } }),
    task('this-morning', { deadline: { date: '2026-03-10', time: '07:00' } }),
    task('tonight', { deadline: { date: '2026-03-10', time: '18:00' } }),
    task('next-week', { deadline: { date: '2026-03-17' } }),
    task('someday'),
    task('finished', { status: 'done', deadline: { date: '2026-03-01' } }),
  ]
  const ids = (scope: Filters['scope'], extra: Partial<Filters> = {}) =>
    applyFilters(scoped, { ...EMPTY_FILTERS, ...extra, scope }, tagsById, now).map((t) => t.id)

  it('overdue: open tasks whose deadline has passed, never completed ones', () => {
    expect(ids('overdue')).toEqual(['late', 'this-morning'])
    expect(scoped.filter((t) => matchesScope(t, 'overdue', now)).map((t) => t.id)).toEqual(['late', 'this-morning'])
  })

  it('today: open tasks due today, including one already overdue this morning', () => {
    expect(ids('today')).toEqual(['this-morning', 'tonight'])
  })

  it('open: everything not done, even with "Show completed" on', () => {
    expect(ids('open', { showCompleted: true })).toEqual(['late', 'this-morning', 'tonight', 'next-week', 'someday'])
  })

  it('done: completed tasks, even with "Show completed" off', () => {
    expect(ids('done')).toEqual(['finished'])
  })

  it('combines with the other filters and counts as an active filter', () => {
    expect(ids('overdue', { query: 'late' })).toEqual(['late'])
    expect(hasActiveFilters({ ...EMPTY_FILTERS, scope: 'today' })).toBe(true)
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
  })
})
