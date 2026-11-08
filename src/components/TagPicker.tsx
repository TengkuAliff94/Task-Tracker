import { useState } from 'react'
import { tagRepo } from '../db/labels'
import type { Label } from '../types'
import { LabelChip } from './LabelChip'

interface Props {
  tags: Label[]
  value: string[]
  onChange: (ids: string[]) => void
}

/** Selected tags as chips, plus an input that suggests existing tags and creates new ones on Enter. */
export function TagPicker({ tags, value, onChange }: Props) {
  const [text, setText] = useState('')
  const byId = new Map(tags.map((t) => [t.id, t]))
  const available = tags.filter((t) => !value.includes(t.id))

  async function add(name: string) {
    const clean = name.trim().replace(/^#/, '')
    if (!clean) return
    const tag = await tagRepo.findOrCreate(clean)
    if (!value.includes(tag.id)) onChange([...value, tag.id])
    setText('')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800">
      {value.map((id) => {
        const t = byId.get(id)
        return t ? (
          <LabelChip key={id} name={t.name} color={t.color} prefix="#" onRemove={() => onChange(value.filter((x) => x !== id))} />
        ) : null
      })}
      <input
        list="tag-suggestions"
        value={text}
        onChange={(e) => {
          const v = e.target.value
          // Picking a suggestion from the datalist adds it straight away.
          if (available.some((t) => t.name === v)) add(v)
          else setText(v)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add(text)
          } else if (e.key === 'Backspace' && !text && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        placeholder={value.length ? '' : 'Add tags…'}
        aria-label="Add tag"
        className="min-w-24 flex-1 bg-transparent text-sm focus:outline-none"
      />
      <datalist id="tag-suggestions">
        {available.map((t) => (
          <option key={t.id} value={t.name} />
        ))}
      </datalist>
    </div>
  )
}
