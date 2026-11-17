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
  danger-dark: "#f0866a"
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
    fontSize: "3rem"
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
    padding: "28px"
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

The app is a warm, physical surface where one person lays out their work. The canvas is a sun-warmed off-white by day and near-black by night. On it sit flat, saturated colour panels, like tiles set out on a bench, each one a tool or a reading ready to pick up. The signature is the heading panel: a big orange slab with "Tasks" set heavy in Gabarito and a black sun that rises into its corner on load. Everything else stays quieter than that one moment.

The panels carry meaning, not decoration. Colour says how urgent something is (maroon overdue, rust past due, mustard due today, sage on track), so the bench reads at a glance before any text does. Separation comes from colour and the gutters between tiles, never from hairline borders or heavy drop shadows. Density is standard rather than compact: a phone-sized glance and a desk-sized planning session should both feel unhurried.

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
- **Dusk Maroon** (panel-maroon): the strongest alarm, overdue. A maroon badge plus a maroon outline round the card.
- **Clay Rust** (panel-rust): past due and urgent priority, and the Trash count badge.
- **Lichen Sage** (panel-sage): calm and on track. Completed work and medium priority.
- **Sandstone Taupe** (panel-taupe): low emphasis. Low priority, to do, and Past due when the count is zero.
- **Heather Mauve** (panel-mauve): spare. Defined and AA-paired, with no role yet.

### Neutral
- **Sunwarmed Paper / Night Bench** (canvas / canvas-dark): the page background.
- **Card Linen** (surface / surface-dark): neutral panels: task cards, quick add, the filter bar, the header icon tray.
- **Lifted White** (raised / raised-dark): dialogs, popovers, select menus.
- **Well Stone** (subtle / subtle-dark): input wells, secondary buttons, idle filter chips, code blocks.
- **Charcoal Ink / Paper Ink** (fg / fg-dark): body text and the focus ring.
- **Weathered Grey** (muted / muted-dark): metadata, placeholders, secondary text. It still meets 6:1 on the lowest surface it sits on.
- **Seam** (line, line-strong): the few hairlines that remain: kbd keys, the checkbox outline, Markdown quotes, scrollbars.
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
- **Display** (800, 3rem on phones / 3.75rem from `sm`, line-height 0.9, tight tracking): the "Tasks" heading on the orange panel. One per screen.
- **Stat** (800, 2.25rem / 3rem, line-height 1, tabular figures): the Overview counts, which count up on first show and on change.
- **Headline** (700, 1.25rem, tight tracking): dialog titles and the Trash page title. All `h1`–`h3` use Gabarito. The wordmark "Task Tracker" is Gabarito 700 at 1.125rem, and group tabs are 1rem bold.
- **Title** (Inter 500, 15px, 20px line): task titles, clamped to two lines.
- **Body** (Inter 400, 14px): descriptions, dialog text and rendered Markdown (relaxed leading). The quick-add input steps up to 16px so phones don't zoom on focus.
- **Label** (Inter 600, 12px): filter chips, badges, metadata, counts. Form labels are 13px medium.

### Named Rules
**The Heavy Headline Rule.** Gabarito is for headings, the wordmark and big numbers only, and always at bold or extra-bold. Anything you read in sentences is Inter.

**The Tabular Count Rule.** Every number that changes in place (stats, percentages, counts in tabs and badges) uses tabular figures so it doesn't jitter.

## Layout

A single centred column, `max-w-6xl` (72rem), with a 16px side gutter at every width. Tiles sit 12px apart. The page reads top to bottom:

1. **Header**: sticky and translucent over the canvas with a backdrop blur. It hides while you scroll down and returns on scroll up or when focus enters it. Wordmark on the left; on the right, a tray of icon buttons on a neutral panel and the brand **New task** button. Under `sm`, the wordmark text and the button label drop to icons only.
2. **Bento**: from `md` up, the heading panel and a 2×2 grid of Overview tiles share a row. Under `md` they stack.
3. **Quick add**: a full-width neutral panel with a 16px input.
4. **Filter bar**: a neutral panel. Search plus three selects (a 2-column grid on phones, `1fr + 3 × 9rem` from `sm`), then wrapping rows of filter chips.
5. **Task grid**: one column on phones, two from `md`. Cards fill rows left to right, the same order J/K walk them. When grouped, each group gets its own tab heading and its own grid.

