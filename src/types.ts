export type Status = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export const STATUSES: Status[] = ['todo', 'in_progress', 'done']
export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

export const STATUS_LABEL: Record<Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}
export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

/** Local calendar date with an optional time. Date-only deadlines are due at the end of that day. */
export interface Deadline {
  date: string // YYYY-MM-DD
  time?: string // HH:mm
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export type Reminder =
  | { id: string; kind: 'absolute'; at: number }
  | { id: string; kind: 'relative'; minutesBefore: number }

export interface Recurrence {
  unit: 'day' | 'week' | 'month' | 'year'
  interval: number
}

export interface Task {
  id: string
  title: string
  description: string // Markdown
  status: Status
  priority: Priority
  projectId?: string
  tagIds: string[]
  deadline?: Deadline
  createdAt: number
  completedAt?: number
  effortMinutes?: number
  checklist: ChecklistItem[]
  reminders: Reminder[]
  recurrence?: Recurrence
  /** For a completed recurring task: the instance its completion created. Stops duplicates. */
  nextInstanceId?: string
  deletedAt?: number // set when moved to Trash
}

/** A named, colored label. Projects (one per task) and tags (many per task) share this shape. */
export interface Label {
  id: string
  name: string
  color: string
}
export type Project = Label
export type Tag = Label

export interface Attachment {
  id: string
  taskId: string
  kind: 'link' | 'file'
  name: string
  url?: string
  blob?: Blob
  size?: number
  createdAt: number
}
