import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { card, PRIORITY_PANEL } from '../ui'
import { POP_FROM } from './motion/presets'
import { Reveal } from './motion/Reveal'
import { taskRepo } from '../db/tasks'
import { projectRepo, tagRepo } from '../db/labels'
import { parseQuickAdd } from '../lib/quickAdd'
import { formatDeadline } from '../lib/deadline'
import { formatEffort } from '../lib/effort'
import { PRIORITY_LABEL } from '../types'

/**
 * One recognised token in the preview. It pops in when the parser first picks it up; the key
 * includes the value, so changing a token pops in its new version.
 */
function Chip({ children, className = 'bg-surface text-fg' }: { children: ReactNode; className?: string }) {
  return (
    <Reveal from={POP_FROM} className={`rounded-md px-1.5 py-0.5 font-medium ${className}`}>
      {children}
    </Reveal>
  )
}

export function QuickAdd() {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const parsed = useMemo(() => (text.trim() ? parseQuickAdd(text) : null), [text])
  const deadlineLabel = parsed?.deadline && formatDeadline(parsed.deadline)

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
    // The panel lifts and glows while you type in it (including after pressing N).
    <form
      onSubmit={handleSubmit}
      className={`${card} p-2 transition-[translate] duration-200 ease-out-soft focus-within:-translate-y-0.5 focus-within:shadow-[0_0_0_3px_var(--primary-soft),var(--shadow-pop)] sm:p-2.5`}
    >
      <div className="group relative">
        <span className="pointer-events-none absolute top-1/2 left-3 grid size-7 -translate-y-1/2 place-items-center rounded-lg bg-primary-soft text-primary transition-[background-color,color,rotate] duration-200 group-focus-within:rotate-90 group-focus-within:bg-primary group-focus-within:text-on-primary">
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
          className="w-full rounded-xl bg-transparent py-3.5 pr-12 pl-13 text-base placeholder:text-muted/70 focus:outline-none sm:py-4"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 transition-opacity group-focus-within:opacity-0 max-sm:hidden" aria-hidden>
          N
        </kbd>
      </div>
      {parsed && (
        <div role="group" aria-label="Quick add preview" className="mt-1 flex animate-fade-up flex-wrap items-center gap-1.5 rounded-lg bg-subtle px-3 py-2 text-xs text-muted">
          <span className="font-medium text-fg">{parsed.title || '(no title)'}</span>
          {parsed.projectName && <Chip key={`@${parsed.projectName}`}>@{parsed.projectName}</Chip>}
          {parsed.tagNames.map((t) => (
            <Chip key={`#${t}`}>#{t}</Chip>
          ))}
          {parsed.priority && <Chip key={`!${parsed.priority}`} className={PRIORITY_PANEL[parsed.priority]}>{PRIORITY_LABEL[parsed.priority]}</Chip>}
          {parsed.effortMinutes && <Chip key={`~${parsed.effortMinutes}`}>~{formatEffort(parsed.effortMinutes)}</Chip>}
          {deadlineLabel && <Chip key={`d${deadlineLabel}`}>{deadlineLabel}</Chip>}
          <span className="ml-auto inline-flex items-center gap-1.5"><kbd>↵</kbd> to add</span>
        </div>
      )}
      {error && <p className="mt-1.5 px-1 text-xs text-danger">{error}</p>}
    </form>
  )
}
