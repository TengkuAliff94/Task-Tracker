import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { projectRepo, tagRepo } from '../db/labels'
import { useConfirm } from '../hooks/useConfirm'
import { plural } from '../lib/utils'
import type { Label } from '../types'
import { btn, field } from '../ui'
import { Dialog } from './Dialog'

interface Props {
  projects: Label[]
  tags: Label[]
  onClose: () => void
}

type Repo = typeof projectRepo | typeof tagRepo
type Kind = 'project' | 'tag'

const errText = (err: unknown) => (err instanceof Error ? err.message : String(err))

interface RowProps {
  label: Label
  repo: Repo
  kind: Kind
  ask: ReturnType<typeof useConfirm>[1]
  /** Called once the label is deleted, so focus can move on from the row that's gone. */
  onRemoved: () => void
}

function LabelRow({ label, repo, kind, ask, onRemoved }: RowProps) {
  const [name, setName] = useState(label.name)
  const [error, setError] = useState<string | null>(null)

  async function save(patch: Partial<Omit<Label, 'id'>>) {
    try {
      await repo.update(label.id, patch)
      setError(null)
    } catch (err) {
      setError(errText(err))
      setName(label.name)
    }
  }

  async function remove() {
    try {
      const count = await repo.countTasks(label.id)
      const effect =
        count === 0
          ? 'No tasks use it.'
          : kind === 'project'
            ? `${plural(count, 'task')} will move to “No project”.`
            : `It will be removed from ${plural(count, 'task')}.`
      const ok = await ask({
        title: `Delete this ${kind}?`,
        body: (
          <p>
            <strong className="font-semibold">“{label.name}”</strong> will be deleted. {effect}
          </p>
        ),
        confirmLabel: `Delete ${kind}`,
        danger: true,
      })
      if (!ok) return
      await repo.remove(label.id)
      onRemoved()
    } catch (err) {
      setError(errText(err))
    }
  }

  return (
    <li className="py-1" data-label-id={label.id}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`Color for ${label.name}`}
          value={label.color}
          onChange={(e) => save({ color: e.target.value })}
          className="size-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          aria-label={`Name of ${label.name}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== label.name && save({ name })}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-2 py-1 text-sm hover:border-line focus:border-ring"
        />
        <button type="button" onClick={remove} aria-label={`Delete ${label.name}`} data-delete-label className={btn.icon}>
          <Trash2 className="size-4" />
        </button>
      </div>
      {error && <p className="ml-9 text-xs text-danger">{error}</p>}
    </li>
  )
}

function Section({ title, items, repo, kind }: { title: string; items: Label[]; repo: Repo; kind: Kind }) {
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, ask] = useConfirm()
  const listRef = useRef<HTMLUListElement>(null)
  const newNameRef = useRef<HTMLInputElement>(null)

  /** The deleted row's neighbour takes focus (its Delete button), or the New name field when it was the last. */
  function focusAfterRemoving(index: number) {
    const neighbour = items[index + 1] ?? items[index - 1]
    // Wait a frame for the live query to drop the row.
    requestAnimationFrame(() => {
      const next = neighbour && listRef.current?.querySelector<HTMLElement>(`[data-label-id="${CSS.escape(neighbour.id)}"] [data-delete-label]`)
      ;(next ?? newNameRef.current)?.focus()
    })
  }

  async function add() {
    try {
      await repo.create(newName)
      setNewName('')
      setError(null)
    } catch (err) {
      setError(errText(err))
    }
  }

  return (
    <section>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      {items.length === 0 && <p className="py-1 text-sm text-muted">None yet.</p>}
      <ul ref={listRef}>
        {items.map((l, i) => (
          <LabelRow key={l.id} label={l} repo={repo} kind={kind} ask={ask} onRemoved={() => focusAfterRemoving(i)} />
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          ref={newNameRef}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={`New ${kind}`}
          aria-label={`New ${kind} name`}
          className={field}
        />
        <button type="button" onClick={add} className={btn.secondary}>
          Add
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {confirmDialog}
    </section>
  )
}

export function LabelManager({ projects, tags, onClose }: Props) {
  return (
    <Dialog title="Projects & tags" onClose={onClose}>
      <div className="space-y-6">
        <Section title="Projects" items={projects} repo={projectRepo} kind="project" />
        <Section title="Tags" items={tags} repo={tagRepo} kind="tag" />
      </div>
    </Dialog>
  )
}
