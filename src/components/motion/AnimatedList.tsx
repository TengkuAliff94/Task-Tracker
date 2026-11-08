import { createContext, useContext, useEffect, useRef, useState, type ComponentProps, type RefObject } from 'react'
import { AnimatePresence, motion, useReducedMotionConfig, type HTMLMotionProps } from 'motion/react'
import { cn } from '../../lib/utils'
import { ENTER_FROM, ENTER_TO, enterTransition, exitTransition, HOVER_LIFT, SPRING } from './presets'

/** Whether the list has finished its first render; items added after that skip the stagger delay. */
const ListMounted = createContext<RefObject<boolean>>({ current: false })

/**
 * A list whose items animate in, glide to new positions when the order changes, and animate out
 * when removed. Children must be `AnimatedItem`s with stable keys.
 */
export function AnimatedList({ children, className, ...props }: ComponentProps<'ul'>) {
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
  }, [])

  // `relative` so items popped out of the layout while exiting stay positioned within the list.
  return (
    <ListMounted.Provider value={mounted}>
      <ul className={cn('relative', className)} {...props}>
        <AnimatePresence initial mode="popLayout">
          {children}
        </AnimatePresence>
      </ul>
    </ListMounted.Provider>
  )
}

type ItemProps = Omit<
  HTMLMotionProps<'li'>,
  'initial' | 'animate' | 'whileInView' | 'viewport' | 'exit' | 'layout' | 'transition' | 'whileHover'
> & {
  /** Position in the list, for a short staggered entrance on the list's first render. */
  index?: number
  /** Lift slightly under the pointer. */
  lift?: boolean
}

/**
 * One item of an `AnimatedList`. It fades up the first time it scrolls into view (so items below
 * the fold reveal as you reach them). Under reduced motion it neither moves nor fades: it appears
 * and disappears at once, so a removed item never lingers on screen, and it doesn't lift on hover.
 */
export function AnimatedItem({ index = 0, lift = false, ...props }: ItemProps) {
  const reduce = useReducedMotionConfig()
  const listMounted = useContext(ListMounted)
  // Fixed at the item's own mount: stagger with the first batch, otherwise enter straight away.
  const [delayIndex] = useState(() => (listMounted.current ? 0 : index))

  if (reduce) return <motion.li {...props} />
  return (
    <motion.li
      {...props}
      layout="position"
      initial={ENTER_FROM}
      whileInView={{ ...ENTER_TO, transition: enterTransition(delayIndex) }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={lift ? HOVER_LIFT : undefined}
      exit={{ opacity: 0, scale: 0.97, transition: exitTransition }}
      transition={{ layout: SPRING.soft }}
    />
  )
}
