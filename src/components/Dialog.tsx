import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { btn, dialog } from '../ui'

interface Props {
  title: string
  onClose: () => void
  /** Tailwind max-width class. */
  width?: string
  children: ReactNode
}

/** A native modal <dialog>: traps focus, closes on Escape, dims the page. */
export function Dialog({ title, onClose, width = 'max-w-md', children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el && !el.open) el.showModal()
  }, [])

  return (
    <dialog ref={ref} onClose={onClose} aria-label={title} className={`${dialog} ${width}`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-raised/90 px-6 py-4 backdrop-blur">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className={btn.icon}>
          <X className="size-4.5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  )
}
