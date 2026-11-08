export type ThemePref = 'system' | 'light' | 'dark'

const KEY = 'theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(pref: ThemePref): void {
  const dark = pref === 'dark' || (pref === 'system' && media().matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function setThemePref(pref: ThemePref): void {
  try {
    if (pref === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch {
    // Storage can be blocked (private mode); the theme still applies for this visit.
  }
  applyTheme(pref)
}

/** Re-applies the theme when the OS switches, while following the system. */
export function watchSystemTheme(): () => void {
  const m = media()
  const onChange = () => getThemePref() === 'system' && applyTheme('system')
  m.addEventListener('change', onChange)
  return () => m.removeEventListener('change', onChange)
}
