import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { getThemePref, setThemePref, watchSystemTheme, type ThemePref } from '../lib/theme'
import { btn } from '../ui'

const NEXT: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' }
const LABEL: Record<ThemePref, string> = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' }
const ICON = { system: Monitor, light: Sun, dark: Moon }

/** Cycles system → light → dark. */
export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>(getThemePref)
  useEffect(() => watchSystemTheme(), [])
  const Icon = ICON[pref]

  return (
    <button
      onClick={() => {
        const next = NEXT[pref]
        setThemePref(next)
        setPref(next)
      }}
      aria-label={`${LABEL[pref]} (click to change)`}
      title={`${LABEL[pref]}. Click for ${LABEL[NEXT[pref]].toLowerCase()}.`}
      className={btn.headerIcon}
    >
      <Icon className="size-5" />
    </button>
  )
}
