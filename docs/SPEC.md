# Personal Task Tracker — Spec

A personal task tracker for daily use that doubles as a learning/portfolio project.

## Platform & stack
- Browser-only web app, single device, no server or login.
- React + TypeScript + Vite + Tailwind CSS.
- Storage: IndexedDB via Dexie. All data access goes through one repository module so a backend can replace it later.
- Installable PWA (offline + notifications).
- Design system generated with `ui-ux-pro-max-cli`. Light/dark theme follows the system setting, with a manual toggle. Responsive layout.

## Task fields
| Field | Details |
|---|---|
| Title | Required |
| Description | Markdown (also covers notes) |
| Status | `todo` / `in_progress` / `done`. **Overdue** is derived: not done and deadline passed |
| Priority | `low` / `medium` (default) / `high` / `urgent` |
| Project | At most one, with a color; can be created while editing a task |
| Tags | Many, each with a color; can be created while editing a task |
| Deadline | Date with optional time. A date-only deadline is overdue once that day ends |
| Date added / completed | Set automatically |
| Effort | Minutes (entered as `30m`, `2h`) |
| Checklist | Text + checkbox items |
| Attachments | Links, plus files up to ~10 MB stored in IndexedDB |
| Reminders | Up to 3, each either an absolute datetime or an offset before the deadline |
| Recurrence | Daily / weekly / monthly / yearly, or every N days/weeks |

## Behaviour
- **List view**: overdue first, then deadline ascending (no deadline last), then priority. The sort can be changed, and tasks grouped by project, priority or status. Completed tasks are hidden behind a "Show completed" toggle.
- **Filters**: project, tag, priority, status, combined with one search box over title, description, tags and checklist items.
- **Quick-add bar**: `Pay rent #finance @home !high ~30m tomorrow 5pm`. Tokens: `#tag`, `@project`, `!low|!med|!high|!urgent`, `~effort`; natural-language dates via chrono-node. The full form handles editing.
- **Recurrence**: completing a recurring task creates the next instance. It copies the description, tags, project, priority, effort, the checklist (all items reset to unchecked) and reminders (shifted to the new deadline). Attachments are not copied.
- **Reminders**: browser notifications while the app is open or installed. On launch, a banner lists reminders that were missed.
- **Delete**: an Undo toast, then Trash, which purges after 30 days. Deleting a project moves its tasks to "No project", after a confirmation that shows the count.
- **Backup**: full JSON export/import (including attachments), plus a "last backup N days ago" nudge.
- **Shortcuts**: `N` quick-add, `/` search, `J`/`K` navigate, `E` edit, `X` toggle done, `?` help.
- **Dates**: `DD/MM/YYYY`, 24-hour clock, relative labels ("Tomorrow", "In 3 days").

## Quality & release
- Vitest for logic (overdue, recurrence, quick-add parser, filters). Playwright for 2–3 main flows.
- Public GitHub repo. Auto-deploy to Vercel or Netlify. A "Load sample data" button for demo visitors. README with screenshots.

## Milestones
1. **Foundation**: scaffold, data model and Dexie, list plus create/edit, status and overdue.
2. **Organising**: projects and tags, filters, search, sorting, quick-add.
3. **Time features**: reminders and notifications, recurrence, PWA.
4. **Extras**: checklist, attachments, export/import, Trash, shortcuts, theme.
5. **Release**: tests, sample data, deploy, README.

## Decisions made during build
- **Recurrence needs a deadline.** A repeat rule is dropped when a task has no deadline.
- **Late completion skips ahead.** The next deadline steps forward until it is no longer overdue, so finishing a daily task a week late creates one new task, not seven.
- **Month-end clamping.** 31 Jan + 1 month = 28/29 Feb.
- **Re-opening a completed recurring task** moves its spawned next instance to Trash, unless that instance has already been started.
- **Missed reminders** are tracked with a "checked up to" time stored in IndexedDB. On launch, anything due since then shows in a banner instead of firing as a burst of notifications. On the very first launch nothing counts as missed.
- **Relative reminders** need a deadline. Absolute ones work on any task.
- **Status filter "Done"** shows completed tasks even when "Show completed" is off.
- **Restore replaces everything.** Importing a backup clears all tasks, projects, tags and attachments first, after a confirmation that shows both counts. There is no merge.
- **Backup nudge** appears when there has never been a backup and the oldest task is 3+ days old, or when the last backup is 14+ days old. "Remind me later" snoozes it for 3 days.
- **Trash purge** runs once per launch and removes items trashed more than 30 days ago, along with their attachments.
- **Attachments are staged in the form.** They're only saved or removed when you click Save, so Cancel discards changes. Only http(s) links are allowed, and imported links are checked again before rendering.
- **Theme preference** (system/light/dark) is stored in localStorage, because it's a per-browser convenience. Everything else is in IndexedDB.
- **Sample data** is offered in the empty state and in the Backup & restore window. When tasks already exist it asks first, and it always adds to existing data, never replacing it. It loads in one transaction, with dates set relative to today, and reuses any projects or tags with the same names (ignoring case), so loading it twice never duplicates labels.
- **Deploy target** is Vercel. `vercel.json` stops `sw.js` and the manifest from being cached so PWA updates go out promptly.
- **Design system**: see `design-system/task-tracker/MASTER.md`. Tokens live in `src/index.css`, and the light palette uses darker shades of the generated dark palette so text keeps 4.5:1 contrast.

## Deferred
Kanban board, calendar view, CSV export, multi-device sync, custom repeat rules, full subtasks.
