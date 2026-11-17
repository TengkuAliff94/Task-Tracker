import type { Label, Priority, Status, Task } from '../types'
import { isOverdue, toDateInput } from './deadline'

export const NO_PROJECT = '__none__'

/**
 * One of the Overview tiles, used as a filter: overdue, due today, all open, or completed.
 * The tiles count all tasks with `matchesScope`; picking one applies the same test to the list,
 * on top of any other filters.
 */
export type Scope = 'overdue' | 'today' | 'open' | 'done'

export function matchesScope(task: Task, scope: Scope, now: Date): boolean {
  switch (scope) {
    case 'overdue':
      return isOverdue(task, now)
    case 'today':
      return task.status !== 'done' && task.deadline?.date === toDateInput(now)
    case 'open':
      return task.status !== 'done'
    case 'done':
      return task.status === 'done'
  }
}

export interface Filters {
  /** An Overview tile picked as a filter, or undefined for none. */
  scope?: Scope
  query: string
  /** Project id, NO_PROJECT, or undefined for any project. */
  projectId?: string
  /** A task must have every selected tag. */
  tagIds: string[]
  /** Empty = any. */
  priorities: Priority[]
  /** Empty = any. */
  statuses: Status[]
  showCompleted: boolean
}

export const EMPTY_FILTERS: Filters = {
  query: '',
  tagIds: [],
  priorities: [],
  statuses: [],
  showCompleted: false,
}

export function hasActiveFilters(f: Filters): boolean {
  return Boolean(f.scope || f.query.trim() || f.projectId || f.tagIds.length || f.priorities.length || f.statuses.length)
}

/** Every word in the query must appear in the title, description, tag names or checklist items. */
export function matchesQuery(task: Task, query: string, tagsById: Map<string, Label>): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const haystack = [
    task.title,
    task.description,
    ...task.tagIds.map((id) => tagsById.get(id)?.name ?? ''),
    ...task.checklist.map((c) => c.text),
  ]
    .join('\n')
    .toLowerCase()
  return words.every((w) => haystack.includes(w))
}

export function applyFilters(tasks: Task[], f: Filters, tagsById: Map<string, Label>, now: Date = new Date()): Task[] {
  return tasks.filter((t) => {
    // Picking "Done" in the status filter, or the Completed tile, shows completed tasks even with the toggle off.
    if (!f.showCompleted && t.status === 'done' && !f.statuses.includes('done') && f.scope !== 'done') return false
    if (f.scope && !matchesScope(t, f.scope, now)) return false
    if (f.projectId === NO_PROJECT && t.projectId) return false
    if (f.projectId && f.projectId !== NO_PROJECT && t.projectId !== f.projectId) return false
    if (f.tagIds.some((id) => !t.tagIds.includes(id))) return false
    if (f.priorities.length && !f.priorities.includes(t.priority)) return false
    if (f.statuses.length && !f.statuses.includes(t.status)) return false
    return matchesQuery(t, f.query, tagsById)
  })
}
