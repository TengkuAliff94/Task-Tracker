---
name: Task Tracker
description: Flat, saturated colour panels on a warm canvas; a sunlit workbench for one person's tasks.
colors:
  panel-orange: "#cf6224"
  panel-mustard: "#e3b867"
  panel-maroon: "#6e1116"
  panel-rust: "#9b3418"
  panel-violet: "#5a3cd4"
  panel-sage: "#80a89b"
  panel-taupe: "#bca59d"
  panel-mauve: "#a97d9c"
  ink-on-light-panel: "#141110"
  ink-on-dark-panel: "#f4f1ee"
  primary: "#a3440f"
  primary-hover: "#8a390c"
  primary-dark: "#ec7a3a"
  primary-hover-dark: "#f28f55"
  on-primary: "#ffffff"
  on-primary-dark: "#0b0a0a"
  danger: "#b42318"
  danger-hover: "#971d14"
  on-danger: "#ffffff"
  danger-dark: "#f0866a"
  danger-hover-dark: "#f49c84"
  on-danger-dark: "#0b0a0a"
  canvas: "#f4f1ee"
  surface: "#fbfaf8"
  raised: "#ffffff"
  subtle: "#ebe5df"
  hover: "#f1ece7"
  fg: "#141110"
  muted: "#5c534d"
  line: "#e4ddd6"
  line-strong: "#d3c9c0"
  canvas-dark: "#0b0a0a"
  surface-dark: "#171413"
  raised-dark: "#1f1b19"
  subtle-dark: "#26211f"
  hover-dark: "#1d1917"
  fg-dark: "#f4f1ee"
  muted-dark: "#b0a69e"
  line-dark: "#2a2522"
  line-strong-dark: "#3a332f"
typography:
  display:
    fontFamily: "'Gabarito Variable', 'Inter Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.025em"
  stat:
    fontFamily: "'Gabarito Variable', 'Inter Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "'tnum'"
  headline:
    fontFamily: "'Gabarito Variable', 'Inter Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: "20px"
    fontFeature: "'cv11', 'ss01', 'ss03'"
  body:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "'cv11', 'ss01', 'ss03'"
  label:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    fontFeature: "'cv11', 'ss01', 'ss03'"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  panel: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "28px"
components:
  button-brand:
    backgroundColor: "{colors.panel-orange}"
    textColor: "{colors.ink-on-light-panel}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-brand-hover:
    backgroundColor: "{colors.panel-mustard}"
    textColor: "{colors.ink-on-light-panel}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.line}"
  button-danger-solid:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-danger-solid-hover:
    backgroundColor: "{colors.danger-hover}"
  button-ghost:
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-ghost-hover:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.fg}"
  button-header-icon:
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    size: "36px"
  button-header-icon-hover:
    backgroundColor: "{colors.panel-mustard}"
    textColor: "{colors.ink-on-light-panel}"
  field:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.fg}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "16px 16px 16px 20px"
  dialog:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.fg}"
    rounded: "{rounded.panel}"
    padding: "0 24px 24px"
  stat-tile:
    backgroundColor: "{colors.panel-violet}"
    textColor: "{colors.ink-on-dark-panel}"
    rounded: "{rounded.panel}"
    padding: "20px"
  heading-panel:
    backgroundColor: "{colors.panel-orange}"
    textColor: "{colors.ink-on-light-panel}"
    typography: "{typography.display}"
    rounded: "{rounded.panel}"
    padding: "24px"
  filter-chip:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.fg}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: "32px"
    padding: "0 14px"
  filter-chip-hover:
    backgroundColor: "{colors.panel-mustard}"
    textColor: "{colors.ink-on-light-panel}"
  badge:
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  group-tab:
    typography: "{typography.headline}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
---

# Design System: Task Tracker

<!-- Source of truth: tokens in src/index.css, shared class strings in src/ui.ts, motion timing in
     src/components/motion/presets.ts. If this file and the code disagree, the code wins and this
     file should be refreshed with /impeccable document. The engineering checklist (presets, test
     guards, pre-delivery checks) lives in design-system/task-tracker/MASTER.md. -->

## Overview

**Creative North Star: "The Sunlit Workbench"**

