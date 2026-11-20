# Handoff: UI critique follow-ups

Last updated 2026-11-21, at the end of the session that ran step 3c.

**Branch:** `ui-revamp`. **Tracking issue:** [#19](https://github.com/TengkuAliff94/Task-Tracker/issues/19), with sub-issues #20–#27 (native GitHub sub-issues).

## Where things stand

An Impeccable critique of `src` scored the revamped app **24/40 (Acceptable)**: 0 P0, 4 P1, 1 P2. The user chose these fixes:
- **Layout first**, using the "slab shows urgency" direction.
- **All four P1s**, plus the native `confirm()` replacement.
- **The polish list.**

Each fix runs as one Impeccable command at a time. Run the step, verify it, commit it, update #19, then move on.

| # | Command | Issue | Status |
|---|---|---|---|
| 1 | `/impeccable layout src/App.tsx` | [#20](https://github.com/TengkuAliff94/Task-Tracker/issues/20) urgency-first top section, tiles as filters | **done** |
| 2 | `/impeccable distill src/components/FilterBar.tsx` | [#21](https://github.com/TengkuAliff94/Task-Tracker/issues/21) collapse the filter bar; the list comes first on phones | **done** |
| 3a | `/impeccable harden src/components/TaskForm.tsx` | [#22](https://github.com/TengkuAliff94/Task-Tracker/issues/22) the editor must not discard edits silently | **done** (`32624b4`, review fixes `c88b2e4`) |
| 3b | `/impeccable harden src/App.tsx` | [#23](https://github.com/TengkuAliff94/Task-Tracker/issues/23) completion toast with Undo, next-due note, J/K position | **done** (`c45be56`) |
| 3c | `/impeccable harden src/components` | [#24](https://github.com/TengkuAliff94/Task-Tracker/issues/24) in-app ConfirmDialog, inline validation, DD/MM dates (+ [#28](https://github.com/TengkuAliff94/Task-Tracker/issues/28)) | **done** |
| 3d | `/impeccable harden src/components/Backup.tsx src/db` | [#25](https://github.com/TengkuAliff94/Task-Tracker/issues/25) backup nudge timing, persistent storage, sample data placement | **next** |
| 4 | `/impeccable audit src` | [#26](https://github.com/TengkuAliff94/Task-Tracker/issues/26) WCAG 2.2 AA gaps. Do this **after #23** | to do |
| 5 | `/impeccable polish src`, then `/impeccable critique src` | [#27](https://github.com/TengkuAliff94/Task-Tracker/issues/27) polish, README screenshots, SPEC alignment, re-score | to do |

Each issue holds the full problem statement, file:line pointers and acceptance criteria. Read the issue before starting its step.

**To resume:** start a session in this repo, run `/impeccable harden src/components/Backup.tsx src/db`, and work through #25's acceptance criteria. Step 3c has no loose ends: #24 and #28 are closed and #19's table is up to date.

**Follow-ups outside the table:** none open. #28 (Save dropped text typed into an "add" field) was fixed together with #24.

## Context files (read these, don't re-derive them)

- **`PRODUCT.md`**: users (privacy-minded individuals first, portfolio reviewers second), positioning, principles, and **WCAG 2.2 AA as a requirement**. Multi-device sync for one person is a coming direction. Sharing and collaboration are out of scope.
- **`DESIGN.md`**: the visual system, "The Sunlit Workbench". The frontmatter tokens are normative. It has named rules, including the new **Urgency-First Rule**. `.impeccable/design.json` is its sidecar.
- **`design-system/task-tracker/MASTER.md`**: the engineering companion (motion presets, test guards, the pre-delivery checklist).
- **`docs/SPEC.md`**: feature spec and build decisions. Treat the decisions as product truth. Its audience and sync wording is stale, which #27 fixes.
- **`.impeccable/critique/2026-11-17T12-00-32Z__src.md`**: the full critique report. It is **local only** (gitignored) and `/impeccable polish` reads it. If it's gone, the same content is in #19–#27.
- **`.impeccable/config.json`**: one detector ignore. `side-tab` is scoped to `src/index.css`, because that hit is the Markdown blockquote seam, which DESIGN.md documents.

## How each step was done (repeat this)

1. **Load the Impeccable command's playbook.** For an implementation step, also read `reference/craft-floor.md` immediately before editing.
2. **Assess before editing.** For layout, the playbook asks for two isolated assessments: a rendered review plus `impeccable detect --scope <x>`. They ran as parallel sub-agents.
3. **Edit inside the established system.** Use tokens from `src/index.css`, class strings from `src/ui.ts`, and timings from `src/components/motion/presets.ts`.
4. **Add tests that fail without the fix.** Step 1 proved this by reverting each fix and watching its test fail.
5. **Look at the rendered result.** Use Playwright screenshots at 320, 390, 640, 768, 1024, 1280 and 1440 widths, in light and dark, with and without the backup nudge.
6. **Run an adversarial review.** Three lenses review the diff (correctness, WCAG AA, rendered layout and design system), and each finding gets three skeptics. Fix what survives.
7. **Update `DESIGN.md`** where the spec changed, then refresh the sidecar with `/impeccable document`. `impeccable doctor` must report no drift.
8. **Commit** with `(#N)` in the subject. Then close the sub-issue and update the table in #19 and in this file.

## Verify before every commit

```bash
npx tsc -b                      # types
npm test                        # unit (Vitest): 135 passing after step 3c
npm run test:e2e                # e2e (Playwright, port 4173): 145 passing after step 3c
npm run build                   # production build + PWA
"<impeccable skill dir>/scripts/impeccable" detect --json --changed   # skill dir: the impeccable plugin (v4.9.2) in the Claude plugin cache
"<impeccable skill dir>/scripts/impeccable" doctor
```

**Known detector findings.** These were there before step 1; don't chase them as regressions:
- `bounce-easing` on the dialog spring: documented and intentional.
- `design-system-font-size` 11px (`kbd`, `index.css`): real, and #27 fixes it.
- `design-system-font-size` 13px (`labelText`, `ui.ts`): documented in DESIGN.md's prose.
- `design-system-color` `#000`: unit-test fixture data.

## Gotchas learned the hard way

- **Windows dev servers.** Stopping a background `npx vite` only stops the `npx` wrapper; the Vite child keeps the port. Find it with `netstat -ano | grep :<port>` and stop it with `taskkill //PID <pid> //F`.
- **Don't use page-level `scroll-padding-top`.** It made the page jump when tabbing into the hidden sticky header, and `e2e/header.spec.ts` caught it. To keep scroll targets clear of the header, put `scroll-margin-top` on the targets: `[data-task-id]`, `#quick-add` and `#search` in `index.css`.
- **Roles and names are a test contract.** These are fixed:
  - `h1` "Tasks", region "Overview", lists "Tasks" and "<group> tasks", button "Load sample data"
  - checkbox names `Mark "<title>" as done` / `as not done`
  - the Overview tiles' names start with their label ("Overdue 2")

  `e2e/fixtures.ts` relies on them.
- **The Overview tiles count all tasks.** Picking one narrows the list together with other filters (`matchesScope` in `src/lib/filter.ts`). The completion meter sits *outside* the tile button so it stays a progress bar to assistive tech. That's why the tiles use a shadow on hover and don't lift.
- **The filter panel is collapsed by default.** Project, Sort by, Group by, the filter pills and "Show completed" only exist once it's open. In e2e, call `app.openFilters()` (in `e2e/fixtures.ts`) before using them. Search, the chips and Clear filters stay visible while it's collapsed.
- **Focus under the sticky header.** On phones, Shift+Tab back up the page brings the header back on top of whatever gets focus. Anything focusable near the top needs `scroll-margin-top` (see the `[data-filter-bar]` rule in `index.css`). The backup nudge's buttons still lack it; that's for #26.
- **Python on Windows writes CRLF.** Scripted edits through `open(..., 'w')` turned whole files into CRLF diffs. Use `newline=''`, or the Edit tool. It happened again in step 3a. Check with `git ls-files --eol <files>` before committing: the working copy should say `w/lf`.
- **Swapped siblings need keys.** When a ternary swaps one block of buttons for another of the same shape, React reuses the DOM nodes. In step 3a, Keep editing became the Save button mid-click and submitted the form. Give each branch its own `key`.
- **The task editor asks before discarding.** With unsaved changes, Esc, × and Cancel show the "Discard your changes?" bar instead of closing. In e2e, close an edited editor with Save, or press Discard on the bar (`e2e/task-editor.spec.ts` shows how). Closing an untouched editor is still instant.
- **Give each review agent its own port.** The adversarial review runs many agents that each start Playwright. Pass `E2E_PORT=<unique port>` to each one (`playwright.config.ts` reads it), or they reuse or kill each other's dev server. Probe tests go in `e2e/zz-probe-*.spec.ts` and get deleted afterwards.
- **Faking a storage failure.** To test what happens when IndexedDB refuses a write, patch `IDBObjectStore.prototype.add` in `page.addInitScript` to throw a `QuotaExceededError` for one store. "when attachments fail to save" in `e2e/task-editor.spec.ts` does this.
- **#25 will break a layout assertion.** `e2e/layout.spec.ts` expects the backup nudge to show after sample data, to measure the worst case. When #25 stops that, bring the nudge up deliberately rather than deleting the check. There's a comment on #25 about this.
- **README screenshots are stale.** They show the old bento. Regenerate them with `npm run screenshots` in #27, not earlier, so it's done once.
- **Confirmations are in-app `alertdialog`s.** There is no `window.confirm()` left, so `page.on('dialog')` never fires. Find a question with `page.getByRole('alertdialog', { name: 'Empty Trash?' })` and press its named button ("Delete forever", "Cancel"). It's an `alertdialog`, not a `dialog`, so `getByRole('dialog')` still means the window behind it. `e2e/confirm.spec.ts` fails any test where a native dialog opens.
- **The task editor validates itself.** The form is `noValidate`; errors are `role="alert"` under the field, and the field gets `aria-invalid` and `aria-describedby`. Assert with `toHaveAccessibleDescription(...)`. The Project select is now named "Project".
- **Draft text lives in TaskForm state now.** The `data-draft` attributes and `hasUnaddedText` are gone: each "add" field's text is a `draft`/`onDraftChange` prop pair, and Save adds it. Typing into one still counts as an unsaved change.
- **`git stash push -- src` fails with intent-to-add files.** After `git add -N` on new files, stash refuses ("not uptodate"). To prove a test fails without a fix, copy the file aside, undo the fix, run, and copy it back.
- **Completing a task shows a toast.** A "Done: <title>" toast (`role="status"`) now follows every completion, so `getByRole('status')` can match more than one toast. Filter by text. A toast replaced or undone keeps its text while it slides out, so wait for it to be hidden before counting.
- **The fake clock stalls toast exits.** After `page.clock.runFor`, Motion's slide-out doesn't finish. Run countdown tests with `reducedMotion: 'reduce'`, as `e2e/completion.spec.ts` does.
- **Shortcuts after quick add.** Quick add keeps focus in its field, so J/K/X/Z typed afterwards go into the field. Blur it first (`addTasks` in `e2e/completion.spec.ts`). Checkboxes and buttons no longer count as typing, so shortcuts work while one has focus.
- **Faking a failed task write.** Patch `IDBObjectStore.prototype.put` for the `tasks` store behind a window flag you turn on mid-test (see "when storage refuses the change" in `e2e/completion.spec.ts`). Patching it from the start breaks nothing else, because creating a task uses `add`.
- **Mind `@` in GitHub text.** Quick-add syntax like `@home` pings real GitHub users in issue or PR text, so keep it in backticks.

## Step 3c in brief (#24, #28)

- **`ConfirmDialog`** (`src/components/ConfirmDialog.tsx`), used through **`useConfirm()`** (`src/hooks/useConfirm.tsx`): `const [confirmDialog, ask] = useConfirm()`, render `confirmDialog`, then `if (await ask({ title, body, confirmLabel, danger }))`. It resolves false on Cancel, Esc, replacement or unmount. Destructive questions use the new `btn.dangerSolid` (`--danger-hover`, `--on-danger`) and focus Cancel. All five `confirm()` calls use it: restore (with a `CountList` of Now/Backup counts), Empty trash, Delete forever, project/tag delete, sample data. `Dialog` ignores a nested dialog's `close` event, so a question closes alone. After Delete forever or a label delete, focus goes to the neighbour's same button.
- **Restore checks the file first** (`backup.inspect` in `src/db/backup.ts`), so a non-backup never reaches "Replace everything?".
- **Inline validation** (`FieldError`, `INVALID_FIELD`): empty title, bad effort, half-typed date or time (`validity.badInput`; time only while a date is set), invalid link. Focus goes to the first error. Fields in dialogs have `scroll-margin-block` so focus stops clear of the sticky title bar and footer.
- **Dates:** "Due Wed 11/03/2026, 17:30 · Tomorrow" under the native pickers (`describeDeadline`), "Reminds you …" under the reminder picker (`formatDateTime`). Date and time stack where both don't fit.
- **#28:** Save adds a typed checklist item, link, tag, project (via `findOrCreate`) or reminder time.
- **Layout fix:** "At a specific time…" in Reminders used to push the editor sideways at every width; the picker now has its own wrapping row.
- **Review:** three lenses, three skeptics each. Three of seven findings survived and are fixed: the disabled time field blocking Save, focus under the sticky title bar, the unnamed Project select (pre-existing). Refuted: focus after Empty trash and after restore (0/3 each), the sample-data double click and a half-typed reminder time (1/3 each). The double-click guard went in anyway (a `useRef`).
- **Left for #26:** after Empty trash or deleting the last Trash card, focus falls to `<body>` (the review refuted it as a defect). Confirming a restore or sample-data load disables the focused button while it works, which also drops focus. A half-typed reminder time is still dropped on Save (pre-existing).

The tests are in `e2e/confirm.spec.ts` (5) and `e2e/editor-validation.spec.ts` (12), plus a contrast check per theme for the confirm dialog and for the inline errors. Each new behaviour test was run against the code without its fix and failed; the contrast checks were not.

## Step 3b in brief (#23)

Completing a task by its checkbox or X shows "Done: <title>" with **Undo**, which restores the task's previous status. A recurring task adds "Next due <when>", and Undo reuses the reopen rule in `taskRepo.update` (the new copy goes to Trash unless started). Completion now runs through `setDone` in `App.tsx`; `TaskCard` hands its checkbox up via `onToggleDone`. `taskRepo.update`/`setStatus` resolve to the saved task.

- **Selection:** after X, the selection passes to the card that takes the completed card's place (next, else previous). `toggleDone` moves it at once, when the card is going to leave the list (`applyFilters` on the toggled task), and puts it back if the save fails. A `useLayoutEffect` covers everything else: a selected card that leaves through Trash, a filter or an edit, or that X moves in the sort with Show completed on. It goes by the previous order, so a recurring task's new copy doesn't take the selection.
- **Toasts:** completion toasts share a slot (latest wins). `Z` runs the newest Undo; X and Z ignore key repeats. The 6s countdown waits on hover or focus. Failure toasts (`urgent`, `role="alert"`) put the reason in `detail` and stay until dismissed. Titles go through `toastTitle` (60 characters, cut at a word break), and nothing in a toast is clamped.
- **Review:** three lenses with three skeptics each. Six findings survived and one was refuted; all six are fixed in the same commit. They were the clamp hiding the verb and the fix, the X-then-J race, held Z, Z ignored on a focused checkbox, and an 8px sidecar corner.
- **Left for #26:** toasts are added to the page with their text in them, which some screen readers don't announce; an always-present live region would be more reliable. When a focused toast closes, focus drops to `<body>` (the review refuted this as a defect, but #26 should decide).

The tests are in `e2e/completion.spec.ts` (20 cases). The files touched are `src/App.tsx`, `src/components/{Toast,TaskCard,TaskForm}.tsx`, `src/db/tasks.ts`, `src/lib/utils.ts` (`describeSaveError` moved here) and `src/hooks/useShortcuts.ts`, plus `DESIGN.md` (Toast), the sidecar (a "Toast" component), `docs/SPEC.md` and the README.

## Step 1 in brief (#20)

The heading reads "Tasks / 2 overdue". The tiles are filters, ordered Overdue, Due today, Open, Completed. The page order is urgency first, with 12px spacing inside groups and 24px between them. The first card is now on the first screen at 1024×768 and 1280×900. On a 390px phone it starts at about 820px, and #21 finishes the job.

The files touched are `src/App.tsx`, `src/components/{HeadingPanel,Overview,Backup,ReminderAlerts,FilterBar}.tsx`, `src/lib/filter.ts`, `src/index.css` and `src/ui.ts`, plus tests and docs. See #20 for the details and measurements.

## Step 2 in brief (#21)

The filter bar is one row: search (still on `/`) and a **Filters** disclosure with a count of active filters. Project, Sort by and Group by (visible labels), the priority, status and tag pills, and "Show completed" sit behind it. While it's collapsed, each active filter shows as a removable chip, then Clear filters. Removing a chip moves focus to the next chip, or the one before it, never onto Clear filters. Sort's "Smart (overdue, deadline, priority)" is now "Smart". Deleting a project or tag that's picked as a filter now takes the filter off too (`withoutMissingLabels` in `src/lib/filter.ts`).

On a 390×844 phone the first card now starts at 570px (was about 820px) and ends at 676px. At 1024 and up it starts at 485px. The tests are in `e2e/filter-bar.spec.ts` and the phone `describe` in `e2e/layout.spec.ts`.

The files touched are `src/components/FilterBar.tsx`, `src/App.tsx`, `src/lib/{filter,sort}.ts`, `src/index.css`, the e2e specs, `DESIGN.md`, `.impeccable/design.json` and `MASTER.md`.

## Step 3a in brief (#22)

The task editor no longer throws edits away silently. With anything changed, Esc, × and Cancel turn the sticky footer into a Noon Mustard bar: "Discard your changes?" ("Discard this new task?" when creating), with **Keep editing** (focused, the inverted main action) and **Discard**. With nothing changed, every close is instant. The backdrop never closed the editor, so it needed no guard.

- **What counts as a change:** every field, the checklist, reminders, repeat, staged attachments, and text typed but not yet added (the inputs marked `data-draft`). Changing a field back counts as no change.
- **Esc** is caught on `keydown`, so a second quick press can't get past the browser's limit on cancelling. Esc on the bar means Keep editing. If the browser forces a close anyway (for example, Android back twice), the editor reopens with the bar showing. That path is untested, and only Chromium was tested.
- **Focus:** Keep editing returns focus to the field, ×, or Cancel. Going back to a field puts the bar away.
- **Saving:** a retry after a half-finished save updates the new task instead of adding a copy. Storage-full errors get a plain message. Errors use `role="alert"` and scroll into view. Double submits are blocked.

**The adversarial review** (`c88b2e4`) ran three lenses over `32624b4`, with three skeptics per finding. All six findings survived; two were the same bug. The fixes:
- a reminder time picked but not added now counts as unsaved
- a forced close while the bar is showing puts focus back in it
- close requests wait while a save is writing
- after a half-finished save, the saved fields become the new baseline, so only the attachments are unsaved and the bar says "Discard your changes?"
- on narrow phones the question stays on one line and the buttons wrap below it (`flex-auto`, not `flex-1`)

Four of the five new tests fail on the old source. The guard for closing during a save has no test, because the race is too short to hit.

The files touched are `src/components/TaskForm.tsx`, `data-draft` in `{Checklist,Attachments,Reminders}Editor`, `TagPicker` and `ProjectPicker`, plus `e2e/task-editor.spec.ts` (21 tests), a contrast test for the bar, `DESIGN.md` (Dialogs) and the sidecar (a "Discard Bar" component).
