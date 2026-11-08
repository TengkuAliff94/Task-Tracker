import { useState } from 'react'
import { projectRepo } from '../db/labels'
import type { Label } from '../types'

interface Props {
  projects: Label[]
  value?: string
  onChange: (id: string | undefined) => void
  className: string
}

const NEW = '__new__'

/** A project dropdown with a "New project…" option that turns into an inline name input. */
export function ProjectPicker({ projects, value, onChange, className }: Props) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function create() {
    try {
      const p = await projectRepo.create(name)
      onChange(p.id)
      setCreating(false)
      setName('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  if (creating) {
    return (
      <div>
        <div className="flex gap-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                create()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setCreating(false)
              }
            }}
            placeholder="Project name"
            aria-label="New project name"
            className={className}
          />
          <button type="button" onClick={create} className="rounded-md bg-slate-200 px-2 text-sm dark:bg-slate-700">
            Add
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    )
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        if (e.target.value === NEW) setCreating(true)
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
