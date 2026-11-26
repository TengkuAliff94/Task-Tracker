import { GROUP_LABEL, SORT_LABEL, type GroupKey, type SortKey } from './sort'

/**
 * How the list is arranged on this device: Sort by, Group by and Show completed. Kept in
 * localStorage, like the theme, so it survives a reload; filters and the picked tile don't (they
 * answer "what am I looking for now", these answer "how do I like to see my list").
 */
export interface Arrangement {
  sort: SortKey
  group: GroupKey
  showCompleted: boolean
}

export const DEFAULT_ARRANGEMENT: Arrangement = { sort: 'smart', group: 'none', showCompleted: false }

const KEY = 'arrangement'

/** The stored value read back, keeping each part only if it's one the app knows; anything else is the default. */
export function parseArrangement(raw: string | null): Arrangement {
  let v: unknown
  try {
    v = raw ? JSON.parse(raw) : null
  } catch {
    return DEFAULT_ARRANGEMENT
  }
  if (!v || typeof v !== 'object') return DEFAULT_ARRANGEMENT
  const o = v as Record<string, unknown>
  return {
    sort: typeof o.sort === 'string' && Object.hasOwn(SORT_LABEL, o.sort) ? (o.sort as SortKey) : DEFAULT_ARRANGEMENT.sort,
    group: typeof o.group === 'string' && Object.hasOwn(GROUP_LABEL, o.group) ? (o.group as GroupKey) : DEFAULT_ARRANGEMENT.group,
    showCompleted: typeof o.showCompleted === 'boolean' ? o.showCompleted : DEFAULT_ARRANGEMENT.showCompleted,
  }
}

export function loadArrangement(): Arrangement {
  try {
    return parseArrangement(localStorage.getItem(KEY))
  } catch {
    // Storage can be blocked (private mode): the defaults, as on a first visit.
    return DEFAULT_ARRANGEMENT
  }
}

/** Saves the arrangement; the default is stored as nothing, so a fresh device and a reset one look alike. */
export function saveArrangement(a: Arrangement): void {
  try {
    if (a.sort === DEFAULT_ARRANGEMENT.sort && a.group === DEFAULT_ARRANGEMENT.group && a.showCompleted === DEFAULT_ARRANGEMENT.showCompleted)
      localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify(a))
  } catch {
    // Blocked storage: the arrangement still holds for this visit.
  }
}
