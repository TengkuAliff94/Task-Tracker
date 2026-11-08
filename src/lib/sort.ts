import type { Priority, Task } from '../types'
import { deadlineInstant, isOverdue } from './deadline'

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

/** Default order: overdue first, then deadline ascending (none last), then priority, then newest. */
export function defaultSort(tasks: Task[], now: Date = new Date()): Task[] {
  return [...tasks].sort((a, b) => {
    const od = Number(isOverdue(b, now)) - Number(isOverdue(a, now))
    if (od) return od
    const da = a.deadline ? deadlineInstant(a.deadline).getTime() : Infinity
    const dbt = b.deadline ? deadlineInstant(b.deadline).getTime() : Infinity
    if (da !== dbt) return da - dbt
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (pr) return pr
    return b.createdAt - a.createdAt
  })
}
