/** Scroll movements smaller than this (px) keep the header as it is, so trackpad jitter can't flicker it. */
const JITTER = 4

interface ScrollStep {
  /** Where the last decision was made. Small moves don't advance it, so a slow scroll still adds up. */
  anchorY: number
  /** Scroll position now. */
  y: number
  /** Whether the header is hidden right now. */
  hidden: boolean
  /** Within this distance (px) of the top of the page the header always shows, usually its own height. */
  topZone: number
}

/**
 * Whether the header should be hidden after a scroll: hidden scrolling down, shown scrolling up or
 * near the top. Returns the anchor to pass in next time.
 */
export function nextHeaderVisibility({ anchorY, y, hidden, topZone }: ScrollStep): { hidden: boolean; anchorY: number } {
  if (y <= topZone) return { hidden: false, anchorY: y }
  const delta = y - anchorY
  if (Math.abs(delta) < JITTER) return { hidden, anchorY }
  return { hidden: delta > 0, anchorY: y }
}
