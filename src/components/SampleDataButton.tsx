import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { db } from '../db/db'
import { sampleData } from '../db/sample'
import { btn } from '../ui'

/**
 * Adds the demo projects, tags and tasks. When tasks already exist it asks first,
 * since the sample set is added alongside them and never replaces anything.
 */
export function SampleDataButton({ onLoaded, className = btn.secondary }: { onLoaded?: (count: number) => void; className?: string }) {
  const [busy, setBusy] = useState(false)

  async function load() {
    setBusy(true)
    try {
      const existing = await db.tasks.count()
      if (
        existing > 0 &&
        !confirm(
          `Add sample tasks alongside your ${existing} existing task(s)?\n\n` +
            `Nothing is replaced. Projects and tags with the same names are reused.`,
        )
      )
        return
      const count = await sampleData.load()
      onLoaded?.(count)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button onClick={load} disabled={busy} className={className}>
      <Sparkles className="size-4" /> Load sample data
    </button>
  )
}