The app is a warm, physical surface where one person lays out their work. The canvas is a sun-warmed off-white by day and near-black by night. On it sit flat, saturated colour panels, like tiles set out on a bench, each one a tool or a reading ready to pick up. The signature is the heading panel: a big orange slab with "Tasks" set heavy in Gabarito and a black sun that rises into its corner on load. Once there are tasks, the slab speaks for urgency: a second display line under "Tasks" says what needs attention ("2 overdue"). Everything else stays quieter than that one moment.

The panels carry meaning, not decoration. Colour says how urgent something is (maroon overdue, mustard due today, violet open, sage on track), so the bench reads at a glance before any text does. Separation comes from colour and the gutters between tiles, never from hairline borders or heavy drop shadows. Density is standard rather than compact: a phone-sized glance and a desk-sized planning session should both feel unhurried.

Controls are **calm and confident**. They stay flat and quiet at rest and answer clearly on hover and focus: a mustard light-up, a soft lift, a strong two-tone focus ring. Motion is expressive (panels rise in, the completion burst, count-ups), but always on top of a guaranteed reduced-motion state where everything appears finished at once. Sill's photography, handwriting font, illustrated scenes and pinned horizontal scroll are deliberately not part of this world.

**Key Characteristics:**
- Flat, saturated panels on a warm canvas; colour and gutters separate, borders and shadows don't
- One soft-square radius (16px) across every panel, so the whole app can be dialled squarer in one place
- Heavy Gabarito display for headings and big numbers; Inter for everything you read
- Colour is semantic: every meaningful hue comes from the panel palette, each with its paired ink
- The same panel palette in light and dark; only the canvas and text invert
- Expressive motion with a hard reduced-motion guarantee

## Colors

A warm, earthy palette of eight saturated panels over a neutral canvas that inverts between light and dark.

### Primary
- **Late-Sun Orange** (panel-orange): the brand. The heading panel, the app mark, the single **New task** button and primary emphasis. Takes near-black ink, because off-white on it fails AA.
- **Burnt Orange Text** (primary / primary-dark): Late-Sun Orange darkened for the light canvas and lightened for the dark one, so it reads as text, links, the quick-add icon and solid primary buttons. Its 8% tint (primary-soft) is the hover halo on the task checkbox and the focus glow on fields.

### Secondary
- **Noon Mustard** (panel-mustard): needs attention soon (due today, high priority), and the system's universal hover light. Coloured controls light up mustard under the pointer.
- **Twilight Violet** (panel-violet): open and in-progress work, and general notices: toasts and the backup reminder.

### Tertiary
- **Dusk Maroon** (panel-maroon): the strongest alarm, overdue, wherever it appears: the card badge, the outline round the card and the Overdue tile. One word (Overdue) and one colour.
- **Clay Rust** (panel-rust): urgent priority and the Trash count badge.
- **Lichen Sage** (panel-sage): calm and on track. Completed work and medium priority.
- **Sandstone Taupe** (panel-taupe): low emphasis. Low priority, to do, and the Overdue tile when nothing is overdue.
- **Heather Mauve** (panel-mauve): spare. Defined and AA-paired, with no role yet.

### Neutral
- **Sunwarmed Paper / Night Bench** (canvas / canvas-dark): the page background.
- **Card Linen** (surface / surface-dark): neutral panels: task cards, quick add, the filter bar, the header icon tray.
- **Lifted White** (raised / raised-dark): dialogs, popovers, select menus.
- **Well Stone** (subtle / subtle-dark): input wells, secondary buttons, idle filter chips, code blocks.
- **Charcoal Ink / Paper Ink** (fg / fg-dark): body text and the focus ring.
- **Weathered Grey** (muted / muted-dark): metadata, placeholders, secondary text. It still meets 6:1 on the lowest surface it sits on.
- **Seam** (line, line-strong): the few hairlines that remain: kbd keys, the task checkbox's outline, Markdown quotes, scrollbars. Nothing else draws a rule: the editor footer, the Markdown preview and the Backup dialog are set apart by tone and space.
- **Panel Inks** (ink-on-light-panel, ink-on-dark-panel): near-black on orange, mustard, sage, taupe and mauve; off-white on maroon, rust and violet.

### Named Rules
**The Panel Means Something Rule.** Anything that carries meaning by colour (status, priority, counts, notices) uses a panel with its paired ink. Never a raw hue, never a Tailwind palette colour.

