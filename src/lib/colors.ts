/**
 * Colours for projects and tags, in the order new ones take them. Each is a calm hue: at least 30°
 * from the colours that already have a job (the danger reds of both themes, the brand orange, the
 * mustard, the violet and the "done" sage), so a label never reads as "late", "act here", "done" or
 * a tile. colors.test.ts checks this against the tokens in index.css.
 */
export const LABEL_COLORS = [
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#84cc16', // lime
  '#d946ef', // fuchsia
  '#3faa3f', // green
  '#64748b', // slate
  '#b4469f', // orchid
]

/** The names a screen reader hears in the colour picker, one per LABEL_COLORS entry. */
export const LABEL_COLOR_NAMES: Record<string, string> = {
  '#0ea5e9': 'Sky',
  '#3b82f6': 'Blue',
  '#84cc16': 'Lime',
  '#d946ef': 'Fuchsia',
  '#3faa3f': 'Green',
  '#64748b': 'Slate',
  '#b4469f': 'Orchid',
}

/**
 * The hues that already mean something: danger (light #b42318, night #f27a8f), the brand orange
 * (#a3440f, #ec7a3a, the #cf6224 panel), mustard (#e3b867), violet (#5a3cd4) and the "done" sage
 * (#80a89b, #4a7266). A label hue keeps LABEL_HUE_GAP degrees clear of each.
 */
export const RESERVED_HUES = [4, 350, 22, 39, 252, 161]
export const LABEL_HUE_GAP = 30

/** A colour's hue in degrees (0–360) and saturation (0–1, HSL), or null if it isn't a #rrggbb colour. */
export function hueOf(hex: unknown): { hue: number; saturation: number } | null {
  // A hand-edited backup can hold a label with no colour; it's left alone rather than failing the restore.
  if (typeof hex !== 'string') return null
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const light = (max + min) / 2
  if (d === 0) return { hue: 0, saturation: 0 }
  const saturation = d / (1 - Math.abs(2 * light - 1))
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { hue: (h * 60 + 360) % 360, saturation }
}

/** How far apart two hues are around the wheel (0–180). */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return Math.min(d, 360 - d)
}

/** Below this saturation a colour reads as a grey, whatever its hue, so it never clashes. */
export const GREY = 0.15

/**
 * A label colour that keeps clear of the reserved hues: the colour itself if it does (or is grey
 * enough not to read as any hue), else the palette colour nearest it on the wheel. Labels saved
 * before the calm palette (red, orange, amber, pink, indigo, violet) move to it this way, once, when
 * the database upgrades, and so do labels in a backup restored from then.
 */
export function calmLabelColor(color: string): string {
  // (A non-string colour comes back as it was; see hueOf.)
  const own = hueOf(color)
  if (!own || own.saturation < GREY) return color
  if (RESERVED_HUES.every((h) => hueDistance(own.hue, h) >= LABEL_HUE_GAP)) return color
  let best = LABEL_COLORS[0]
  let bestDistance = Infinity
  for (const c of LABEL_COLORS) {
    const h = hueOf(c)
    if (!h || h.saturation < GREY) continue
    const d = hueDistance(own.hue, h.hue)
    if (d < bestDistance) [best, bestDistance] = [c, d]
  }
  return best
}

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
