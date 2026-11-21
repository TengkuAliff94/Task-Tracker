import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useModalDialog } from '../hooks/useModalDialog'
import { btn, dialog } from '../ui'

export interface ConfirmOptions {
  /** The question, e.g. "Empty Trash?". */
  title: string
  /** What will happen, with the counts involved. */
  body: ReactNode
  /** Names the action, e.g. "Delete forever". Never "OK". */
  confirmLabel: string
  /** Destructive and can't be undone: the go-ahead is solid red and Cancel takes focus first. */
  danger?: boolean
}

const CONFIRM = 'confirm'

/**
 * Asks before something consequential, in the app's own words and styling instead of the browser's
 * native confirm box. A native modal <dialog>: Esc cancels, focus returns to what opened it.
 * Use it through `useConfirm`, which turns the answer into a promise.
 */
export function ConfirmDialog({ title, body, confirmLabel, danger = false, onAnswer }: ConfirmOptions & { onAnswer: (ok: boolean) => void }) {
  const { ref } = useModalDialog()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const bodyId = useId()

  // Runs after useModalDialog's showModal(). Cancel is the safe default for anything destructive.
  useEffect(() => {
    ;(danger ? cancelRef : confirmRef).current?.focus()
  }, [danger])

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      // Every way out (the buttons, Esc, a forced close) ends here, so the answer is given exactly once.
      // The target check keeps a nested dialog's close from answering for this one.
      onClose={(e) => e.target === e.currentTarget && onAnswer(ref.current?.returnValue === CONFIRM)}
      className={`${dialog} max-w-md`}
    >
      <div className="px-6 pt-5 pb-6">
        <h2 id={titleId} className="text-xl font-bold tracking-tight text-balance break-words">
          {title}
        </h2>
        <div id={bodyId} className="mt-2 space-y-3 text-sm leading-relaxed break-words text-fg/90">
          {body}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" ref={cancelRef} onClick={() => ref.current?.close('cancel')} className={btn.secondary}>
            Cancel
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={() => ref.current?.close(CONFIRM)}
            className={danger ? btn.dangerSolid : btn.primary}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}

/**
 * Facts in a Well Stone list, label then value: two counts side by side, so a confirmation shows what
 * changes before anyone agrees to it, or the state of the data in Backup & restore.
 */
export function CountList({ rows }: { rows: [label: string, value: ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-subtle px-3 py-2.5">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
