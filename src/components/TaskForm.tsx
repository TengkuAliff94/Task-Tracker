import { lazy, Suspense, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type SyntheticEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { useModalDialog } from '../hooks/useModalDialog'
import { DialogTitleBar } from './Dialog'
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
import { attentionAction, attentionQuiet, btn, dialog, field, INVERTED_PANEL, labelText, panel } from '../ui'
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

/** What went wrong while saving, in words the person can act on. */
function describeSaveError(err: unknown): string {
  const named = err as { name?: string; inner?: { name?: string } } | null
  if (named?.name === 'QuotaExceededError' || named?.inner?.name === 'QuotaExceededError') {
    return 'There isn’t enough storage space on this device to save this. Remove a large attachment or free up some space, then try again.'
  }
  return err instanceof Error ? err.message : String(err)
}

/** Inputs in the sub-editors holding text not yet added (a checklist item, a link, a tag, a project name). */
function hasUnaddedText(form: HTMLFormElement | null): boolean {
  return Array.from(form?.querySelectorAll<HTMLInputElement>('input[data-draft]') ?? []).some((el) => el.value.trim())
}

export function TaskForm({ task, projects, tags, onClose, onTrash }: Props) {
  const { ref: dialogRef, close } = useModalDialog()
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
  /** Showing the "Discard changes?" bar in place of the footer buttons. */
  const [confirming, setConfirming] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const keepEditingRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  /** Where focus was when the bar appeared, to go back to on Keep editing. */
  const returnFocus = useRef<HTMLElement | null>(null)
  const restoreFocus = useRef(false)
  /** Set just before a close that should go through: Save, Discard, Delete, or a close with nothing changed. */
  const leaving = useRef(false)
  const savingNow = useRef(false)
  /** The task's id once it exists, so a retry after a half-finished save updates it instead of adding a copy. */
  const savedId = useRef(task?.id)
  const messageId = useId()

  // Everything the form edits, as one string, so "has anything changed?" is a single comparison.
  const snapshot = JSON.stringify([title, description, status, priority, date, time, projectId, tagIds, effort, reminders, recurrence, checklist])
  const [initialSnapshot, setInitialSnapshot] = useState(snapshot)
  const isDirty = () =>
    snapshot !== initialSnapshot || pendingFiles.length > 0 || removedFiles.length > 0 || hasUnaddedText(formRef.current)

  useEffect(() => {
    if (!task) return
    let current = true
    attachmentRepo
      .listForTask(task.id)
      .then((files) => current && setExistingFiles(files))
      .catch(() => current && setError('This task’s attachments couldn’t be loaded. Close the task and open it again to retry.'))
    return () => {
      current = false
    }
  }, [task])

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [error])

  useEffect(() => {
    if (confirming) {
      keepEditingRef.current?.focus()
    } else if (restoreFocus.current) {
      restoreFocus.current = false
      // Cancel was swapped out for the bar, so if it was the button pressed, focus the new one.
      const back = returnFocus.current?.isConnected ? returnFocus.current : cancelRef.current
      back?.focus()
    }
  }, [confirming])

  function leave() {
    leaving.current = true
    close()
  }

  function askToDiscard() {
    const active = document.activeElement
    returnFocus.current = active instanceof HTMLElement && dialogRef.current?.contains(active) ? active : null
    setConfirming(true)
  }

  function keepEditing() {
    restoreFocus.current = true
    setConfirming(false)
  }

  /** The × button and Cancel. Esc and other close requests come through handleKeyDown and handleCancel. */
  function requestClose() {
    // Mid-save, Discard would be a lie: the write is already on its way.
    if (savingNow.current) return
    if (confirming) keepEditingRef.current?.focus()
    else if (isDirty()) askToDiscard()
    else leave()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    // A field that uses Esc itself (e.g. the new-project name) has already handled it.
    if (e.key !== 'Escape' || e.nativeEvent.defaultPrevented || e.nativeEvent.isComposing) return
    // Stopping Esc here, rather than only in `cancel`, also covers a second quick press, which the
    // browser may not let a page cancel.
    if (savingNow.current) {
      e.preventDefault()
    } else if (confirming) {
      e.preventDefault()
      keepEditing()
    } else if (isDirty()) {
      e.preventDefault()
      askToDiscard()
    }
  }

  /** A close request from the browser that didn't come from Esc, such as the Android back gesture. */
  function handleCancel(e: SyntheticEvent<HTMLDialogElement>) {
    if (leaving.current || !isDirty()) return
    e.preventDefault()
    if (!confirming && !savingNow.current) askToDiscard()
  }

  function handleClose() {
    // The browser can force a close it won't let us cancel. Edits must never vanish silently, so
    // put the editor straight back and ask.
    if (!leaving.current && isDirty()) {
      dialogRef.current?.showModal()
      returnFocus.current = null
      // showModal() focuses the first control (×). If the bar is already up, setConfirming(true)
      // changes nothing and its effect won't run, so move focus into the bar here.
      if (confirming) keepEditingRef.current?.focus()
      else setConfirming(true)
      return
    }
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (savingNow.current) return
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
    savingNow.current = true
    setSaving(true)
    setError(null)
    try {
      let id = savedId.current
      try {
        if (id) await taskRepo.update(id, fields)
        else savedId.current = id = (await taskRepo.create(fields)).id
      } catch (err) {
        setError(describeSaveError(err))
        return
      }
      // The fields are stored now. If the attachments fail next, only they still count as unsaved,
      // so "Discard" means exactly what it says.
      setInitialSnapshot(snapshot)
      if (pendingFiles.length || removedFiles.length) {
        try {
          // One transaction, so nothing is half-applied and Save can simply run again.
          await attachmentRepo.apply(id, pendingFiles, removedFiles)
        } catch (err) {
          setError(`The task is saved, but its attachment changes aren’t. ${describeSaveError(err)} Press ${task ? 'Save' : 'Add task'} to try again.`)
          return
        }
      }
      leave()
    } finally {
      savingNow.current = false
      setSaving(false)
    }
  }

  const tab = (active: boolean) =>
    `rounded px-2 py-0.5 text-xs font-medium ${active ? 'bg-subtle text-fg' : 'text-muted hover:text-fg'}`

  return (
    <dialog
      ref={dialogRef}
      onKeyDown={handleKeyDown}
      onCancel={handleCancel}
      onClose={handleClose}
      aria-label={task ? 'Edit task' : 'New task'}
      className={`${dialog} max-w-2xl`}
    >
      <form ref={formRef} onSubmit={handleSubmit}>
        <DialogTitleBar title={task ? 'Edit task' : 'New task'} onClose={requestClose} />

        {/* Going back to a field means carrying on, so the question goes away. */}
        <div className="space-y-4 px-6 py-5" onFocus={() => setConfirming(false)}>
          <Field label="Title">
            <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" className={field} />
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
              <div className="min-h-24 rounded-lg border border-line bg-subtle/40 px-3 py-2">
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

          <div ref={errorRef} role="alert" className="scroll-mb-24 empty:hidden">
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        </div>

        {confirming ? (
          // Keyed so React never reuses the bar's buttons as the footer's: Keep editing would turn into
          // Save mid-click and submit the form.
          <div
            key="discard"
            role="group"
            aria-labelledby={messageId}
            className={`sticky bottom-0 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-transparent px-6 py-3.5 ${panel.warning}`}
          >
            {/* flex-auto, not flex-1: on narrow phones the buttons wrap below instead of crushing the question. */}
            <p id={messageId} className="flex-auto animate-fade-up text-sm font-semibold">
              {/* After a half-finished save, a new task already exists: only its attachments are unsaved. */}
              {task || savedId.current ? 'Discard your changes?' : 'Discard this new task?'}
            </p>
            <div className="ml-auto flex animate-fade-up gap-2">
              <button type="button" onClick={leave} className={`${attentionQuiet} min-h-9`}>
                Discard
              </button>
              <button type="button" ref={keepEditingRef} onClick={keepEditing} className={`${attentionAction} ${INVERTED_PANEL.warning} min-h-9`}>
                Keep editing
              </button>
            </div>
          </div>
        ) : (
          <div key="actions" className="sticky bottom-0 flex items-center gap-2 border-t border-line bg-subtle/80 px-6 py-3.5 backdrop-blur">
            {task && (
              <button
                type="button"
                onClick={() => {
                  onTrash(task)
                  leave()
                }}
                className={btn.danger}
              >
                <Trash2 className="size-4" /> Delete
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button type="button" ref={cancelRef} onClick={requestClose} className={btn.ghost}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btn.primary}>
                {task ? 'Save' : 'Add task'}
              </button>
            </div>
          </div>
        )}
      </form>
    </dialog>
  )
}
