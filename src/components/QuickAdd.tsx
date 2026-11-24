import { useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type FormEvent, type ReactNode, type Ref } from 'react'
import { flushSync } from 'react-dom'
import { CircleHelp, Plus } from 'lucide-react'
import { FieldError } from './FieldError'
import { PHONE_QUERY, useMediaQuery } from '../hooks/useMediaQuery'
import { btn, card, PRIORITY_TONE } from '../ui'
import { cn } from '../lib/utils'
import { placeBelow } from './Menu'
import { QuickAddSyntax } from './QuickAddSyntax'
import { POP_FROM } from './motion/presets'
import { Reveal } from './motion/Reveal'
import { PriorityGlyph } from './PriorityGlyph'
import { taskRepo } from '../db/tasks'
import { projectRepo, tagRepo } from '../db/labels'
import { parseQuickAdd, QUICK_ADD_EXAMPLE } from '../lib/quickAdd'
import { formatDeadline } from '../lib/deadline'
import { formatEffort } from '../lib/effort'
import { PRIORITY_LABEL, type Label } from '../types'

/**
 * One recognised token in the preview. It pops in when the parser first picks it up; the key
 * includes the value, so changing a token pops in its new version.
 */
function Chip({ children, className = 'bg-surface text-fg' }: { children: ReactNode; className?: string }) {
  return (
    <Reveal from={POP_FROM} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium ${className}`}>
      {children}
    </Reveal>
  )
}

/** The quick-add syntax, as the full placeholder shows it from `sm` and the hint shows it on phones. */
const SYNTAX: ReactNode[] = ['#tag', '@project', '!high', '~30m', 'tomorrow 5pm'].map((token, i) => (
  <span key={token}>
    {i > 0 && ' '}
    <span className="font-medium text-fg">{token}</span>
  </span>
))

/**
 * A typed project or tag name as the task will show it: an existing label's own spelling when one
 * matches (the lookup ignores case, like `findOrCreate`), else the name as typed.
 */
function shownName(labels: Label[], typed: string): string {
  const key = typed.trim().toLowerCase()
  return labels.find((l) => l.name.trim().toLowerCase() === key)?.name ?? typed
}

/** Lets the empty state's Try button put a line in the bar. */
export interface QuickAddHandle {
  /** Puts `text` in the field and focuses it with the caret at the end, so the preview shows what it reads. Nothing is saved. */
  fill: (text: string) => void
}

export function QuickAdd({ projects, tags: knownTags, ref }: { projects: Label[]; tags: Label[]; ref?: Ref<QuickAddHandle> }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  // On phones the full example placeholder is cut off mid-token, so it shortens and the syntax
  // moves to a hint under the field while it's focused and empty.
  const phone = useMediaQuery(PHONE_QUERY)
  const hintId = useId()
  const errorId = useId()
  const helpId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const helpRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    fill(line) {
      // Rendered at once, so the caret can go after the new text.
      flushSync(() => {
        setText(line)
        setError(null)
      })
      const input = inputRef.current
      if (!input) return
      input.focus()
      input.setSelectionRange(line.length, line.length)
    },
  }))

  // The syntax hangs just under the panel, lined up with its right edge (so 16px from the screen's on phones).
  useEffect(() => {
    const help = helpRef.current
    if (!help) return
    const place = () => formRef.current && placeBelow(formRef.current, help)
    help.addEventListener('beforetoggle', place)
    return () => help.removeEventListener('beforetoggle', place)
  }, [])
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
      ref={formRef}
      onSubmit={handleSubmit}
      className={`${card} p-2 transition-[translate] duration-200 ease-out-soft focus-within:-translate-y-0.5 focus-within:shadow-[0_0_0_3px_var(--primary-soft),var(--shadow-pop)] sm:p-2.5`}
    >
      <div className="group relative">
        <span className="pointer-events-none absolute top-1/2 left-3 grid size-7 -translate-y-1/2 place-items-center rounded-lg bg-primary-soft text-primary transition-[background-color,color,rotate] duration-200 group-focus-within:rotate-90 group-focus-within:bg-primary group-focus-within:text-on-primary">
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
        </span>
        <input
          ref={inputRef}
          id="quick-add"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={phone ? 'Quick add a task' : `Quick add: ${QUICK_ADD_EXAMPLE}`}
          aria-label="Quick add task"
          aria-invalid={error ? true : undefined}
          aria-describedby={[phone && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
          className="w-full rounded-xl bg-transparent py-3.5 pr-12 pl-13 text-base placeholder:text-muted sm:py-4 md:pr-20"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-12 -translate-y-1/2 transition-opacity group-focus-within:opacity-0 max-md:hidden" aria-hidden>
          N
        </kbd>
        {/* The full syntax, on demand: a popover (Esc or a tap elsewhere closes it), so it never covers the list. */}
        <button
          type="button"
          popoverTarget={helpId}
          aria-label="Quick add syntax"
          title="Quick add syntax"
          className={cn(btn.icon, 'absolute inset-y-0 right-1.5 my-auto sm:right-2')}
        >
          <CircleHelp className="size-4.5" aria-hidden />
        </button>
        <div
          ref={helpRef}
          id={helpId}
          popover="auto"
          aria-labelledby={`${helpId}-title`}
          className="inset-auto m-0 w-80 max-w-[calc(100vw-2rem)] animate-fade-up rounded-panel border-0 bg-raised p-4 text-fg shadow-pop"
        >
          <h2 id={`${helpId}-title`} className="mb-3 text-sm font-bold">
            Quick add syntax
          </h2>
          <QuickAddSyntax />
        </div>
      </div>
      {parsed && (
        <div role="group" aria-label="Quick add preview" className="mt-1 flex animate-fade-up flex-wrap items-center gap-1.5 rounded-lg bg-subtle px-3 py-2 text-xs text-muted">
          <span className="font-medium text-fg">{parsed.title || '(no title)'}</span>
          {parsed.projectName && <Chip key={`@${parsed.projectName}`}>@{shownName(projects, parsed.projectName)}</Chip>}
          {parsed.tagNames.map((t) => (
            <Chip key={`#${t}`}>#{shownName(knownTags, t)}</Chip>
          ))}
          {parsed.priority && <Chip key={`!${parsed.priority}`} className={parsed.priority === 'urgent' ? PRIORITY_TONE.urgent.badge : undefined}>
              <PriorityGlyph priority={parsed.priority} />
              {PRIORITY_LABEL[parsed.priority]}
            </Chip>}
          {parsed.effortMinutes && <Chip key={`~${parsed.effortMinutes}`}>~{formatEffort(parsed.effortMinutes)}</Chip>}
          {deadlineLabel && <Chip key={`d${deadlineLabel}`}>{deadlineLabel}</Chip>}
          <span className="ml-auto inline-flex items-center gap-1.5"><kbd>↵</kbd> to add</span>
        </div>
      )}
      {/* Always there on phones, so the field can point at it; only drawn while it helps. */}
      {phone && (
        <p
          id={hintId}
          className={
            focused && !text
              ? 'mt-1 animate-fade-up rounded-lg bg-subtle px-3 py-2 text-xs text-muted'
              : 'sr-only'
          }
        >
          Add details as you type: {SYNTAX}
        </p>
      )}
      {error && (
        <div className="mt-1.5 px-1">
          <FieldError id={errorId}>{error}</FieldError>
        </div>
      )}
    </form>
  )
}
