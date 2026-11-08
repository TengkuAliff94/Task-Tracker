import { useEffect, useRef, useState } from 'react'
import { projectRepo, tagRepo } from '../db/labels'
import type { Label } from '../types'

interface Props {
  projects: Label[]
  tags: Label[]
  onClose: () => void
}

type Repo = typeof projectRepo | typeof tagRepo

function LabelRow({ label, repo, kind }: { label: Label; repo: Repo; kind: 'project' | 'tag' }) {
  const [name, setName] = useState(label.name)
  const [error, setError] = useState<string | null>(null)

  async function save(patch: Partial<Omit<Label, 'id'>>) {
    try {
      await repo.update(label.id, patch)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setName(label.name)
    }
  }

  async function remove() {
    const count = await repo.countTasks(label.id)
    const effect =
      kind === 'project'
        ? `${count} task${count === 1 ? '' : 's'} will move to "No project".`
        : `It will be removed from ${count} task${count === 1 ? '' : 's'}.`
    if (confirm(`Delete ${kind} "${label.name}"? ${effect}`)) await repo.remove(label.id)
  }

  return (
    <li className="flex items-center gap-2 py-1.5">
      <input
        type="color"
        aria-label={`Color for ${label.name}`}
        value={label.color}
        onChange={(e) => save({ color: e.target.value })}
        className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
      />
      <input
        aria-label={`Name of ${label.name}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name !== label.name && save({ name })}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-2 py-1 text-sm hover:border-slate-300 focus:border-indigo-500 focus:outline-none dark:hover:border-slate-700"
      />
      {error && <span className="text-xs text-rose-600">{error}</span>}
      <button type="button" onClick={remove} className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950">
        Delete
      </button>
    </li>
  )
}

function Section({ title, items, repo, kind }: { title: string; items: Label[]; repo: Repo; kind: 'project' | 'tag' }) {
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function add() {
    try {
      await repo.create(newName)
      setNewName('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <section>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      {items.length === 0 && <p className="py-1 text-sm text-slate-500">None yet.</p>}
      <ul>
        {items.map((l) => (
          <LabelRow key={l.id} label={l} repo={repo} kind={kind} />
        ))}
      </ul>
      <div className="mt-1 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={`New ${kind}`}
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button type="button" onClick={add} className="rounded-md bg-slate-200 px-3 py-1 text-sm dark:bg-slate-700">
          Add
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </section>
  )
}

export function LabelManager({ projects, tags, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-xl bg-white p-6 text-slate-900 shadow-xl backdrop:bg-black/40 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Projects & tags</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="text-xl leading-none text-slate-500">
          ×
        </button>
      </div>
      <div className="space-y-6">
        <Section title="Projects" items={projects} repo={projectRepo} kind="project" />
        <Section title="Tags" items={tags} repo={tagRepo} kind="tag" />
      </div>
    </dialog>
  )
}
