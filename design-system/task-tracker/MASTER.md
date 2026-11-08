# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.
>
> **Source of truth:** the tokens live in `src/index.css`, the shared class strings in `src/ui.ts`,
> and all motion timing in `src/components/motion/presets.ts`. This file describes them. If they
> disagree, the code wins and this file should be updated.

---

**Project:** Task Tracker
**Updated:** 2026-11-08 (card-style revamp, issue #9)
**Category:** Productivity Tool (offline PWA)
**Direction:** Card-based colour panels, after the 21st.dev "Sill" template
**Design Dials:** Variance 6/10 (Bento / card grid) | Motion 7/10 (Expressive, with a reduced-motion guarantee) | Density 7/10 (Standard)

---

## Global Rules

### Visual language

- The page is a canvas of **panels**: flat, saturated colour blocks separated by gutters.
  Colour and spacing do the separating. No hairline borders or heavy drop shadows as dividers.
- Cards are **soft-square**: one radius token, `--panel-radius` (1rem), so the whole app can be
  dialled toward Sill's square panels.
- Dark mode is Sill as-is: near-black canvas, off-white text, saturated panels. A dark panel may
  carry a faint inner top highlight (`--shadow-card`).
- Light mode inverts it: a warm off-white canvas, near-black text, the **same** panel palette.
- Surfaces layer: `bg` (canvas) < `surface` (cards) < `raised` (dialogs, popovers).

### Panel palette

The panels look the same in both themes. Each has a paired text colour, and every pair meets
WCAG AA (4.5:1). Where Sill's own pairing failed, the text colour was changed.

| Panel | Hex | On-panel text | Contrast | Role (`panel.*` in `src/ui.ts`) |
|-------|-----|---------------|----------|----------------------------------|
| Orange | `#cf6224` | `#141110` | 4.9:1 | `brand`: primary emphasis, heading panel, New task |
| Mustard | `#e3b867` | `#141110` | 10.1:1 | `warning`: due today, high priority, Sill hover |
| Maroon | `#6e1116` | `#f4f1ee` | 10.6:1 | `critical`: Overdue |
| Rust | `#9b3418` | `#f4f1ee` | 6.4:1 | `danger`: past due, urgent |
| Violet | `#5a3cd4` | `#f4f1ee` | 6.2:1 | `info`: open, in progress, toasts, backup reminder |
| Sage | `#80a89b` | `#141110` | 7.2:1 | `calm`: completed, medium priority |
| Taupe | `#bca59d` | `#141110` | 8.1:1 | `neutral`: low priority, to do, Trash stripe |
| Mauve | `#a97d9c` | `#141110` | 5.5:1 | spare |

CSS variables: `--panel-<name>` and `--on-panel-<name>`, exposed to Tailwind as
`bg-panel-<name>` / `text-on-panel-<name>`.

**Semantic mappings** (`src/ui.ts`):

- Overview tiles: Open → violet, Due today → mustard, Past due → rust (taupe at zero), Completed → sage.
- `PRIORITY_PANEL`: low → taupe, medium → sage, high → mustard, urgent → rust.
- `STATUS_PANEL`: to do → taupe, in progress → violet, done → sage.
- Overdue: maroon badge plus a maroon outline (`ALERT_OUTLINE`).
- Anything that carries meaning by colour uses one of these panels, never a raw hue.
- User-picked project and tag colours stay as they are. They show as a dot, a tint and a ring
  (`labelTint` in `src/lib/colors.ts`) with body-coloured text, never as the text colour itself.

### Canvas and text

| Token | Light | Dark |
|-------|-------|------|
| `--bg` (canvas) | `#f4f1ee` | `#0b0a0a` |
| `--surface` (cards) | `#fbfaf8` | `#171413` |
| `--raised` (dialogs) | `#ffffff` | `#1f1b19` |
| `--subtle` (wells, inputs) | `#ebe5df` | `#26211f` |
| `--fg` (text) | `#141110` | `#f4f1ee` |
| `--muted` | `#5c534d` (6.0:1 on subtle) | `#b0a69e` (6.7:1 on subtle) |
| `--primary` (orange as text) | `#a3440f` | `#ec7a3a` |
| `--danger` | `#b42318` | `#f0866a` |
| `--ring` (focus) | `var(--fg)` | `var(--fg)` |

### Typography

- **Display font:** Gabarito (`font-display`), extra-bold, for headings and big numbers. All
  `h1`–`h3` use it.
- **Body font:** Inter (`font-sans`).
- Both fonts are **self-hosted** via `@fontsource-variable/*` and precached by the PWA. No Google
  Fonts or any other CDN, so the app keeps working offline.
- Sill's handwriting font is not used.

### Shadows

Shadows mark elevation, not separation.

| Token | Use |
|-------|-----|
| `--shadow-card` | Cards at rest: empty in light mode, a faint inner highlight in dark |
| `--shadow-pop` | Hovered cards, the focused quick-add panel |
| `--shadow-modal` | Dialogs |

`--shadow-card` is an empty shadow (`0 0 #0000`), never `none`. Tailwind combines shadows and
rings into one list, and `none` would void the selection and overdue rings.

---

## Components

Reuse these before building anything new.

| Need | Use |
|------|-----|
| Buttons | `btn.primary / secondary / ghost / danger / small / icon`; `btn.brand` for the single most prominent action (orange, turns mustard on hover); `btn.headerIcon` in the header panel |
| Inputs | `field`: a flat filled well, with a border and soft glow on hover and focus |
| Neutral panel | `card` (`rounded-panel bg-surface shadow-card`) |
| Colour panel | `panel.*`, plus `INVERTED_PANEL` for a solid button sitting on that panel |
| Dialog | `Dialog` / `useModalDialog` on native `<dialog>`, with `DialogTitleBar` |
| Toast | `ToastPanel` inside `AnimatePresence` |
| Empty state | `EmptyState`: a big panel named by its title, with a floating icon tile |
| Task | `TaskCard`: a priority stripe on the left edge, badges, metadata chips |
| Group heading | `GroupHeading`: a coloured tab with a count |
| Labels | `LabelChip` |
| Selection | `SELECTED_OUTLINE` (an outline ring, not colour alone) |
| Hover | `hoverHighlight` (Sill's mustard hover) |

---

## Layout

- The main container is `max-w-6xl`, with a 16px side gutter.
- **Bento top section:** from `md` up, the heading panel and the four Overview tiles share a row
  and quick add spans below. Under `md`, everything stacks in one column.
- **Task grid:** one column on phones, two from `md`. Cards fill rows left to right, the same
  order `J`/`K` walk them.
- Groups keep their own sections, each with its own grid.
- No horizontal scroll at 375–390px.

---

## Motion

**Dial: Expressive.** It is built with Motion for React (the `motion` package) and CSS only. No
GSAP, ScrollTrigger, SplitText or Lenis, and no scroll hijacking.

### Presets (`src/components/motion/presets.ts`)

Every animation takes its timing from here, never from ad-hoc numbers. CSS durations in
`index.css` mirror the presets, each with a "keep in sync" comment.

| Preset | Value | Use |
|--------|-------|-----|
| `DURATION.fast` | 180ms | Exits and small state changes (exits stay ≤ 250ms) |
| `DURATION.base` | 320ms | Entrances, reveals, the theme fade |
| `DURATION.spring` | 480ms | Dialogs springing in (CSS spring) |
| `DURATION.count` | 1.1s | Number count-ups |
| `DURATION.burst` | 450ms | The completion celebration |
| `DURATION.float` | 3.6s | One bob of a decorative icon (CSS) |
| `EASE_OUT_SOFT` | `cubic-bezier(0.22, 1, 0.36, 1)` | The default easing (`--ease-out-soft`) |
| `SPRING.soft` / `SPRING.pop` | | Layout glides / small pops (Trash badge) |
| Stagger | 25ms per item, capped at index 12 | `enterTransition(index)` |

### Primitives (`src/components/motion/`)

- **Reveal:** fades and lifts its children in on mount or when scrolled into view (once), with a
  stagger index and a `from` preset (`ENTER_FROM`, `POP_FROM`, `RISE_FROM`).
- **CountUp:** animates a number. Assistive tech reads only the final value.
- **AnimatedList / AnimatedItem:** a list or grid with enter, exit, scroll-reveal and layout
  (reorder) animation, plus an optional hover lift.
- **Burst / BurstLayer:** the completion celebration, drawn app-wide so it outlives its card.

### Where it moves

- Bento panels rise in on load with a short, capped stagger.
- Cards reveal on scroll, glide on reorder, animate in when added and out when removed, and
  lift under a mouse pointer (not on touch).
- Completing a task bursts from its checkbox. The Overview counts up and its meter fills.
- The header hides while you scroll down and returns on scroll up or when focus enters it.
- Dialogs spring in over a blurred backdrop. Toasts slide in and out.
- Switching theme cross-fades colours.
- Empty-state icons float gently.

### Rules

- Movement (entrances, exits, reveals, lifts, reorders, fills) animates `transform` and `opacity`
  only. Hover and focus states may also transition colour, border colour and box-shadow, as may
  the theme fade. Never `transition-all` or layout properties (`width`, `height`, `top`, `left`):
  scale a bar instead of resizing it.
- Small hover and focus transitions, and the dialog backdrop fade, use 200ms (Tailwind's
  `duration-200`). It is the one timing defined outside `presets.ts`, and it is close to
  `DURATION.fast`.
- **Reduced motion is guaranteed:** `MotionConfig reducedMotion="user"`, the global CSS
  `prefers-reduced-motion` override, and `motion-safe:` for anything endless. Content renders in
  its final state at once: no entrance offsets, scroll reveals, count-ups or lingering exits.
  `e2e/reduced-motion.spec.ts` guards this.

---

## Accessibility

- Every text and panel pairing meets 4.5:1 (3:1 for large display text) in both themes. This is
  checked by axe in `e2e/contrast.spec.ts`.
- Focus is always visible: an unlayered `:focus-visible` outline in the text colour, with a halo
  in the canvas colour, so it shows on every panel colour. Nothing may remove it. This is checked
  in `e2e/focus.spec.ts`.
- Roles and accessible names used by the e2e fixture are a contract: don't rename them.
- Dialogs stay native `<dialog>`, which gives Escape, focus trapping and focus return.

---

## Anti-Patterns (Do NOT Use)

- ❌ Hairline borders or heavy drop shadows as separators
- ❌ Raw hues for meaning (use `panel.*`), or a user-picked colour as text colour
- ❌ Ad-hoc durations, easings, colours or radii outside the tokens and presets
- ❌ `transition-all`, or animating layout properties
- ❌ GSAP, ScrollTrigger, Lenis, or any scroll hijacking
- ❌ Fonts or libraries loaded from a CDN at runtime
- ❌ Removing the focus outline (`outline: none`) or showing selection by colour alone
- ❌ Emojis as icons (use Lucide)
- ❌ Sill's photography, handwriting font, illustrated hero scenes or pinned horizontal scroll

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] Colours, radii and motion come from the tokens, `src/ui.ts` and `presets.ts`
- [ ] Text contrast meets 4.5:1 in light **and** dark (`e2e/contrast.spec.ts`)
- [ ] Focus is visible on every control (`e2e/focus.spec.ts`)
- [ ] Under `prefers-reduced-motion`, content shows in its final state at once
- [ ] Only `transform` and `opacity` animate
- [ ] Responsive at 390px, 768px, 1024px and 1440px, with no horizontal scroll on mobile
- [ ] Accessible roles and names are unchanged
- [ ] `21st review src` shows no new errors or warnings
