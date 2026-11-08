import { useMemo, useState, type FormEvent } from 'react'
import { taskRepo } from '../db/tasks'
import { projectRepo, tagRepo } from '../db/labels'
import { parseQuickAdd } from '../lib/quickAdd'
import { formatDeadline } from '../lib/deadline'
import { formatEffort } from '../lib/effort'
import { PRIORITY_LABEL } from '../types'

const hint = 'rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800'

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
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        id="quick-add"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
        placeholder="Quick add: Pay rent #finance @home !high ~30m tomorrow 5pm"
        aria-label="Quick add task"
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
      />
      {parsed && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-900 dark:text-slate-100">{parsed.title || '(no title)'}</span>
          {parsed.projectName && <span className={hint}>@{parsed.projectName}</span>}
          {parsed.tagNames.map((t) => (
            <span key={t} className={hint}>#{t}</span>
          ))}
          {parsed.priority && <span className={hint}>{PRIORITY_LABEL[parsed.priority]}</span>}
          {parsed.effortMinutes && <span className={hint}>~{formatEffort(parsed.effortMinutes)}</span>}
          {parsed.deadline && <span className={hint}>{formatDeadline(parsed.deadline)}</span>}
          <span className="ml-auto">Enter to add</span>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </form>
  )
}
