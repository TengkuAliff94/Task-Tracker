import type { Label, Priority, Status, Task } from '../types'

export const NO_PROJECT = '__none__'

export interface Filters {
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
  return Boolean(f.query.trim() || f.projectId || f.tagIds.length || f.priorities.length || f.statuses.length)
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

export function applyFilters(tasks: Task[], f: Filters, tagsById: Map<string, Label>): Task[] {
  return tasks.filter((t) => {
    // Picking "Done" in the status filter shows completed tasks even with the toggle off.
    if (!f.showCompleted && t.status === 'done' && !f.statuses.includes('done')) return false
    if (f.projectId === NO_PROJECT && t.projectId) return false
    if (f.projectId && f.projectId !== NO_PROJECT && t.projectId !== f.projectId) return false
    if (f.tagIds.some((id) => !t.tagIds.includes(id))) return false
    if (f.priorities.length && !f.priorities.includes(t.priority)) return false
    if (f.statuses.length && !f.statuses.includes(t.status)) return false
    return matchesQuery(t, f.query, tagsById)
  })
}
