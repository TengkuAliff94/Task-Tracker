import { panel } from '../ui'
import { RISE_FROM } from './motion/presets'
import { Reveal } from './motion/Reveal'

/** What the heading says needs attention, most urgent first. Absent before there are any tasks. */
export interface Urgency {
  overdue: number
  dueToday: number
  open: number
}

/** "2 overdue", else "1 due today", else "On track" while anything is open, else "All done". */
export function urgencyLine({ overdue, dueToday, open }: Urgency): string {
  if (overdue) return `${overdue} overdue`
  if (dueToday) return `${dueToday} due today`
  return open ? 'On track' : 'All done'
}

/**
 * The big heading on the brand-coloured panel, with today's date. A black sun (after Sill's) rises
 * into the corner on load; it's decoration only and sits clear of the text.
 *
 * Before there are any tasks it's the full-width brand moment: "Tasks" alone at display size.
 * Once there are tasks it turns compact and says what's urgent: a second display line under
 * "Tasks" ("2 overdue"), with the text kept clear of a smaller sun.
 */
export function HeadingPanel({ dateLabel, urgency }: { dateLabel: string; urgency?: Urgency }) {
  if (!urgency) {
    return (
      <div className={`relative flex h-full min-h-40 flex-col justify-end overflow-hidden rounded-panel p-6 sm:p-7 ${panel.brand}`}>
        <Reveal from={RISE_FROM} index={2} className="absolute -top-10 -right-10 size-40 rounded-full bg-current sm:size-48" />
        <h1 id="page-heading" tabIndex={-1} className="relative text-5xl leading-[0.9] font-extrabold tracking-tight sm:text-6xl">Tasks</h1>
        <p className="relative mt-2 text-sm font-medium">{dateLabel}</p>
      </div>
    )
  }

  return (
    <div className={`relative flex h-full flex-col justify-end overflow-hidden rounded-panel p-5 sm:p-6 ${panel.brand}`}>
      <Reveal from={RISE_FROM} index={2} className="absolute -top-10 -right-10 size-28 rounded-full bg-current" />
      {/* pr-20 keeps both display lines out of the sun's corner (72px of it shows). */}
      <div className="relative pr-20 font-display text-3xl leading-[0.9] font-extrabold tracking-tight sm:text-4xl">
        <h1 id="page-heading" tabIndex={-1}>Tasks</h1>
        <p>{urgencyLine(urgency)}</p>
      </div>
      <p className="relative mt-2 text-sm font-medium">{dateLabel}</p>
    </div>
  )
}
