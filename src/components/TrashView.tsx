import { useLiveQuery } from 'dexie-react-hooks'
import { RotateCcw, Trash2 } from 'lucide-react'
import { taskRepo, TRASH_RETENTION_DAYS } from '../db/tasks'
import { btn, card, panel } from '../ui'
import { EmptyState } from './EmptyState'
import { AnimatedItem, AnimatedList } from './motion/AnimatedList'

const DAY = 86_400_000

/** Trashed tasks as cards in the same grid as the task list, each with Restore and Delete forever. */
export function TrashView() {
  const trashed = useLiveQuery(() => taskRepo.listTrash(), [])
  const now = Date.now()

  async function emptyAll() {
    if (!trashed?.length) return
    const s = trashed.length === 1 ? '' : 's'
    if (confirm(`Permanently delete ${trashed.length} task${s} and their attachments? This can't be undone.`)) {
      await taskRepo.emptyTrash()
    }
  }

  if (!trashed) return null

  if (trashed.length === 0) {
    return (
      <EmptyState icon={Trash2} title="Nothing in Trash">
        Trash is empty. Deleted tasks wait here for {TRASH_RETENTION_DAYS} days before they go for good.
      </EmptyState>
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
      <AnimatedList aria-label="Trashed tasks" className="grid gap-3 md:grid-cols-2">
        {trashed.map((t, i) => {
          const daysLeft = Math.max(0, Math.ceil((t.deletedAt! + TRASH_RETENTION_DAYS * DAY - now) / DAY))
          return (
            <AnimatedItem
              key={t.id}
              index={i}
              className={`${card} relative flex items-center gap-3 overflow-hidden py-4 pr-3 pl-5`}
            >
              {/* A taupe stripe: the low-emphasis colour, as these tasks are set aside. */}
              <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${panel.neutral}`} />
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 font-medium break-words text-muted line-through decoration-muted/50">{t.title}</div>
                <div className="mt-1 text-xs text-muted">
                  Deleted {new Date(t.deletedAt!).toLocaleDateString('en-GB')} · {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                </div>
              </div>
              <button onClick={() => taskRepo.restore(t.id)} aria-label={`Restore "${t.title}"`} className={btn.secondary}>
                <RotateCcw className="size-4" /> Restore
              </button>
              <button
                onClick={() => confirm(`Permanently delete "${t.title}"?`) && taskRepo.purge([t.id])}
                aria-label={`Delete "${t.title}" forever`}
                title="Delete forever"
                className={btn.icon}
              >
                <Trash2 className="size-4" />
              </button>
            </AnimatedItem>
          )
        })}
      </AnimatedList>
    </section>
  )
}
