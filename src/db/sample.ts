// Demo content for first-time visitors. Dates are placed relative to "now" so the list always
// shows a mix of overdue, upcoming, recurring and completed tasks.
import type { ChecklistItem, Deadline, Priority, Recurrence, Reminder, Status } from '../types'
import { toDateInput } from '../lib/deadline'
import { db as defaultDb, type TaskTrackerDB } from './db'
import { createAttachmentRepo } from './attachments'
import { createLabelRepo } from './labels'
import { createTaskRepo } from './tasks'

const DAY = 86_400_000

/** A day relative to today: a number of days from it, or "later this week" (see `daysFromToday`). */
type DayOffset = number | 'later-this-week'

/** A day relative to today, with an optional HH:mm time (midnight if left out). */
interface When {
  days: DayOffset
  time?: string
}

interface SampleTask {
  title: string
  description?: string
  status?: Status
  priority?: Priority
  project?: string
  tags?: string[]
  due?: When
  effortMinutes?: number
  checklist?: [string, boolean][]
  remindersBefore?: number[]
  /** A reminder at a fixed time. */
  remindAt?: When & { time: string }
  /** Link attachments as [name, url]. */
  links?: [string, string][]
  recurrence?: Recurrence
  /** How many days ago the task was added. */
  addedDaysAgo: number
}

const PROJECTS: [string, string][] = [
  ['Home', '#0ea5e9'],
  ['Work', '#3b82f6'],
  ['Health', '#3faa3f'],
]
const TAGS: [string, string][] = [
  ['finance', '#84cc16'],
  ['errand', '#64748b'],
  ['reading', '#d946ef'],
  ['quick', '#8c3274'],
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
    description:
      '## Agenda\n\n- Revenue vs target\n- Hiring update\n- Risks for next quarter\n\nStart from the [team slide template](https://example.com/slides-template).',
    status: 'in_progress',
    priority: 'high',
    project: 'Work',
    due: { days: 'later-this-week', time: '09:30' },
    effortMinutes: 180,
    checklist: [
      ['Pull numbers from dashboard', true],
      ['Draft outline', true],
      ['Design slides', false],
      ['Dry run with team', false],
    ],
    links: [['Sales dashboard', 'https://example.com/dashboard']],
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
    priority: 'medium',
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
    remindAt: { days: 1, time: '09:00' },
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

/**
 * Weeks run Monday to Sunday, as in the app's en-GB locale. "Later this week" aims three days
 * out but stops at Sunday, so it never spills into next week (on a Saturday that's tomorrow).
 * On a Sunday the week has no days left, so it falls three days out, early next week.
 */
function daysFromToday(days: DayOffset, today: Date): number {
  if (days !== 'later-this-week') return days
  const daysLeftInWeek = (7 - today.getDay()) % 7 // getDay(): Sunday is 0
  return daysLeftInWeek === 0 ? 3 : Math.min(3, daysLeftInWeek)
}

/** The local date and time `when` points at, counted from `today` (local midnight). */
function resolve(when: When, today: Date): Date {
  const [h, m] = (when.time ?? '00:00').split(':').map(Number)
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysFromToday(when.days, today), h, m)
}

/**
 * Whether the sample set counts as loaded: more than half of it in the list. Every task would miss
 * a set with one task trashed or retitled; any one would trip on a single shared title.
 */
export function looksLoaded(present: number, size: number): boolean {
  return present * 2 > size
}

export function createSampleData(db: TaskTrackerDB = defaultDb) {
  const labels = createLabelRepo(db)
  const tasks = createTaskRepo(db)
  const attachments = createAttachmentRepo(db)

  return {
    /**
     * Adds the sample projects, tags and tasks in one transaction, so the list never shows a half-loaded set.
     * Adds to existing data, never replaces it. Labels with the same name (ignoring case) are reused.
     * Returns the task count.
     */
    load(now: Date = new Date()): Promise<number> {
      return db.transaction('rw', [db.projects, db.tags, db.tasks, db.attachments], () => addAll(now))
    },
    /**
     * How many of the sample tasks are in the list, matched by title. Trash doesn't count either
     * way: a trashed sample task isn't in the list, and the rest of the set still is.
     */
    async inList(): Promise<number> {
      const titles = new Set((await tasks.list()).map((t) => t.title))
      return TASKS.filter((s) => titles.has(s.title)).length
    },
    /** How many tasks a load adds. */
    size: TASKS.length,
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
        date: toDateInput(resolve(s.due, today)),
        ...(s.due.time ? { time: s.due.time } : {}),
      }
      const checklist: ChecklistItem[] = (s.checklist ?? []).map(([text, done]) => ({ id: crypto.randomUUID(), text, done }))
      const reminders: Reminder[] = (s.remindersBefore ?? []).map((minutesBefore) => ({
        id: crypto.randomUUID(),
        kind: 'relative',
        minutesBefore,
      }))
      if (s.remindAt) reminders.push({ id: crypto.randomUUID(), kind: 'absolute', at: resolve(s.remindAt, today).getTime() })
      const addedAt = now.getTime() - s.addedDaysAgo * DAY
      const task = await tasks.create(
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
        { sample: true },
      )
      for (const [name, url] of s.links ?? []) await attachments.addLink(task.id, url, name, addedAt)
    }
    return TASKS.length
  }
}

export const sampleData = createSampleData()
