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
- **Complete**: a "Done" toast with Undo, which puts the task back to the status it had. For a recurring task it also says when the new copy is due, and Undo follows the reopen rule below.
- **Delete**: an Undo toast, then Trash, which purges after 30 days. Deleting a project moves its tasks to "No project", after a confirmation that shows the count.
- **Backup**: full JSON export/import (including attachments), plus a "last backup N days ago" nudge.
- **Shortcuts**: `N` quick-add, `/` search, `J`/`K` navigate, `E` edit, `X` toggle done, `Z` undo (while the toast shows), `?` help. After `X`, the selection passes to the card that takes the completed card's place, so `J`/`K` carry on from there. `J`/`K` move keyboard focus along with the selection, and Tabbing to a card selects it. When a focused card leaves the list, focus moves to the card that takes its place.
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
- **Restore replaces everything.** Importing a backup clears all tasks, projects, tags and attachments first, after a confirmation that shows both counts. There is no merge. Afterwards the data matches the file, so the file's export time becomes the last backup (never later than now).
- **Backup nudge** appears when there has never been a backup and real use started 3+ days ago, or when the last backup is 14+ days old. "Remind me later" snoozes it for 3 days. Real use starts with the first task you add yourself, or your first restore, and is stored as a "first used" time in IndexedDB. Sample data doesn't count, because its tasks are back-dated. Installs from before this was recorded start the count from their oldest task, as the nudge always did.
- **Persistent storage.** Browsers can clear a site's IndexedDB when the device runs low on space unless the site's storage is persistent. The app asks for it (`navigator.storage.persist()`) right after your first own task, when Firefox's prompt makes sense, and on later launches only if the browser would agree without a prompt (for example once the app is installed). It never prompts on page load. The Backup & restore window shows the answer (Protected, Not protected, or Not reported) and can ask again.
- **Trash purge** runs once per launch and removes items trashed more than 30 days ago, along with their attachments.
- **Attachments are staged in the form.** They're only saved or removed when you click Save, so Cancel discards changes. Only http(s) links are allowed, and imported links are checked again before rendering.
- **Save adds what's typed but not added.** Text left in the editor's "add" fields (a checklist item, a link, a tag, a new project name, a reminder time) is added when you click Save rather than dropped. A new project or tag whose name already exists (ignoring case) reuses that label. A link that isn't valid stops Save with an error at the link field.
- **Confirmations and validation stay in the app.** Every "are you sure?" is an in-app dialog that shows the counts, with Cancel as the safe default for anything destructive; the browser's `confirm()` and validation bubbles are never used. A restore file is checked before the question is asked, so a file that isn't a backup never gets as far as "Replace everything?". Date and time pickers are the browser's own, so a line under them shows the value as `DD/MM/YYYY` and 24-hour whatever the browser's locale.
- **Theme preference** (system/light/dark) is stored in localStorage, because it's a per-browser convenience. Everything else is in IndexedDB.
- **Sample data** is offered in the empty state and in the Backup & restore window, where it sits in its own "Try the app" section below backup and restore, so it never reads as a way to restore data. When tasks already exist it asks first, and it always adds to existing data, never replacing it. It loads in one transaction, with dates set relative to today, and reuses any projects or tags with the same names (ignoring case), so loading it twice never duplicates labels.
- **Deploy target** is Vercel. `vercel.json` rewrites page paths (anything outside `/assets/` without a file extension) to `index.html` so deep links and reloads never 404. Everything except hashed `/assets/` must revalidate on each load, so a new `sw.js` and app shell are picked up after a deploy. The service worker (`registerType: autoUpdate`) skips waiting, claims clients and deletes outdated caches.
- **Design system**: flat colour panels after the Sill template (issue #9). Tokens live in `src/index.css`: dark is a near-black canvas with off-white text, light inverts it onto warm off-white, and the panel colours are shared. Where a Sill swatch failed 4.5:1 contrast it was shifted (noted beside the token), and `e2e/contrast.spec.ts` checks the rendered screens with axe.

## Deferred
Kanban board, calendar view, CSV export, multi-device sync, custom repeat rules, full subtasks.
