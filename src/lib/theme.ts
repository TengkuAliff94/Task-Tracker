import { DURATION } from '../components/motion/presets'

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

/** How long the theme switch fades for: `--duration-base` in index.css, which mirrors DURATION.base. */
const THEME_FADE_MS = DURATION.base * 1000
let fadeTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Applies `pref`, fading the canvas and panel colours across rather than snapping, unless the
 * user prefers reduced motion. The fade class only stays on for the length of the fade, so it
 * never slows down any other colour change.
 */
function applyThemeWithFade(pref: ThemePref): void {
  const root = document.documentElement
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-fade')
    clearTimeout(fadeTimer)
    fadeTimer = setTimeout(() => root.classList.remove('theme-fade'), THEME_FADE_MS)
  }
  applyTheme(pref)
}

/** Saves and applies the user's choice, e.g. from the theme toggle. */
export function setThemePref(pref: ThemePref): void {
  try {
    if (pref === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch {
    // Storage can be blocked (private mode); the theme still applies for this visit.
  }
  applyThemeWithFade(pref)
}

/** Re-applies the theme when the OS switches, while following the system. */
export function watchSystemTheme(): () => void {
  const m = media()
  const onChange = () => getThemePref() === 'system' && applyTheme('system')
  m.addEventListener('change', onChange)
  return () => m.removeEventListener('change', onChange)
}
