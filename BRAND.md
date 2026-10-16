# Mise brand

Live version with the interactive orb: `/brand` in the app.

## Name

**Mise**, from *mise en place*: everything in its place. Before a cook starts, every ingredient is measured and laid out. Mise does that for your grocery list. Always lowercase in the wordmark; "Mise" in running text.

## Logo

- **Mark:** a halftone sphere on a 7×7 grid. The grid is mise en place, the shading is the orb, and dot radius follows a light from the top left. The single brightest dot is saffron. Built in code: `markDots()` in `src/components/brand.tsx`. The favicon (`src/app/icon.svg`) is generated from the same construction.
- **Wordmark:** Archivo, 125% width, bold, tight tracking (−0.045em), lowercase.
- **Lockup:** mark left, wordmark right, gap ≈ half the mark's width. Clear space: one grid cell all round. Minimum mark size 16 px.
- **Don't:** recolour the dots, add gradients or glows, outline the wordmark, set it in capitals, or put the mark on a busy photo.

## Colour

Dark only. One accent.

| Name | Hex | Use |
| --- | --- | --- |
| Ink | `#0B0A09` | Background. Warm black, never `#000`. |
| Ink 2 / 3 | `#141311` / `#1C1A17` | Raised panels, pressed states. |
| Paper | `#EFEBE3` | Text and dots. Use opacity for hierarchy (85 / 55 / 40 / 25%). |
| Saffron | `#FF7A1A` | The accent: primary actions, focus, the highlight dot. If two things on a screen are orange, one is wrong. |
| Turmeric | `#FFC24B` | Notices and "sample data" flags only. |
| Herb | `#8CD47E` | Success: cart ready, connected. |
| Chili | `#FF5C4D` | Errors. |

## Type

| Role | Face | Setting |
| --- | --- | --- |
| Display | Archivo | 118% width, weight 620, −0.035em, line-height 0.98 |
| Text | Archivo | 100% width, 400, 15 to 17 px |
| Labels and data | JetBrains Mono | 11 px uppercase, +0.14em for labels; quantities and prices in regular case |
| Numerals | Doto | Dot-matrix face for counts, totals and slide numbers. Never for sentences. |

## Motifs

- **The orb:** a sphere of dots (WebGL). It breathes when idle, moves faster and warms toward saffron while Gemini is working, turns herb green when the cart is ready, and swells toward the cursor.
- **The receipt:** lists print like a kitchen ticket: dotted leaders between name and quantity, mono numbers, dashed rules, a torn bottom edge.
- **The ruled line:** inputs are one line on an order pad with a `>` prompt and a saffron caret, not a glowing pill.
- **Hairlines over cards:** 1 px rules at 10% paper, tables instead of icon grids, 12 to 16 px radii.

## Voice

Talk like a good cook writing a shopping list: specific, warm, short. Say quantities. Say what happens next. No hype words, no sparkles, no exclamation marks.

| Write | Not |
| --- | --- |
| 200 ml fresh cream | A splash of creamy goodness |
| Mise can't place orders. | Your security is our top priority! |
| Gemini is measuring everything out | ✨ AI magic is happening… |
| Untick what you have | Customize your perfect cart experience |
