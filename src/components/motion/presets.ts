// Shared motion presets. Every animation in the app takes its timing from here, never ad-hoc numbers,
// so the whole app moves with one rhythm. Durations are in seconds, as Motion expects.
import type { Transition } from 'motion/react'

/** Matches `--ease-out-soft` in index.css: fast start, long gentle settle. Keep the two in sync. */
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const

export const DURATION = {
  /** Exits and small state changes. Kept short so leaving items never linger. */
  fast: 0.18,
  /** Entrances and reveals. */
  base: 0.32,
  /** Dialogs springing in (a CSS spring: `--duration-spring` in index.css mirrors this). */
  spring: 0.48,
  /** Number count-ups. */
  count: 1.1,
  /** The little celebration when a task is completed. */
  burst: 0.45,
  /** One slow bob of a decorative icon, e.g. on empty states (CSS only: `--duration-float` in index.css mirrors this). */
  float: 3.6,
} as const

export const SPRING = {
  /** Gentle settle for panels, dialogs and items gliding to a new position. */
  soft: { type: 'spring', stiffness: 260, damping: 28 },
  /** A quick, slightly bouncy pop for small things that change, e.g. the Trash count badge. */
  pop: { type: 'spring', stiffness: 520, damping: 16 },
} as const satisfies Record<string, Transition>

/** Where things start as they enter (faded, a little low), and where they settle. */
export const ENTER_FROM = { opacity: 0, y: 8 } as const
export const ENTER_TO = { opacity: 1, y: 0, scale: 1 } as const
/** Small things popping into place, e.g. the quick-add preview chips. */
export const POP_FROM = { opacity: 0, y: 4, scale: 0.8 } as const
/** Toasts sliding in from the screen edge, and back out the same way. */
export const SLIDE_FROM = { opacity: 0, x: 32 } as const
export const SLIDE_TO = { opacity: 1, x: 0 } as const
/** Big decorative shapes rising into view, e.g. the heading panel's sun. */
export const RISE_FROM = { opacity: 0, y: 60 } as const

export type EnterFrom = typeof ENTER_FROM | typeof POP_FROM | typeof RISE_FROM

/** A card lifting slightly under the pointer (Motion skips it for touch). */
export const HOVER_LIFT = { y: -3, scale: 1.005 } as const

/** The completion celebration: dots fly out on the soft ease, but grow and fade on a linear clock
 *  (under the front-loaded ease alone they'd be gone before anyone saw them). */
export const BURST = {
  particles: 8,
  /** How far (px) the dots travel from the centre. */
  radius: 20,
  scale: [0, 1.3, 0.6],
  opacity: [1, 1, 0],
  transition: {
    duration: DURATION.burst,
    ease: EASE_OUT_SOFT,
    scale: { duration: DURATION.burst, times: [0, 0.3, 1], ease: 'linear' },
    opacity: { duration: DURATION.burst, times: [0, 0.65, 1], ease: 'linear' },
  } satisfies Transition,
}

const STAGGER_STEP = 0.025
/** Items past this index all share the last delay, so long lists don't take ages to appear. */
const STAGGER_MAX_INDEX = 12

/** Entrance timing for the item at `index` in a staggered group. */
export const enterTransition = (index = 0): Transition => ({
  duration: DURATION.base,
  ease: EASE_OUT_SOFT,
  delay: Math.min(Math.max(index, 0), STAGGER_MAX_INDEX) * STAGGER_STEP,
})

export const exitTransition: Transition = { duration: DURATION.fast, ease: EASE_OUT_SOFT }
