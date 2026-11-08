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

/** "Today", "Tomorrow", "Yesterday", "In 3 days", "2 days ago", otherwise DD/MM/YYYY. Time appended when set. */
export function formatDeadline(d: Deadline, now: Date = new Date()): string {
  const [y, m, day] = d.date.split('-').map(Number)
  const target = new Date(y, m - 1, day)
  const diffDays = Math.round((target.getTime() - startOfDay(now).getTime()) / 86_400_000)
  let label: string
  if (diffDays === 0) label = 'Today'
  else if (diffDays === 1) label = 'Tomorrow'
  else if (diffDays === -1) label = 'Yesterday'
  else if (diffDays > 1 && diffDays <= 7) label = `In ${diffDays} days`
  else if (diffDays < -1 && diffDays >= -7) label = `${-diffDays} days ago`
  else label = formatDate(d)
  return d.time ? `${label} ${d.time}` : label
}

/** Local date as YYYY-MM-DD, for <input type="date">. */
export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
