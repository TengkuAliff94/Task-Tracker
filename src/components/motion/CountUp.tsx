import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotionConfig, useTransform } from 'motion/react'
import { DURATION, EASE_OUT_SOFT } from './presets'

/**
 * Shows `value`, counting up from zero on first render and animating to each new value.
 * The animated digits are hidden from assistive tech, which reads the final value only,
 * never a number mid-count. Under reduced motion the value is rendered as-is, in the same
 * render as the change, so it is never a frame behind.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  // Motion reads the reduced-motion setting once, when the component mounts.
  const reduce = useReducedMotionConfig()
  const current = useMotionValue(0)
  const rounded = useTransform(current, (v) => Math.round(v))

  useEffect(() => {
    if (reduce) return
    const controls = animate(current, value, { duration: DURATION.count, ease: EASE_OUT_SOFT })
    return () => controls.stop()
  }, [value, reduce, current])

  return (
    <span className={className}>
      <motion.span aria-hidden>{reduce ? value : rounded}</motion.span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
