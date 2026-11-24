import type { Priority } from '../types'
import { PRIORITIES } from '../types'

/**
 * Priority as signal bars: four rising bars, one lit for Low up to all four for Urgent. Drawn in
 * the text colour, so it reads on any well or panel. Always shown beside the priority's word,
 * which carries the meaning; the glyph is a shape cue, so it's hidden from assistive tech.
 */
export function PriorityGlyph({ priority, className = 'size-3' }: { priority: Priority; className?: string }) {
  const lit = PRIORITIES.indexOf(priority) + 1
  return (
    <svg viewBox="0 0 12 12" className={`shrink-0 ${className}`} aria-hidden data-priority-glyph={lit}>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={i * 3}
          y={9 - i * 3}
          width={2}
          height={3 + i * 3}
          rx={0.5}
          fill="currentColor"
          opacity={i < lit ? 1 : 0.3}
        />
      ))}
    </svg>
  )
}
