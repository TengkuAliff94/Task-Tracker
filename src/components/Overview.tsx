import { AlertCircle, CalendarClock, CircleCheck, CircleDashed, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotionConfig } from 'motion/react'
import { matchesScope, type Scope } from '../lib/filter'
import type { Task } from '../types'
import { panel, SELECTED_OUTLINE } from '../ui'
import { CountUp } from './motion/CountUp'
import { DURATION, EASE_OUT_SOFT } from './motion/presets'
import { Reveal } from './motion/Reveal'

interface Stat {
  scope: Scope
  label: string
  value: number
  icon: LucideIcon
  tone: string
  /** Draws the eye: the icon pulses. */
  alert?: boolean
  /** Shows a percentage and a completion meter (0–100). */
  progress?: number
}

/** How many tiles the Overview shows, so whatever reveals after it can stagger in behind them. */
export const OVERVIEW_TILE_COUNT = 4

interface Props {
  tasks: Task[]
  now: Date
  /** The tile picked as a filter, if any. */
  scope?: Scope
  /** Picks a tile as the filter, or clears it when that tile is already picked. */
  onScope: (scope: Scope | undefined) => void
  firstIndex: number
}

/**
 * At-a-glance counts as colour tiles, most urgent first, each one a filter for the list below.
 * The numbers always count all tasks, so they keep answering "what needs me now?" whatever else is
 * filtered; picking a tile narrows the list to those tasks, together with any other filters (both
 * use `matchesScope`). Numbers count up when they first show and whenever they change. Tiles
 * reveal in turn, starting at `firstIndex`.
 *
 * Layout: a 2×2 grid of slim tiles (label and number on one line) on phones, one row of four
 * from `sm`, where each tile stacks its label over a large number.
 */
export function Overview({ tasks, now, scope, onScope, firstIndex }: Props) {
  const count = (s: Scope) => tasks.filter((t) => matchesScope(t, s, now)).length
  const overdue = count('overdue')
  const done = count('done')

  const stats: Stat[] = [
    // The alarm colour only when something is late; calm otherwise.
    { scope: 'overdue', label: 'Overdue', value: overdue, icon: AlertCircle, tone: overdue ? panel.critical : panel.neutral, alert: overdue > 0 },
    { scope: 'today', label: 'Due today', value: count('today'), icon: CalendarClock, tone: panel.warning },
    { scope: 'open', label: 'Open', value: count('open'), icon: CircleDashed, tone: panel.info },
    {
      scope: 'done',
      label: 'Completed',
      value: done,
      icon: CircleCheck,
      tone: panel.calm,
      progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    },
  ]

  return (
    <section aria-label="Overview" className="grid h-full grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ scope: s, label, value, icon: Icon, tone, alert, progress }, i) => {
        const picked = scope === s
        return (
          <Reveal key={s} index={firstIndex + i} className="relative min-w-0">
            <button
              type="button"
              aria-pressed={picked}
              onClick={() => onScope(picked ? undefined : s)}
              className={`flex h-full w-full items-center justify-between gap-2 rounded-panel p-3 text-left transition-shadow duration-200 hover:shadow-pop sm:flex-col sm:items-stretch sm:justify-start sm:p-4 lg:p-5 ${
                progress !== undefined ? 'pb-6 sm:pb-8 lg:pb-9' : ''
              } ${tone} ${picked ? SELECTED_OUTLINE : ''}`}
            >
              <span className="flex min-w-0 items-start justify-between gap-2">
                <span className="truncate text-sm font-semibold">{label}</span>
                {/* Left out where tiles are slimmest: on phones, and beside the heading below `xl`. */}
                <Icon className={`size-5 shrink-0 max-sm:hidden lg:max-xl:hidden ${alert ? 'motion-safe:animate-pulse' : ''}`} aria-hidden />
              </span>
              <span className="flex items-end gap-1.5 sm:mt-auto sm:gap-2 sm:pt-3">
                <CountUp value={value} className="font-display text-2xl leading-none font-extrabold tracking-tight tabular-nums sm:text-4xl" />
                {/* Not on phones, where it would squeeze the label; the meter shows it there. */}
                {progress !== undefined && <span className="text-sm font-semibold tabular-nums max-sm:hidden sm:mb-0.5">{progress}%</span>}
              </span>
            </button>
            {/* Outside the button, so the progress bar stays a progress bar to assistive tech. */}
            {progress !== undefined && <Meter pct={progress} />}
          </Reveal>
        )
      })}
    </section>
  )
}

/**
 * The completion bar, along the bottom of the Completed tile. It fills smoothly to each new
 * percentage (a horizontal scale, so only transforms animate); under reduced motion it jumps
 * straight there. Clicks pass through to the tile.
 */
function Meter({ pct }: { pct: number }) {
  const reduce = useReducedMotionConfig()
  return (
    <div
      className="pointer-events-none absolute inset-x-3 bottom-2.5 h-1.5 overflow-hidden rounded-full bg-current/20 text-on-panel-sage sm:inset-x-4 sm:bottom-4 lg:inset-x-5 lg:bottom-5"
      role="progressbar"
      aria-label="Tasks completed"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full origin-left rounded-full bg-current"
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={reduce ? { duration: 0 } : { duration: DURATION.count, ease: EASE_OUT_SOFT }}
      />
    </div>
  )
}
