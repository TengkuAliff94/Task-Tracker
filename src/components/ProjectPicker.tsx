import { useId, useState } from 'react'
import { projectRepo } from '../db/labels'
import type { Label } from '../types'
import { cn } from '../lib/utils'
import { btn, INVALID_FIELD } from '../ui'
import { FieldError } from './FieldError'

interface Props {
  projects: Label[]
  value?: string
  onChange: (id: string | undefined) => void
  className: string
  /** The new project's name while one is being typed, else null. The form owns it, so Save can create it too. */
  draft: string | null
  onDraftChange: (name: string | null) => void
}

const NEW = '__new__'

/** A project dropdown with a "New project…" option that turns into an inline name input. */
export function ProjectPicker({ projects, value, onChange, className, draft, onDraftChange }: Props) {
  const [error, setError] = useState<string | null>(null)
  const errorId = useId()

  async function create() {
    try {
      const p = await projectRepo.create(draft ?? '')
      onChange(p.id)
      onDraftChange(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  if (draft !== null) {
    return (
      <div>
        <div className="flex flex-wrap gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => {
              onDraftChange(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                create()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                onDraftChange(null)
                setError(null)
              }
            }}
            placeholder="Project name"
            aria-label="New project name"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(className, 'min-w-0 flex-[1_1_6rem]', error && INVALID_FIELD)}
          />
          <button type="button" onClick={create} className={btn.secondary}>
            Add
          </button>
        </div>
        {error && (
          <div className="mt-1">
            <FieldError id={errorId}>{error}</FieldError>
          </div>
        )}
      </div>
    )
  }

  return (
    <select
      aria-label="Project"
      value={value ?? ''}
      onChange={(e) => {
        if (e.target.value === NEW) onDraftChange('')
        else onChange(e.target.value || undefined)
      }}
      className={className}
    >
      <option value="">No project</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
      <option value={NEW}>+ New project…</option>
    </select>
  )
}