Breakpoints are Tailwind's defaults; only `sm` (640px) and `md` (768px) change the layout. No horizontal scroll at 375–390px.

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
- **Danger** (`btn.danger`): danger-coloured text with a 10% danger tint on hover. For destructive actions, after a confirmation that shows counts.
- **Header icon** (`btn.headerIcon`): a 36px tile (32px on phones) with 12px corners that lights up mustard on hover. It also closes dialogs.
- **On an attention panel** (`attentionAction` / `attentionQuiet`): the main action swaps the panel's colours; the quiet one is the panel's own ink at 85%, tinted on hover.

### Chips
- **Filter chip**: a 32px pill, 12px semibold. Idle: a Well Stone fill with 80% text, lighting up mustard on hover. Active: the matching panel colour. Active label chips keep the body text and gain a 2px inset ring in the label's own colour.
- **Label chip** (`LabelChip`): a 6px-corner pill, 12px medium, with a 6px dot, a 16% tint and an inset ring in the label's colour, and an optional × to remove.
- **Badge**: 6px corners, 12px medium, filled with the priority panel (taupe, sage, mustard, rust) or maroon for Overdue.

### Cards / Containers
- **Corner Style:** the panel radius (16px).
- **Background:** Card Linen, with Lifted White for dialogs.
- **Shadow Strategy:** flat at rest; pop on hover (see Elevation & Depth).
- **Border:** none. A 6px priority stripe in the priority panel colour runs down the card's left edge.
- **Internal Padding:** 16px, with 20px on the stripe side.
- **States:** hover takes the hover tone plus a pop shadow and a 3px lift (mouse only). Keyboard selection gets a 2px outline ring in the text colour, offset 2px. Overdue cards get a 2px maroon ring.

### Inputs / Fields
- **Style** (`field`): a flat Well Stone well with 8px corners, 8px × 12px padding, 14px text, and placeholders at 70% muted. No visible border at rest.
- **Focus:** the border appears in the ring colour with a 3px soft orange glow (primary-soft), and the global focus outline sits on top.
- **Hover:** the border fades in at the strong seam colour.
- **Selects:** the same well, with one shared chevron instead of each browser's own arrow.
- **Checkbox (task complete):** a 20px circle with a 1.5px strong-seam border. On hover the border turns orange with a 4px soft halo. Checked, it fills orange and the tick scales in.

### Navigation
The header is the only navigation. On the left, the brand mark: a 36px Late-Sun Orange tile with 12px corners and a double-check icon, plus the Gabarito wordmark. On the right, a neutral tray of header icon buttons (notifications, projects & tags, backup, Trash with a rust count badge, theme, shortcuts) and the brand New task button. In Trash view, the wordmark gives way to a back button and a "Trash" headline.

### Heading Panel (signature)
The orange bento tile: "Tasks" in Display type at the bottom left, today's date under it in 14px medium, and the black sun clipped in the top-right corner. The sun rises 60px into place on load, the one large decorative movement in the app, and it sits clear of the text.

### Overview Tiles (signature)
Four read-only panels in a 2×2 grid: Open (violet), Due today (mustard), Past due (rust, or taupe at zero), Completed (sage). Each has a 14px semibold label, a 20px icon at the top right, and a Stat number at the bottom that counts up. Completed adds a percentage and a 6px meter that fills by `scaleX`. When Past due is non-zero, its icon pulses (motion-safe only).

### Dialogs and Toasts
- **Dialog:** native `<dialog>` on Lifted White with the panel radius and the modal shadow. It springs up 24px from 94% scale over 480ms, over a blurred backdrop. The sticky title bar is translucent Lifted White with a blur, a Headline title and a header-icon close button.
- **Toast:** a Twilight Violet panel with the pop shadow that slides in 32px from the edge. Undo is a small brand-orange button that lights up mustard; Dismiss is the panel's ink at 75%.

### Empty State
A large neutral panel (56px top padding, 80px from `sm`) with a 64px orange icon tile that floats gently (motion-safe), a 30px Gabarito extra-bold title, a 14px muted line capped at 24rem, and the way out (e.g. **Load sample data**) below it.

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
