import { describe, expect, it } from 'vitest'
import { applyFilters, EMPTY_FILTERS, filterChips, hasActiveFilters, matchesScope, NO_PROJECT, removeChip, withoutMissingLabels, type Filters } from './filter'
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

describe('filter chips (the collapsed filter bar)', () => {
  const projects: Label[] = [{ id: 'p-life', name: 'Life', color: '#123456' }]
  const f: Filters = {
    ...EMPTY_FILTERS,
    projectId: 'p-life',
    priorities: ['high', 'urgent'],
    statuses: ['in_progress'],
    tagIds: ['t-fin'],
    query: 'rent',
    scope: 'overdue',
  }

  it('lists every panel filter in panel order, but not search or the Overview pick', () => {
    expect(filterChips(f, projects, tags).map((c) => c.label)).toEqual(['Life', 'High', 'Urgent', 'In Progress', '#finance'])
    expect(filterChips(EMPTY_FILTERS, projects, tags)).toEqual([])
  })

  it('names "No project", and keeps a chip for a label that was deleted while picked', () => {
    const chips = filterChips({ ...EMPTY_FILTERS, projectId: NO_PROJECT, tagIds: ['gone'] }, projects, tags)
    expect(chips.map((c) => c.label)).toEqual(['No project', '#deleted tag'])
    expect(filterChips({ ...EMPTY_FILTERS, projectId: 'gone' }, projects, tags)[0].label).toBe('Deleted project')
  })

  it('drops a project or tag that was deleted, and leaves everything else alone', () => {
    expect(withoutMissingLabels(f, projects, tags)).toBe(f)
    const noProject = { ...f, projectId: NO_PROJECT }
    expect(withoutMissingLabels(noProject, projects, tags)).toBe(noProject)
    const pruned = withoutMissingLabels(f, [], [tags[1]])
    expect(pruned).toEqual({ ...f, projectId: undefined, tagIds: [] })
  })

  it('removing a chip takes off only that filter', () => {
    const chips = filterChips(f, projects, tags)
    for (const chip of chips) {
      const after = removeChip(f, chip)
      expect(filterChips(after, projects, tags).map((c) => c.key)).toEqual(chips.filter((c) => c !== chip).map((c) => c.key))
      expect(after.query).toBe('rent')
      expect(after.scope).toBe('overdue')
    }
  })
})
