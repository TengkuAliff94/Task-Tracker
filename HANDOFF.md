# Handoff: UI critique follow-ups

Last updated 2026-11-19, at the end of the session that ran step 3a.

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
| 3a | `/impeccable harden src/components/TaskForm.tsx` | [#22](https://github.com/TengkuAliff94/Task-Tracker/issues/22) the editor must not discard edits silently | **done** (`32624b4`; #22 still open, see below) |
| 3b | `/impeccable harden src/App.tsx` | [#23](https://github.com/TengkuAliff94/Task-Tracker/issues/23) completion toast with Undo, next-due note, J/K position | **next** |
| 3c | `/impeccable harden src/components` | [#24](https://github.com/TengkuAliff94/Task-Tracker/issues/24) in-app ConfirmDialog, inline validation, DD/MM dates | to do |
| 3d | `/impeccable harden src/components/Backup.tsx src/db` | [#25](https://github.com/TengkuAliff94/Task-Tracker/issues/25) backup nudge timing, persistent storage, sample data placement | to do |
| 4 | `/impeccable audit src` | [#26](https://github.com/TengkuAliff94/Task-Tracker/issues/26) WCAG 2.2 AA gaps. Do this **after #23** | to do |
| 5 | `/impeccable polish src`, then `/impeccable critique src` | [#27](https://github.com/TengkuAliff94/Task-Tracker/issues/27) polish, README screenshots, SPEC alignment, re-score | to do |

Each issue holds the full problem statement, file:line pointers and acceptance criteria. Read the issue before starting its step.

**To resume:** first clear the loose ends from step 3a (below), then start a session in this repo and run `/impeccable harden src/App.tsx` and work through #23's acceptance criteria.

**Loose ends from step 3a.** The code is committed and pushed. The sidecar is refreshed (it has a "Discard Bar" component now) and `impeccable doctor` reports no drift. These parts of the routine are still to do:
- **No adversarial review yet** (step 6 of the routine). Run it over `32624b4` before closing #22.
- **#22 is still open** and the table in #19 still says it's next. Close #22 and update #19 once the two items above are done.
- **Follow-up to file:** Save still drops text typed into an "add" input but not added (checklist item, link, tag). Closing now asks first, but saving doesn't. That's a silent loss too.

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
npm test                        # unit (Vitest): 131 passing after step 3a
npm run test:e2e                # e2e (Playwright, port 4173): 99 passing after step 3a
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
- **#25 will break a layout assertion.** `e2e/layout.spec.ts` expects the backup nudge to show after sample data, to measure the worst case. When #25 stops that, bring the nudge up deliberately rather than deleting the check. There's a comment on #25 about this.
- **README screenshots are stale.** They show the old bento. Regenerate them with `npm run screenshots` in #27, not earlier, so it's done once.
- **Mind `@` in GitHub text.** Quick-add syntax like `@home` pings real GitHub users in issue or PR text, so keep it in backticks.

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

The files touched are `src/components/TaskForm.tsx`, `data-draft` in `{Checklist,Attachments}Editor`, `TagPicker` and `ProjectPicker`, plus `e2e/task-editor.spec.ts` (16 tests), a contrast test for the bar and `DESIGN.md` (Dialogs).