**The Readable Label Rule.** User-picked project and tag colours appear only as a dot, a 16% tint and an inset ring. Text on them stays in the body colour, because a user's light hue as text drops to 2:1.

**The Paired Ink Rule.** Every panel/ink pair meets 4.5:1. When a source swatch failed, the ink or the swatch was moved, never the standard. New pairs prove themselves in `e2e/contrast.spec.ts` before they ship.

## Typography

**Display Font:** Gabarito Variable (with Inter Variable, then system sans)
**Body Font:** Inter Variable (with ui-sans-serif, system-ui, Segoe UI)

**Character:** Gabarito is the hand-set sign on the bench: round, heavy and friendly at extra-bold, used for few words at large sizes. Inter is the working text: neutral, compact and legible at 12–15px, with the `cv11`, `ss01` and `ss03` alternates for a straighter, calmer letterform. Both are self-hosted through Fontsource and precached, so the app looks the same offline.

### Hierarchy
- **Display** (800, line-height 0.9, tight tracking): the heading panel only. Before there are tasks, "Tasks" alone at 3rem on phones / 3.75rem from `sm`. Once there are tasks, two lines of equal size, "Tasks" over the urgency line, at 1.875rem / 2.25rem from `sm`. Never a small label above a big one.
- **Stat** (800, 1.5rem on phones / 2.25rem from `sm`, line-height 1, tabular figures): the Overview counts, which count up on first show and on change.
- **Headline** (700, 1.25rem, tight tracking): dialog titles and the Trash page title. All `h1`–`h3` use Gabarito. The wordmark "Task Tracker" is Gabarito 700 at 1.125rem, and group tabs are 1rem bold.
- **Title** (Inter 500, 15px, 20px line): task titles, clamped to two lines.
- **Body** (Inter 400, 14px): descriptions, dialog text and rendered Markdown (relaxed leading). The quick-add input steps up to 16px so phones don't zoom on focus.
- **Label** (Inter 600, 12px): filter chips, badges, metadata, counts, `kbd` keys and the Trash count badge. Form labels are 13px medium. Nothing is set below 12px.

### Named Rules
**The Heavy Headline Rule.** Gabarito is for headings, the wordmark and big numbers only, and always at bold or extra-bold. Anything you read in sentences is Inter.

**The Tabular Count Rule.** Every number that changes in place (stats, percentages, counts in tabs and badges) uses tabular figures so it doesn't jitter.

## Layout

A single centred column, `max-w-6xl` (72rem), with a 16px side gutter at every width. The page reads in task order, urgency first: what needs attention, then any notices, then capture, then refine, then the list. Things inside a group sit 12px apart (the panel gutter); groups sit 24px apart. The header sits 24px above the first group.

1. **Header**: sticky, in the solid canvas colour (a see-through blur smeared the saturated tiles passing under it into a muddy band). It hides while you scroll down and returns on scroll up or when focus enters it. Wordmark on the left; on the right, a tray of icon buttons on a neutral panel and the brand **New task** button. Under `sm`, the wordmark text and the button label drop to icons only.
2. **What needs attention**: the heading panel and the Overview tiles. From `lg` they share a row (5/7 columns, tiles in a row of four). Below `lg` the tiles run under the heading: a row of four from `sm`, a 2×2 grid of slim tiles on phones.
3. **Notices**: the missed-reminders banner and the backup reminder, when showing. They always come after the heading, so the page title is the first thing read.
4. **Capture and refine**: quick add (a full-width neutral panel with a 16px input), then the filter bar. The filter bar is one row: search, always in view, and a **Filters** disclosure button. Everything else waits behind it: Project, Sort by and Group by selects with visible labels, the filter chips, and "Show completed". While it's collapsed, each active filter shows as a removable chip under the row, followed by **Clear filters**, so nothing narrows the list out of sight. The filter bar and the count line only appear once there are tasks.
5. **The list**: the count line ("8 tasks", or "2 overdue tasks" with a tile picked), then the task grid: one column on phones, two from `md`. Cards fill rows left to right, the same order J/K walk them. When grouped, each group gets its own tab heading and its own grid.

