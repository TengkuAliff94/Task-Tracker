import { useEffect, useState } from 'react'
import { motion, useReducedMotionConfig } from 'motion/react'
import { BURST, DURATION } from './presets'

const EVENT = 'task-tracker:celebrate'
const COLOURS = ['bg-panel-orange', 'bg-panel-mustard', 'bg-panel-violet', 'bg-panel-sage']

interface Point {
  id: number
  x: number
  y: number
}

/**
 * Plays a small celebration (a ring of coloured dots) centred on `el`, e.g. the checkbox of a task
 * just completed. It draws in the app-wide `BurstLayer`, so it can outlive `el`: the card it came
 * from may leave the list at once. Does nothing under reduced motion (the layer renders nothing).
 */
export function celebrate(el: Element | null | undefined) {
  if (!el) return
  const r = el.getBoundingClientRect()
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }))
}

/** Where celebrations draw. Mount once, near the root. Decorative only. */
export function BurstLayer() {
  const reduce = useReducedMotionConfig()
  const [bursts, setBursts] = useState<Point[]>([])

  useEffect(() => {
    if (reduce) return
    let next = 0
    const onCelebrate = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail
      const id = next++
      setBursts((b) => [...b, { id, x, y }])
      setTimeout(() => setBursts((b) => b.filter((p) => p.id !== id)), DURATION.burst * 1000)
    }
    window.addEventListener(EVENT, onCelebrate)
    return () => window.removeEventListener(EVENT, onCelebrate)
  }, [reduce])

  if (reduce) return null
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      {bursts.map((b) => (
        <span key={b.id} className="absolute" style={{ left: b.x, top: b.y }}>
          {Array.from({ length: BURST.particles }, (_, i) => {
            const angle = (i / BURST.particles) * 2 * Math.PI
            return (
              <motion.span
                key={i}
                className={`absolute -top-1 -left-1 size-2 rounded-full ${COLOURS[i % COLOURS.length]}`}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * BURST.radius,
                  y: Math.sin(angle) * BURST.radius,
                  scale: BURST.scale,
                  opacity: BURST.opacity,
                }}
                transition={BURST.transition}
              />
            )
          })}
        </span>
      ))}
    </div>
  )
}
