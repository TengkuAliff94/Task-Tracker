import type { Reminder, Task } from '../types'
import { deadlineInstant, formatDeadline } from './deadline'

export const MAX_REMINDERS = 3

export const RELATIVE_PRESETS: { label: string; minutes: number }[] = [
  { label: 'At deadline', minutes: 0 },
  { label: '10 minutes before', minutes: 10 },
  { label: '30 minutes before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '3 hours before', minutes: 180 },
  { label: '1 day before', minutes: 1440 },
  { label: '2 days before', minutes: 2880 },
  { label: '1 week before', minutes: 10080 },
]

/** When a reminder goes off, or undefined if it's relative and the task has no deadline. */
export function reminderTime(r: Reminder, task: Pick<Task, 'deadline'>): number | undefined {
  if (r.kind === 'absolute') return r.at
  if (!task.deadline) return undefined
  return deadlineInstant(task.deadline).getTime() - r.minutesBefore * 60_000
}

export function describeReminder(r: Reminder): string {
  if (r.kind === 'absolute') {
    return new Date(r.at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short', hour12: false })
  }
  return RELATIVE_PRESETS.find((p) => p.minutes === r.minutesBefore)?.label ?? `${r.minutesBefore} minutes before`
}

export interface DueReminder {
  task: Task
  reminder: Reminder
  at: number
}

/** Reminders on open tasks that went off after `since` and at or before `now`, oldest first. */
export function dueReminders(tasks: Task[], since: number, now: number): DueReminder[] {
  const due: DueReminder[] = []
  for (const task of tasks) {
    if (task.status === 'done' || task.deletedAt !== undefined) continue
    for (const reminder of task.reminders) {
      const at = reminderTime(reminder, task)
      if (at !== undefined && at > since && at <= now) due.push({ task, reminder, at })
    }
  }
  return due.sort((a, b) => a.at - b.at)
}

export function notificationBody(task: Task, now: Date = new Date()): string {
  return task.deadline ? `Due ${formatDeadline(task.deadline, now)}` : 'Reminder'
}
