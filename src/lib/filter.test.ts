import { describe, expect, it } from 'vitest'
import { applyFilters, EMPTY_FILTERS, NO_PROJECT, type Filters } from './filter'
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
