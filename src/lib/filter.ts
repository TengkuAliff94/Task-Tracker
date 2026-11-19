import { PRIORITY_LABEL, STATUS_LABEL, type Label, type Priority, type Status, type Task } from '../types'
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

/**
 * One filter from the filter panel, shown as a removable chip while the panel is collapsed.
 * Search (visible in its own field) and the Overview pick (shown by its pressed tile) aren't chips.
 */
export type FilterChip =
  | { kind: 'project'; key: string; label: string; color?: string; id: string }
  | { kind: 'priority'; key: string; label: string; value: Priority }
  | { kind: 'status'; key: string; label: string; value: Status }
  | { kind: 'tag'; key: string; label: string; color: string; id: string }

/** The panel's active filters, in the panel's order: project, priorities, statuses, tags. */
export function filterChips(f: Filters, projects: Label[], tags: Label[]): FilterChip[] {
  const chips: FilterChip[] = []
  if (f.projectId) {
    const project = projects.find((p) => p.id === f.projectId)
    const label = f.projectId === NO_PROJECT ? 'No project' : (project?.name ?? 'Deleted project')
    chips.push({ kind: 'project', key: `project:${f.projectId}`, label, color: project?.color, id: f.projectId })
  }
  for (const p of f.priorities) chips.push({ kind: 'priority', key: `priority:${p}`, label: PRIORITY_LABEL[p], value: p })
  for (const s of f.statuses) chips.push({ kind: 'status', key: `status:${s}`, label: STATUS_LABEL[s], value: s })
  for (const id of f.tagIds) {
    const tag = tags.find((t) => t.id === id)
    // A tag deleted while picked still gets a chip, so the filter can always be removed.
    chips.push({ kind: 'tag', key: `tag:${id}`, label: `#${tag?.name ?? 'deleted tag'}`, color: tag?.color ?? 'currentColor', id })
  }
  return chips
}

/**
 * The filters without any project or tag that no longer exists, so deleting a label can't leave the
 * list narrowed by a filter no control shows. Returns `f` itself when nothing changed.
 */
export function withoutMissingLabels(f: Filters, projects: Label[], tags: Label[]): Filters {
  const projectGone = f.projectId && f.projectId !== NO_PROJECT && !projects.some((p) => p.id === f.projectId)
  const tagIds = f.tagIds.filter((id) => tags.some((t) => t.id === id))
  if (!projectGone && tagIds.length === f.tagIds.length) return f
  return { ...f, projectId: projectGone ? undefined : f.projectId, tagIds }
}

/** The filters with one chip's filter taken off. */
export function removeChip(f: Filters, chip: FilterChip): Filters {
  switch (chip.kind) {
    case 'project':
      return { ...f, projectId: undefined }
    case 'priority':
      return { ...f, priorities: f.priorities.filter((p) => p !== chip.value) }
    case 'status':
      return { ...f, statuses: f.statuses.filter((s) => s !== chip.value) }
    case 'tag':
      return { ...f, tagIds: f.tagIds.filter((id) => id !== chip.id) }
  }
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
