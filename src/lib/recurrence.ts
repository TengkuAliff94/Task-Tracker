import type { Deadline, Recurrence, Reminder, Task } from '../types'
import { deadlineInstant, toDateInput } from './deadline'

export const RECURRENCE_PRESETS: { label: string; value: Recurrence }[] = [
  { label: 'Daily', value: { unit: 'day', interval: 1 } },
  { label: 'Weekly', value: { unit: 'week', interval: 1 } },
  { label: 'Monthly', value: { unit: 'month', interval: 1 } },
  { label: 'Yearly', value: { unit: 'year', interval: 1 } },
]

export function describeRecurrence(r: Recurrence): string {
  const preset = RECURRENCE_PRESETS.find((p) => p.value.unit === r.unit && p.value.interval === r.interval)
  if (preset) return preset.label
  return `Every ${r.interval} ${r.unit}s`
}

/**
 * Moves a date forward by one step. Months and years clamp to the end of the month,
 * so 31 Jan + 1 month = 28/29 Feb and 29 Feb + 1 year = 28 Feb.
 */
export function addInterval(date: string, r: Recurrence): string {
  const [y, m, d] = date.split('-').map(Number)
  if (r.unit === 'day' || r.unit === 'week') {
    const days = r.interval * (r.unit === 'week' ? 7 : 1)
    return toDateInput(new Date(y, m - 1, d + days))
  }
  const months = r.unit === 'month' ? r.interval : r.interval * 12
  const targetMonth = m - 1 + months
  const lastDay = new Date(y, targetMonth + 1, 0).getDate()
  return toDateInput(new Date(y, targetMonth, Math.min(d, lastDay)))
}

/**
 * The next deadline after completing a recurring task. Steps forward from the current deadline
 * until the result is no longer overdue, so finishing a daily task a week late doesn't leave
 * six overdue copies behind.
 */
export function nextDeadline(deadline: Deadline, r: Recurrence, now: Date = new Date()): Deadline {
  let next: Deadline = { ...deadline, date: addInterval(deadline.date, r) }
  for (let i = 0; i < 10_000 && deadlineInstant(next).getTime() <= now.getTime(); i++) {
    next = { ...next, date: addInterval(next.date, r) }
  }
  return next
}

/** Absolute reminders move by the same amount as the deadline; relative ones stay as they are. */
export function shiftReminders(reminders: Reminder[], from: Deadline, to: Deadline): Reminder[] {
  const delta = deadlineInstant(to).getTime() - deadlineInstant(from).getTime()
  return reminders.map((r) =>
    r.kind === 'absolute' ? { ...r, id: crypto.randomUUID(), at: r.at + delta } : { ...r, id: crypto.randomUUID() },
  )
}

/** The task to create when `task` (recurring, with a deadline) is completed. */
export function nextInstance(task: Task, now: Date = new Date()): Task {
  if (!task.recurrence || !task.deadline) throw new Error('Task is not recurring')
  const deadline = nextDeadline(task.deadline, task.recurrence, now)
  return {
    id: crypto.randomUUID(),
    title: task.title,
    description: task.description,
    status: 'todo',
    priority: task.priority,
    projectId: task.projectId,
    tagIds: [...task.tagIds],
    deadline,
    createdAt: now.getTime(),
    effortMinutes: task.effortMinutes,
    checklist: task.checklist.map((c) => ({ ...c, id: crypto.randomUUID(), done: false })),
    reminders: shiftReminders(task.reminders, task.deadline, deadline),
    recurrence: { ...task.recurrence },
  }
}
