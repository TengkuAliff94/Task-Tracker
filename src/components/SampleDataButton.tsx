import { useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { looksLoaded, sampleData } from '../db/sample'
import { taskRepo } from '../db/tasks'
import { useConfirm } from '../hooks/useConfirm'
import { plural } from '../lib/utils'
import { btn } from '../ui'

/**
 * Adds the demo projects, tags and tasks. When tasks already exist it asks first,
 * since the sample set is added alongside them and never replaces anything.
 * `variant`: `ink` for the first-run empty state, where it's the main action (New task keeps the one brand button); `ghost` in Backup & restore,
 * where it must not read as a peer of Restore.
 */
export function SampleDataButton({
  onLoaded,
  variant = 'secondary',
}: {
  onLoaded?: (count: number) => void
  variant?: 'ink' | 'secondary' | 'ghost'
}) {
  const [busy, setBusy] = useState(false)
  const [confirmDialog, ask] = useConfirm()
  /** Set at once on click, so a quick second click can't start a second load before busy renders. */
  const running = useRef(false)

  async function load() {
    if (running.current) return
    running.current = true
    try {
      await askThenLoad()
    } finally {
      running.current = false
    }
  }

  async function askThenLoad() {
    // Ask before going busy: a disabled button drops focus, and the question hands focus back to it.
    // Only the list counts: tasks in Trash are set aside, so they neither need asking about nor add to the count.
    const existing = (await taskRepo.list()).length
    if (existing > 0) {
      // Already here (most of the set, so one task ticked off into Trash doesn't hide it): say so,
      // rather than quietly adding a second copy.
      const present = await sampleData.inList()
      const { size } = sampleData
      const ok = await ask(
        looksLoaded(present, size)
          ? {
              title: 'Sample tasks are already here',
              body: (
                <p>
                  {present === size
                    ? `All ${size} sample tasks are already in your list. Loading again adds a second copy of each.`
                    : `${present} of the ${size} sample tasks are already in your list. Loading again adds all ${size}, so those ${present} show twice.`}
                </p>
              ),
              confirmLabel: 'Add another copy',
            }
          : {
              title: 'Add sample tasks?',
              body: (
                <p>
                  They go alongside your {plural(existing, 'existing task')}. Nothing is replaced. Projects and tags with the same
                  names are reused.
                </p>
              ),
              confirmLabel: 'Add sample tasks',
            },
      )
      if (!ok) return
    }
    setBusy(true)
    try {
      const count = await sampleData.load()
      onLoaded?.(count)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button onClick={load} disabled={busy} className={variant === 'ghost' ? `${btn.ghost} -ms-3` : btn[variant]}>
        <Sparkles className="size-4" /> Load sample data
      </button>
      {confirmDialog}
    </>
  )
}
