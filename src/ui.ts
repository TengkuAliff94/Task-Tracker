// Shared class strings so every component uses the same tokens.
import type { Priority, Status } from './types'

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-[background-color,color,opacity,translate] duration-200 disabled:cursor-not-allowed disabled:opacity-50'

export const btn = {
  primary: `${btnBase} bg-primary px-3.5 py-2 text-on-primary hover:bg-primary-hover active:translate-y-px`,
  secondary: `${btnBase} bg-subtle px-3 py-2 hover:bg-line`,
  ghost: `${btnBase} px-3 py-2 text-muted hover:bg-subtle hover:text-fg`,
  danger: `${btnBase} px-3 py-2 text-danger hover:bg-danger/10`,
  /** The go-ahead in a destructive confirmation (Replace everything, Delete forever): solid, so it can't be mistaken for Cancel. */
  dangerSolid: `${btnBase} bg-danger px-3.5 py-2 text-on-danger hover:bg-danger-hover active:translate-y-px`,
  small: `${btnBase} rounded-md px-2 py-1 text-xs hover:bg-subtle`,
  icon: `${btnBase} size-9 shrink-0 text-muted hover:bg-subtle hover:text-fg`,
  /** The most prominent action (New task): the orange brand panel, lighting up mustard on hover as in Sill. */
  brand: `${btnBase} rounded-xl bg-panel-orange px-4 py-2.5 font-semibold text-on-panel-orange hover:bg-panel-mustard hover:text-on-panel-mustard active:translate-y-px`,
  /** An icon button in the header's panel: a square tile that lights up mustard on hover. */
  headerIcon: `${btnBase} size-9 shrink-0 rounded-xl text-fg/80 hover:bg-panel-mustard hover:text-on-panel-mustard`,
}

/** Flat input: a filled well with no outline at rest; the border appears on hover and focus. */
export const field =
  'w-full rounded-lg border border-transparent bg-subtle px-3 py-2 text-sm text-fg transition-[border-color,box-shadow] duration-200 placeholder:text-muted hover:border-line-strong focus:border-ring focus:shadow-[0_0_0_3px_var(--primary-soft)] disabled:opacity-50'

/** Added to `field` (through `cn`) while a field has an error: a danger border that stays on hover and focus. */
export const INVALID_FIELD = 'border-danger hover:border-danger focus:border-danger'

/** A neutral panel: flat, no border, separated from its neighbours by the gap around it. */
export const card = 'rounded-panel bg-surface shadow-card'

export const dialog =
  'm-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-panel bg-raised p-0 text-fg shadow-modal'

export const labelText = 'text-[13px] font-medium text-fg/90'

/**
 * Saturated colour panels, each with its paired readable text colour. Colour means time and
 * state (overdue, due today, open, done), so each hue has one job. Priority isn't a colour: it's
 * the signal-bars glyph and its word (`PriorityGlyph`), and only Urgent keeps a hue (rust).
 */
export const panel = {
  /** Brand and primary emphasis (orange). */
  brand: 'bg-panel-orange text-on-panel-orange',
  /** Open or in progress (violet). Nothing else. */
  info: 'bg-panel-violet text-on-panel-violet',
  /** Needs attention soon: due today, missed reminders, the discard question (mustard). Also the hover light. */
  warning: 'bg-panel-mustard text-on-panel-mustard',
  /** Urgent priority, the Trash count (rust). */
  danger: 'bg-panel-rust text-on-panel-rust',
  /** The strongest alarm: overdue, wherever it shows (the badge, the card outline, the Overview tile) (maroon). */
  critical: 'bg-panel-maroon text-on-panel-maroon',
  /** Done: completed work (sage). Nothing else. */
  calm: 'bg-panel-sage text-on-panel-sage',
  /** Low emphasis: to do, nothing overdue, set aside in Trash (taupe). */
  neutral: 'bg-panel-taupe text-on-panel-taupe',
  /** Word from the app itself, with no state to colour: toasts, the backup reminder. The text colour on the canvas colour, so it inverts with the theme. */
  ink: 'bg-fg text-bg',
} as const

/** A panel's two colours swapped, for a solid button sitting on that panel. Same contrast as the panel. */
export const INVERTED_PANEL = {
  warning: 'bg-on-panel-mustard text-panel-mustard',
  ink: 'bg-bg text-fg',
} as const

/**
 * How a priority looks wherever it's shown. Every priority carries `PriorityGlyph` and its word;
 * colour is left to time and state, except Urgent, which keeps the rust panel.
 * - `badge`: the card badge, the quick-add preview and priority group tabs (a neutral well).
 * - `pressed`: a pressed priority filter pill and its collapsed chip (ink, so it reads as on).
 * - `stripe`: the card's left edge, Urgent only. High has none: an ink stripe read as the
 *   selection marker, which must stay the only ink bar on the list (the One Form Rule).
 */
export const PRIORITY_TONE: Record<Priority, { badge: string; pressed: string; stripe?: string }> = {
  low: { badge: 'bg-subtle text-fg', pressed: panel.ink },
  medium: { badge: 'bg-subtle text-fg', pressed: panel.ink },
  high: { badge: 'bg-subtle text-fg', pressed: panel.ink },
  urgent: { badge: panel.danger, pressed: panel.danger, stripe: 'bg-panel-rust' },
}

/** Each status's colour, e.g. for status group headings. */
export const STATUS_PANEL: Record<Status, string> = {
  todo: panel.neutral,
  in_progress: panel.info,
  done: panel.calm,
}

/** A picked Overview tile: an outline (not colour alone) that reads on every panel colour. */
export const SELECTED_OUTLINE = 'ring-2 ring-fg ring-offset-2 ring-offset-bg'
/**
 * An overdue card: outlined in `--alert-outline` (maroon by day, the danger red at night, 3:1 or
 * more on the canvas either way). The only line around a card; selection is the margin marker.
 */
export const ALERT_OUTLINE = 'ring-2 ring-alert-outline'

/**
 * Buttons inside an attention panel (the missed-reminders banner, the backup reminder). The main
 * action is the panel's colours swapped (`INVERTED_PANEL`), the quiet one is plain text in the
 * panel's own text colour that gains a tint on hover.
 */
const attentionBase = 'rounded-lg px-3 py-1.5 text-xs font-semibold transition'
export const attentionAction = `${attentionBase} hover:opacity-85`
/** Dimmed to 85% at rest; on violet that is still about 5.6:1. Hover tints from the panel's own ink. */
export const attentionQuiet = `${attentionBase} opacity-85 hover:bg-current/10 hover:opacity-100`

/** The Dismiss (×) button on a toast panel, in the panel's own text colour (75% at rest, still AA on violet and mustard). */
export const toastDismiss = 'rounded-md p-1 opacity-75 transition hover:bg-current/10 hover:opacity-100'

/** Sill's hover: a coloured control lights up mustard. */
export const hoverHighlight = 'hover:bg-panel-mustard hover:text-on-panel-mustard'
