/** Colors for projects and tags. New items take the next unused one. */
export const LABEL_COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#84cc16', // lime
  '#f97316', // orange
]

/**
 * Inline styles that show a user-picked label colour as a tint with an outline (pair it with
 * `ring-1 ring-inset` and body-coloured text). The colour never colours the text itself: with
 * light hues that fell to 2:1 contrast.
 */
export function labelTint(color: string, tintPercent = 12): Record<string, string> {
  return {
    backgroundColor: `color-mix(in srgb, ${color} ${tintPercent}%, transparent)`,
    '--tw-ring-color': `color-mix(in srgb, ${color} 45%, transparent)`,
  }
}

export function nextColor(used: string[]): string {
  return LABEL_COLORS.find((c) => !used.includes(c)) ?? LABEL_COLORS[used.length % LABEL_COLORS.length]
}
