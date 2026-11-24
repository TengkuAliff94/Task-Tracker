import * as chrono from 'chrono-node'
import { toDateInput } from './deadline'

/**
 * Reading what someone typed into a date or time field. The app's fields are text, so dates show as
 * DD/MM/YYYY and times on the 24-hour clock whatever the browser's locale; the native pickers sit
 * behind a button and only ever write into them.
 */

export type DateReading =
  /** `date` is YYYY-MM-DD. `time` (HH:MM) is set when the words carried one too, as in "fri 5pm". */
  | { ok: true; date: string; time?: string }
  | { ok: false; error: string }

export type TimeReading = { ok: true; time: string } | { ok: false; error: string }

const pad = (n: number) => String(n).padStart(2, '0')

const DATE_HINT = 'Use DD/MM/YYYY, such as 08/03/2026, or clear it.'
const TIME_HINT = 'Use the 24-hour clock, such as 17:30, or clear it.'

/** YYYY-MM-DD as DD/MM/YYYY. */
export function formatDateText(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** The calendar date, or undefined when it doesn't exist (31/02, month 13). */
function calendarDate(y: number, m: number, d: number): Date | undefined {
  const date = new Date(y, m - 1, d)
  // new Date(2026, 1, 31) rolls over to 03/03; a real date comes back unchanged.
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : undefined
}

const notADate = (text: string) => `“${text}” isn’t a date. Check the day and month.`

/**
 * Reads a typed date, day first. Empty text is no date (undefined).
 *   08/03/2026, 8/3/26, 8.3.2026, 8-3-2026, 08032026, and 2026-03-08 pasted from elsewhere
 *   8/3 with no year: the next 8 March, today included
 *   words, as in quick add: today, tomorrow, fri, next week, 8 march, in 3 days, fri 5pm
 *   a date then a time: 8/3 1730, fri 0900, tomorrow 9 (the time is passed back, not dropped)
 * The whole text has to be read, so "mon plans" is refused rather than read as Monday with the rest dropped.
 */
export function readDateText(text: string, now: Date = new Date()): DateReading | undefined {
  const t = text.trim()
  if (!t) return undefined

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t)
  // No spaces between day, month and year: "8/3 1730" is a date and a time, not the year 1730.
  const dmy = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2}|\d{4}))?$/.exec(t) ?? /^(\d{2})(\d{2})(\d{4})$/.exec(t)
  if (iso || dmy) {
    const [yearText, m, d] = iso ? [iso[1], Number(iso[2]), Number(iso[3])] : [dmy![3], Number(dmy![2]), Number(dmy![1])]
    if (yearText !== undefined) {
      // Two digits mean this century. Four digits are taken as written, but not before 1000, which
      // couldn't be stored as YYYY-MM-DD.
      const y = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText)
      const date = y >= 1000 ? calendarDate(y, m, d) : undefined
      return date ? { ok: true, date: toDateInput(date) } : { ok: false, error: notADate(t) }
    }
    // No year: this year's, unless that day has gone, then next year's. 29/02 finds the next leap year.
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    for (let year = now.getFullYear(); year <= now.getFullYear() + 8; year++) {
      const date = calendarDate(year, m, d)
      if (date && date >= today) return { ok: true, date: toDateInput(date) }
    }
    return { ok: false, error: notADate(t) }
  }

  // Words first, so "8 march 2026" stays a date. Chrono reads "8/3 1730" as the year 1730, though,
  // so a year before 1900 means the number was a time, and that's left to the step below.
  const hits = chrono.en.GB.parse(t, now, { forwardDate: true })
  const [hit] = hits
  if (hits.length === 1 && hit.index === 0 && hit.text.length === t.length && hit.start.date().getFullYear() >= 1900) {
    const d = hit.start.date()
    return {
      ok: true,
      date: toDateInput(d),
      time: hit.start.isCertain('hour') ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : undefined,
    }
  }

  // A date then a time, as in "8/3 1730", "fri 0900" or "tomorrow 9": the time goes to the time field.
  const split = /^(.*\S)\s+(\S+)$/.exec(t)
  if (split) {
    const day = readDateText(split[1], now)
    const time = readTimeText(split[2])
    if (day?.ok && !day.time && time?.ok) return { ok: true, date: day.date, time: time.time }
  }
  return { ok: false, error: DATE_HINT }
}

/**
 * Reads a typed time, shown back on the 24-hour clock. Empty text is no time (undefined).
 *   17:30, 17.30, 17h30, 1730, 930, 9, and 5pm, 5:30 pm, 9am, noon, midnight
 */
export function readTimeText(text: string): TimeReading | undefined {
  const t = text.trim().toLowerCase()
  if (!t) return undefined
  if (t === 'noon' || t === 'midday') return { ok: true, time: '12:00' }
  if (t === 'midnight') return { ok: true, time: '00:00' }

  const m =
    /^(\d{1,2})(?:[:.h]?(\d{2}))?\s*([ap])\.?m?\.?$/.exec(t) ??
    /^(\d{1,2})(?:[:.h](\d{2}))?$/.exec(t) ??
    /^(\d{1,2})(\d{2})$/.exec(t)
  if (!m) return { ok: false, error: TIME_HINT }

  let hours = Number(m[1])
  const minutes = m[2] ? Number(m[2]) : 0
  const meridiem = m[3]
  if (meridiem) {
    if (hours < 1 || hours > 12) return { ok: false, error: `“${text.trim()}” isn’t a time. With am or pm, hours go from 1 to 12.` }
    hours = (hours % 12) + (meridiem === 'p' ? 12 : 0)
  }
  if (hours > 23 || minutes > 59) {
    return { ok: false, error: `“${text.trim()}” isn’t a time. Hours go up to 23 and minutes up to 59.` }
  }
  return { ok: true, time: `${pad(hours)}:${pad(minutes)}` }
}

/** The moment a date (YYYY-MM-DD) and time (HH:MM) name, in local time. */
export function instantOf(date: string, time: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm).getTime()
}
