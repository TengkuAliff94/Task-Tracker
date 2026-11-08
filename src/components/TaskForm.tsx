import { lazy, Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Trash2, X } from 'lucide-react'
import { taskRepo } from '../db/tasks'
import { attachmentRepo, type PendingAttachment } from '../db/attachments'
import { formatEffort, parseEffort } from '../lib/effort'
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  type Attachment,
  type Deadline,
  type Label,
  type Priority,
  type Status,
  type Task,
} from '../types'
import { btn, dialog, field, labelText } from '../ui'
import { ProjectPicker } from './ProjectPicker'
import { TagPicker } from './TagPicker'
import { RecurrenceEditor } from './RecurrenceEditor'
import { RemindersEditor } from './RemindersEditor'
import { ChecklistEditor } from './ChecklistEditor'
import { AttachmentsEditor } from './AttachmentsEditor'

// Loaded on first Preview so the Markdown library stays out of the main bundle.
const Markdown = lazy(() => import('./Markdown').then((m) => ({ default: m.Markdown })))

interface Props {
  task?: Task // absent = create
  projects: Label[]
  tags: Label[]
  onClose: () => void
  onTrash: (task: Task) => void
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <span className={labelText}>{label}</span>
      {children}
    </div>
  )
}

export function TaskForm({ task, projects, tags, onClose, onTrash }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [preview, setPreview] = useState(false)
  const [status, setStatus] = useState<Status>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [date, setDate] = useState(task?.deadline?.date ?? '')
  const [time, setTime] = useState(task?.deadline?.time ?? '')
  const [projectId, setProjectId] = useState(task?.projectId)
  const [tagIds, setTagIds] = useState(task?.tagIds ?? [])
  const [effort, setEffort] = useState(task?.effortMinutes ? formatEffort(task.effortMinutes) : '')
  const [reminders, setReminders] = useState(task?.reminders ?? [])
  const [recurrence, setRecurrence] = useState(task?.recurrence)
  const [checklist, setChecklist] = useState(task?.checklist ?? [])
  const [existingFiles, setExistingFiles] = useState<Attachment[]>([])
  const [removedFiles, setRemovedFiles] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const el = dialogRef.current
    if (el && !el.open) el.showModal()
  }, [])

  useEffect(() => {
    if (task) attachmentRepo.listForTask(task.id).then(setExistingFiles)
  }, [task])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const deadline: Deadline | undefined = date ? { date, time: time || undefined } : undefined
    const effortMinutes = parseEffort(effort)
    if (effort.trim() && effortMinutes === undefined) {
      setError('Effort should look like 30m, 2h or 1h30m')
      return
    }
    const fields = {
      title,
      description,
      status,
      priority,
      deadline,
      projectId,
      tagIds,
      effortMinutes,
      reminders,
      checklist: checklist.filter((c) => c.text.trim()),
      recurrence: deadline ? recurrence : undefined,
    }
    setSaving(true)
    try {
      let id = task?.id
      if (id) await taskRepo.update(id, fields)
      else id = (await taskRepo.create(fields)).id
      if (pendingFiles.length || removedFiles.length) await attachmentRepo.apply(id, pendingFiles, removedFiles)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const tab = (active: boolean) =>
    `rounded px-2 py-0.5 text-xs font-medium ${active ? 'bg-subtle text-fg' : 'text-muted hover:text-fg'}`

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-label={task ? 'Edit task' : 'New task'} className={`${dialog} max-w-2xl`}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold">{task ? 'Edit task' : 'New task'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={btn.icon}>
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <Field label="Title">
            <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
          </Field>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={labelText}>Description</span>
              <div className="flex gap-1" role="tablist">
                <button type="button" role="tab" aria-selected={!preview} onClick={() => setPreview(false)} className={tab(!preview)}>
                  Write
                </button>
                <button type="button" role="tab" aria-selected={preview} onClick={() => setPreview(true)} className={tab(preview)}>
                  Preview
                </button>
              </div>
            </div>
            {preview ? (
              <div className="min-h-24 rounded-md border border-line px-3 py-2">
                {description.trim() ? (
                  <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
                    <Markdown text={description} />
                  </Suspense>
                ) : (
                  <p className="text-sm text-muted">Nothing to preview.</p>
                )}
              </div>
            ) : (
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Markdown supported: **bold**, - lists, [links](https://…)"
                aria-label="Description"
                className={field}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} aria-label="Status" className={field}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} aria-label="Priority" className={field}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                ))}
              </select>
            </Field>
            <Field label="Effort">
              <input value={effort} onChange={(e) => setEffort(e.target.value)} placeholder="e.g. 30m, 2h" aria-label="Effort" className={field} />
            </Field>
            <Field label="Deadline">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Deadline date" className={field} />
            </Field>
            <Field label="Time (optional)">
              <input type="time" value={time} disabled={!date} onChange={(e) => setTime(e.target.value)} aria-label="Deadline time" className={field} />
            </Field>
            <Field label="Project">
              <ProjectPicker projects={projects} value={projectId} onChange={setProjectId} className={field} />
            </Field>
          </div>

          <Field label="Tags">
            <TagPicker tags={tags} value={tagIds} onChange={setTagIds} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Repeat">
              <RecurrenceEditor value={recurrence} onChange={setRecurrence} hasDeadline={Boolean(date)} className={field} />
            </Field>
            <Field label="Reminders">
              <RemindersEditor value={reminders} onChange={setReminders} hasDeadline={Boolean(date)} className={field} />
            </Field>
          </div>

          <Field label="Checklist">
            <ChecklistEditor value={checklist} onChange={setChecklist} />
          </Field>

          <Field label="Attachments">
            <AttachmentsEditor
              existing={existingFiles}
              removed={removedFiles}
              onRemovedChange={setRemovedFiles}
              pending={pendingFiles}
              onPendingChange={setPendingFiles}
            />
          </Field>

          {task && (
            <p className="text-xs text-muted">
              Added {new Date(task.createdAt).toLocaleString('en-GB', { hour12: false })}
              {task.completedAt && ` · Completed ${new Date(task.completedAt).toLocaleString('en-GB', { hour12: false })}`}
            </p>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="flex items-center gap-2 border-t border-line px-6 py-4">
          {task && (
            <button type="button" onClick={() => onTrash(task)} className={btn.danger}>
              <Trash2 className="size-4" /> Delete
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className={btn.ghost}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={btn.primary}>
              {task ? 'Save' : 'Add task'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
