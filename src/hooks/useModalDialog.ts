import { useCallback, useEffect, useRef } from 'react'

/**
 * Opens a native <dialog> as a modal when it mounts. Close it with `close()`, never by unmounting
 * it: closing through the dialog returns focus to whatever opened it, then its `close` event
 * fires, which is where the owner should unmount it (`<dialog onClose={...}>`).
 */
export function useModalDialog() {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el && !el.open) el.showModal()
  }, [])

  const close = useCallback(() => ref.current?.close(), [])
  return { ref, close }
}
