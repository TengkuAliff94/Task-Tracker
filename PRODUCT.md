# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: privacy-minded individuals** who want a capable personal task tracker without an account, a cloud service or a subscription. Each person runs their own install and keeps their own data on their own device. They use it every day to capture, triage and finish personal tasks: bills, errands, projects, recurring chores.

**Secondary: people evaluating the work.** The project also serves as a public portfolio piece. Reviewers reach it through the live demo and the README, usually with an empty install, and see it through **Load sample data**. Serve them without compromising the daily user. When the two conflict, the person using it as their real tracker wins.

The owner is also a daily user, and the reference case for one.

## Product Purpose

A full-featured personal task tracker that runs entirely in the browser. It has rich tasks (Markdown, checklists, attachments, effort), deadlines with reminders, recurrence, projects and tags, and a smart list ordered by urgency. Success means someone can trust it as their only task system: capture is fast, nothing is lost silently, and their data never leaves their device unless they export it.

## Positioning

The user confirmed four things together that a neighbouring product such as Todoist, TickTick or Things could not truthfully claim as a set:

1. **Local-first and private.** No server, no login, no telemetry. Data lives in IndexedDB on the device. The app installs as a PWA and works offline.
2. **Keyboard and quick-add first.** One line such as `Pay rent #finance @home !high ~30m tomorrow 5pm` becomes a fully structured task. `N` `/` `J` `K` `E` `X` `?` cover capture, search and triage without a mouse.
3. **Safety nets everywhere.** An Undo toast on delete, a 30-day Trash, full JSON backup (attachments included) with a nudge when one is overdue, and a banner for missed reminders instead of a burst of notifications.
4. **Craft as part of the point.** Design quality and engineering rigour are deliberate and visible, enforced by unit, e2e, contrast, reduced-motion, focus and layout tests.

## Operating Context

- Used on desktop and phone browsers, often installed as a PWA. Usage is mostly short, frequent visits: capture something, check what's overdue, tick things off. Occasionally a longer session to plan or edit a task in detail.
- Reminders arrive as browser notifications while the app is open or installed. Missed ones show in a banner on next launch.
- Date conventions are fixed: `DD/MM/YYYY`, 24-hour clock, relative labels ("Tomorrow", "In 3 days").
- Data lifecycle is user-driven: backup and restore through one JSON file, and restore replaces everything (no merge). Clearing site data deletes everything.
- Demo visitors arrive at https://task-tracker-eta-blush.vercel.app with no data. The empty state and the Backup & restore window offer sample data, which only ever adds to existing data.

## Capabilities and Constraints

- **Built:** everything in `README.md` § Features and `docs/SPEC.md`: list, sort, group and filter; search; quick-add parser; rich tasks; up to 3 reminders; recurrence; Trash; backup and restore; shortcuts; light and dark themes that follow the system setting; responsive layout down to phone widths.
- **Behaviour rules are recorded in `docs/SPEC.md` § Decisions made during build** (recurrence needs a deadline, late completion skips ahead, missed-reminder handling, restore replaces everything, and others). Treat them as product truth. Change them only on purpose.
- **Stack (existing):** React 19 + TypeScript, Vite, Tailwind CSS v4 with tokens in `src/index.css`, Dexie/IndexedDB, Motion for React, vite-plugin-pwa, chrono-node. Static site deployed on Vercel.
- **Storage boundary:** only `src/db/` touches the database. Keep it that way.
- **Direction: multi-device sync for one person is coming.** It is not built yet and there is no backend. Design and architecture must not block it: no assumptions that data is only ever local, room for sync status and conflict states later, and the repository seam kept intact.
- **Out of scope:** sharing, collaboration and multi-user features. Also deferred: Kanban board, calendar view, CSV export, custom repeat rules, full subtasks.
- **Terminology:** task, project (one per task, coloured), tag (many, coloured), deadline, reminder, checklist, attachment, effort, Trash, quick-add, backup and restore, sample data. A task is *overdue* when it isn't done and its deadline has passed. Overdue is derived, never stored.

## Brand Commitments

- **Name:** Task Tracker. There is no separate logo mark beyond the app icon set in `public/` (`icon.svg` plus generated PWA icons).
- **Voice (observed in the shipped UI and README):** plain, direct, reassuring. Short sentences say exactly what happens ("Your own tasks are kept.", "Shortcuts are off while you type in a field or a window is open."). No hype and no exclamation-mark cheer. Explain consequences before destructive actions and show the counts involved.
- **Spelling:** British/Commonwealth in prose ("colour", "behaviour", "organising").

## Evidence on Hand

- Live demo: https://task-tracker-eta-blush.vercel.app
- Built-in sample data (`src/db/sample.ts`), with dates relative to today.
- README screenshots in `docs/screenshots/` (list in light and dark, editor, mobile), regenerated with `npm run screenshots`.
- Full spec and build decisions: `docs/SPEC.md`.
- **None of the following exist, and none may be fabricated:** user counts, testimonials, reviews, press, ratings, performance benchmarks, pricing, or claims about sync or any backend.

## Product Principles

1. **Trust over cleverness.** No action loses data silently. Every destructive step is undoable or explained with counts first. Privacy is the default, not a setting.
2. **Capture in one breath.** Getting a task in should take one line and no mouse. Detail comes later, in the editor, only when wanted.
3. **Urgency first.** What's overdue or due soon leads. Done work recedes.
4. **Rigour is visible.** Every surface meets the tested bar for contrast, focus, motion and layout. Craft is part of the product, not decoration.
5. **Don't foreclose sync.** Today's local-first choices should still make sense once one person's data spans devices.

## Accessibility & Inclusion

- **Required standard: WCAG 2.2 AA.**
- Full keyboard operation, with a visible focus indicator on every stop in both themes (`e2e/focus.spec.ts`).
- AA colour contrast on rendered screens in both themes (`e2e/contrast.spec.ts`, axe).
- Reduced-motion parity: with reduced motion on, everything renders in its final state at once and nothing depends on animation (`e2e/reduced-motion.spec.ts`).
- Responsive down to phone widths, keeping the reading order (`e2e/layout.spec.ts`, `e2e/task-cards.spec.ts`).
