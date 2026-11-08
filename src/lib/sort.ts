import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  type Label,
  type Priority,
  type Task,
} from '../types'
import { deadlineInstant, isOverdue } from './deadline'

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

export type SortKey = 'smart' | 'deadline' | 'priority' | 'created' | 'title'
export type GroupKey = 'none' | 'project' | 'priority' | 'status'

export const SORT_LABEL: Record<SortKey, string> = {
  smart: 'Smart (overdue, deadline, priority)',
  deadline: 'Deadline',
  priority: 'Priority',
  created: 'Newest first',
  title: 'Title A–Z',
}
export const GROUP_LABEL: Record<GroupKey, string> = {
  none: 'No grouping',
  project: 'Project',
  priority: 'Priority',
  status: 'Status',
}

type Cmp = (a: Task, b: Task) => number

const byDeadline: Cmp = (a, b) => {
  const da = a.deadline ? deadlineInstant(a.deadline).getTime() : Infinity
  const db = b.deadline ? deadlineInstant(b.deadline).getTime() : Infinity
  return da === db ? 0 : da - db
}
const byPriority: Cmp = (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
const byNewest: Cmp = (a, b) => b.createdAt - a.createdAt
const byTitle: Cmp = (a, b) => a.title.localeCompare(b.title)

const chain =
  (...cmps: Cmp[]): Cmp =>
  (a, b) => {
    for (const c of cmps) {
      const r = c(a, b)
      if (r) return r
    }
    return 0
  }

export function sortTasks(tasks: Task[], key: SortKey, now: Date = new Date()): Task[] {
  const byOverdue: Cmp = (a, b) => Number(isOverdue(b, now)) - Number(isOverdue(a, now))
  const cmp: Record<SortKey, Cmp> = {
    smart: chain(byOverdue, byDeadline, byPriority, byNewest),
    deadline: chain(byDeadline, byPriority, byNewest),
    priority: chain(byPriority, byDeadline, byNewest),
    created: byNewest,
    title: chain(byTitle, byNewest),
  }
  return [...tasks].sort(cmp[key])
}

/** Default order: overdue first, then deadline ascending (none last), then priority, then newest. */
export const defaultSort = (tasks: Task[], now?: Date) => sortTasks(tasks, 'smart', now)

export interface TaskGroup {
  key: string
  label: string
  color?: string
  tasks: Task[]
}

/** Splits already-sorted tasks into groups in a fixed order. Empty groups are dropped. */
export function groupTasks(tasks: Task[], key: GroupKey, projects: Label[]): TaskGroup[] {
  if (key === 'none') return [{ key: 'all', label: '', tasks }]

  let groups: TaskGroup[]
  let keyOf: (t: Task) => string
  if (key === 'project') {
    groups = [
      ...projects.map((p) => ({ key: p.id, label: p.name, color: p.color, tasks: [] as Task[] })),
      { key: '', label: 'No project', tasks: [] },
    ]
    keyOf = (t) => t.projectId ?? ''
  } else if (key === 'priority') {
    groups = [...PRIORITIES].reverse().map((p) => ({ key: p, label: PRIORITY_LABEL[p], tasks: [] }))
    keyOf = (t) => t.priority
  } else {
    groups = STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s], tasks: [] }))
    keyOf = (t) => t.status
  }

  const index = new Map(groups.map((g) => [g.key, g]))
  for (const t of tasks) (index.get(keyOf(t)) ?? index.get(''))?.tasks.push(t)
  return groups.filter((g) => g.tasks.length)
}
