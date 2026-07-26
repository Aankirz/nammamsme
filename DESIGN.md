# DESIGN.md

The design is given, not invented. It lives in `design/`:

- `design/namma-msme.design.html` — the designed screens for this product
- `design/industry/styles.css` — the token sheet and component layer. Single source of truth.
- `design/industry/readme.md` — the system's own guidance. Read it before building.

**Take every colour, font, space, radius and shadow from the CSS variables.** Never hard-code a hex, a font name, or a px value the tokens already carry. When this file and `design/industry/` disagree, the stylesheet wins.

Desktop-first, 1440px primary.

## Direction: Industry

A wireframe. Steel-blue on a light technical ground. Cards, figures and buttons are blueprint objects: square-cornered, hairline-bordered, carrying `+` registration marks at their corners. Cards and figures stay **transparent line drawings**. The primary button is the one solid object on the board.

Not a surface-and-shadow interface. A drawing of one.

## Colour

```
--color-bg        #f2f2f3    ground
--color-surface   #e9e9ea
--color-text      #1d1f20
--color-accent    #5980a6    steel, the only accent
--color-divider   16% text
```

Mono scheme. `--color-accent-2-*` is a machine-derived stand-in; treat it as the same role.

Each role carries a 100–900 OKLCH ramp. Light steps (100–300) for tinted fills, hovers and subtle borders; 500 as base; dark steps (700–900) for text on tinted fills and pressed states. Prefer ramp steps over ad-hoc `color-mix()`.

The accent-to-ground pair is tuned to ~3:1 — enough for icons, large text and chrome, **not for body copy**. Paragraph-size accent text uses `--color-accent-700`.

Elevation is `--shadow-sm/md/lg`, already tuned to the ground.

## Type

`--font-heading` Barlow Condensed over `--font-body` Barlow. Both loaded from Google Fonts by the stylesheet.

Density 0.85× and radius 4px are baked into `--space-*` and `--radius-*`. Use the variables, never raw numbers.

## Structure

Modular grid. Equal-width cells, strong horizontal and vertical rhythm, visible structure.

The designed inbox is a **single scrolling page**, not a master-detail split:

1. Nav bar: brand, kicker, date, business, reset
2. Headline row — three equal cells: due in 30 days, owed to you, most urgent
3. GST returns — three cards, one per return, with the filing note beneath
4. The document table, sorted by deadline
5. The accuracy scoreboard: processed, filed, refused, wrong

## Components

Use the system's classes rather than inventing parallel ones. `design/industry/readme.md` carries the full table; the ones this product needs:

| Class | Use |
|---|---|
| `.blueprint` + four `<i class="corner tl/tr/bl/br">` | The frame every card, figure and primary button wears |
| `.btn` `.btn-primary` `.btn-secondary` `.btn-ghost` `.btn-icon` | Actions. Primary is the solid accent fill. |
| `.tag` `.tag-accent` `.tag-neutral` `.tag-outline` | Status labels |
| `.card` `.card-kicker` `.card-title` `.card-body` `.card-meta` | Transparent, corner-marked |
| `.table` | The document list |
| `.field` `.input` `.seg` `.seg-opt` | Forms, on native elements |
| `.dialog-backdrop` + `.dialog` | Modal at top elevation |

Icons are Lucide at stroke-width 1.5. Thin stroke throughout.

## Interaction

States are themed, never browser defaults. Hover tint and pressed state come one step past the base on the accent ramp. Keyboard focus is `outline: 2px solid var(--color-accent); outline-offset: 2px`. Disabled drops to 45% opacity. Do not restyle per page.

## Currency

**`₹`, not `Rs`.** The designed screens use the glyph throughout. This reverses the earlier copy rule and the seed's copy gate must be updated to match.

## Don't

- Do not round cards, figures or buttons.
- Do not give cards or figures a surface fill. They are line drawings. The solid accent primary button is the one deliberate exception.
- Do not drop the registration marks from a framed element.
- Do not use thick icon strokes.
- Do not add decorative colour beyond the steel accent.

## What this supersedes

This replaces the earlier "registry" direction entirely: warm paper ground, stamp red, system fonts, two-pane master-detail, `Rs` over `₹`. That was a position taken in the absence of a design. A design now exists. See D-55.
