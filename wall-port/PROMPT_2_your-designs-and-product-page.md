# Claude Code Prompts 2 & 3 — after the Wall is in

Run these only after Prompt 1 is merged into `redesign/v2` and verified.

---

## Prompt 2 — An asset pipeline so Parrv's own designs drop straight onto the wall

You're in `dripTheka` on `redesign/v2`. The Wall (`components/theka/wall/`) reads `product.wall.{front, frontShadow, back, backShadow}`. Right now those point at placeholder tees (`placeholderArt: true`). Build the pipeline that turns Parrv's real product photos into wall-ready assets.

Build `scripts/wall-assets.mjs` (Node, using `sharp`; add it as a devDependency if it's missing):
- Input: `assets-src/wall/<slug>/front.png` and `back.png`. These are **transparent-background** cutouts: ghost-mannequin or flat-lay photos with the background already removed (remove.bg, Photoroom or similar).
- For each image:
  1. **Trim** to the alpha bounding box (alpha > 20).
  2. Resize to **1100px tall** (keep the aspect ratio) and write `public/theka/wall/<slug>-front.webp` (quality 88).
  3. Make the **shadow**: take the alpha channel, scale it to 50%, blur it (σ ≈ 9), and multiply its opacity by 0.55. Write it as RGBA with fill `rgb(20,14,12)` to `<slug>-front_sh.webp` (quality 80).
  4. Do the same for back. If there's no `back.png`, mirror `front.png` horizontally *only if* `--mirror-back` is passed; otherwise fall back to the front image.
- Print a table: slug, output sizes, width/height ratio. **Warn if the ratio falls outside 0.70–1.00.** The wall's box is AR 0.84; hoodies and jackets may need their own AR, which is fine. In that case the Wall should read a per-product `wall.ar`, so add that field and use it in `computeLayout` instead of the constant.
- Add `"wall:assets": "node scripts/wall-assets.mjs"` to `package.json`.
- Document the workflow in `docs/WALL_ASSETS.md`: shoot or render → remove the background → drop the files in `assets-src/wall/<slug>/` → `pnpm wall:assets` → set `wall` paths, `code`, `colourway`, `blurb` in the product data → remove `placeholderArt`.

VERIFY: run the pipeline on one existing placeholder (copy `public/theka/wall/p03.webp` into `assets-src/wall/test/front.png`). The output should look the same as the original on the wall. Delete the test afterwards. `tsc`, `lint` and `build` pass.

Commit: `feat(theka): wall asset pipeline for real product photography`

---

## Prompt 3 — `/product/[slug]`: the shareable, SEO-friendly version of the zoomed view

This replaces the old P2 in `driptheka_redesign_prompts.md`. The pour/goblet version is gone.

You're in `dripTheka` on `redesign/v2`. Build `app/(site)/product/[slug]/page.tsx` as a **server-rendered** page that looks exactly like the Wall's zoomed product view, so a shared link lands on the same visual:
- Same wall background, light and vignette. The product sits large and centred on its acrylic ledge, with neighbours as edge slivers (reuse `WallItem`/`Ledge`, rendered statically from a pre-computed layout, with no camera animation on first paint).
- Same `ProductInfo` (top-left) and `BuyPanel` (top-right on desktop, bottom dock on mobile), with the same Front/Back flip and the same cart wiring.
- `← Collection` goes to `/?fit={slug}`, which zooms the live Wall onto the same product, then the user can step back out to the full wall. Prev/next go to the neighbouring `/product/[slug]` pages.
- Below the fold (the page scrolls here, unlike the Wall), using the same type system: **"How it's poured"** (3 columns: fabric 400 GSM · fit · print, Delhi), then **"Also on the wall"** (3 related products as small ledge cards that link to their pages).
- `generateStaticParams` for every product with `wall` images. `generateMetadata` sets title `"{name} — Drip Theka"`, the description from `blurb`, and an OG image (the front image on the wall background; `/api/og?slug=` if it exists, otherwise a static image). Add Product JSON-LD with price in INR, availability, and the image.
- Mobile: sticky bottom buy dock. No horizontal scroll at 375px.

VERIFY: `/product/<slug>` renders without JavaScript (view source shows the name, price and image). Add to bag works. `← Collection` lands zoomed on the Wall. OG tags validate. Lighthouse mobile ≥ 85 perf and 100 SEO. Reduced motion is safe. `tsc`, `lint` and `build` pass.

Commit: `feat(theka): product page mirrors the wall's zoomed view`

---

### What happens to the rest of the original sequence
- **P3 Try the Look:** still next. Build it in the Wall's visual language (same wall, light and ledges), with styled looks on mannequins or models hung on the wall, pins, a whole-look price, and swipe on mobile. Write that prompt after we prototype it, the same way we did this one.
- **P4–P9** (Story, Building, Regulars, Last Call, 404/Legal, final pass): still valid. Restyle them to the wall's palette (warm plaster, cream text, amber accent, cobalt only in product and brand moments) instead of the old bar look.
