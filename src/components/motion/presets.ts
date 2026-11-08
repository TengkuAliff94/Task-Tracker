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
  /** Number count-ups. */
  count: 1.1,
} as const

export const SPRING = {
  /** Gentle settle for panels, dialogs and items gliding to a new position. */
  soft: { type: 'spring', stiffness: 260, damping: 28 },
} as const satisfies Record<string, Transition>

/** Where things start as they enter (faded, a little low), and where they settle. */
export const ENTER_FROM = { opacity: 0, y: 8 } as const
export const ENTER_TO = { opacity: 1, y: 0 } as const

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
