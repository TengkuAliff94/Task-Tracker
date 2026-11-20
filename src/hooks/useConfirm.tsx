import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ConfirmDialog, type ConfirmOptions } from '../components/ConfirmDialog'

interface Pending extends ConfirmOptions {
  id: number
  resolve: (ok: boolean) => void
}

/**
 * `const [confirmDialog, ask] = useConfirm()`, then `if (await ask({...})) doIt()`, and render
 * `confirmDialog` anywhere in the component. Resolves false on Cancel or Esc, if another question
 * replaces it, or if the component unmounts first, so a caller never waits forever.
 */
export function useConfirm(): [ReactNode, (options: ConfirmOptions) => Promise<boolean>] {
  const [pending, setPending] = useState<Pending | null>(null)
  const current = useRef<Pending | null>(null)
  const nextId = useRef(0)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        current.current?.resolve(false)
        current.current = { ...options, id: nextId.current++, resolve }
        setPending(current.current)
      }),
    [],
  )

  useEffect(
    () => () => {
      current.current?.resolve(false)
      current.current = null
    },
    [],
  )

  const element = pending && (
    <ConfirmDialog
      // A new question gets a fresh dialog, with focus placed again.
      key={pending.id}
      {...pending}
      onAnswer={(ok) => {
        pending.resolve(ok)
        if (current.current === pending) current.current = null
        setPending((p) => (p === pending ? null : p))
      }}
    />
  )
  return [element, confirm]
}
