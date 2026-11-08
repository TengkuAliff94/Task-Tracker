import type { ReactNode } from 'react'
import { motion, useReducedMotionConfig } from 'motion/react'
import { ENTER_FROM, ENTER_TO, enterTransition, type EnterFrom } from './presets'

interface Props {
  children?: ReactNode
  className?: string
  /** Position in a staggered group; later items start a little later. */
  index?: number
  /** Reveal when first scrolled into view instead of on mount. */
  inView?: boolean
  /** Where it starts from, one of the presets (default: faded, a little low). */
  from?: EnterFrom
}

/**
 * Fades and lifts its children into place, once. Under reduced motion it renders them in their
 * final state with no offset, so nothing waits on an animation to become visible.
 */
export function Reveal({ children, className, index = 0, inView = false, from = ENTER_FROM }: Props) {
  const reduce = useReducedMotionConfig()

  return (
    <motion.div
      className={className}
      initial={reduce ? false : from}
      {...(inView ? { whileInView: ENTER_TO, viewport: { once: true, amount: 0.15 } } : { animate: ENTER_TO })}
      transition={enterTransition(index)}
    >
      {children}
    </motion.div>
  )
}
