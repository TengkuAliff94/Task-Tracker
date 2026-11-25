import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { RotateCcw, Trash2 } from 'lucide-react'
import { taskRepo, TRASH_RETENTION_DAYS } from '../db/tasks'
import { useConfirm } from '../hooks/useConfirm'
import { plural } from '../lib/utils'
import type { Task } from '../types'
import { btn, card, panel } from '../ui'
import { EmptyState } from './EmptyState'
import { AnimatedItem, AnimatedList } from './motion/AnimatedList'

const DAY = 86_400_000

/** Trashed tasks as cards in the same grid as the task list, each with Restore and Delete forever. */
export function TrashView({ onRestore }: { onRestore: (task: Task) => Promise<void> | void }) {
  const trashed = useLiveQuery(() => taskRepo.listTrash(), [])
  const now = Date.now()
  const [confirmDialog, ask] = useConfirm()
  const listRef = useRef<HTMLUListElement>(null)
  /**
   * Where focus goes once a card leaves (restored or deleted for good): the same button on its
   * neighbour, or the empty state when Trash is now empty, so focus never drops to the page.
   */
  const focusNext = useRef<{ id: string; button: 'restore' | 'delete' } | 'empty' | null>(null)

  useEffect(() => {
    const next = focusNext.current
    if (!next || !trashed) return
    if (next === 'empty') {
      if (trashed.length) return
      focusNext.current = null
      document.querySelector<HTMLElement>('[data-empty-state]')?.focus()
      return
    }
    if (!trashed.some((t) => t.id === next.id)) return
    focusNext.current = null
    const button = next.button === 'delete' ? '[data-delete-forever]' : '[data-restore]'
    listRef.current?.querySelector<HTMLElement>(`[data-trash-id="${CSS.escape(next.id)}"] ${button}`)?.focus()
  }, [trashed])

  /** Card `index` is about to go: its neighbour's same button takes focus, or the empty state if it was the last. */
  function handOverFocus(index: number, button: 'restore' | 'delete') {
    const neighbour = trashed?.[index + 1] ?? trashed?.[index - 1]
    focusNext.current = neighbour ? { id: neighbour.id, button } : 'empty'
  }

  async function emptyAll() {
    if (!trashed?.length) return
    const ok = await ask({
      title: 'Empty Trash?',
      body: <p>This permanently deletes {plural(trashed.length, 'task')}, with any attachments. It can’t be undone.</p>,
      confirmLabel: 'Delete forever',
      danger: true,
    })
    if (!ok) return
    focusNext.current = 'empty'
    await taskRepo.emptyTrash()
  }

  async function deleteForever(index: number) {
    if (!trashed) return
    const task = trashed[index]
    const ok = await ask({
      title: 'Delete this task forever?',
      body: (
        <p>
          <strong className="font-semibold">“{task.title}”</strong> will be deleted for good, with any attachments. This can’t be
          undone.
        </p>
      ),
      confirmLabel: 'Delete forever',
      danger: true,
    })
    if (!ok) return
    // The button that asked is about to disappear with its card.
    handOverFocus(index, 'delete')
    await taskRepo.purge([task.id])
  }

  if (!trashed) return null

  if (trashed.length === 0) {
    return (
      <>
        <EmptyState icon={Trash2} title="Nothing in Trash">
          Deleted tasks wait here for {TRASH_RETENTION_DAYS} days before they go for good.
        </EmptyState>
        {confirmDialog}
      </>
    )
  }

  return (
    <section>
      <div className={`${card} mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5`}>
        <p className="text-sm text-muted">Tasks here are deleted for good after {TRASH_RETENTION_DAYS} days.</p>
        <button onClick={emptyAll} className={btn.danger}>
          <Trash2 className="size-4" /> Empty trash
        </button>
      </div>
      <AnimatedList ref={listRef} aria-label="Trashed tasks" className="grid gap-3 md:grid-cols-2">
        {trashed.map((t, i) => {
          const daysLeft = Math.max(0, Math.ceil((t.deletedAt! + TRASH_RETENTION_DAYS * DAY - now) / DAY))
          return (
            <AnimatedItem
              key={t.id}
              index={i}
              data-trash-id={t.id}
              className={`${card} relative flex items-center gap-3 overflow-hidden py-4 pr-3 pl-5`}
            >
              {/* A taupe stripe: the low-emphasis colour, as these tasks are set aside. */}
              <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${panel.neutral}`} />
              <div className="min-w-0 flex-1">
                {/* No strike-through: here that would read as done. The taupe stripe and the dates say it's set aside. */}
                <div className="line-clamp-2 text-[15px] leading-5 font-medium break-words">{t.title}</div>
                <div className="mt-1 text-xs text-muted">
                  Deleted {new Date(t.deletedAt!).toLocaleDateString('en-GB')} · {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                </div>
              </div>
              <button
                onClick={() => {
                  handOverFocus(i, 'restore')
                  void onRestore(t)
                }}
                aria-label={`Restore "${t.title}"`}
                data-restore
                className={btn.secondary}
              >
                <RotateCcw className="size-4" /> Restore
              </button>
              <button
                onClick={() => deleteForever(i)}
                aria-label={`Delete "${t.title}" forever`}
                title="Delete forever"
                data-delete-forever
                className={btn.icon}
              >
                <Trash2 className="size-4" />
              </button>
            </AnimatedItem>
          )
        })}
      </AnimatedList>
      {confirmDialog}
    </section>
  )
}
