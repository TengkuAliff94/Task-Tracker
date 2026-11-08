/**
 * Parses "30m", "2h", "1h30m", "1.5h", "90" (minutes) into minutes.
 * Returns undefined for empty or invalid input.
 */
export function parseEffort(input: string): number | undefined {
  const s = input.trim().toLowerCase().replace(/\s+/g, '')
  if (!s) return undefined
  if (/^\d+$/.test(s)) return Number(s) || undefined
  const m = s.match(/^(?:(\d+(?:\.\d+)?)h)?(?:(\d+)m)?$/)
  if (!m || (!m[1] && !m[2])) return undefined
  const minutes = Math.round(Number(m[1] ?? 0) * 60) + Number(m[2] ?? 0)
  return minutes > 0 ? minutes : undefined
}

/** 30 -> "30m", 120 -> "2h", 90 -> "1h 30m" */
export function formatEffort(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m}m`
  return m ? `${h}h ${m}m` : `${h}h`
}
