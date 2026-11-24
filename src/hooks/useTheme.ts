import { useEffect, useState } from 'react'
import { getThemePref, setThemePref, watchSystemTheme, type ThemePref } from '../lib/theme'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

/**
 * The saved theme choice, a setter, and whether the screen is dark right now, so the header can show
 * a sun or a moon for what's on screen (System follows the OS, which can change while the app is open).
 */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(getThemePref)
  const [systemDark, setSystemDark] = useState(() => darkQuery().matches)

  useEffect(() => {
    const stopWatching = watchSystemTheme()
    const query = darkQuery()
    const onChange = () => setSystemDark(query.matches)
    query.addEventListener('change', onChange)
    return () => {
      stopWatching()
      query.removeEventListener('change', onChange)
    }
  }, [])

  const choose = (next: ThemePref) => {
    setThemePref(next)
    setPref(next)
  }

  return { pref, choose, dark: pref === 'dark' || (pref === 'system' && systemDark) }
}
