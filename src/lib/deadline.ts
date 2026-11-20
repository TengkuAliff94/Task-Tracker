import type { Deadline, Task } from '../types'

/** The moment a deadline passes. Date-only deadlines pass at the end of that local day. */
export function deadlineInstant(d: Deadline): Date {
  const [y, m, day] = d.date.split('-').map(Number)
  if (d.time) {
    const [hh, mm] = d.time.split(':').map(Number)
    return new Date(y, m - 1, day, hh, mm)
  }
  return new Date(y, m - 1, day + 1) // midnight starting the next day
}

export function isOverdue(task: Pick<Task, 'status' | 'deadline'>, now: Date = new Date()): boolean {
  if (task.status === 'done' || !task.deadline) return false
  return deadlineInstant(task.deadline).getTime() <= now.getTime()
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

const pad = (n: number) => String(n).padStart(2, '0')

/** DD/MM/YYYY */
export function formatDate(d: Deadline): string {
  const [y, m, day] = d.date.split('-')
  return `${day}/${m}/${y}`
}

const localDate = (d: Deadline) => {
  const [y, m, day] = d.date.split('-').map(Number)
  return new Date(y, m - 1, day)
}

/** "Today", "Tomorrow", "Yesterday", "In 3 days" or "2 days ago" within a week either side, else undefined. */
export function relativeDay(d: Deadline, now: Date = new Date()): string | undefined {
  const diffDays = Math.round((localDate(d).getTime() - startOfDay(now).getTime()) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < -1 && diffDays >= -7) return `${-diffDays} days ago`
  return undefined
}

/** "Today", "Tomorrow", "Yesterday", "In 3 days", "2 days ago", otherwise DD/MM/YYYY. Time appended when set. */
export function formatDeadline(d: Deadline, now: Date = new Date()): string {
  const label = relativeDay(d, now) ?? formatDate(d)
  return d.time ? `${label} ${d.time}` : label
}

const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

/**
 * "Tue 10/03/2026, 17:00 · Tomorrow": a deadline in the app's own format (DD/MM/YYYY, 24-hour),
 * shown beside the native pickers, which follow the browser's locale instead.
 */
export function describeDeadline(d: Deadline, now: Date = new Date()): string {
  const when = `${weekday.format(localDate(d))} ${formatDate(d)}${d.time ? `, ${d.time}` : ''}`
  const relative = relativeDay(d, now)
  return relative ? `${when} · ${relative}` : when
}

/** "Tue 10/03/2026, 17:00" for a moment in local time, e.g. a reminder at a specific time. */
export function formatDateTime(at: Date): string {
  return `${weekday.format(at)} ${pad(at.getDate())}/${pad(at.getMonth() + 1)}/${at.getFullYear()}, ${pad(at.getHours())}:${pad(at.getMinutes())}`
}

/** Local date as YYYY-MM-DD, for <input type="date">. */
export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
