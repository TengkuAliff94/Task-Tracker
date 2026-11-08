import { useLiveQuery } from 'dexie-react-hooks'
import { RotateCcw, Trash2 } from 'lucide-react'
import { taskRepo, TRASH_RETENTION_DAYS } from '../db/tasks'
import { btn, card } from '../ui'

const DAY = 86_400_000

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

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">Tasks here are deleted for good after {TRASH_RETENTION_DAYS} days.</p>
        {trashed.length > 0 && (
          <button onClick={emptyAll} className={btn.danger}>
            <Trash2 className="size-4" /> Empty trash
          </button>
        )}
      </div>
      {trashed.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong p-8 text-center text-muted">Trash is empty.</p>
      ) : (
        <ul className={`${card} divide-y divide-line overflow-hidden`}>
          {trashed.map((t) => {
            const daysLeft = Math.max(0, Math.ceil((t.deletedAt! + TRASH_RETENTION_DAYS * DAY - now) / DAY))
            return (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="text-xs text-muted">
                    Deleted {new Date(t.deletedAt!).toLocaleDateString('en-GB')} · {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                  </div>
                </div>
                <button onClick={() => taskRepo.restore(t.id)} className={btn.secondary}>
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
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
