# Wall assets — from product photo to the Wall

The Wall (`components/theka/wall/`) shows every product that has a `wall` block in
`data/pour-001.ts`. `scripts/wall-assets.mjs` turns transparent product cutouts into the
files that block points at.

## Workflow

1. **Shoot or render** the product: ghost-mannequin or flat-lay, front and back, evenly lit,
   garment filling the frame, ideally ≥ 1100px tall at the final crop. The wall zooms ~3.5×,
   so more resolution is better; a source shorter than 1100px after trimming gets upscaled
   (the script warns).
2. **Remove the background** (remove.bg, Photoroom or similar). Export a **PNG with a
   transparent background**. The script trims to pixels with alpha > 20, so stray
   semi-transparent fringe or floating specks will enlarge the crop: clean those up first.
3. **Drop the files** in `assets-src/wall/<slug>/` where `<slug>` is the product's slug in
   the data file:
   ```
   assets-src/wall/first-round-tee/front.png
   assets-src/wall/first-round-tee/back.png      (optional)
   ```
4. **Run** `pnpm wall:assets` (or `npm run wall:assets`). Optional arguments:
   - `pnpm wall:assets first-round-tee` processes only that slug.
   - `pnpm wall:assets --mirror-back` mirrors `front.png` horizontally when there's no
     `back.png`. Without the flag a missing back falls back to the unmirrored front.
5. **Wire it up** in `data/pour-001.ts` for that product:
   ```ts
   code: "01",
   colourway: "Cobalt / Cream",
   blurb: "One line for the product view.",
   wall: {
     front:       "/theka/wall/first-round-tee-front.webp",
     frontShadow: "/theka/wall/first-round-tee-front_sh.webp",
     back:        "/theka/wall/first-round-tee-back.webp",
     backShadow:  "/theka/wall/first-round-tee-back_sh.webp",
     // ar: 0.92,   // only if the table below says this product isn't ~0.84
   },
   ```
6. **Remove `placeholderArt: true`** from the product (see the warning below).

## What the script writes (`public/theka/wall/`)

| File | What |
| --- | --- |
| `<slug>-front.webp` | alpha-trimmed, 1100px tall, aspect ratio kept, WebP q88 |
| `<slug>-front_sh.webp` | shadow: the alpha channel at 50% size, blurred σ 9, opacity × 0.55, filled `rgb(20,14,12)`, WebP q80 |
| `<slug>-back.webp`, `<slug>-back_sh.webp` | the same for the back |

It prints a table with the trimmed source size, output sizes and the width/height ratio.
It warns when the ratio is outside **0.70–1.00**, and lists products whose ratio differs
from the wall's default box.

## Aspect ratio (`wall.ar`)

The wall's default box is **AR 0.84** (w/h). Tees land close to that. Hoodies, jackets and
cropped pieces often don't: if the table shows a different ratio, set `wall.ar` to roughly
that number. `computeLayout` reads it per product: desktop boxes keep their own ratio, and
on mobile a row is as tall as its tallest fit, with every fit on the row sitting on the
same ledge. Leave it out and you get 0.84.

## ⚠ Removing `placeholderArt` un-fences a product

Placeholder (demo) tees are kept out of checkout, DB seeding and every shop listing. Once
you remove `placeholderArt: true`, the product:

- can be reserved through `/api/reserve`,
- appears in shop grids, related and upsell lists, and the static product pages,
- is included in `reserve_count_cache` seeding.

Only remove it when the product is really on sale, with correct sizes, stock and price.

## Notes

- `assets-src/wall/` holds the originals. They're large, so decide whether to commit them
  or keep them in cloud storage; the script only needs them when regenerating.
- Re-running overwrites that slug's outputs in place; bump nothing, but hard-refresh the
  browser if you still see the old image.
