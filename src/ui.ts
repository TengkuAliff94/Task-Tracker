// Shared class strings so every component uses the same tokens.

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50'

export const btn = {
  primary: `${btnBase} bg-primary px-3.5 py-2 text-on-primary hover:bg-primary-hover active:translate-y-px`,
  secondary: `${btnBase} bg-subtle px-3 py-2 hover:bg-line`,
  ghost: `${btnBase} px-3 py-2 text-muted hover:bg-subtle hover:text-fg`,
  danger: `${btnBase} px-3 py-2 text-danger hover:bg-danger/10`,
  small: `${btnBase} rounded-md px-2 py-1 text-xs hover:bg-subtle`,
  icon: `${btnBase} size-9 shrink-0 text-muted hover:bg-subtle hover:text-fg`,
}

/** Flat input: a filled well with no outline at rest; the border appears on hover and focus. */
export const field =
  'w-full rounded-lg border border-transparent bg-subtle px-3 py-2 text-sm text-fg transition-[border-color,box-shadow] duration-200 placeholder:text-muted/70 hover:border-line-strong focus:border-ring focus:shadow-[0_0_0_3px_var(--primary-soft)] focus:outline-none disabled:opacity-50'

/** A neutral panel: flat, no border, separated from its neighbours by the gap around it. */
export const card = 'rounded-panel bg-surface shadow-card'

export const dialog =
  'm-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-panel bg-raised p-0 text-fg shadow-modal'

export const labelText = 'text-[13px] font-medium text-fg/90'

/**
 * Saturated colour panels, each with its paired readable text colour. Anything that carries
 * meaning by colour (stats, priority, status) uses one of these, never a raw hue. Named for the
 * role they play; a role can show up in more than one place (sage marks both "completed" and
 * medium priority, as the calm, nothing-to-worry-about colour).
 */
export const panel = {
  /** Brand and primary emphasis (orange). */
  brand: 'bg-panel-orange text-on-panel-orange',
  /** Open or in progress (violet). */
  info: 'bg-panel-violet text-on-panel-violet',
  /** Needs attention soon: due today, high priority (mustard). */
  warning: 'bg-panel-mustard text-on-panel-mustard',
  /** Past due, urgent (rust). */
  danger: 'bg-panel-rust text-on-panel-rust',
  /** The strongest alarm: overdue (maroon). */
  critical: 'bg-panel-maroon text-on-panel-maroon',
  /** Calm, on track: completed, medium priority (sage). */
  calm: 'bg-panel-sage text-on-panel-sage',
  /** Low emphasis: low priority (taupe). */
  neutral: 'bg-panel-taupe text-on-panel-taupe',
} as const

/** Sill's hover: a coloured control lights up mustard. */
export const hoverHighlight = 'hover:bg-panel-mustard hover:text-on-panel-mustard'
