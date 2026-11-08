import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { ChecklistItem } from '../types'
import { btn, field } from '../ui'

interface Props {
  value: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
}

export function ChecklistEditor({ value, onChange }: Props) {
  const [text, setText] = useState('')
  const done = value.filter((i) => i.done).length

  const update = (id: string, patch: Partial<ChecklistItem>) =>
    onChange(value.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  function add() {
    const clean = text.trim()
    if (!clean) return
    onChange([...value, { id: crypto.randomUUID(), text: clean, done: false }])
    setText('')
  }

  return (
    <div className="space-y-1.5">
      {value.length > 0 && (
        <>
          <div className="h-1 overflow-hidden rounded-full bg-subtle" aria-hidden>
            {/* Scaled, not resized, so the fill animates on transform only. */}
            <div
              className="h-full origin-left bg-primary transition-transform duration-200"
              style={{ transform: `scaleX(${done / value.length})` }}
            />
          </div>
          <ul className="space-y-0.5">
            {value.map((item) => (
              <li key={item.id} className="group flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(e) => update(item.id, { done: e.target.checked })}
                  aria-label={`Done: ${item.text}`}
                  className="size-4 accent-primary"
                />
                <input
                  value={item.text}
                  onChange={(e) => update(item.id, { text: e.target.value })}
                  onBlur={(e) => !e.target.value.trim() && onChange(value.filter((i) => i.id !== item.id))}
                  aria-label="Checklist item"
                  className={`min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm hover:border-line focus:border-ring ${item.done ? 'text-muted line-through' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => onChange(value.filter((i) => i.id !== item.id))}
                  aria-label={`Remove ${item.text}`}
                  className="rounded p-1 text-muted opacity-60 hover:bg-subtle hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="Add an item and press Enter"
          aria-label="New checklist item"
          className={field}
        />
        <button type="button" onClick={add} aria-label="Add checklist item" className={btn.secondary}>
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}
