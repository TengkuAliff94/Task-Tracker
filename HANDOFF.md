# Handoff: UI critique follow-ups

Last updated 2026-11-24 (step 10). Step 5 is done: polish pushed (`426f55f`), and the re-critique scored **28/40 (Good)**, up from 24/40. 0 P0, 2 P1 (icon-only header; the deadline in two date formats), 2 P2 (panel colours carry several meanings; the 13-field editor), 1 P3 (quick-add grammar help). The report is `.impeccable/critique/2026-11-21T17-02-11Z__src.md` (local only). The date-format P1 is fixed, reviewed and pushed as `63657c9` ([#29](https://github.com/TengkuAliff94/Task-Tracker/issues/29), closed, now a sub-issue of #19 as step 6). #27 records 28/40 and is closed. The other P1, the icon-only header, is fixed for [#30](https://github.com/TengkuAliff94/Task-Tracker/issues/30) (step 7, `af20632`, closed). The colour P2 is fixed for [#31](https://github.com/TengkuAliff94/Task-Tracker/issues/31) (step 8, `f0f26d5`, closed), the editor P2 for #32 (step 9), and the quick-add help P3 in step 10. Every re-critique finding is now addressed.

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
| 3d | `/impeccable harden src/components/Backup.tsx src/db` | [#25](https://github.com/TengkuAliff94/Task-Tracker/issues/25) backup nudge timing, persistent storage, sample data placement | **done** (`e0b8ad1`) |
| 4 | `/impeccable audit src`, then harden, adapt and clarify | [#26](https://github.com/TengkuAliff94/Task-Tracker/issues/26) WCAG 2.2 AA gaps | **done** (`391ccaf`, closed) |
| 5 | `/impeccable polish src`, then `/impeccable critique src` | [#27](https://github.com/TengkuAliff94/Task-Tracker/issues/27) polish, README screenshots, SPEC alignment, re-score | **done**: 28/40 |
| 6 | `/impeccable harden src/components/TaskForm.tsx` | [#29](https://github.com/TengkuAliff94/Task-Tracker/issues/29) re-critique P1: typed DD/MM/YYYY and 24-hour dates, picker behind a button | **done** (`63657c9`, closed) |
| 7 | `/impeccable clarify` (header) | [#30](https://github.com/TengkuAliff94/Task-Tracker/issues/30) re-critique P1: header buttons named, theme menu, labelled More menu on phones | **done** (`af20632`) |
| 8 | `/impeccable colorize` | [#31](https://github.com/TengkuAliff94/Task-Tracker/issues/31) re-critique P2: colour has one job; priority as signal bars, ink toasts, neutral backup reminder | **done** (`f0f26d5`) |
| 9 | `/impeccable distill` (editor) | [#32](https://github.com/TengkuAliff94/Task-Tracker/issues/32) re-critique P2: the editor leads with the common fields; Status, Effort, Repeat, Reminders, Attachments behind a closed More details with a summary | **done** (`bdd1df8`) |
| 10 | `/impeccable onboard` | [#33](https://github.com/TengkuAliff94/Task-Tracker/issues/33) re-critique P3: quick-add help. A `?` popover in the bar, the syntax in the shortcuts sheet, and a Try button on the first-run empty state | **done** (`74e5dfd`) |

Each issue holds the full problem statement, file:line pointers and acceptance criteria. Read the issue before starting its step.

**To resume:** every re-critique finding is addressed. Next: decide whether to re-run `/impeccable critique src` for a new score, or take on the persona red flags in the 2026-11-21 report.

**Re-critique P1 "deadline in two date formats": fixed** (2026-11-23/24, `/impeccable harden src/components/TaskForm.tsx`). Three agents reviewed it (correctness, WCAG, layout); it was committed for [#29](https://github.com/TengkuAliff94/Task-Tracker/issues/29) and pushed. See "Typed dates in brief" below.

**Follow-ups outside the table:** #28 (Save dropped text typed into an "add" field) was fixed together with #24. The #29 review left some minor points for later:
- Picking a preset reminder clears a half-typed specific time (as before).
- Add is 36px tall beside 38px fields (`btn.secondary`).
- One Save with both deadline and reminder errors can raise four alerts at once.
- Opening the native picker still needs a by-hand check with a screen reader.

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
npm test                        # unit (Vitest): 179 passing after #31
npm run test:e2e                # e2e (Playwright, port 4173): 211 passing after #31
npm run build                   # production build + PWA
"<impeccable skill dir>/scripts/impeccable" detect --json --changed   # skill dir: the impeccable plugin (v4.9.2) in the Claude plugin cache
"<impeccable skill dir>/scripts/impeccable" doctor
```

**Known detector findings.** These were there before step 1; don't chase them as regressions:
- `bounce-easing` on the dialog spring: documented and intentional.
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
- **Focus under the sticky header.** On phones, Shift+Tab back up the page brings the header back on top of whatever gets focus. Every control in `<main>` now has `scroll-margin-top: 6rem` (`index.css`), so this is solved for anything new inside `<main>`. Things outside it (dialogs, toasts) don't need it.
- **Python on Windows writes CRLF.** Scripted edits through `open(..., 'w')` turned whole files into CRLF diffs. Use `newline=''`, or the Edit tool. It happened again in step 3a. Check with `git ls-files --eol <files>` before committing: the working copy should say `w/lf`.
- **Swapped siblings need keys.** When a ternary swaps one block of buttons for another of the same shape, React reuses the DOM nodes. In step 3a, Keep editing became the Save button mid-click and submitted the form. Give each branch its own `key`.
- **The task editor asks before discarding.** With unsaved changes, Esc, × and Cancel show the "Discard your changes?" bar instead of closing. In e2e, close an edited editor with Save, or press Discard on the bar (`e2e/task-editor.spec.ts` shows how). Closing an untouched editor is still instant.
- **Give each review agent its own port.** The adversarial review runs many agents that each start Playwright. Pass `E2E_PORT=<unique port>` to each one (`playwright.config.ts` reads it), or they reuse or kill each other's dev server. Probe tests go in `e2e/zz-probe-*.spec.ts` and get deleted afterwards.
- **Faking a storage failure.** To test what happens when IndexedDB refuses a write, patch `IDBObjectStore.prototype.add` in `page.addInitScript` to throw a `QuotaExceededError` for one store. "when attachments fail to save" in `e2e/task-editor.spec.ts` does this.
- **Sample data never brings up the backup nudge.** To test with it showing, call `app.showBackupNudge()` (in `e2e/fixtures.ts`). It writes `firstUsedAt` (4 days back) straight into IndexedDB and reloads. The layout and contrast specs use it for the worst case.
- **Run e2e with `npm run test:e2e`, not bare `npx playwright test`.** The bare command also runs the screenshots project, which rewrites `docs/screenshots/*.png`. If it happens, `git checkout -- docs/screenshots`.
- **Faking the storage manager.** Headless Chromium answers `navigator.storage.persist()` on its own terms. Patch `StorageManager.prototype.persisted/persist` (and `Permissions.prototype.query` for `persistent-storage`) in `page.addInitScript`, then reload. `fakeStorageManager` in `e2e/backup.spec.ts` does this; tests that call it need the `app` fixture so there's a page to reload.
- **`taskRepo.create` writes `meta` too.** It notes first use in the same transaction, so calling it inside an outer transaction needs `db.meta` in scope, or `{ sample: true }` (which skips the note), as `sample.ts` does.
- **README screenshots are stale.** They show the old bento. Regenerate them with `npm run screenshots` in #27, not earlier, so it's done once.
- **Confirmations are in-app `alertdialog`s.** There is no `window.confirm()` left, so `page.on('dialog')` never fires. Find a question with `page.getByRole('alertdialog', { name: 'Empty Trash?' })` and press its named button ("Delete forever", "Cancel"). It's an `alertdialog`, not a `dialog`, so `getByRole('dialog')` still means the window behind it. `e2e/confirm.spec.ts` fails any test where a native dialog opens.
- **The task editor validates itself.** The form is `noValidate`; errors are `role="alert"` under the field, and the field gets `aria-invalid` and `aria-describedby`. Assert with `toHaveAccessibleDescription(...)`. The Project select is now named "Project".
- **Draft text lives in TaskForm state now.** The `data-draft` attributes and `hasUnaddedText` are gone: each "add" field's text is a `draft`/`onDraftChange` prop pair, and Save adds it. Typing into one still counts as an unsaved change.
- **`git stash push -- src` fails with intent-to-add files.** After `git add -N` on new files, stash refuses ("not uptodate"). To prove a test fails without a fix, copy the file aside, undo the fix, run, and copy it back.
- **Completing a task shows a toast.** A "Done: <title>" toast (`role="status"`) now follows every completion, so `getByRole('status')` can match more than one toast. Filter by text. A toast replaced or undone keeps its text while it slides out, so wait for it to be hidden before counting.
- **The fake clock stalls toast exits.** After `page.clock.runFor`, Motion's slide-out doesn't finish. Run countdown tests with `reducedMotion: 'reduce'`, as `e2e/completion.spec.ts` does.
- **Shortcuts after quick add.** Quick add keeps focus in its field, so J/K/X/Z typed afterwards go into the field. Blur it first (`addTasks` in `e2e/completion.spec.ts`). Checkboxes and buttons no longer count as typing, so shortcuts work while one has focus.
- **Faking a failed task write.** Patch `IDBObjectStore.prototype.put` for the `tasks` store behind a window flag you turn on mid-test (see "when storage refuses the change" in `e2e/completion.spec.ts`). Patching it from the start breaks nothing else, because creating a task uses `add`.
- **J/K move real focus now.** After `J`, focus is on the card's title button (`[data-card-edit]`), and Tabbing to a card selects it. So a test that presses `J` and then types expects the keys to reach the shortcuts, which they do, since buttons aren't typing targets.
- **Focus follows a card that leaves.** When the focused card goes (ticked off, deleted, X), focus moves to the same control on the next card, or the empty state (`[data-empty-state]`, `tabIndex=-1`). Ticking a checkbox with the mouse therefore leaves focus on the next card's checkbox. The logic is the `useLayoutEffect` in `App.tsx`, next to the selection handover.
- **Toasts have a separate live region.** Status toasts carry `aria-live="off"`; their words go into `ToastAnnouncer` (`[aria-live="polite"]`, visually hidden). `getByRole('status')` still finds the toast panels. The announcer's text adds "Press Z to undo." only with a fine pointer.
- **Toast countdowns pause under a modal.** `useModalOpen` watches for `dialog:modal`. A test that opens a dialog over a toast and runs the fake clock will find the toast still there.
- **Popovers take Esc.** The blocked-notifications popover (`popover="auto"`) closes on Esc, and `useShortcuts` stands aside while any `:popover-open` exists. Fake the blocked state with `Object.defineProperty(Notification, 'permission', { get: () => 'denied' })` in `addInitScript`.
- **The page heading is a focus target.** `#page-heading` (`tabIndex=-1`) is the fallback when a focused toast goes and focus has nowhere better to return to.
- **Mind `@` in GitHub text.** Quick-add syntax like `@home` pings real GitHub users in issue or PR text, so keep it in backticks.

## Quick-add help in brief (step 10)

Quick add's grammar is findable without reading the placeholder. `QUICK_ADD_SYNTAX` and `QUICK_ADD_EXAMPLE` in `src/lib/quickAdd.ts` are the single source; `QuickAddSyntax` (`src/components/QuickAddSyntax.tsx`) renders it as a token-chip list, and `quickAdd.test.ts` parses every token it shows.
- **`?` in the bar** ("Quick add syntax", `btn.icon`, at every width) opens a `popover="auto"` hung under the quick-add *panel* with `placeBelow(form, …)`, so it keeps a 16px gutter on phones (anchoring to the button left it 2px from the edge at 320). Esc closes it with focus on the button. The `N` key cap sits beside it from `md` only; between `sm` and `md` it cut the example placeholder off.
- **Shortcuts sheet** has the same list under a bold "Quick add syntax" heading.
- **First-run empty state:** new copy ("Type one in the quick-add bar above. One line sets its tags, project, priority and deadline.") and a Well Stone **Try: Pay rent #finance …** button (`EmptyState`'s new `example` slot). It calls `QuickAddHandle.fill()` (a React 19 `ref` prop with `useImperativeHandle`; `flushSync`, then focus with the caret at the end). Nothing is saved until Enter (the user's choice over adding at once).
- **Deadline row** leads with `fri 5pm`, not `tomorrow 5pm`: the long chip squeezed the text column. `next mon` is left out on purpose: from a Sunday chrono reads it as the next day.

Tests: `e2e/quick-add-help.spec.ts` (10: Try fills without saving, popover + Esc, Tab order, shortcuts sheet, 320/390/1280 placement, placeholder fits at 640/768/1024) and a popover contrast check per theme in `contrast.spec.ts`. The 9 behaviour tests failed on the old source; the placeholder test was proved by putting `sm:pr-20` back. 193 unit and 228 e2e passing, build clean. Sidecar gained a Quick Add Syntax component; doctor clean, detector clean.

**Gotchas from this step:**
- **`getByRole('button', { name: 'Quick add syntax' })`** is the help; `getByLabel('Quick add task')` still finds only the field.
- **Flaky unit test (pre-existing):** `storage.test.ts` "apply adds and removes in one go" fails about one full run in four and passes alone. Probably two attachments created in the same millisecond sorting either way. Not touched here.

## Editor fields in brief (step 9)

The editor reads: Title; Deadline, Time and Priority on one row; Description; Checklist; Project beside Tags; then **More details** (Status, Effort, Repeat, Reminders, Attachments). It starts closed on every open, and closed it lists what's set ("In Progress · 30m · Repeats weekly · 1 reminder"), or names its fields in muted text when nothing is. Its fields stay mounted under `hidden`, so drafts typed there still save, and `RemindersEditor`'s own "specific time" choice survives a close. A Save with an error there (effort, reminder date/time, link) opens it in the same render, so focus reaches the field. Tests: `e2e/editor-details.spec.ts` (5, all failing on the old editor). 179 unit and 216 e2e passing.

**Gotchas from this step:**
- **Open More details before touching its fields.** In e2e call `openMoreDetails(dialog)` (in `e2e/fixtures.ts`); it also waits for the fade-up, so boxes measured after it are settled. Reopening a saved task closes it again.
- **On phones, blur quick add before tapping a card.** Its panel shrinks when it loses focus, so a tap straight after `quickAdd` lands where the card was.
- **Two flakes under full-suite load,** both passing alone: the phone More menu's 40px item height (39.99998) and "a new project name that already exists reuses that project on Save".

## Colour roles in brief (#31)

Colour means time and state, one job per hue: maroon overdue, mustard due soon (plus the hover light), violet open, sage done (DESIGN.md, the One Job Rule). Priority is `PriorityGlyph` (four signal bars, `data-priority-glyph="<lit>"`) plus its word, styled through `PRIORITY_TONE` in `ui.ts` (`badge`, `pressed`, `stripe`); `PRIORITY_PANEL` is gone. Badges and priority group tabs are Well Stone, pressed priority pills and chips are ink, and only High (ink) and Urgent (rust) cards have a stripe (`data-priority-stripe`). Urgent alone keeps a hue. New `panel.ink` (`bg-fg text-bg`) and `INVERTED_PANEL.ink`; `INVERTED_PANEL.info` is gone. Toasts are ink. The backup reminder is a neutral `bg-surface` panel with an ink Back up now (an ink slab was too loud, and white in dark mode). Tests: `e2e/colour.spec.ts` (8, all failed on the old source); 179 unit and 211 e2e passing. README screenshots regenerated. Review: a self-review plus rendered checks at 390 and 1280 in both themes (no three-lens agent review).

**Gotcha:** a pill's colour eases over 200ms, so read a pressed pill's background with `expect.poll`.

## Header in brief (#30)

Backup and Trash show their words from `md`, Projects & tags and the bell from `lg`; Trash's count is a corner badge on the bare icon and an inline pill after the word. Under `sm` the tray is bell, Trash and **More** (a `Menu` with Projects & tags, Backup & restore and the Theme choices). Theme is a `Menu` (System / Light / Dark) showing a sun or moon, named "Theme: System". `src/components/Menu.tsx` (WAI-ARIA menu on `popover="auto"`, placed with `placeBelow`), `src/hooks/useTheme.ts`; `ThemeToggle.tsx` is gone. Tests: 7 new in `e2e/header.spec.ts`; 203 e2e passing.

**Gotchas from this step:**
- **`:focus-within` stops at an open popover in Chromium.** The header would hide under an open menu, so `index.css` adds `.hide-on-scroll:has(:popover-open)`.
- **The menu focuses its item on the `toggle` event,** a moment after opening. In tests, wait for the item to be focused before pressing arrow keys.
- **Theme in tests:** click "Theme: System", then the `menuitemradio` "Dark". On phones it's under "More".

## Typed dates in brief (re-critique P1)

The deadline and the reminder's "At a specific time" are typed text now: `DateField` / `TimeField` in `src/components/DateTimeFields.tsx`, read by `readDateText` / `readTimeText` in `src/lib/dateInput.ts`. Day first and 24-hour in any locale; short forms (`8/3`, `1730`, `5pm`) and quick-add words ("fri", "fri 5pm") are written back in full on blur, and a time given with the date moves to the time field. The native picker sits behind an icon button ("Open calendar for the deadline", "Open time picker for …") and only writes into the text; no `showPicker`, no button. Errors name the problem ("“31/02/2026” isn’t a date. Check the day and month."). A reminder with only one half typed now stops Save at its field instead of being dropped. TaskForm holds the deadline as `dateText` / `timeText` and derives `date` / `time` each render, so the readout follows the typing.

Tests: `src/lib/dateInput.test.ts` (17) and ten new e2e tests in `e2e/editor-validation.spec.ts`; the old ones type `DD/MM/YYYY` now. 179 unit and 196 e2e passing.

**Review fixes:** a space no longer separates the year, so "8/3 1730" is a date and a time (it had saved the year 1730, and "8/3 0930" a broken `930-03-08`); four-digit years before 1000 are refused. Each field tells screen readers its format until there's a reading or error. Clearing the date clears the disabled time field's error. The reminder's date and time share a row (min 9.25rem each, so the placeholder clears the button), each error under its own field, with the reading and Add on the line below. Pointing at a picker button keeps the field's hover border. The sidecar has a new Date Field component.

**Gotchas from this step:**
- **`getByLabel` matches substrings.** A picker button called "Choose deadline date" collided with the field "Deadline date", so the buttons are "Open calendar for the deadline". Keep new names clear of existing ones.
- **The native picker can't be driven by Playwright.** Tests fill the hidden `input[type="date"]` with `{ force: true }`, which is what the picker writes on a choice.
- **An owner holding date and time in one value** (the reminder draft) must take the tidied date and the time in one call: two `onDraftChange` calls from the same render overwrite each other. That's why `DateField`'s `onTimeRead(time, dateText)` carries both.

## Step 5 polish in brief (#27)

Every item in #27's list except the re-critique. No snapshot was used: the 2026-11-17 critique is closed because `src` changed, so this was an independent pass with #27 as the backlog.

- **Drift:** no hairlines left (editor footer, Markdown preview; the Backup divider had already gone). `kbd` and the Trash badge are 12px; nothing is below 12px. The shortcuts sheet uses the global `kbd`, with J / K as two keys. Chips read `#finance` / `@Home` with no drawn gap (the gap came from flex `gap`, not text), and the quick-add preview shows an existing label's spelling. The title button's dead `focus-visible:outline-offset-4` is gone. Markdown headings are bold.
- **Overview:** a picked tile shows a check cut out of an ink disc in its icon's place, at every size, so picked never looks like focus alone.
- **Trash:** no strike-through, bold `h1`, New task hidden with `invisible` (it keeps its space; removing it shifted the tray so the Trash button left the pointer).
- **Toast Undo** is the violet panel inverted (`attentionAction` + `INVERTED_PANEL.info`).
- **Checkboxes:** `.box-check` (square, 4px, Weathered Grey border, same tick and halo as `.task-check`) for Show completed and checklist items.
- **Solid surfaces:** the editor footer is solid Well Stone (Cancel hovers to `bg-line`), and the sticky header is solid `bg-bg` with no blur.
- **No matches** has **Clear search** (only a search) or **Clear filters**; both keep Show completed and focus `#search`.
- **Projects & tags:** names in `field` wells, round `.swatch` colour pickers, per-label task counts (`countTasks`, also the name field's description).
- **Docs:** `DESIGN.md`, the sidecar (two new components: Square Checkbox, Label Row), `docs/SPEC.md` (audience, sync as a direction, out of scope), `MASTER.md`, README, and regenerated screenshots. `impeccable doctor` is clean; the detector shows only the documented dialog spring.
- **Review:** a self-review of the diff, as in step 4.

The tests are `e2e/polish.spec.ts` (14) and one more in `e2e/header.spec.ts`. All 15 failed against the old source. The phone header test now checks every visible header button instead of New task.

**Gotchas from this step:**
- **`getByText` can't see a flex gap.** `<span>@</span>Home` has the text "@Home" but draws "@ Home". `polish.spec.ts` measures the gap with a `Range`.
- **The README editor shot shows the date picker as 03/13/2026, 09:30 AM.** Headless Chromium's native date field follows its own locale, not Playwright's `locale`. DESIGN.md already says the pickers follow the browser's locale, and the line under them gives DD/MM.
- **A ticked card leaves at once**, so use `click()`, not `check()`, on a task checkbox in tests.

## Step 4 in brief (#26)

The audit (`/impeccable audit src`) scored **14/20**. Six P1s, five P2s and two P3s, all fixed in one pass except the 10px badge, which is left for #27.

- **Placeholders** use full `text-muted` (6.0–7.7:1, were 3.1–3.5) in `field`, quick add, the tag picker and search, which had fallen back to the browser default. `contrast.spec` now measures placeholders, because axe skips them.
- **J/K** move real focus with the selection; Tab to a card selects it. When a focused card leaves, focus goes to the same control on the next card or to the empty state. Delete from the editor lands on the next card. Trash does the same for Restore, Delete forever and Empty trash.
- **Toasts:** the countdown waits while a modal is open (`src/hooks/useModalOpen.ts`). Status toasts are read out by `ToastAnnouncer`, the stack is a "Notifications" region while it holds anything, and focus returns to where it was when a focused toast goes.
- **Errors** in quick add, Projects & tags, the new-project field and the attachment file check use `FieldError` with `aria-invalid`/`aria-describedby`.
- **Blocked notifications** is a button with a popover explanation, which is also its description.
- **Sticky header:** `main :is(...)` gets `scroll-margin-top`; the content is now in `<main>`.
- **Phones:** the quick-add placeholder is "Quick add a task" below `sm`, with a syntax hint while focused (`src/hooks/useMediaQuery.ts`). The task checkbox has a 44px target, and the label-chip × and attachment/checklist removes are 24px or more.
- **Cards:** the metadata figures have spoken labels ("2 reminders", "Checklist: 1 of 3 done", "Effort: 1 hour 30 minutes" via `describeEffort`), and the deadline gets a hidden "Due".
- **Also:** the Ask-for-storage focus moved into a layout effect, and the raw `bg-black/10`/`bg-white/15` tints are now `bg-current/*`.
- **Review:** a self-review of the diff instead of the three-lens agent review. It found one issue, fixed: focus moving after a mouse tick scrolled the page; now only keyboard focus scrolls. The card's double ring was checked in screenshots and the title button rounded to 8px so the rings nest.

The tests are in `e2e/accessibility.spec.ts` (17) and two placeholder tests in `e2e/contrast.spec.ts`. All 19 were run against the old source: 18 failed as expected, and the phone sticky-header test was rewritten until it did too. Docs touched: `DESIGN.md`, the sidecar, `MASTER.md`, `docs/SPEC.md` and the README test section.

## Step 3d in brief (#25)

- **Nudge rule:** `backupNudge()` in `src/db/backup.ts` (pure, unit-tested). Never backed up: shows once real use is 3+ days old. Backed up: shows at 14+ days. Not while snoozed, not with no tasks. Real use is `firstUsedAt` in `meta` (`src/db/usage.ts`), set by `taskRepo.create` (unless `{ sample: true }`) and by a restore. A Dexie v3 upgrade seeds it from the oldest task on existing installs, so their behaviour is unchanged. The trade-off: an old install with only sample data still gets the nudge.
- **Restore** sets `lastBackupAt` to the file's `exportedAt` (never later than now), because the data then matches the file. An older file moves it back on purpose.
- **Persistent storage:** `src/db/persistence.ts` and `src/hooks/useKeepStorage.ts` (in `App`). It asks right after the first own task or restore in a visit, when Firefox's prompt makes sense, and on later launches only when `permissions.query('persistent-storage')` is `granted`. It never prompts on load. Backup & restore shows Storage: Protected, Not protected or Not reported. "Ask the browser to protect it" leads to "Not granted" or "Still not granted"; when protection is granted, focus moves to the answer. `persistence.subscribe` keeps an open dialog current.
- **Dialog:** Last backup is `DD/MM/YYYY` via `formatDateTime`. `CountList` now takes nodes. Sample data lives in a "Try the app" section with a bold h3 and a ghost button, with spacing and no rule. Result lines are `role="status"` and `empty:sr-only`, so they stay in the accessibility tree.
- **Review:** three lenses. Eight findings, checked by hand against code and renders rather than by three skeptics each, since all were measured facts. Fixed: stale status after a restore, `display:none` status regions, a silent second refusal, the centred wrap on phones, the h3 weight, the hairline, Firefox-inaccurate copy, DESIGN.md wording. Not fixed: old sample-only installs (by design), an older restore moving Last backup back (intended), two tabs both asking (rare, unproven).
- **Left for #26:** the Ask flow puts focus on `<body>` for one animation frame before it reaches "Protected". Focusing in a layout effect would close that gap.

The tests are `src/db/usage.test.ts` (21) and `e2e/backup.spec.ts` (8). The 7 original e2e tests were run against the old source and failed; the restore catch-up test was checked the same way against its fix.

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
