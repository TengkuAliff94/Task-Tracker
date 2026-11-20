import { useEffect, useRef } from 'react'

export type ShortcutMap = Record<string, (e: KeyboardEvent) => void>

export const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'N', label: 'Quick add a task' },
  { keys: '/', label: 'Search' },
  { keys: 'J / K', label: 'Next / previous task' },
  { keys: 'E', label: 'Edit selected task' },
  { keys: 'X', label: 'Toggle selected task done' },
  { keys: 'Z', label: 'Undo, while its message shows' },
  { keys: 'Esc', label: 'Leave a field / clear selection' },
  { keys: '?', label: 'Show shortcuts' },
]

/** Inputs that take no typed text, so letter keys stay shortcuts while one has focus. */
const NON_TEXT_INPUTS = ['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image']

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.includes(target.type)
  return target.isContentEditable || ['TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Single-key shortcuts, keyed by `event.key` (e.g. 'n', '/', '?', 'Escape').
 * Ignored while typing, while a dialog is open, or with Ctrl/Alt/Meta held.
 */
export function useShortcuts(map: ShortcutMap) {
  const ref = useRef(map)
  ref.current = map

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return
      if (isTyping(e.target) || document.querySelector('dialog[open]')) return
      const handler = ref.current[e.key.length === 1 ? e.key.toLowerCase() : e.key] ?? ref.current[e.key]
      if (!handler) return
      e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
