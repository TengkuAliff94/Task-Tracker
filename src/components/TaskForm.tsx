import { lazy, Suspense, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type SyntheticEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { useModalDialog } from '../hooks/useModalDialog'
import { DialogTitleBar } from './Dialog'
import { taskRepo } from '../db/tasks'
import { projectRepo, tagRepo } from '../db/labels'
import { attachmentRepo, normaliseUrl, type PendingAttachment } from '../db/attachments'
import { describeDeadline } from '../lib/deadline'
import { formatDateText, readDateText, readTimeText } from '../lib/dateInput'
import { formatEffort, parseEffort } from '../lib/effort'
import { MAX_REMINDERS } from '../lib/reminders'
import { cn, describeSaveError } from '../lib/utils'
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
import { attentionAction, attentionQuiet, btn, dialog, field, INVALID_FIELD, INVERTED_PANEL, labelText, panel } from '../ui'
import { FieldError } from './FieldError'
import { ProjectPicker } from './ProjectPicker'
import { TagPicker } from './TagPicker'
import { RecurrenceEditor } from './RecurrenceEditor'
import { EMPTY_REMINDER_DRAFT, reminderDraftAt, RemindersEditor, type ReminderDraft } from './RemindersEditor'
import { DateField, TimeField } from './DateTimeFields'
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

interface FieldProps {
  label: string
  children: ReactNode
  className?: string
  /** Shown under the control, which should point at `errorId` with aria-describedby. */
  error?: string
  errorId?: string
}

function Field({ label, children, className = '', error, errorId }: FieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <span className={labelText}>{label}</span>
      {children}
      {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}

/** Fields checked on Save. Each error shows under its field, and focus goes to the first one. */
type FieldErrors = Partial<Record<'title' | 'effort' | 'date' | 'time' | 'reminderDate' | 'reminderTime' | 'link', string>>

/** Props that mark a control invalid and point it at its error message. */
const invalidProps = (error: string | undefined, errorId: string) =>
  error ? { 'aria-invalid': true as const, 'aria-describedby': errorId } : {}

export function TaskForm({ task, projects, tags, onClose, onTrash }: Props) {
  const { ref: dialogRef, close } = useModalDialog()
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [preview, setPreview] = useState(false)
  const [status, setStatus] = useState<Status>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  // The deadline as typed. It's read on every render, so the line under it follows the typing.
  const [dateText, setDateText] = useState(task?.deadline ? formatDateText(task.deadline.date) : '')
  const [timeText, setTimeText] = useState(task?.deadline?.time ?? '')
  const [projectId, setProjectId] = useState(task?.projectId)
  const [tagIds, setTagIds] = useState(task?.tagIds ?? [])
  const [effort, setEffort] = useState(task?.effortMinutes ? formatEffort(task.effortMinutes) : '')
  const [reminders, setReminders] = useState(task?.reminders ?? [])
  const [recurrence, setRecurrence] = useState(task?.recurrence)
  const [checklist, setChecklist] = useState(task?.checklist ?? [])
  // Text typed into an "add" field but not added yet. Save adds it rather than dropping it.
  const [checklistDraft, setChecklistDraft] = useState('')
  const [linkDraft, setLinkDraft] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  /** The new project's name while one is being typed, else null. */
  const [projectDraft, setProjectDraft] = useState<string | null>(null)
  const [reminderDraft, setReminderDraft] = useState<ReminderDraft>(EMPTY_REMINDER_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [existingFiles, setExistingFiles] = useState<Attachment[]>([])
  const [removedFiles, setRemovedFiles] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  /** Showing the "Discard changes?" bar in place of the footer buttons. */
  const [confirming, setConfirming] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  /** Set by a Save that found errors, so focus moves to the first one once they render. */
  const focusFirstError = useRef(false)
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
  const errorIds = {
    title: useId(),
    effort: useId(),
    date: useId(),
    time: useId(),
    reminderDate: useId(),
    reminderTime: useId(),
  }
  const deadlineHintId = useId()

  const dateReading = readDateText(dateText)
  const timeReading = readTimeText(timeText)
  /** The deadline's date (YYYY-MM-DD), or '' while there's none or it can't be read. */
  const date = dateReading?.ok ? dateReading.date : ''
  // A time typed with the date ("fri 5pm") is the newest word on it, so it wins until the date field tidies it away.
  const time = dateReading?.ok && dateReading.time ? dateReading.time : timeReading?.ok ? timeReading.time : ''

  // Everything the form edits, as one string, so "has anything changed?" is a single comparison. Text
  // that can't be read counts as itself, so typing over a date with nonsense is still a change.
  const values = {
    title,
    description,
    status,
    priority,
    date: date || dateText.trim(),
    time: time || timeText.trim(),
    projectId,
    tagIds,
    effort,
    reminders,
    recurrence,
    checklist,
  }
  const snapshotOf = (v: typeof values) => JSON.stringify(v)
  const snapshot = snapshotOf(values)
  const [initialSnapshot, setInitialSnapshot] = useState(snapshot)
  const hasDrafts = Boolean(
    checklistDraft.trim() ||
      linkDraft.trim() ||
      tagDraft.trim() ||
      projectDraft?.trim() ||
      reminderDraft.date.trim() ||
      reminderDraft.time.trim(),
  )
  const isDirty = () => snapshot !== initialSnapshot || pendingFiles.length > 0 || removedFiles.length > 0 || hasDrafts

  /** Clears one field's error as soon as it's edited. */
  function clearError(key: keyof FieldErrors) {
    if (!fieldErrors[key]) return
    setFieldErrors((errors) => {
      const next = { ...errors }
      delete next[key]
      return next
    })
  }

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
    if (!focusFirstError.current) return
    focusFirstError.current = false
    // Document order, so it's the first problem reading down the form.
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [fieldErrors])

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

  /** Everything Save would refuse, checked before anything is written. */
  function validate(): FieldErrors {
    const errors: FieldErrors = {}
    if (!title.trim()) errors.title = 'Give the task a title.'
    if (effort.trim() && parseEffort(effort) === undefined) errors.effort = 'Effort should look like 30m, 2h or 1h30m.'
    // Text that can't be read would otherwise save as no deadline, or a deadline without its time.
    if (dateReading && !dateReading.ok) errors.date = dateReading.error
    // Without a date the time field is disabled and no deadline is saved, so a stray time there doesn't matter.
    if (dateText.trim() && timeReading && !timeReading.ok && !(dateReading?.ok && dateReading.time)) {
      errors.time = timeReading.error
    }
    // A specific reminder time needs both halves; half of one would be dropped on Save.
    const reminderDate = readDateText(reminderDraft.date)
    const reminderTime = readTimeText(reminderDraft.time)
    if (reminderDate || reminderTime) {
      if (!reminderDate) errors.reminderDate = 'Give the reminder a date, or clear its time.'
      else if (!reminderDate.ok) errors.reminderDate = reminderDate.error
      if (!(reminderDate?.ok && reminderDate.time)) {
        if (!reminderTime) errors.reminderTime = 'Give the reminder a time, such as 09:00.'
        else if (!reminderTime.ok) errors.reminderTime = reminderTime.error
      }
    }
    if (linkDraft.trim()) {
      try {
        normaliseUrl(linkDraft)
      } catch (err) {
        errors.link = err instanceof Error ? err.message : String(err)
      }
    }
    return errors
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (savingNow.current) return
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      focusFirstError.current = true
      setError(null)
      return
    }
    savingNow.current = true
    setSaving(true)
    setError(null)
    try {
      // Text left in an "add" field is added, not dropped: the person typed it, then pressed Save.
      let resolved = values
      let pending = pendingFiles
      try {
        const extraTag = tagDraft.trim().replace(/^#/, '')
        const newProject = projectDraft?.trim()
        const [tag, project] = await Promise.all([
          extraTag ? tagRepo.findOrCreate(extraTag) : undefined,
          newProject ? projectRepo.findOrCreate(newProject) : undefined,
        ])
        const at = reminderDraftAt(reminderDraft)
        resolved = {
          ...values,
          checklist: checklistDraft.trim()
            ? [...checklist, { id: crypto.randomUUID(), text: checklistDraft.trim(), done: false }]
            : checklist,
          tagIds: tag && !tagIds.includes(tag.id) ? [...tagIds, tag.id] : tagIds,
          projectId: project?.id ?? projectId,
          reminders:
            at !== undefined && reminders.length < MAX_REMINDERS
              ? [...reminders, { id: crypto.randomUUID(), kind: 'absolute' as const, at }]
              : reminders,
        }
        if (linkDraft.trim()) {
          const href = normaliseUrl(linkDraft)
          pending = [...pendingFiles, { kind: 'link', url: href, name: href }]
        }
      } catch (err) {
        setError(describeSaveError(err))
        return
      }
      // Show them as added, so a failed save below leaves the form exactly as it will be saved.
      setChecklist(resolved.checklist)
      setTagIds(resolved.tagIds)
      setProjectId(resolved.projectId)
      setReminders(resolved.reminders)
      setPendingFiles(pending)
      setChecklistDraft('')
      setTagDraft('')
      setProjectDraft(null)
      setReminderDraft(EMPTY_REMINDER_DRAFT)
      setLinkDraft('')
      // Written back the way it's read, so the form shows exactly what's being saved.
      setDateText(date ? formatDateText(date) : '')
      if (date) setTimeText(time)

      const deadline: Deadline | undefined = date ? { date, time: time || undefined } : undefined
      const fields = {
        title,
        description,
        status,
        priority,
        deadline,
        projectId: resolved.projectId,
        tagIds: resolved.tagIds,
        effortMinutes: parseEffort(effort),
        reminders: resolved.reminders,
        checklist: resolved.checklist.filter((c) => c.text.trim()),
        recurrence: deadline ? recurrence : undefined,
      }
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
      setInitialSnapshot(snapshotOf(resolved))
      if (pending.length || removedFiles.length) {
        try {
          // One transaction, so nothing is half-applied and Save can simply run again.
          await attachmentRepo.apply(id, pending, removedFiles)
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
      {/* noValidate: problems show under their fields in the app's words, never as the browser's bubble. */}
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <DialogTitleBar title={task ? 'Edit task' : 'New task'} onClose={requestClose} />

        {/* Going back to a field means carrying on, so the question goes away. */}
        <div className="space-y-4 px-6 py-5" onFocus={() => setConfirming(false)}>
          <Field label="Title" error={fieldErrors.title} errorId={errorIds.title}>
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                clearError('title')
              }}
              aria-label="Title"
              {...invalidProps(fieldErrors.title, errorIds.title)}
              className={cn(field, fieldErrors.title && INVALID_FIELD)}
            />
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
              <div className="min-h-24 rounded-lg bg-subtle px-3 py-2">
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
            <Field label="Effort" error={fieldErrors.effort} errorId={errorIds.effort}>
              <input
                value={effort}
                onChange={(e) => {
                  setEffort(e.target.value)
                  clearError('effort')
                }}
                placeholder="e.g. 30m, 2h"
                aria-label="Effort"
                {...invalidProps(fieldErrors.effort, errorIds.effort)}
                className={cn(field, fieldErrors.effort && INVALID_FIELD)}
              />
            </Field>
            <Field label="Project">
              <ProjectPicker
                projects={projects}
                value={projectId}
                onChange={setProjectId}
                draft={projectDraft}
                onDraftChange={setProjectDraft}
                className={field}
              />
            </Field>
            {/* Date and time are typed (DD/MM/YYYY, 24-hour) with the native pickers behind their buttons,
                since the pickers' own fields follow the browser's locale (mm/dd/yyyy and 12-hour under
                en-US). They sit side by side where both fit and stack on the narrowest phones. The line
                below confirms the reading as it's typed: "fri" shows which Friday. */}
            <div className="col-span-2 grid grid-cols-[repeat(auto-fit,minmax(9.25rem,1fr))] gap-3">
              <Field label="Deadline" error={fieldErrors.date} errorId={errorIds.date}>
                <DateField
                  text={dateText}
                  onTextChange={(text) => {
                    setDateText(text)
                    clearError('date')
                    // An empty date disables the time field, so an error left on it couldn't be fixed there.
                    if (!text.trim()) clearError('time')
                  }}
                  onTimeRead={(t, d) => {
                    setDateText(d)
                    setTimeText(t)
                    clearError('date')
                    clearError('time')
                  }}
                  label="Deadline date"
                  pickerFor="the deadline"
                  invalid={Boolean(fieldErrors.date)}
                  describedBy={fieldErrors.date ? errorIds.date : date ? deadlineHintId : undefined}
                  className={cn(field, fieldErrors.date && INVALID_FIELD)}
                />
              </Field>
              <Field label="Time (optional)" error={fieldErrors.time} errorId={errorIds.time}>
                <TimeField
                  text={timeText}
                  onTextChange={(text) => {
                    setTimeText(text)
                    clearError('time')
                  }}
                  // Off only while the date is empty, not while it's half-typed, so it doesn't flicker.
                  disabled={!dateText.trim()}
                  label="Deadline time"
                  pickerFor="the deadline"
                  invalid={Boolean(fieldErrors.time)}
                  describedBy={fieldErrors.time ? errorIds.time : date ? deadlineHintId : undefined}
                  className={cn(field, fieldErrors.time && INVALID_FIELD)}
                />
              </Field>
              {date && (
                <p id={deadlineHintId} data-testid="deadline-readout" className="col-span-full -mt-2 text-xs text-muted tabular-nums">
                  Due {describeDeadline({ date, time: time || undefined })}
                </p>
              )}
            </div>
          </div>

          <Field label="Tags">
            <TagPicker tags={tags} value={tagIds} onChange={setTagIds} draft={tagDraft} onDraftChange={setTagDraft} />
          </Field>

          {/* min-w-0: a grid cell would otherwise grow to fit the widest native picker and push the dialog sideways. */}
          <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
            <Field label="Repeat">
              <RecurrenceEditor value={recurrence} onChange={setRecurrence} hasDeadline={Boolean(date)} className={field} />
            </Field>
            <Field label="Reminders">
              <RemindersEditor
                value={reminders}
                onChange={setReminders}
                hasDeadline={Boolean(date)}
                draft={reminderDraft}
                onDraftChange={(d) => {
                  setReminderDraft(d)
                  if (d.date !== reminderDraft.date) clearError('reminderDate')
                  if (d.time !== reminderDraft.time) clearError('reminderTime')
                }}
                errors={{ date: fieldErrors.reminderDate, time: fieldErrors.reminderTime }}
                errorIds={{ date: errorIds.reminderDate, time: errorIds.reminderTime }}
                className={field}
              />
            </Field>
          </div>

          <Field label="Checklist">
            <ChecklistEditor value={checklist} onChange={setChecklist} draft={checklistDraft} onDraftChange={setChecklistDraft} />
          </Field>

          <Field label="Attachments">
            <AttachmentsEditor
              existing={existingFiles}
              removed={removedFiles}
              onRemovedChange={setRemovedFiles}
              pending={pendingFiles}
              onPendingChange={setPendingFiles}
              draft={linkDraft}
              onDraftChange={(url) => {
                setLinkDraft(url)
                clearError('link')
              }}
              draftError={fieldErrors.link}
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
            className={`sticky bottom-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-6 py-3.5 ${panel.warning}`}
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
          // Solid Well Stone, no rule: the tone step sets it apart, and nothing scrolling behind shows through around Save.
          <div key="actions" className="sticky bottom-0 flex items-center gap-2 bg-subtle px-6 py-3.5">
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
              {/* On the Well Stone footer, Cancel's hover steps one tone further, to the seam colour. */}
              <button type="button" ref={cancelRef} onClick={requestClose} className={cn(btn.ghost, 'hover:bg-line')}>
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
