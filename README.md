# Task Tracker

[![CI](https://github.com/TengkuAliff94/Task-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/TengkuAliff94/Task-Tracker/actions/workflows/ci.yml)
[![Vercel deploy](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Frepos%2FTengkuAliff94%2FTask-Tracker%2Fcommits%2Fmain%2Fstatus&query=%24.statuses%5B0%5D.state&label=vercel%20deploy&logo=vercel)](https://task-tracker-eta-blush.vercel.app)
<!-- The deploy badge reads the "Vercel" commit status that Vercel's Git integration posts on main
     (success / pending / failure / error). It takes the first status, which is Vercel's as long as
     nothing else posts commit statuses; GitHub Actions uses check runs, which don't appear there. -->

**Live demo: [task-tracker-eta-blush.vercel.app](https://task-tracker-eta-blush.vercel.app)**

A personal task tracker that runs entirely in the browser. There's no server and no login: your tasks stay on your device in IndexedDB. It installs as a PWA, works offline and can send reminder notifications.

![Task list, light theme](docs/screenshots/list-light.png)

<p>
  <img src="docs/screenshots/list-dark.png" alt="Task list, dark theme" width="49%">
  <img src="docs/screenshots/editor.png" alt="Task editor with checklist" width="49%">
</p>
<img src="docs/screenshots/mobile.png" alt="Mobile layout" width="260">

The screenshots show the built-in sample data. To regenerate them after a UI change, run `npm run screenshots`. It uses Playwright with the clock pinned to a fixed date, so the images come out the same on every run.

## Features

- **Quick-add bar**: `Pay rent #finance @home !high ~30m tomorrow 5pm` becomes a task with a tag, a project, a priority, an effort estimate and a deadline. Dates are parsed in plain language with [chrono-node](https://github.com/wanasit/chrono).
- **Smart list**: overdue tasks first, then by deadline, then by priority. You can change the sort, group by project, priority or status, and filter by project, tag, priority or status. Search covers titles, descriptions, tags and checklist items.
- **Rich tasks**: Markdown descriptions, checklists, links and file attachments (up to about 10 MB, stored in IndexedDB), and effort estimates.
- **Time features**: up to 3 reminders per task, at a fixed time or a set time before the deadline. Reminders you missed while the app was closed are listed in a banner. Tasks can repeat daily, weekly, monthly or yearly, or every N days or weeks.
- **Safety nets**: deleting shows an Undo toast, and deleted tasks go to a Trash that empties itself after 30 days. You can back up everything to one JSON file (attachments included), and the app reminds you when it's been a while since your last backup.
- **Offline PWA**: installs like an app, and a service worker caches the app so it opens without a connection.
- **Keyboard shortcuts**: see the [table below](#keyboard-shortcuts).
- **Themes**: light and dark, following the system setting by default. Responsive down to phone widths.

New here? Open the app and click **Load sample data** to see a filled-in list. It is also in the Backup & restore window.

## Tech

| Part | Why |
|---|---|
| **React 19 + TypeScript** | Components suit a list-and-dialog UI. Types keep the task model (deadlines, reminders, recurrence) consistent across storage, logic and UI. |
| **Vite** | Fast dev server and build, plus a plugin for the PWA. |
| **Tailwind CSS v4** | Design tokens live as CSS variables in `src/index.css`, so the light and dark themes only swap values. |
| **Dexie (IndexedDB)** | IndexedDB holds structured data and file attachments in the browser. Dexie adds transactions and live queries (`useLiveQuery`), so the list updates whenever data changes. |
| **Motion for React** | Entrance, count-up, layout and exit animations, through a few shared primitives in `src/components/motion/` that render final states under reduced motion. |
| **Inter + Gabarito (Fontsource)** | Body and display faces, self-hosted so the app still works offline. |
| **21st.dev / RareUI registries** | Source of animated UI components, added as editable code via `components.json` (shadcn-style, with `@/` mapped to `src/` and a `cn()` helper in `src/lib/utils.ts`). Pulled components are rewritten to the project's tokens and to `motion/react`. RareUI item names are PascalCase, e.g. `npx shadcn add @rareui/AnimatedTab`. |
| **vite-plugin-pwa** | Generates the service worker and manifest for install and offline use. |
| **chrono-node** | Parses plain-language dates in the quick-add bar ("tomorrow 5pm"). |
| **Vitest + fake-indexeddb** | Unit tests for the pure logic, and for the repositories against an in-memory IndexedDB. |
| **Playwright** | End-to-end flows in Chromium with a pinned clock, and the README screenshots. |

## Architecture

```
UI (src/App.tsx, src/components/)  ->  storage module (src/db/)  ->  IndexedDB (via Dexie)
              |
              v
   pure logic (src/lib/): quick-add parser, recurrence, overdue rules, reminders, filters, sorting
```

- **`src/db/`** is the only code that touches the database. Tasks, projects and tags, attachments, backup, reminder bookkeeping and sample data each have a repository there (`tasks.ts`, `labels.ts`, `attachments.ts`, `backup.ts`, `reminders.ts`, `sample.ts`). Components and hooks call these and never import the Dexie handle, so a backend could replace IndexedDB by swapping this module. One catch: the UI wraps repository calls in Dexie's `useLiveQuery` to re-render when data changes, so a backend swap would also need another way to push updates.
- **`src/lib/`** is plain TypeScript with no storage or React, so it's easy to unit test.

## Design decisions

The full spec and the decisions made during the build are in [`docs/SPEC.md`](docs/SPEC.md#decisions-made-during-build). Examples: recurrence needs a deadline, a late completion skips ahead instead of creating a backlog, missed reminders appear in a banner instead of a burst of notifications, and restoring a backup replaces everything.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run build` | Type-checks and builds to `dist/` |
| `npm run preview` | Serves the production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end flows (Playwright; first run `npx playwright install chromium`) |
| `npm run screenshots` | Regenerates the README screenshots from sample data |

### End-to-end tests

The e2e tests live in `e2e/` and use Playwright with Chromium. Before the first run, install the browser:

```bash
npx playwright install chromium   # add --with-deps on a fresh Linux machine
npm run test:e2e
```

`npm run test:e2e` starts the dev server on port 4173 (or reuses one that is already running) and gives each test a fresh browser with empty storage. If a test fails, open the report with `npx playwright show-report`. Test results go to `test-results/` and the report to `playwright-report/`, and git ignores both. New tests should import `test` and `expect` from `e2e/fixtures.ts`. Its `app` fixture opens the app and finds elements by role and label. Vitest only runs `src/**/*.test.ts`, so it skips the e2e files.

Beyond the user flows, a few suites guard the design: `contrast.spec.ts` runs axe's colour-contrast check on the main screens in both themes; `reduced-motion.spec.ts` checks that with reduced motion on, everything shows in its final state at once; and `layout.spec.ts` and `task-cards.spec.ts` check the responsive layout, the card grid's reading order (J/K), the selection outline and that scroll-revealed cards never stay hidden.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `N` | Quick add a task |
| `/` | Search |
| `J` / `K` | Next / previous task |
| `E` | Edit selected task |
| `X` | Toggle selected task done |
| `Esc` | Leave a field / clear selection |
| `?` | Show shortcuts |

Shortcuts are off while you type in a field or a window is open. Press `?` in the app to see this list.

## Deploying

The app is a static site, and `vercel.json` configures it for Vercel:

- **SPA rewrite**: page paths (anything outside `/assets/` without a file extension) are rewritten to `index.html`, so deep links and reloads never 404.
- **Caching**: hashed files under `/assets/` are cached for a year as immutable. Everything else, including `index.html`, `sw.js` and the manifest, must revalidate on every load, so a new service worker and app shell are picked up after each deploy. The service worker then skips waiting, takes over open tabs and deletes outdated caches.

The repo is connected to Vercel, so every push to `main` deploys to production and pull requests get preview URLs. To deploy by hand, run `npx vercel --prod`.

## Privacy

Everything stays in your browser's storage on this device. Clearing site data deletes it, so use **Backup & restore** to keep a copy.
