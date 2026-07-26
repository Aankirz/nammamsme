# DESIGN.md

Desktop-first. Minimum 1280px. The user is at a desk.

## Direction

**Registry.** A case file on a well-organised desk, not an app. Closest cousins are a court docket, a ledger, a lawyer's matter file. Structure and legibility carry the design; ornament does none of the work.

## Theme

Light. The scene is an office at 11am with daylight through a window, doing document work. Dark is a monitoring-dashboard reflex and wrong here.

## Color

Strategy: **Restrained.** Tinted neutrals, one accent, semantic colours for state only.

Everything is tinted toward the ink hue. No pure black, no pure white.

```
--paper:        oklch(97.5% 0.004 60)     page
--paper-raised: oklch(99% 0.003 60)       panels sitting on paper
--paper-sunk:   oklch(95% 0.005 60)       rail, toolbars, table headers
--rule:         oklch(88% 0.006 60)       borders, dividers
--rule-strong:  oklch(78% 0.008 60)

--ink:          oklch(24% 0.012 60)       primary text, primary buttons
--ink-muted:    oklch(48% 0.010 60)       secondary text
--ink-faint:    oklch(62% 0.008 60)       labels, metadata

--stamp:        oklch(48% 0.175 27)       THE accent
--stamp-tint:   oklch(94% 0.030 27)       backgrounds behind stamp text
--settled:      oklch(45% 0.095 155)      filed, matched, paid
--pending:      oklch(58% 0.120 75)       due soon, unmatched
```

**`--stamp` is the colour of official red ink on Indian government paper.** It is reserved for consequence: overdue, blocked, refused, demanded. It is never a brand flourish, never a hover state, never a primary button. The primary action is `--ink`. If red appears somewhere that is not about consequence, it is a bug.

Restraint is what makes it mean something. Red everywhere reads as panic, and the user is already anxious.

## Typography

Two families, both functional.

- **UI:** `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
- **Data:** `ui-monospace, "SF Mono", Menlo, monospace` — amounts, dates, reference numbers, GSTIN, ARN

Fixed rem scale, ratio ~1.2. No fluid clamps; the user is at a consistent DPI.

```
--text-xs:   0.75rem     labels, metadata
--text-sm:   0.8125rem   secondary, table cells
--text-base: 0.9375rem   body
--text-lg:   1.125rem    section headings
--text-xl:   1.5rem      document title
--text-2xl:  2rem        secondary amounts
--text-hero: 3rem        the amount that matters
```

All numerals `font-variant-numeric: tabular-nums`. Money never wraps, never uses a fluid size.

## Layout

Two-pane master-detail, the correct desktop pattern for a case file.

```
┌────────────────────────────────────────────────────────────┐
│ business identity · GSTIN · reset                          │
├──────────────────┬─────────────────────────────────────────┤
│ EXPOSURE         │  document header: what, how much, when  │
│ (the one number) │                                          │
│                  │  ┌──────────────┬────────────────────┐  │
│ OBLIGATIONS      │  │ facts        │  source document   │  │
│  · notice        │  │ what it says │  scan + highlight  │  │
│  · licence       │  │ what happens │                    │  │
│  · receivable    │  └──────────────┴────────────────────┘  │
│                  │  action bar (pinned bottom)              │
│  360px fixed     │                                          │
└──────────────────┴─────────────────────────────────────────┘
```

- Left rail 360px fixed, `--paper-sunk`. Selection is persistent, not a link-away.
- Main pane max 1100px content, left-aligned, not centred in a huge void.
- Below 1024px the rail collapses to a top list. This is structural, not fluid type.
- Vary spacing. Section gaps 32–48px, row padding 12–16px. Not uniform.

## Components

Every interactive element ships default, hover, focus-visible, active, disabled. No exceptions.

- **Focus:** 2px `--ink` outline, 2px offset. Visible, not a subtle glow.
- **Buttons:** primary is `--ink` fill. Secondary is `--rule` border on transparent. Destructive-adjacent uses `--stamp` text on `--stamp-tint`, never a red fill.
- **Rows:** full borders or plain dividers. Never a coloured left edge.
- **Urgency:** a small mono day-count plus a 2px top rule in the state colour. Legible at a glance without reading.
- **Empty state:** teaches what to do. Never "nothing here."
- **Loading:** skeletons matching final layout. No centred spinners.

## Motion

150–250ms, `cubic-bezier(0.16, 1, 0.3, 1)`. `transform` and `opacity` only.

Motion conveys state: selection, reveal, the processing hop log advancing. Nothing decorative. No page-load choreography; the user arrives in a task.

One deliberate exception: when the reply assembles, the supporting invoices stagger in at 40ms intervals. That is the product's argument made visible, and it earns the animation.

## Bans

Beyond the shared bans: no stat-tile row, no sparklines, no card grid, no gradients anywhere, no icon-plus-heading-plus-text triplets, no rounded-pill everything. Radii stay at 4–6px. This is a document, not a toy.