Breakpoints are Tailwind's defaults: `sm` (640px), `md` (768px) and `lg` (1024px) change the layout. No horizontal scroll at 375–390px. Scrolling something into view (J/K, N, /, or Tab and Shift+Tab reaching any control in `<main>`) stops 6rem below the top, clear of the sticky header (WCAG 2.4.11).

### Named Rules
**The Urgency-First Rule.** The first screen answers "what needs me now?" before anything else. At 1024×768 and up, the first task card is on the first screen even with the backup reminder showing; on a 390×844 phone it is on the first screen once the reminder is dismissed. `e2e/layout.spec.ts` guards both. Controls that refine the list stay collapsed by default so they never push it down.

## Elevation & Depth

The system is **flat at rest**. Depth comes from tonal layering: canvas < surface (cards) < raised (dialogs, popovers), each a step lighter in light mode and a step lighter out of the black in dark mode. Shadows mean "lifted right now" and appear only as a response to state: a hovered card, the focused quick-add panel, an open dialog. In dark mode, cards carry a faint inner top highlight instead of a drop shadow, so they don't look cut out of the night canvas.

### Shadow Vocabulary
- **Rest** (`--shadow-card`: `0 0 #0000` light, `inset 0 1px 0 rgb(255 255 255 / 0.03)` dark): every neutral card at rest.
- **Pop** (`--shadow-pop`: `0 4px 6px -2px rgb(20 17 16 / 0.06), 0 12px 24px -4px rgb(20 17 16 / 0.12)` light; a deeper black plus a top highlight in dark): hovered task cards, the focused quick add, toasts.
- **Modal** (`--shadow-modal`: `0 24px 48px -12px rgb(20 17 16 / 0.3)` light): dialogs, over a 50% near-black backdrop with a 6px blur.
- **Key** (`--shadow-xs`: `0 1px 2px rgb(20 17 16 / 0.06)`): the small bevel under `kbd` keys.

### Named Rules
**The Flat-at-Rest Rule.** Nothing casts a shadow just for existing. If a shadow appears, something was hovered, focused or opened.

**The Empty Shadow Rule.** A "no shadow" token is `0 0 #0000`, never `none`. Tailwind merges shadows and rings into one list, and `none` would void the selection and overdue rings.

## Shapes

Soft-square throughout. Every panel (cards, tiles, the heading panel, dialogs, toasts, the filter bar and the header tray) shares one radius, `--panel-radius` (16px). Change it in one place to move the whole app toward Sill's square panels. Inside panels, corners step down with size: 12px for the brand button and header icon tiles, 8px for buttons and fields, 6px for badges, label chips and small buttons, 4px for `kbd` keys. Pills (filter chips, group tabs, counts) and the task checkbox are fully round.

The one non-rectangular form is the **sun**: a perfect circle (160px, 192px from `sm`) in the panel's ink colour, partly off the top-right corner of the heading panel and clipped by it.

### Named Rules
**The One Radius Rule.** Panels never invent their own radius. They use `rounded-panel`, and the inner steps above are the only other corners in the system.

## Components

### Buttons
Calm at rest, clear on hover. All buttons are 14px medium Inter with 6px icon gaps, transition only colour, opacity and a 1px press-down, and dim to 50% when disabled.
- **Brand** (`btn.brand`): Late-Sun Orange with near-black ink, 12px corners, 600 weight, 10px × 16px. It lights up Noon Mustard on hover and presses down 1px. **One per screen**: New task.
- **Primary** (`btn.primary`): solid Burnt Orange with white ink (near-black in dark), 8px corners. For the main action inside dialogs (Save).
- **Secondary** (`btn.secondary`): a Well Stone fill that darkens to the seam colour on hover.
- **Ghost** (`btn.ghost`): muted text with no fill, gaining a Well Stone fill and full-strength text on hover.
- **Danger** (`btn.danger`): danger-coloured text with a 10% danger tint on hover. For the button that starts a destructive action (Empty trash, Delete), which then asks first.
- **Danger solid** (`btn.dangerSolid`): a solid danger fill with white ink (near-black in dark), 8px corners, darkening on hover. Only as the go-ahead inside a destructive confirmation, so it can't be mistaken for Cancel.
- **Header icon** (`btn.headerIcon`): a 36px tile (32px on phones) with 12px corners that lights up mustard on hover. It also closes dialogs.
- **On an attention panel** (`attentionAction` / `attentionQuiet`): the main action swaps the panel's colours; the quiet one is the panel's own ink at 85%, tinted on hover.

