import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Link2, Paperclip, X } from 'lucide-react'
import { checkFileSize, formatBytes, normaliseUrl, type PendingAttachment } from '../db/attachments'
import type { Attachment } from '../types'
import { btn, field } from '../ui'

interface Props {
  existing: Attachment[]
  removed: string[]
  onRemovedChange: (ids: string[]) => void
  pending: PendingAttachment[]
  onPendingChange: (p: PendingAttachment[]) => void
}

/** Opens a stored file. Object URLs are revoked when the editor closes. */
function useObjectUrls(items: Attachment[]) {
  const urls = useMemo(
    () => new Map(items.filter((a) => a.blob).map((a) => [a.id, URL.createObjectURL(a.blob!)])),
    [items],
  )
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])
  return urls
}

export function AttachmentsEditor({ existing, removed, onRemovedChange, pending, onPendingChange }: Props) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const kept = existing.filter((a) => !removed.includes(a.id))
  const fileUrls = useObjectUrls(existing)

  function addLink() {
    try {
      const href = normaliseUrl(url)
      onPendingChange([...pending, { kind: 'link', url: href, name: href }])
      setUrl('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function addFiles(files: FileList | null) {
    if (!files) return
    const ok: PendingAttachment[] = []
    const tooBig: string[] = []
    for (const file of Array.from(files)) {
      try {
        checkFileSize(file)
        ok.push({ kind: 'file', file })
      } catch {
        tooBig.push(file.name)
      }
    }
    onPendingChange([...pending, ...ok])
    setError(tooBig.length ? `Too large (max 10 MB): ${tooBig.join(', ')}` : null)
    if (fileInput.current) fileInput.current.value = ''
  }

  const row = 'flex items-center gap-2 rounded-md bg-subtle px-2 py-1.5 text-sm'

  return (
    <div className="space-y-1.5">
      {kept.map((a) => (
        <div key={a.id} className={row}>
          {a.kind === 'link' ? <Link2 className="size-4 shrink-0 text-muted" /> : <FileText className="size-4 shrink-0 text-muted" />}
          <a
            // Imported backups are untrusted, so only ever link to http(s) URLs.
            href={a.kind === 'link' ? (a.url && /^https?:\/\//i.test(a.url) ? a.url : undefined) : fileUrls.get(a.id)}
            {...(a.kind === 'file' ? { download: a.name } : {})}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-primary hover:underline"
          >
            {a.name}
          </a>
          {a.size !== undefined && <span className="text-xs text-muted">{formatBytes(a.size)}</span>}
          <button type="button" onClick={() => onRemovedChange([...removed, a.id])} aria-label={`Remove ${a.name}`} className="rounded p-0.5 text-muted hover:text-fg">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      {pending.map((p, i) => {
        const name = p.kind === 'link' ? p.name : p.file.name
        return (
          <div key={`${name}-${i}`} className={`${row} border border-dashed border-line-strong bg-transparent`}>
            {p.kind === 'link' ? <Link2 className="size-4 shrink-0 text-muted" /> : <FileText className="size-4 shrink-0 text-muted" />}
            <span className="min-w-0 flex-1 truncate">{name}</span>
            {p.kind === 'file' && <span className="text-xs text-muted">{formatBytes(p.file.size)}</span>}
            <span className="text-xs text-muted">unsaved</span>
            <button type="button" onClick={() => onPendingChange(pending.filter((_, j) => j !== i))} aria-label={`Remove ${name}`} className="rounded p-0.5 text-muted hover:text-fg">
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}

      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addLink()
            }
          }}
          placeholder="Paste a link and press Enter"
          aria-label="Add link"
          className={field}
        />
        <button type="button" onClick={() => fileInput.current?.click()} className={btn.secondary}>
          <Paperclip className="size-4" /> File
        </button>
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
