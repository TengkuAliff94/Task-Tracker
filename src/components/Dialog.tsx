import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useModalDialog } from '../hooks/useModalDialog'
import { btn, dialog } from '../ui'

interface Props {
  title: string
  /** Called once the dialog has closed (Escape, the Close button, or `close()`), to unmount it. */
  onClose: () => void
  /** Tailwind max-width class. */
  width?: string
  children: ReactNode
}

/** A native modal <dialog>: traps focus, closes on Escape, returns focus, dims the page. */
export function Dialog({ title, onClose, width = 'max-w-lg', children }: Props) {
  const { ref, close } = useModalDialog()

  return (
    <dialog ref={ref} onClose={onClose} aria-label={title} className={`${dialog} ${width}`}>
      <DialogTitleBar title={title} onClose={close} />
      <div className="px-6 pt-2 pb-6">{children}</div>
    </dialog>
  )
}

/** The top of every dialog panel: a heavy title and the Close button, pinned while the body scrolls. */
export function DialogTitleBar({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-raised/90 px-6 pt-5 pb-3 backdrop-blur">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <button type="button" onClick={onClose} aria-label="Close" className={btn.headerIcon}>
        <X className="size-5" />
      </button>
    </div>
  )
}