### Chips
- **Filter chip**: a 32px pill, 12px semibold, inside the open filter panel. Idle: a Well Stone fill with 80% text, lighting up mustard on hover. Active: the matching panel colour. Active label chips keep the body text and gain a 2px inset ring in the label's own colour. Chips in one cluster (priority, status, tags) sit 6px apart; clusters sit 16px apart side by side and 12px apart when they wrap, with no rule between them.
- **Active-filter chip**: what a pressed filter chip becomes while the panel is collapsed. The same pill in the same pressed colours, plus a 14px × at the end; pressing it removes that filter (its name is "Remove High filter"). Hover adds the pop shadow rather than mustard, because a mustard chip already means High. A project shows here as a chip with its dot too. Search and the Overview pick aren't chips: the search field and the pressed tile already show them. Focus moves to the next chip when one goes, then the one before it, never onto Clear filters.
- **Filters toggle**: a 36px Well Stone button matching the search well, with 8px corners, a sliders icon, "Filters", a chevron that turns over when open, and a count of active filters in the same pill as the group-heading counts (a 15% tint of its own ink, tabular figures). It lights up mustard on hover like the idle chips.
- **Label chip** (`LabelChip`): a 6px-corner pill, 12px medium, with a 6px dot, a 16% tint and an inset ring in the label's colour, and an optional × to remove. The muted sigil sits against the name, as quick add takes it: `#finance`, `@Home`. Everywhere a label is named it's spelt the same way: the filter pills, and the quick-add preview, which shows an existing label's own spelling (`@home` previews as `@Home`). The × is drawn at 12px but takes taps over 24px (negative margins cancel its padding).
- **Badge**: 6px corners, 12px medium, filled with the priority panel (taupe, sage, mustard, rust) or maroon for Overdue.

