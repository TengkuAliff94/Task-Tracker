// Demo content for first-time visitors. Dates are placed relative to "now" so the list always
// shows a mix of overdue, upcoming, recurring and completed tasks.
import type { ChecklistItem, Deadline, Priority, Recurrence, Reminder, Status } from '../types'
import { toDateInput } from '../lib/deadline'
import { db as defaultDb, type TaskTrackerDB } from './db'
import { createLabelRepo } from './labels'
import { createTaskRepo } from './tasks'

const DAY = 86_400_000

interface SampleTask {
  title: string
  description?: string
  status?: Status
  priority?: Priority
  project?: string
  tags?: string[]
  /** Days from today, with an optional HH:mm time. */
  due?: { days: number; time?: string }
  effortMinutes?: number
  checklist?: [string, boolean][]
  remindersBefore?: number[]
  recurrence?: Recurrence
  /** How many days ago the task was added. */
  addedDaysAgo: number
}

const PROJECTS: [string, string][] = [
  ['Home', '#14b8a6'],
  ['Work', '#6366f1'],
  ['Health', '#ef4444'],
]
const TAGS: [string, string][] = [
  ['finance', '#f59e0b'],
  ['errand', '#0ea5e9'],
  ['reading', '#8b5cf6'],
  ['quick', '#10b981'],
]

const TASKS: SampleTask[] = [
  {
    title: 'Pay rent',
    priority: 'high',
    project: 'Home',
    tags: ['finance'],
    due: { days: 1, time: '17:00' },
    effortMinutes: 10,
    remindersBefore: [60],
    recurrence: { unit: 'month', interval: 1 },
    addedDaysAgo: 20,
  },
  {
    title: 'Renew car insurance',
    description: 'Compare at least **two** quotes before renewing.',
    priority: 'urgent',
    project: 'Home',
    tags: ['finance', 'errand'],
    due: { days: -2 },
    effortMinutes: 45,
    addedDaysAgo: 14,
  },
  {
    title: 'Prepare quarterly review slides',
    description: '- Revenue vs target\n- Hiring update\n- Risks for next quarter',
    status: 'in_progress',
    priority: 'high',
    project: 'Work',
    due: { days: 3, time: '09:30' },
    effortMinutes: 180,
    checklist: [
      ['Pull numbers from dashboard', true],
      ['Draft outline', true],
      ['Design slides', false],
      ['Dry run with team', false],
    ],
    addedDaysAgo: 6,
  },
  {
    title: 'Reply to recruiter email',
    priority: 'low',
    project: 'Work',
    tags: ['quick'],
    due: { days: 0, time: '18:00' },
    effortMinutes: 15,
    addedDaysAgo: 1,
  },
  {
    title: 'Morning run',
    project: 'Health',
    due: { days: 0, time: '07:00' },
    effortMinutes: 30,
    recurrence: { unit: 'day', interval: 1 },
    addedDaysAgo: 30,
  },
  {
    title: 'Book dentist appointment',
    project: 'Health',
    tags: ['errand', 'quick'],
    due: { days: 7 },
    addedDaysAgo: 4,
  },
  {
    title: 'Grocery run',
    project: 'Home',
    tags: ['errand'],
    due: { days: 2, time: '19:00' },
    checklist: [
      ['Milk', false],
      ['Eggs', false],
      ['Coffee beans', false],
    ],
    recurrence: { unit: 'week', interval: 1 },
    addedDaysAgo: 9,
  },
  {
    title: 'Finish reading "Deep Work"',
    priority: 'low',
    tags: ['reading'],
    effortMinutes: 120,
    addedDaysAgo: 12,
  },
  {
    title: 'File expense claims',
    status: 'done',
    project: 'Work',
    tags: ['finance'],
    due: { days: -1 },
    effortMinutes: 20,
    addedDaysAgo: 5,
  },
  {
    title: 'Fix the leaking kitchen tap',
    status: 'done',
    priority: 'high',
    project: 'Home',
    addedDaysAgo: 8,
  },
]

export function createSampleData(db: TaskTrackerDB = defaultDb) {
  const labels = createLabelRepo(db)
  const tasks = createTaskRepo(db)

  return {
    /**
     * Adds the sample projects, tags and tasks in one transaction, so the list never shows a half-loaded set.
     * Existing labels with the same name are reused. Returns the task count.
     */
    load(now: Date = new Date()): Promise<number> {
      return db.transaction('rw', db.projects, db.tags, db.tasks, () => addAll(now))
    },
  }

  async function addAll(now: Date): Promise<number> {
    const projectIds = new Map<string, string>()
    for (const [name, color] of PROJECTS) {
      const existing = (await labels.projects.list()).find((p) => p.name.toLowerCase() === name.toLowerCase())
      projectIds.set(name, (existing ?? (await labels.projects.create(name, color))).id)
    }
    const tagIds = new Map<string, string>()
    for (const [name, color] of TAGS) {
      const existing = (await labels.tags.list()).find((t) => t.name.toLowerCase() === name.toLowerCase())
      tagIds.set(name, (existing ?? (await labels.tags.create(name, color))).id)
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    for (const s of TASKS) {
      const deadline: Deadline | undefined = s.due && {
        date: toDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + s.due.days)),
        ...(s.due.time ? { time: s.due.time } : {}),
      }
      const checklist: ChecklistItem[] = (s.checklist ?? []).map(([text, done]) => ({ id: crypto.randomUUID(), text, done }))
      const reminders: Reminder[] = (s.remindersBefore ?? []).map((minutesBefore) => ({
        id: crypto.randomUUID(),
        kind: 'relative',
        minutesBefore,
      }))
      const addedAt = now.getTime() - s.addedDaysAgo * DAY
      await tasks.create(
        {
          title: s.title,
          description: s.description,
          status: s.status,
          priority: s.priority,
          projectId: s.project && projectIds.get(s.project),
          tagIds: (s.tags ?? []).map((t) => tagIds.get(t)!),
          deadline,
          effortMinutes: s.effortMinutes,
          checklist,
          reminders,
          recurrence: s.recurrence,
        },
        addedAt,
      )
    }
    return TASKS.length
  }
}

export const sampleData = createSampleData()
