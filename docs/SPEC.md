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

## Deferred
Kanban board, calendar view, CSV export, multi-device sync, custom repeat rules, full subtasks.