### Cards / Containers
- **Corner Style:** the panel radius (16px).
- **Background:** Card Linen, with Lifted White for dialogs.
- **Shadow Strategy:** flat at rest; pop on hover (see Elevation & Depth).
- **Border:** none. A 6px priority stripe in the priority panel colour runs down the card's left edge.
- **Internal Padding:** 16px, with 20px on the stripe side.
- **States:** hover takes the hover tone plus a pop shadow and a 3px lift (mouse only). Keyboard selection gets a 2px outline ring in the text colour, offset 2px. Overdue cards get a 2px maroon ring.
- **Selection is focus:** J and K move real focus with the selection (to the title button, or the checkbox if that's where focus was), and Tabbing to a card selects it, so a screen reader hears the card and E and X act on what's in focus. The title button is rounded (8px), so its focus ring sits inside the selection ring as a second soft rectangle.
- **When a card leaves** (ticked off, deleted, completed with X), focus moves to the same control on the card that takes its place, or to the empty state when none does. It never drops to the page.

### Inputs / Fields
- **Style** (`field`): a flat Well Stone well with 8px corners, 8px × 12px padding, 14px text, and placeholders in full Weathered Grey (6.0:1 or better; `contrast.spec` measures them, since axe skips placeholders). No visible border at rest.
- **Focus:** the border appears in the ring colour with a 3px soft orange glow (primary-soft), and the global focus outline sits on top.
- **Hover:** the border fades in at the strong seam colour.
- **Selects:** the same well, with one shared chevron instead of each browser's own arrow.
- **Error:** the app checks its own fields (`noValidate`), so the browser's "Please fill out this field." bubble never shows. On Save, a problem shows right under its field (`FieldError`): 12px medium danger text after a 14px circle-alert icon, with `role="alert"`. The field gains a danger border that stays on hover and focus (`INVALID_FIELD`), `aria-invalid` and `aria-describedby`, and focus moves to the first problem reading down the form. Editing the field clears it. Messages say what to do, and name the value when it can't exist: "Give the task a title.", "Use DD/MM/YYYY, such as 08/03/2026, or clear it.", "“31/02/2026” isn’t a date. Check the day and month."
- **Dates and times** (`DateField`, `TimeField`): typed, so one format shows in any locale. Dates are day first (placeholder `DD/MM/YYYY`), times on the 24-hour clock (`HH:MM`), in tabular figures. They take the shapes people type (`8/3`, `8/3/26`, `1730`, `5pm`) and words as in quick add ("fri", "tomorrow", "fri 5pm", whose time fills the time field), and write them back in full on leaving the field. Text that can't be read stays as typed until Save names the problem. The native picker sits behind a 32px icon button inside the field's right edge (calendar or clock, muted, hovering to the seam colour; named "Open calendar for the deadline"), and it only writes into the text. Browsers that can't open a picker from a button get no button. Under the deadline, a 12px muted line confirms the reading as it's typed: "Due Wed 11/03/2026, 17:30 · Tomorrow"; a reminder time gets "Reminds you Thu 12/03/2026, 19:05". Date and time sit side by side and stack where both don't fit (each at least 9.25rem, so the whole placeholder clears the button), with each error under its own field; the reminder's reading and its Add button share the line below. Until there's an error or a reading, each field's description tells screen readers its format ("Day first, such as 25/04/2026."), since a placeholder isn't read out reliably.
- **"Add" fields:** text typed into a field that adds something (a checklist item, a link, a tag, a new project, a reminder time) but not added yet is added on Save, never dropped. A link that isn't valid stops Save with an error at the link field.
- **Checkbox (task complete):** a 20px circle with a 1.5px strong-seam border, inside a label that makes the touch target 44px without moving it. On hover (of the circle or its target) the border turns orange with a 4px soft halo. Checked, it fills orange and the tick scales in.
- **Checkbox (everything else):** `.box-check`, the square sibling, for "Show completed" and checklist items: 16px with 4px corners and a 1.5px Weathered Grey border (3:1 or better on its own), with the same hover halo, orange fill and tick. Round always means "complete this task"; no checkbox is left to the browser's own look.
- **Quick add on phones:** the example placeholder would be cut off mid-token, so below `sm` it reads "Quick add a task", and while the field is focused and empty a Well Stone hint under it shows the syntax ("Add details as you type: #tag @project !high ~30m tomorrow 5pm"). The hint is the field's description either way.
- **Errors outside the editor** (quick add, Projects & tags, a new project, a file that's too large) use the same `FieldError`, so they're read out as alerts and the field points at them.

### Navigation
The header is the only navigation. On the left, the brand mark: a 36px Late-Sun Orange tile with 12px corners and a double-check icon, plus the Gabarito wordmark. On the right, a neutral tray of header icon buttons (notifications, projects & tags, backup, Trash with a rust count badge, theme, shortcuts) and the brand New task button. In Trash view, the wordmark gives way to a back button and a "Trash" Headline (bold), and New task is hidden there (a new task wouldn't show in Trash). It keeps its space, so the Trash button stays under the pointer to switch back. Trashed cards keep their title in full ink with no strike-through, which would read as done; the taupe stripe and "Deleted … · N days left" say they're set aside. The page content below sits in `<main>`.

With notifications blocked, the bell becomes a crossed-out bell button ("Notifications blocked") that opens a small Lifted White popover with the pop shadow, under the tray: what blocking means and where to allow them. Esc or a tap elsewhere closes it, and the same text is the button's description.

### Heading Panel (signature)
The orange tile that leads the page, with the black sun clipped in its top-right corner and today's date in 14px medium at the bottom. It has two states:
- **Before there are tasks:** the full-width brand moment. "Tasks" alone in Display type, with a 160px sun (192px from `sm`).
- **Once there are tasks:** compact, and it says what's urgent. Two Display lines of equal size, "Tasks" over the urgency line: "2 overdue", else "1 due today", else "On track" while anything is open, else "All done". The sun shrinks to 112px, and the text keeps an 80px right margin so it never runs into it.

The sun rises 60px into place on load, the one large decorative movement in the app.

### Overview Tiles (signature)
Four panels, most urgent first: Overdue (maroon, or taupe at zero), Due today (mustard), Open (violet), Completed (sage). Each tile is a filter, a toggle button with `aria-pressed`. The numbers always count all tasks, so they keep answering "what needs me now?" whatever else is filtered. Picking a tile narrows the list to those tasks, together with any other filters (both use `matchesScope` in `src/lib/filter.ts`). Picking it again clears it, and only one is picked at a time. The Completed tile shows completed tasks even with "Show completed" off. A picked tile with nothing to show gets its own empty state ("Nothing overdue") with a **Show all tasks** button.
- **Feedback:** the count line under the filters names the pick ("2 overdue tasks") and is a status region, so screen readers hear the new count.
- **Content:** a 14px semibold label, a 20px icon at the top right, and a Stat number that counts up. Completed adds a percentage and a 6px meter that fills by `scaleX`. When something is overdue, its icon pulses (motion-safe only).
- **Layout:** from `sm`, label over a large number. On phones, a slim 2×2 grid with label and number on one line, and Completed drops its percentage text (the meter still shows it). Icons are left out where tiles are slimmest: on phones, and beside the heading from `lg` to `xl`.
- **States:** hover adds the pop shadow (no lift, so the meter stays aligned). Picked takes the selection outline (`SELECTED_OUTLINE`) and, so it never looks like keyboard focus alone, a check cut out of a 20px ink disc in the tile's own panel colour, in the icon's place. The check shows at every size, including phones, where the icons are left out. The meter sits outside the button, so it stays a progress bar to assistive tech.

### Dialogs and Toasts
- **Dialog:** native `<dialog>` on Lifted White with the panel radius and the modal shadow. It springs up 24px from 94% scale over 480ms, over a blurred backdrop. The sticky title bar is translucent Lifted White with a blur, a Headline title and a header-icon close button. Fields inside a dialog carry a scroll margin, so one that takes focus stops clear of the sticky title bar and footer, label included.
- **Task editor footer:** sticky, solid Well Stone with no rule above it: the tone step sets it apart, and nothing scrolling behind shows through around Save (it used to be see-through). Cancel's hover steps one tone further, to the seam colour. The Markdown **Preview** sits in a plain Well Stone well like the field it replaces, with no border; Markdown headings inside it are Gabarito bold, per the Heavy Headline Rule.
- **Projects & tags:** each label is a row: a round 28px colour swatch (`.swatch`, the label's dot made big, with a faint inner ring so light colours still show; it takes the soft orange halo on hover), its name in a field well (so it reads as editable; it saves on blur or Enter), the number of tasks it's on ("4 tasks", the same count the delete question gives, and the name field's description), and Delete. Rows sit 8px apart under a bold section heading.
- **Keyboard shortcuts:** a two-column list with the app's own `kbd` keys; a pair like J / K is two keys with a muted slash between.
- **Unsaved changes (task editor):** with anything changed (fields, checklist, reminders, repeat, staged attachments, or text typed but not yet added), Esc, × and Cancel don't close the editor. Its sticky footer becomes a Noon Mustard bar asking "Discard your changes?" ("Discard this new task?" when creating). **Keep editing** is the inverted main action and takes focus; **Discard** is the quiet one. Esc on the bar means Keep editing, and going back to a field puts the bar away. With nothing changed, every close is instant.
- **Confirmation** (`ConfirmDialog`, through `useConfirm`): every "are you sure?" in the app, never the browser's own confirm box. A small Lifted White dialog (`max-w-md`) with the dialog spring, an `alertdialog` with a Headline question ("Empty Trash?", "Delete this project?"), a body that says what will happen with the counts involved, and a button row: Cancel (secondary) and the go-ahead, named for the action ("Delete forever", "Replace everything"). Destructive ones use Danger solid and give Cancel the first focus; the rest use Primary and focus it. Esc cancels. Counts that compare two states sit in a Well Stone list (`CountList`): "Now 3 tasks", "Backup 1 task". A confirmation opened from another dialog stacks on top of it and closes alone. When the thing asked about disappears (a deleted Trash card or label), focus moves to its neighbour's same button.
- **Backup & restore:** a muted line on where the tasks live, then the data's state in a Well Stone list (`CountList`): **Last backup** (`DD/MM/YYYY`, 24-hour, or Never) and **Storage** (Protected, Not protected or Not reported, with a muted line saying what that means). While storage isn't protected, an underlined Burnt Orange Text button ("Ask the browser to protect it", then "Ask again") asks for it; a refusal says so ("Not granted", then "Still not granted"), and once it's granted, focus moves to the answer. Download (Primary) and Restore (secondary) follow, with their result in a status line underneath. Sample data sits apart at the bottom, after extra space (32px, no rule), in a **Try the app** section with its own bold heading and a ghost button, so it never reads as a peer of Restore.
- **Toast:** a Twilight Violet panel with the pop shadow that slides in 32px from the edge. The message is 14px medium and wraps anywhere; task titles in it are cut to 60 characters, so the words around them ("moved to Trash") always show. An optional second line in regular weight carries detail ("Next due tomorrow 07:00", or why a save failed), in full ink. Undo is the violet panel inverted (`attentionAction` with `INVERTED_PANEL.info`), like Back up now on the backup reminder, so the screen keeps one brand-orange button; Dismiss is the panel's ink at 75%, tinted with its own ink on hover. Toasts close after 6 seconds, but the countdown waits while the pointer is over one, while focus is inside it, and while a dialog is open over it (the backdrop covers it and the page behind is inert); each wait ends with a fresh 6 seconds. A failure toast stays until dismissed. Completion toasts share one slot, so a quick J/X run shows only the latest "Done", and `Z` runs the newest Undo (a held key doesn't repeat it).
- **Toasts and assistive tech:** a failure toast uses `role="alert"`. The others are `role="status"` but silent themselves: their words ("Done: Pay rent. Press Z to undo.") go through a visually hidden live region that's on the page from the start, which screen readers announce more reliably. While it holds anything, the stack is a region named "Notifications". When a toast that has focus goes (Undo, Dismiss), focus returns to where it was before the toast, else the page heading.

### Empty State
A large neutral panel (56px top padding, 80px from `sm`) with a 64px orange icon tile that floats gently (motion-safe), a 30px Gabarito extra-bold title, a 14px muted line capped at 24rem, and the way out (e.g. **Load sample data**) below it.
- **No matches** says what narrowed the list. With only a search: "No tasks match “rent”." and **Clear search**. With filters: "No tasks match these filters." and **Clear filters**, which clears the search, the filters and the tile pick, keeps Show completed as it is, and puts focus in the search field.

### Motion
Timing comes only from `src/components/motion/presets.ts`: 180ms for exits and small changes, 320ms for entrances and reveals, 480ms for the dialog spring, 1.1s for count-ups, 450ms for the burst. The default easing is a soft out curve, `cubic-bezier(0.22, 1, 0.36, 1)`, and hover and focus transitions use 200ms. Entrances fade and rise 8px with a 25ms stagger capped at 12 items. Only `transform` and `opacity` animate movement. With reduced motion on, everything renders in its final state at once.

## Do's and Don'ts

### Do:
- **Do** take every colour, radius, shadow and duration from `src/index.css`, `src/ui.ts` and `presets.ts`.
- **Do** carry meaning with a `panel.*` colour and its paired ink, and prove new pairs at 4.5:1 in both themes.
- **Do** keep panels flat and separated by 12px gutters; reserve shadows for hover, focus and open dialogs.
- **Do** use `rounded-panel` (16px) on every panel, and the inner steps (12 / 8 / 6 / 4px) only inside them.
- **Do** show selection with an outline ring, not colour alone, and keep the two-tone focus ring visible on every control.
- **Do** keep exactly one brand-orange button per screen.
- **Do** ask through `useConfirm`, never the browser's `confirm()`, and check fields in the app (`FieldError`), never with the browser's validation bubble.
- **Do** light up coloured controls Noon Mustard on hover (`hoverHighlight`).
- **Do** animate movement with `transform` and `opacity` only, and guarantee a final-state render under reduced motion.
- **Do** use Lucide icons at 16–20px.

### Don't:
- **Don't** use hairline borders or heavy drop shadows as separators.
- **Don't** use raw hues for meaning, or a user-picked colour as text.
- **Don't** use ad-hoc durations, easings, colours or radii outside the tokens and presets.
- **Don't** use `transition-all`, or animate `width`, `height`, `top` or `left`; scale a bar instead.
- **Don't** use GSAP, ScrollTrigger, Lenis or any scroll hijacking.
- **Don't** load fonts or libraries from a CDN at runtime; the app must look the same offline.
- **Don't** remove the focus outline (`outline: none`) or show selection by colour alone.
- **Don't** use emojis as icons.
- **Don't** bring in Sill's photography, handwriting font, illustrated hero scenes or pinned horizontal scroll.
- **Don't** set body text, labels or long strings in Gabarito.
