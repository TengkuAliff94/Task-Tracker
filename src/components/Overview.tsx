import { AlertCircle, CalendarClock, Check, CircleCheck, CircleDashed, type LucideIcon } from 'lucide-react'
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
  /** The tile's panel colour, which the check on a picked tile is cut out in. */
  fill: string
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
 * Layout: one row of four at every width, each tile stacking its label over its number. On phones
 * the row is compact and sits tight under the heading as one unit with it: tiles size to their
 * labels at the least (so "Completed" fits at 320px) and sharing the room equally where there's more;
 * small labels, no icons. Huge counts at 320px wrap a tile to a second line rather than overflow. From `sm` the tiles share the row
 * equally and the number is large.
 */
export function Overview({ tasks, now, scope, onScope, firstIndex }: Props) {
  const count = (s: Scope) => tasks.filter((t) => matchesScope(t, s, now)).length
  const overdue = count('overdue')
  const today = count('today')
  const done = count('done')

  const stats: Stat[] = [
    // The alarm and attention colours only while they count something; calm (taupe) at 0.
    { scope: 'overdue', label: 'Overdue', value: overdue, icon: AlertCircle, tone: overdue ? panel.critical : panel.neutral, fill: overdue ? 'var(--panel-maroon)' : 'var(--panel-taupe)', alert: overdue > 0 },
    { scope: 'today', label: 'Due today', value: today, icon: CalendarClock, tone: today ? panel.warning : panel.neutral, fill: today ? 'var(--panel-mustard)' : 'var(--panel-taupe)' },
    { scope: 'open', label: 'Open', value: count('open'), icon: CircleDashed, tone: panel.info, fill: 'var(--panel-violet)' },
    {
      scope: 'done',
      label: 'Completed',
      value: done,
      icon: CircleCheck,
      tone: panel.calm,
      fill: 'var(--panel-sage)',
      progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    },
  ]

  return (
    <section aria-label="Overview" className="flex h-full flex-wrap gap-1.5 sm:grid sm:grid-cols-4 sm:gap-3">
      {stats.map(({ scope: s, label, value, icon: Icon, tone, fill, alert, progress }, i) => {
        const picked = scope === s
        return (
          <Reveal key={s} index={firstIndex + i} className="relative min-w-0 max-sm:min-w-fit max-sm:flex-1">
            <button
              type="button"
              aria-pressed={picked}
              onClick={() => onScope(picked ? undefined : s)}
              className={`flex h-full w-full flex-col gap-0.5 rounded-panel p-2 text-left transition-shadow duration-200 hover:shadow-pop sm:gap-2 sm:p-4 lg:p-5 ${
                progress !== undefined ? 'pb-5 sm:pb-8 lg:pb-9' : ''
              } ${tone} ${picked ? SELECTED_OUTLINE : ''}`}
            >
              <span className="flex min-w-0 items-start justify-between gap-2">
                <span className="truncate text-xs font-semibold sm:text-sm">{label}</span>
                {/* Picked: a check in an ink disc takes the icon's place at every size, so "picked" never
                    looks like the focus outline alone. Otherwise the icon, left out where tiles are
                    slimmest: on phones, and beside the heading below `xl`. */}
                {picked ? (
                  <PickedMark fill={fill} className="max-sm:hidden" />
                ) : (
                  <Icon className={`size-5 shrink-0 max-sm:hidden lg:max-xl:hidden ${alert ? 'motion-safe:animate-pulse' : ''}`} aria-hidden />
                )}
              </span>
              <span className="mt-auto flex items-end gap-1.5 sm:gap-2 sm:pt-3">
                <CountUp value={value} className="font-display text-2xl leading-none font-extrabold tracking-tight tabular-nums sm:text-4xl" />
                {/* On phones the mark sits by the number, which is narrower than the label. */}
                {picked && <PickedMark fill={fill} className="sm:hidden" />}
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
function PickedMark({ fill, className }: { fill: string; className: string }) {
  return (
    <span data-picked-mark className={`grid size-5 shrink-0 place-items-center rounded-full bg-current ${className}`} aria-hidden>
      <Check className="size-3.5" style={{ color: fill }} strokeWidth={3} />
    </span>
  )
}

function Meter({ pct }: { pct: number }) {
  const reduce = useReducedMotionConfig()
  return (
    <div
      className="pointer-events-none absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-current/20 text-on-panel-sage sm:inset-x-4 sm:bottom-4 lg:inset-x-5 lg:bottom-5"
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
