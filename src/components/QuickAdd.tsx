import { useMemo, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { taskRepo } from '../db/tasks'
import { projectRepo, tagRepo } from '../db/labels'
import { parseQuickAdd } from '../lib/quickAdd'
import { formatDeadline } from '../lib/deadline'
import { formatEffort } from '../lib/effort'
import { PRIORITY_LABEL } from '../types'

const hint = 'rounded-md bg-surface px-1.5 py-0.5 font-medium text-fg ring-1 ring-line ring-inset'

export function QuickAdd() {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const parsed = useMemo(() => (text.trim() ? parseQuickAdd(text) : null), [text])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!parsed) return
    try {
      if (!parsed.title) throw new Error('Add a title as well as the #tags, @project or date')
      const project = parsed.projectName ? await projectRepo.findOrCreate(parsed.projectName) : undefined
      const tags = await Promise.all(parsed.tagNames.map((n) => tagRepo.findOrCreate(n)))
      await taskRepo.create({
        title: parsed.title,
        priority: parsed.priority,
        deadline: parsed.deadline,
        effortMinutes: parsed.effortMinutes,
        projectId: project?.id,
        tagIds: tags.map((t) => t.id),
      })
      setText('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-3">
      <div className="group relative">
        <span className="pointer-events-none absolute top-1/2 left-3 grid size-6 -translate-y-1/2 place-items-center rounded-md bg-primary-soft text-primary transition-colors duration-200 group-focus-within:bg-primary group-focus-within:text-on-primary">
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
        </span>
        <input
          id="quick-add"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
          placeholder="Quick add: Pay rent #finance @home !high ~30m tomorrow 5pm"
          aria-label="Quick add task"
          className="w-full rounded-xl border border-line-strong bg-surface py-3.5 pr-12 pl-12 text-[15px] shadow-card transition-[border-color,box-shadow] duration-200 placeholder:text-muted/70 hover:border-muted/40 focus:border-ring focus:shadow-[0_0_0_4px_var(--primary-soft)] focus:outline-none"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 transition-opacity group-focus-within:opacity-0 max-sm:hidden" aria-hidden>
          N
        </kbd>
      </div>
      {parsed && (
        <div role="group" aria-label="Quick add preview" className="mt-2 flex animate-fade-up flex-wrap items-center gap-1.5 rounded-lg bg-subtle px-3 py-2 text-xs text-muted">
          <span className="font-medium text-fg">{parsed.title || '(no title)'}</span>
          {parsed.projectName && <span className={hint}>@{parsed.projectName}</span>}
          {parsed.tagNames.map((t) => (
            <span key={t} className={hint}>#{t}</span>
          ))}
          {parsed.priority && <span className={hint}>{PRIORITY_LABEL[parsed.priority]}</span>}
          {parsed.effortMinutes && <span className={hint}>~{formatEffort(parsed.effortMinutes)}</span>}
          {parsed.deadline && <span className={hint}>{formatDeadline(parsed.deadline)}</span>}
          <span className="ml-auto inline-flex items-center gap-1.5"><kbd>↵</kbd> to add</span>
        </div>
      )}
      {error && <p className="mt-1.5 px-1 text-xs text-danger">{error}</p>}
    </form>
  )
}
