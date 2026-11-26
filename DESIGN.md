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
  danger-dark: "#f27a8f"
  danger-hover-dark: "#f58ca0"
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
  field-label:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
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

The panels carry meaning, not decoration. Colour says how urgent something is (maroon overdue, mustard due today, violet open, sage done), so the bench reads at a glance before any text does. Separation comes from colour and the gutters between tiles, never from hairline borders or heavy drop shadows. Density is standard rather than compact: a phone-sized glance and a desk-sized planning session should both feel unhurried.

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
- **Burnt Orange Text** (primary / primary-dark): Late-Sun Orange darkened for the light canvas and lightened for the dark one, so it reads as text, links, the quick-add icon and solid primary buttons. Its 8% tint (primary-soft) is the focus glow on fields. It never colours a checkbox: a tick means done, so checkboxes are sage.

### Secondary
- **Noon Mustard** (panel-mustard): needs attention soon (due today, missed reminders, the discard question), and the system's universal hover light. Coloured controls light up mustard under the pointer.
- **Twilight Violet** (panel-violet): open and in-progress work. Nothing else.

### Tertiary
- **Dusk Maroon** (panel-maroon): the strongest alarm: the Overdue tile. On a card, overdue is said once, in one red: the ring and the deadline both in the danger colour (no badge). At night maroon is too dark to read on the canvas, so the ring and the danger colour turn **rose** (#f27a8f, OKLCH hue 10°), kept 37° of hue clear of the brand orange so a late task never reads as a branded one and a destructive button never reads as New task.
- **Clay Rust** (panel-rust): urgent priority (the one priority with a hue) and the Trash count badge.
- **Lichen Sage** (panel-sage): done. Completed work, the Done status and a ticked checkbox. Nothing else. A ticked box's edge and hover border are `--done-edge` (a deeper sage, #4a7266, by day, where Lichen Sage is only about 2.5:1 on the card; Lichen Sage itself at night) with its tint `--done-soft` as the halo.
- **Sandstone Taupe** (panel-taupe): low emphasis. To do, the Overdue and Due today tiles while they count zero, and the stripe on trashed cards.
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
- **Ink Panel** (`panel.ink`: fg on canvas, so it inverts with the theme): word from the app itself that has no state to colour. Toasts, the **Back up now** button, and a pressed priority filter. Never a card stripe: on a card, ink belongs to the selection marker alone.

### Named Rules
**The Panel Means Something Rule.** Anything that carries meaning by colour (status, counts, notices) uses a panel with its paired ink. Never a raw hue, never a Tailwind palette colour.

**The One Job Rule.** Colour means time and state: maroon overdue, mustard due soon, violet open, sage done. Each of those hues has that one job (mustard's hover light aside), so a colour never needs a legend. Priority isn't a colour: it's the signal-bars glyph and its word, and only Urgent keeps a hue (rust). Notices with no state to show (toasts, the backup reminder) are ink or neutral, not a borrowed panel.

**The Readable Label Rule.** User-picked project and tag colours appear only as a dot, a 16% tint and an inset ring. Text on them stays in the body colour, because a user's light hue as text drops to 2:1.

**The Calm Label Rule.** Project and tag colours come only from a calm palette of seven (`LABEL_COLORS`: sky, blue, lime, fuchsia, green, slate, orchid), each at least 30° of hue from the colours with a job: danger in both themes, the brand orange, mustard, violet and the done sage. There's no free colour input, so a `@Health` can't be red beside a red overdue date. Labels saved before the palette moved to the nearest calm hue once (database version 4), and an old backup's labels move the same way on restore. `src/lib/colors.test.ts` reads the tokens and checks every hue.

**The Paired Ink Rule.** Every panel/ink pair meets 4.5:1. When a source swatch failed, the ink or the swatch was moved, never the standard. New pairs prove themselves in `e2e/contrast.spec.ts` before they ship.

## Typography

**Display Font:** Gabarito Variable (with Inter Variable, then system sans)
**Body Font:** Inter Variable (with ui-sans-serif, system-ui, Segoe UI)

**Character:** Gabarito is the hand-set sign on the bench: round, heavy and friendly at extra-bold, used for few words at large sizes. Inter is the working text: neutral, compact and legible at 12–15px, with the `cv11`, `ss01` and `ss03` alternates for a straighter, calmer letterform. Both are self-hosted through Fontsource and precached, so the app looks the same offline.

### Hierarchy
- **Display** (800, line-height 0.9, tight tracking): the heading panel only. Before there are tasks, "Tasks" alone at 3rem on phones / 3.75rem from `sm`. Once there are tasks, two lines of equal size, "Tasks" over the urgency line, at 1.5rem / 2.25rem from `sm`. Never a small label above a big one.
- **Stat** (800, 1.5rem on phones / 2.25rem from `sm`, line-height 1, tabular figures): the Overview counts, which count up on first show and on change.
- **Headline** (700, 1.25rem, tight tracking): dialog titles and the Trash page title. All `h1`–`h3` use Gabarito. The wordmark "Task Tracker" is Gabarito 700 at 1.125rem, and group tabs are 1rem bold.
- **Title** (Inter 500, 15px, 20px line): task titles, clamped to two lines.
- **Body** (Inter 400, 14px): descriptions, dialog text and rendered Markdown (relaxed leading). The quick-add input steps up to 16px so phones don't zoom on focus.
- **Label** (Inter 600, 12px): filter chips, badges, metadata, counts, `kbd` keys and the Trash count badge. Nothing is set below 12px.
- **Field Label** (Inter 500, 13px): form field labels (`labelText`) and the editor's More details row. It sits between Body and Label, so a label reads quieter than the text typed under it.

### Named Rules
**The Heavy Headline Rule.** Gabarito is for headings, the wordmark and big numbers only, and always at bold or extra-bold. Anything you read in sentences is Inter.

**The Tabular Count Rule.** Every number that changes in place (stats, percentages, counts in tabs and badges) uses tabular figures so it doesn't jitter.

## Layout

A single centred column, `max-w-6xl` (72rem), with a 16px side gutter at every width. The page reads in task order, urgency first: what needs attention, then any notices, then capture, then refine, then the list. Things inside a group sit 12px apart (the panel gutter); groups sit 24px apart. The header sits 24px above the first group.

1. **Header**: sticky, in the solid canvas colour (a see-through blur smeared the saturated tiles passing under it into a muddy band). It hides while you scroll down and returns on scroll up or when focus enters it. Wordmark on the left; on the right, a tray of header buttons on a neutral panel and the brand **New task** button. The tray's buttons gain their words as the width allows (Backup and Trash from `md`, Projects & tags and the notification bell from `lg`). Under `sm`, the wordmark text and the New task label drop to icons only, and the tray keeps the bell and Trash and gathers the rest into a labelled **More** menu. Touch screens (no hover, so no tooltip to name a glyph) keep that phone pattern up to `lg`: the bell, Trash with its word from `sm`, and More. From `lg` on touch, Theme shows its word, and the shortcuts button is never offered on touch (`?` still opens the sheet from a keyboard). The `touch:` and `mouse:` variants (`@media (hover: none)` / `(hover: hover)`) in `index.css` carry this.
2. **What needs attention**: the heading panel and the Overview tiles. From `lg` they share a row (5/7 columns, tiles in a row of four). Below `lg` the tiles run under the heading: a row of four from `sm`. On phones the two merge into one compact unit (the tiles 8px under a tighter heading, in one row of four), so the list starts in the top 60% of a 390×844 screen.
3. **Notices**: the missed-reminders banner and the backup reminder, when showing. They always come after the heading, so the page title is the first thing read. Missed reminders are time-bound, so they're Noon Mustard. The backup reminder has no urgency to colour: it's a neutral Card Linen panel with an ink **Back up now**, so it never outshouts what's overdue.
4. **Capture and refine**: quick add (a full-width neutral panel with a 16px input), then the filter bar. The filter bar is one row: search, always in view, and a **Filters** disclosure button. Everything else waits behind it: Project, Sort by and Group by selects with visible labels, the filter pills in named groups (Priority, Status, Tags: the Field Label names each group, in a 64px column left of its pills on phones and above them from `sm`, so no group is named for assistive tech alone), and "Show completed". Opening the panel on a short screen scrolls just enough to show the list's start under it (about one and a half cards, and never past the bar's top), so a pick never changes a list out of sight; where the list already shows, nothing moves, and under reduced motion the scroll is instant. While it's collapsed, each active filter shows as a removable chip under the row, followed by **Clear filters** (which also takes off a picked tile), so nothing narrows the list out of sight. A picked tile alone gets no row: the tile shows the pick and unpicks itself. The filter bar and the count line only appear once there are tasks.
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

**The One Form Rule.** On a card, each mark takes its own shape: an edge stripe for Urgent, a ring for overdue, a gutter marker for selection. Never reuse one form for two meanings; two dark lines that mean different things read as one.

**The Empty Shadow Rule.** A "no shadow" token is `0 0 #0000`, never `none`. Tailwind merges shadows and rings into one list, and `none` would void the overdue ring and the picked tile's outline.

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
- **Danger** (`btn.danger`): danger-coloured text with a 10% danger tint on hover. For the button that starts a destructive action (Empty Trash, Delete), which then asks first.
- **Danger solid** (`btn.dangerSolid`): a solid danger fill with white ink (near-black in dark), 8px corners, darkening on hover. Only as the go-ahead inside a destructive confirmation, so it can't be mistaken for Cancel.
- **Header icon** (`btn.headerIcon`): a 36px tile (32px on phones) with 12px corners that lights up mustard on hover, and stays lit while its menu is open. Pressed (Trash view) it turns ink (`bg-fg`, `text-bg`), since mustard means due soon. It also closes dialogs. Where the width allows it widens to carry its word after the icon (10px side padding), so a glyph is never the only clue where there's room for a word.
- **Menu** (`Menu`): a header button that opens a popover menu, the same Lifted White panel with the pop shadow as the blocked-notifications popover, 224px wide, hanging 8px under its button and lined up with its right edge. Items are 40px rows: an 18px icon, 14px medium text, mustard on hover like the header icons. A set of choices (the theme) sits under a 12px semibold muted group label, with the pick ticked at the row's end; no rule between groups. It follows the WAI-ARIA menu pattern: it opens on the pick (else the first item), arrow keys, Home and End move, Esc returns to the button, Tab closes it. Choosing puts focus back on the button before acting, so a dialog opened from it returns focus there. While it's open the header stays shown, even scrolled down.
- **On an attention panel** (`attentionAction` / `attentionQuiet`): the main action swaps the panel's colours; the quiet one is the panel's own ink at 85%, tinted on hover.

### Chips
- **Filter chip**: a 32px pill, 12px semibold, inside the open filter panel. Idle: a Well Stone fill with 80% text, lighting up mustard on hover. Active: the matching panel colour (a pressed priority pill is ink, Urgent rust). Active label chips keep the body text and gain a 2px inset ring in the label's own colour. Chips in one cluster (priority, status, tags) sit 6px apart; clusters sit 16px apart side by side and 12px apart when they wrap, with no rule between them.
- **Active-filter chip**: what a pressed filter chip becomes while the panel is collapsed. The same pill in the same pressed colours, plus a 14px × at the end; pressing it removes that filter (its name is "Remove High filter"). Hover adds the pop shadow rather than mustard, so a pressed chip keeps its pressed colours under the pointer. A project shows here as a chip with its dot too. Search and the Overview pick aren't chips: the search field and the pressed tile already show them. Focus moves to the next chip when one goes, then the one before it, never onto Clear filters.
- **Filters toggle**: a 36px Well Stone button matching the search well, with 8px corners, a sliders icon, "Filters", a chevron that turns over when open, and a count of active filters in the same pill as the group-heading counts (a 15% tint of its own ink, tabular figures). It lights up mustard on hover like the idle chips.
- **Label chip** (`LabelChip`): a 6px-corner pill, 12px medium, with a 6px dot, a 16% tint and an inset ring in the label's colour, and an optional × to remove. The muted sigil sits against the name, as quick add takes it: `#finance`, `@Home`. Everywhere a label is named it's spelt the same way: the filter pills, and the quick-add preview, which shows an existing label as its own chip, colour and spelling included (`@home` previews as `@Home`); a label quick add would create stays a plain chip, which is how the preview says it's new. The × is drawn at 12px but takes taps over 24px (negative margins cancel its padding).
- **Badge**: 6px corners, 12px medium. In Progress is violet. A priority badge is a Well Stone well with the **priority glyph** and its word; Urgent is filled rust instead. Medium, the default, has no badge on a card (it still shows in the filter pills and group tabs). There's no Overdue badge: the card's ring and red date say it.
- **Priority glyph** (`PriorityGlyph`): four rising bars, 12px (14px in group tabs), in the text colour, one lit for Low up to four for Urgent and the rest at 30%. It sits before the word everywhere a priority shows: the card badge, the quick-add preview, the filter pills and their chips, and priority group tabs. It's a shape cue beside the word, hidden from assistive tech. Pressed priority pills and their chips are ink (Urgent rust); priority group tabs are Well Stone (Urgent rust).

### Cards / Containers
- **Corner Style:** the panel radius (16px).
- **Background:** Card Linen, with Lifted White for dialogs.
- **Shadow Strategy:** flat at rest; pop on hover (see Elevation & Depth).
- **Border:** none. An Urgent task has a 6px rust stripe down the card's left edge; Low, Medium and High have none. High reads by its glyph and word: an ink stripe looked like the selection marker beside it, so the marker stays the only ink bar on the list.
- **Internal Padding:** 16px, with 20px on the stripe side.
- **States:** hover takes the hover tone plus a pop shadow and a 3px lift (mouse only). Each card mark has its own form, so no two read as the same line (the One Form Rule): the Urgent **stripe** runs down the left edge, **overdue** is a 2px ring around the card in `--alert-outline` (the danger colour: #b42318 by day, rose at night; 3:1 or more on the canvas and the card), and **selection** is a lift (the pop shadow) plus a 4px ink **marker** in the gutter 7px left of the card, which grows in over 200ms. Selection never draws a ring, so a selected overdue card shows both.
- **Move (overdue only):** an overdue card has one next step close to hand: a small muted **Move** button (`btn.small`, a calendar-arrow glyph and the word) at its top right, in place of the hover chevron. It's its own button beside the card's edit button and opens a **Menu**: Tomorrow, Next week (both keep the time of day), Pick a date… (the editor, opened at its deadline date, selected). `T` moves the selected task to tomorrow. Either way an ink toast says where it went ("“Morning run” moved to tomorrow" / "Now due tomorrow 07:00", in the completion toast’s style) with Undo.
- **Metadata row:** one reading order, 12px, wrapping: **when** (the deadline, then Repeat), **what** (the priority badge unless Medium, In Progress), **labels** (`@project`, then tags), then **counts** (reminders, checklist, attachments, effort) in muted regular weight, last because they're the least urgent. An overdue deadline is medium-weight danger red, titled "Overdue", and read as "Overdue, due 2 days ago"; the date's words plus the ring keep it from resting on colour alone. When the list is grouped by project, cards leave out the `@project` chip their heading already gives; grouped by priority, they leave out the priority badge (Urgent keeps its stripe). On phones (below `sm`) the row lightens: tags drop their tint and ring to the dot and the name, the +N loses its well, and the counts wait for `sm` (the editor still shows them); the project keeps its chip. Tags stop at three: a Well Stone **+N** chip in muted text follows, titled with the rest ("#four, #five") and read as "2 more tags: #four, #five".
- **Selection is focus:** J and K move real focus with the selection (to the title button, or the checkbox if that's where focus was), and Tabbing to a card selects it, so a screen reader hears the card and E and X act on what's in focus. While its card is selected, the title button's own focus ring and halo step aside (the marker shows where focus is); every other control in the card keeps its ring.
- **When a card leaves** (ticked off, deleted, completed with X), focus moves to the same control on the card that takes its place, or to the empty state when none does. It never drops to the page.

### Inputs / Fields
- **Style** (`field`): a flat Well Stone well with 8px corners, 8px × 12px padding, 14px text, and placeholders in full Weathered Grey (6.0:1 or better; `contrast.spec` measures them, since axe skips placeholders). No visible border at rest.
- **Focus:** the border appears in the ring colour with a 3px soft orange glow (primary-soft), and the global focus outline sits on top.
- **Hover:** the border fades in at the strong seam colour.
- **Selects:** the same well, with one shared chevron instead of each browser's own arrow.
- **Error:** the app checks its own fields (`noValidate`), so the browser's "Please fill out this field." bubble never shows. On Save, a problem shows right under its field (`FieldError`): 12px medium danger text after a 14px circle-alert icon, with `role="alert"`. The field gains a danger border that stays on hover and focus (`INVALID_FIELD`), `aria-invalid` and `aria-describedby`, and focus moves to the first problem reading down the form. Editing the field clears it. Messages say what to do, and name the value when it can't exist: "Give the task a title.", "Use DD/MM/YYYY, such as 08/03/2026, or clear it.", "“31/02/2026” isn’t a date. Check the day and month."
- **Dates and times** (`DateField`, `TimeField`): typed, so one format shows in any locale. Dates are day first (placeholder `DD/MM/YYYY`), times on the 24-hour clock (`HH:MM`), in tabular figures. They take the shapes people type (`8/3`, `8/3/26`, `1730`, `5pm`) and words as in quick add ("fri", "tomorrow", "fri 5pm", whose time fills the time field), and write them back in full on leaving the field. Text that can't be read stays as typed until Save names the problem. The native picker sits behind a 32px icon button inside the field's right edge (calendar or clock, muted, hovering to the seam colour; named "Open calendar for the deadline"), and it only writes into the text. Browsers that can't open a picker from a button get no button. Under the deadline, a 12px muted line confirms the reading as it's typed: "Due Wed 11/03/2026, 17:30 · Tomorrow"; a reminder time gets "Reminds you Thu 12/03/2026, 19:05". Date and time sit side by side and stack where both don't fit (each at least 9.25rem, so the whole placeholder clears the button), with each error under its own field; the reminder's reading and its Add button share the line below. Until there's an error or a reading, each field's description tells screen readers its format ("Day first, such as 25/04/2026."), since a placeholder isn't read out reliably.
- **"Add" fields:** text typed into a field that adds something (a checklist item, a link, a tag, a new project, a reminder time) but not added yet is added on Save, never dropped. A link that isn't valid stops Save with an error at the link field.
- **Checkbox (task complete):** a 20px circle with a 1.5px strong-seam border, inside a label that makes the touch target 44px without moving it. On hover (of the circle or its target) the border turns sage (`--done-edge`) with a 4px soft sage halo, a preview of done. Checked, it fills Lichen Sage with a `--done-edge` rim (3:1 or more on the card in both themes) and the ink tick (7.2:1) scales in. Never orange: the brand marks actions, sage marks done.
- **Checkbox (everything else):** `.box-check`, the square sibling, for "Show completed" and checklist items: 16px with 4px corners and a 1.5px Weathered Grey border (3:1 or better on its own), with the same sage hover halo, sage fill and ink tick. Round always means "complete this task"; no checkbox is left to the browser's own look.
- **Quick add on phones:** the example placeholder would be cut off mid-token, so below `sm` it reads "Quick add a task", and while the field is focused and empty a Well Stone hint under it shows the syntax ("Add details as you type: #tag @project !high ~30m tomorrow 5pm"). The hint is the field's description either way.
- **Quick add syntax** (`QuickAddSyntax`): the full grammar on demand. A 36px muted icon button (circle-help, "Quick add syntax") sits inside the bar's right edge at every width, with the `N` key cap beside it from `md` (between `sm` and `md` the cap would cut the example placeholder off). It opens a Lifted White popover with the pop shadow, 320px wide, hanging 8px under the quick-add panel and lined up with its right edge (so 16px from the screen's on phones); Esc or a tap elsewhere closes it and focus stays on the button. Inside, a bold 14px title and a two-column list: each kind of token as a Well Stone chip (`#finance`, `@home`, `!high`, `~30m`, `fri 5pm`), then its name in semibold and the other forms it takes ("Priority. Also !low, !med or !urgent."), and "The rest of the line is the title." The keyboard shortcuts sheet carries the same list under its own heading. The rows are data (`QUICK_ADD_SYNTAX` in `src/lib/quickAdd.ts`), and a unit test parses every token shown, so the help never promises a form the parser doesn't read.
- **Errors outside the editor** (quick add, Projects & tags, a new project, a file that's too large) use the same `FieldError`, so they're read out as alerts and the field points at them.

### Navigation
The header is the only navigation. On the left, the brand mark: a 36px Late-Sun Orange tile with 12px corners and a double-check icon, plus the Gabarito wordmark. On the right, a neutral tray of header buttons and the brand New task button. In order: notifications, Projects & tags, Backup, Trash, theme, shortcuts. Backup and Trash show their words from `md`; Projects & tags and the bell's ask ("Turn on reminders") from `lg`. Only the actionable state earns words: once notifications are blocked, the bell is a bare glyph at every width, since a standing negative status shouldn't be the widest thing in the tray. Trash's count is a rust corner badge at every width; once the word shows, the button keeps 18px on its right so the badge clears it, count or not, and the tray never shifts as the count comes and goes. The theme button is a **Menu** (System, Light, Dark) that shows a sun or a moon for what's on screen and is named for the choice ("Theme: System"). Phones have no hover tooltips to name a bare glyph, so under `sm` the tray keeps the bell and Trash and adds **More** (an ellipsis and the word), a Menu holding Projects & tags, Backup & restore and the Theme choices; the shortcuts button isn't offered there. Touch screens (no hover, so no tooltip to name a glyph) keep that phone pattern up to `lg`: the bell, Trash with its word from `sm`, and More. From `lg` on touch, Theme shows its word, and the shortcuts button is never offered on touch (`?` still opens the sheet from a keyboard). The `touch:` and `mouse:` variants (`@media (hover: none)` / `(hover: hover)`) in `index.css` carry this. Accessible names never change with the width or the pointer. In Trash view, the wordmark gives way to a "Trash" Headline (bold), and New task's slot holds a Well Stone **Back to tasks** (a new task wouldn't show in Trash). Both buttons share one grid cell and fill it, so the slot is the same width in both views and the Trash button stays under the pointer to switch back. Trash has two ways back, both named: Back to tasks and the pressed Trash button. Empty, it says so once ("Nothing in Trash", then how long deleted tasks wait). Trashed cards keep their title in full ink with no strike-through, which would read as done; the taupe stripe and "Deleted … · N days left" say they're set aside. The page content below sits in `<main>`.

With notifications blocked, the bell becomes a square crossed-out bell button with no words (named and titled "Notifications blocked") that opens a small Lifted White popover with the pop shadow, under the tray: what blocking means and where to allow them. Esc or a tap elsewhere closes it, and the same text is the button's description.

### Heading Panel (signature)
The orange tile that leads the page, with the black sun clipped in its top-right corner and today's date in 14px medium at the bottom. It has two states:
- **Before there are tasks:** the full-width brand moment. "Tasks" alone in Display type, with a 160px sun (192px from `sm`).
- **Once there are tasks:** compact, and it says what's urgent. Two Display lines of equal size, "Tasks" over the urgency line: "2 overdue", else "1 due today", else "On track" while anything is open, else "All done". The sun shrinks to 112px, and the text keeps an 80px right margin so it never runs into it. On phones the panel tightens (16px padding, both Display lines at 24px, a 96px sun with a 56px margin), and when something is overdue and something is due today the urgency line adds "· 1 today" ("2 overdue · 1 today"), since the compact tiles under it are small. It shows only where it fits on the line: with a two-digit count it waits for 375px, rather than wrap onto a third line starting with its dot.

The sun rises 60px into place on load, the one large decorative movement in the app.

### Overview Tiles (signature)
Four panels, most urgent first: Overdue (maroon, or taupe at zero), Due today (mustard, or taupe at zero, so a tile reading 0 never asks for attention), Open (violet), Completed (sage). Overdue and Due today never count the same task: Due today is what's still to come today, so a task due at 07:00 moves from Due today to Overdue when 07:00 passes. Open includes both. Each tile is a filter, a toggle button with `aria-pressed`. The numbers always count all tasks, so they keep answering "what needs me now?" whatever else is filtered. Picking a tile narrows the list to those tasks, together with any other filters (both use `matchesScope` in `src/lib/filter.ts`). Picking it again clears it, and only one is picked at a time. Completed tasks follow one rule: "Show completed" alone lets them into the list. While the Completed tile is picked the box reads ticked, and unticking it unpicks the tile; the tile never writes the stored setting, so unpicking it restores the list. The status pills are To Do and In Progress only. A picked tile with nothing to show gets its own empty state ("Nothing overdue"; Due today's adds that anything already late is under Overdue) with a **Show all tasks** button.
- **Feedback:** the count line under the filters names the pick ("2 overdue tasks") and is a status region, so screen readers hear the new count.
- **Content:** a 14px semibold label (12px on phones), a 20px icon at the top right (not on phones), and a Stat number that counts up. Completed adds a percentage and a 6px meter that fills by `scaleX`. When something is overdue, its icon pulses (motion-safe only).
- **Layout:** label over number at every width. From `sm`, four equal tiles with a large number. On phones, one compact row of four, 6px apart, sharing the row equally but never narrower than its label (so "Completed" fits whole at 320px, where the tiles go uneven), and a tile wraps to a second line rather than push the page sideways with a huge count: 8px padding, a 12px semibold label, the 24px Stat, and Completed drops its percentage text (the meter still shows it). Icons are left out where tiles are slimmest: on phones, and beside the heading from `lg` to `xl`.
- **States:** hover adds the pop shadow (no lift, so the meter stays aligned). Picked takes the selection outline (`SELECTED_OUTLINE`) and, so it never looks like keyboard focus alone, a clear mark (×) cut out of a 20px ink disc in the tile's own panel colour, in the icon's place: the filter is on, press to take it off. Not a check, which would read as done. The mark shows at every size, including phones, where the icons are left out and it sits beside the number (narrower than the label). The meter sits outside the button, so it stays a progress bar to assistive tech.

### Dialogs and Toasts
- **Dialog:** native `<dialog>` on Lifted White with the panel radius and the modal shadow. It springs up 24px from 94% scale over 480ms, over a blurred backdrop. The sticky title bar is solid Lifted White (a see-through blur smeared the labels scrolling under it), with a Headline title and a header-icon close button. Fields inside a dialog carry a scroll margin, so one that takes focus stops clear of the sticky title bar and footer, label included.
- **Task editor fields:** most tasks need only a few fields, so those lead in the order they're decided. Title, then Deadline, Time and Priority on one row (2 : 1 from `sm`, stacked on phones), Description, Checklist, and Project beside Tags. Status, Effort, Repeat, Reminders and Attachments wait behind **More details**: a full-width row (44px tall, 13px, semibold name, chevron at the right) that starts closed every time the editor opens. Closed, it says what's set behind it in plain words ("In Progress · 3h effort · Repeats weekly · 2 reminders · 1 attachment"), or names what's there in muted text when nothing is set, so closing it never hides a value. Its fields stay in the DOM while it's closed: text typed there still saves, and a Save that finds a problem there opens it so focus can reach the field. The fields fade up (`animate-fade-up`) when it opens, and opening it by hand scrolls the editor just enough to bring them in (`nearest`, clear of the title bar and footer; instant under reduced motion), so they never open below the footer. The checklist's progress bar is a 6px rounded meter filling in `--done-edge` (the ticked box's sage) on Well Stone, not a brand-orange hairline.
- **Task editor footer:** sticky, solid Well Stone with no rule above it: the tone step sets it apart, and nothing scrolling behind shows through around Save (it used to be see-through). Cancel's hover steps one tone further, to the seam colour. The Markdown **Preview** sits in a plain Well Stone well like the field it replaces, with no border; Markdown headings inside it are Gabarito bold, per the Heavy Headline Rule.
- **Projects & tags:** each label is a row: a round 28px colour swatch (`.swatch`, the label's dot made big, with a faint inner ring so light colours still show; it takes the soft orange halo on hover). The swatch opens **ColorPicker**, a popover radio group of the seven calm colours in a 4-wide grid of swatches on a raised panel: arrow keys move and pick, Enter, Space or a click picks and closes, Esc closes unchanged, and focus leaving closes it so it never covers the next control. It hangs under the swatch, or above when there's no room. The pick has a dark check and a 3px inner ring in the panel colour; the focus outline stays focus's alone. Then its name in a field well with its muted sigil inside, right against the name (`@Home`, `#finance`, as everywhere else; so it reads as editable; it saves on blur or Enter), the number of tasks it's on ("4 tasks", the same count the delete question gives, and the name field's description), and Delete. Rows sit 8px apart under a bold section heading.
- **Keyboard shortcuts:** a two-column list with the app's own `kbd` keys; a pair like J / K is two keys with a muted slash between. Under it, 32px down, a bold "Quick add syntax" heading and the same `QuickAddSyntax` list as the quick-add popover.
- **Unsaved changes (task editor):** with anything changed (fields, checklist, reminders, repeat, staged attachments, or text typed but not yet added), Esc, × and Cancel don't close the editor. Its sticky footer becomes a Noon Mustard bar asking "Discard your changes?" ("Discard this new task?" when creating). **Keep editing** is the inverted main action and takes focus; **Discard** and **Save** ("Add task" when creating) are quiet; Save rests on a 10% tint of the bar's ink so the two never read as the same button. Save saves and closes as the footer's would; a problem with a field focuses it, which puts the bar away. Esc on the bar means Keep editing, and going back to a field puts the bar away. With nothing changed, every close is instant.
- **Confirmation** (`ConfirmDialog`, through `useConfirm`): every "are you sure?" in the app, never the browser's own confirm box. A small Lifted White dialog (`max-w-md`) with the dialog spring, an `alertdialog` with a Headline question ("Empty Trash?", "Delete this project?"), a body that says what will happen with the counts involved, and a button row: Cancel (secondary) and the go-ahead, named for the action ("Delete forever", "Replace everything"). Destructive ones use Danger solid and give Cancel the first focus; the rest use Primary and focus it. Esc cancels. Counts that compare two states sit in a Well Stone list (`CountList`): "Now 3 tasks", "Backup 1 task". A confirmation opened from another dialog stacks on top of it and closes alone. When the thing asked about disappears (a deleted Trash card or label), focus moves to its neighbour's same button.
- **Backup & restore:** a muted line on where the tasks live, then the data's state in a Well Stone list (`CountList`): **Last backup** (`DD/MM/YYYY`, 24-hour, or Never) and **Storage** (Protected, Not protected or Not reported, with a muted line saying what that means). While storage isn't protected, an underlined Burnt Orange Text button ("Ask the browser to protect it", then "Ask again") asks for it; a refusal says so ("Not granted", then "Still not granted"), and once it's granted, focus moves to the answer. Download (Primary) and Restore (secondary) follow, with their result in a status line underneath: ink for a result ("Restored 3 tasks."; a zero attachment count is left out), medium danger text after a circle-alert icon for a problem. A file that isn't a backup says so in plain words with what to do ("This file isn’t a Task Tracker backup. Choose a file you downloaded from Backup & restore."); a backup from a newer version says to reload the app to update it. Restore's question shows both counts; when the file has fewer tasks it adds a danger line with a triangle icon ("This backup has 9 fewer tasks than you have now."), then says the data will be replaced and can be undone until the app is reloaded, with a secondary **Download current data** button that saves a backup without closing the question and confirms in a muted status line. A file with no tasks, while you have some, gets its own question ("This backup has no tasks") with a danger line naming how many tasks it deletes, and a plainer go-ahead ("Replace with an empty backup"); Cancel still takes focus. After a restore, the result line comes first and a secondary **Undo restore** button sits in its own row below it (with a line saying why whenever no result is showing, so after a bad file the error stands alone and Undo never reads as its fix); it puts everything back from the snapshot taken just before, and focus moves to Restore from file…. The app holds that snapshot for the session (in memory, gone on reload), so closing the window doesn't end Undo: a sticky toast takes it over ("Backup restored", "You can undo it until you reload the app.", **Undo restore**), and reopening the window shows the button again with a line saying why. If anything changed since the restore, Undo asks first ("Undo the restore?"; changes made since will be lost too), and Cancel keeps the offer. Sample data sits apart at the bottom, after extra space (32px, no rule), in a **Try the app** section with its own bold heading and a ghost button, so it never reads as a peer of Restore.
- **Toast:** an ink panel (`panel.ink`: near-black in light, off-white in dark) with the pop shadow that slides in 32px from the edge. The message is 14px medium, wraps anywhere and wraps pretty (`text-pretty`, so "Trash" never ends alone on a line); task titles in it are cut to 60 characters, so the words around them ("moved to Trash") always show. An optional second line in regular weight carries detail ("Next due tomorrow 07:00", or why a save failed), in full ink. Undo is the ink panel inverted (`attentionAction` with `INVERTED_PANEL.ink`), so the screen keeps one brand-orange button; Dismiss is the panel's ink at 75%, tinted with its own ink on hover. Toasts close after 6 seconds, but the countdown waits while the pointer is over one, while focus is inside it, and while a dialog is open over it (the backdrop covers it and the page behind is inert); each wait ends with a fresh 6 seconds. A failure toast stays until dismissed, and so does a sticky one (`sticky`), whose action is good for the whole session (Undo restore). Completion toasts share one slot, so a quick J/X run shows only the latest "Done", and `Z` runs the newest Undo (a held key doesn't repeat it). The page keeps 192px of room under the list at all times, so the last cards can scroll clear of the stack (growing it only while a toast showed made the page jump when one went).
- **Toasts and assistive tech:** a failure toast uses `role="alert"`. The others are `role="status"` but silent themselves: their words ("Done: Pay rent. Press Z to undo.") go through a visually hidden live region that's on the page from the start, which screen readers announce more reliably. While it holds anything, the stack is a region named "Notifications". When a toast that has focus goes (Undo, Dismiss), focus returns to where it was before the toast, else the page heading.

### Empty State
A large neutral panel (56px top padding, 80px from `sm`) with a 64px orange icon tile that floats gently (motion-safe), a 30px Gabarito extra-bold title, a 14px muted line capped at 24rem, and the way out (e.g. **Load sample data**) below it.
- **First run** ("No tasks yet") teaches capture by doing it. The line says what one quick-add line can set, and under it a Well Stone button reads "Try: Pay rent #finance @home !high ~30m tomorrow 5pm" (muted "Try:", balanced wrap on phones). It puts the line in quick add and focuses it with the caret at the end, so the preview shows each token become a tag, project, priority, effort and deadline; nothing is saved until Enter. **Load sample data** sits below it as an ink button (`btn.ink`: the brand button's shape in `bg-fg`/`text-bg`), the view's main action without a second brand-orange button; New task in the header stays the one. Last, a muted 12px line with a drive icon says what's different about the app where people land: "Stored only in this browser. No account, works offline." (`EmptyState`'s `note` slot). It belongs to the first run only; no other empty state shows it, and the header has no storage chip until sync gives it something to report.
- **No matches** says what narrowed the list. With only a search: "No tasks match “rent”." and **Clear search**. With filters: "No tasks match these filters." and **Clear filters**, which clears the search, the filters and the tile pick, keeps Show completed as it is, and puts focus in the search field.

### Motion
Timing comes only from `src/components/motion/presets.ts`: 180ms for exits and small changes, 320ms for entrances and reveals, 480ms for the dialog spring, 1.1s for count-ups, 450ms for the burst. The default easing is a soft out curve, `cubic-bezier(0.22, 1, 0.36, 1)`, and hover and focus transitions use 200ms. Entrances fade and rise 8px with a 25ms stagger capped at 12 items. Only `transform` and `opacity` animate movement. With reduced motion on, everything renders in its final state at once.

## Do's and Don'ts

### Do:
- **Do** take every colour, radius, shadow and duration from `src/index.css`, `src/ui.ts` and `presets.ts`.
- **Do** carry meaning with a `panel.*` colour and its paired ink, and prove new pairs at 4.5:1 in both themes.
- **Do** keep panels flat and separated by 12px gutters; reserve shadows for hover, focus and open dialogs.
- **Do** use `rounded-panel` (16px) on every panel, and the inner steps (12 / 8 / 6 / 4px) only inside them.
- **Do** show selection with a shape (the margin marker on cards, the outline and clear mark on tiles), not colour alone, and keep the two-tone focus ring visible on every control.
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
