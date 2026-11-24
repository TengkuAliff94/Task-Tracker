import * as chrono from 'chrono-node'
import type { Deadline, Priority } from '../types'
import { parseEffort } from './effort'
import { toDateInput } from './deadline'

export interface QuickAddResult {
  title: string
  tagNames: string[]
  projectName?: string
  priority?: Priority
  effortMinutes?: number
  deadline?: Deadline
}

const PRIORITY_ALIASES: Record<string, Priority> = {
  low: 'low',
  med: 'medium',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
}

const pad = (n: number) => String(n).padStart(2, '0')

/** The one-line example the placeholder, the empty state's Try button and the help all use. */
export const QUICK_ADD_EXAMPLE = 'Pay rent #finance @home !high ~30m tomorrow 5pm'

/** What a token sets on the task, as `parseQuickAdd` returns it. */
export type QuickAddField = 'tagNames' | 'projectName' | 'priority' | 'effortMinutes' | 'deadline'

/**
 * The quick-add help: each kind of token with the example's own token first, other forms after it,
 * and a note. `quickAdd.test.ts` parses every token shown here, so the help can't promise a form the
 * parser doesn't read.
 */
export const QUICK_ADD_SYNTAX: { field: QuickAddField; name: string; tokens: string[]; note?: string }[] = [
  { field: 'tagNames', name: 'Tag', tokens: ['#finance'], note: 'Add as many as you like.' },
  { field: 'projectName', name: 'Project', tokens: ['@home'], note: 'One per task.' },
  { field: 'priority', name: 'Priority', tokens: ['!high', '!low', '!med', '!urgent'] },
  { field: 'effortMinutes', name: 'Effort', tokens: ['~30m', '~2h', '~1h30m'] },
  { field: 'deadline', name: 'Deadline', tokens: ['fri 5pm', 'tomorrow', 'in 3 days', '25/12 17:30'], note: 'Day first.' },
]

/**
 * Parses quick-add text such as `Pay rent #finance @home !high ~30m tomorrow 5pm`.
 *   #tag        a tag (repeatable)
 *   @project    the project (the last one wins)
 *   !priority   one of low, med, medium, high, urgent
 *   ~effort     30m, 2h, 1h30m
 *   anything chrono understands as a date, read day-first (DD/MM) and only in the future
 * Tokens that don't match (for example `!foo` or `~abc`) stay in the title.
 */
export function parseQuickAdd(input: string, ref: Date = new Date()): QuickAddResult {
  const result: QuickAddResult = { title: '', tagNames: [] }

  let text = input.replace(/(^|\s)([#@!~])([^\s#@!~]+)/g, (whole, lead: string, sigil: string, value: string) => {
    switch (sigil) {
      case '#':
        if (!result.tagNames.some((t) => t.toLowerCase() === value.toLowerCase())) result.tagNames.push(value)
        return lead
      case '@':
        result.projectName = value
        return lead
      case '!': {
        const p = PRIORITY_ALIASES[value.toLowerCase()]
        if (!p) return whole
        result.priority = p
        return lead
      }
      case '~': {
        const e = parseEffort(value)
        if (e === undefined) return whole
        result.effortMinutes = e
        return lead
      }
    }
    return whole
  })

  const [hit] = chrono.en.GB.parse(text, ref, { forwardDate: true })
  if (hit) {
    const d = hit.start.date()
    result.deadline = {
      date: toDateInput(d),
      time: hit.start.isCertain('hour') ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : undefined,
    }
    text = text.slice(0, hit.index) + text.slice(hit.index + hit.text.length)
  }

  // Drop connector words left dangling by a removed date, e.g. "Submit report by".
  result.title = text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+(by|on|at|due)$/i, '')
  return result
}
