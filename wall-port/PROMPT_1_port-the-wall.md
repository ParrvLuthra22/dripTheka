# Claude Code Prompt 1 — Replace the Bar with "The Wall"

> **Before you run this:** unzip `wall-port.zip` into the **repo root** so that `wall-reference/index.html` and `wall-reference/assets/` exist. Then paste everything below the line into Claude Code.

---

You are working in the `dripTheka` repo (Next.js 16 App Router, React 19, TypeScript, Tailwind v4, GSAP, Zustand cart store). Branch: `redesign/v2`.

## 0. Safety first (do this before touching anything)
1. `git checkout redesign/v2 && git status`.
2. If there are uncommitted changes (the glass-bar fixes are probably still uncommitted), commit them as-is:
   `git add -A && git commit -m "wip(theka): glass bar — superseded by the wall"`. This keeps the glass version recoverable. The `design-v1` tag still holds the original site.
3. Confirm `wall-reference/index.html` and `wall-reference/assets/` exist (27 files: `wall.jpg`, `p01–p10.webp`, `p01–p10_sh.webp`, `back_{bone,black,cobalt}.webp`, `back_*_sh.webp`). **If they're missing, stop and tell me.** Don't invent replacements, and don't draw SVG or silhouette stand-ins.

## 1. What you're building
`wall-reference/index.html` is the **approved** home experience. **It is the spec. Port it exactly; don't redesign it.** Open it in a browser and click through it before writing code. Every number below comes from that file. If this document and the file disagree, the file wins.

It's modelled on Ascenta's "Last Dept." store:
- **The Wall:** a warm grey plaster wall lit from the top-left, with a vignette. Products sit on **clear acrylic ledges** in a grid (5 columns on desktop, 2 on mobile). Each product casts a soft shadow onto the wall, and each ledge casts one too.
- **Hover (desktop):** the ledge lights up amber (top face tinted, edge glowing, a light spill on the wall below it). The product lifts 1.5%. The bottom-right tag changes to `NO. 04 / Ek Peg Aur`.
- **Click → camera zoom:** the whole wall (the "world") scales and translates with GSAP so the chosen product fills the frame. The neighbouring products show as slivers at the screen edges. The wall background scales a little less, for depth.
- **Product view overlays** (fade in after the zoom):
  - Top-left: eyebrow `Drip Theka / 04`, the big uppercase name, the Hindi line in amber, and a one-line description.
  - Top-right: eyebrow `Pour #001 / Tees`, colourway and price, a size label and native `<select>`, an **Add to bag** pill with a dark round icon, a **Front / Back** toggle, and a **Design details** accordion.
  - Arrows at the left and right edges, and a counter at the bottom centre.
  - In the header, `Collection¹⁰` becomes `← Collection`.
- **Moving through the aisle:** arrows, ←/→ keys, mouse drag or touch swipe (>50px horizontal), or clicking a visible neighbour. The camera glides to the next product. Going from the end of row 1 drops diagonally to row 2. Esc or `← Collection` zooms back out.
- **Front / Back:** a scaleX squash flip that swaps the image and its shadow.
- **"Lights on" intro**, which replaces the old Gate: the blackout flickers off, then the fits drop onto their ledges in a stagger. Play it once per session (`sessionStorage`).
- **Mobile (≤820px):** a 2-column wall that you scroll vertically. Tapping a product zooms to it. All other products fade to 0 so only that one shows. The buy panel docks to the bottom over a dark gradient, and the arrows are hidden. Swipe left or right to move. No horizontal page scroll.

## 2. Assets — put the real images in the repo
- Copy `wall-reference/assets/*` to `public/theka/wall/`. These are real photographic product images. Use them; they are not placeholders to redraw.
- Delete the old silhouette or clip-art placeholders the glass bar used (in `public/bar/` or wherever they are), once nothing references them.

## 3. Data
Extend the product type (in `data/pour-001.ts` or wherever products live). Don't change the DB schema.
```ts
wall?: {
  front: string;        // /theka/wall/p04.webp  (trimmed transparent cutout, ~1100px tall)
  frontShadow: string;  // /theka/wall/p04_sh.webp
  back: string;         // /theka/wall/back_black.webp
  backShadow: string;   // /theka/wall/back_black_sh.webp
};
code: string;           // "04"
colourway: string;      // "Ink / Amber"
blurb: string;          // one-liner for the product view
```
- The 10 Pour #001 tees in the reference (`FITS` array: names, Hindi, colourways, blurbs) are the demo collection. Add them to the product data as tees at **₹2,499, 400 GSM, oversized**, sizes S–XXL, each with a `placeholderArt: true` flag. Parrv will swap in his own designs later; that's Prompt 2.
- **The wall shows only products that have `wall` images.** The existing hoodie, cargo, jacket and set products stay in the data, but they don't appear on the wall until they get real cutouts. Don't put tee art on a hoodie listing.
- If checkout or reservations validate slugs against Neon and reject these demo slugs, **don't touch the DB or the payment path**. The cart add still works. Note it in your report.

## 4. Components — `components/theka/wall/`
| File | Responsibility |
|---|---|
| `TheWall.tsx` (client) | State machine `mode: 'wall' \| 'zoom'`, `cur`, `side`, `busy`. Owns the `#scroller` → `#world` → items DOM and all GSAP camera tweens. |
| `wallLayout.ts` | **Pure functions**: `computeLayout(vw, vh, count)` returns positions per item, and `cameraTarget(layout, i, scrollTop)` returns `{s, x, y}`. Unit-test them (vitest, or whatever runner the repo has). |
| `WallItem.tsx` | A `<button>` with: shadow img, `Ledge`, contact shadow, fit img. `aria-label="{name} — ₹2,499"`. |
| `Ledge.tsx` | Acrylic ledge: glow, top face (clip-path trapezoid), wall shadow, edge. The `.on` state is the amber hover. |
| `ProductInfo.tsx` | Top-left block. `aria-live="polite"`. |
| `BuyPanel.tsx` | Top-right panel on desktop, bottom dock on mobile. Size select, Add to bag, Front/Back (`aria-pressed`), Design details. |
| `AisleControls.tsx` | Prev/next buttons and the counter bar. |
| `LightsOn.tsx` | The intro timeline. Skipped if already played this session, or if the user prefers reduced motion. |
| `WallHeader` | Reuse the P0 `Nav` with a `variant="wall"`, or build a header that matches the reference exactly: logo (wine-glass mark + DRIP THEKA), centre `Collection¹⁰ / ← Collection · Try the Look`, right `Bag (n)`. |

Mount it on the **home route**, replacing `TheBar`, `Gate`, `GlassUnit`, `ServePour` and `Goblet`. Delete those once nothing imports them; they live in git history now. Keep `/try-the-look` as the stub, with the header link pointing to it.

## 5. Exact numbers (copy from the reference; don't eyeball)
**Layout — desktop (>820px):** cols 5, side margin `0.075·vw`, `pitch=(vw−2·margin)/5`. Product box `h=min(0.205·vh, pitch·0.62/AR)` with `AR=0.84` and `w=h·AR`. Ledge y for row 1 = `0.545·vh`, row 2 = `0.885·vh`. The product box sits with its bottom on the ledge. Item centre for the camera: `cy = ledgeY − 0.46·h`. Intro copy at `left max(16, 0.026·vw)`, `top 0.17·vh`.
**Layout — mobile (≤820px):** cols 2, margin 16, `w=pitch·0.74`, `h=w/AR`, first ledge at `150 + h`, row gap `h + 74`. World height `150 + rows·gap + 60`. The scroller is `overflow-y:auto`.
**More than 2 desktop rows:** generalise. Row pitch = row 1→2 spacing (`0.34·vh`), and the desktop scroller becomes vertically scrollable, using the same scrollTop logic as mobile.
**Camera:** desktop `s=min(0.72·vh/h, 0.42·vw/w)` with the target centre at `(0.5·vw, 0.55·vh)`. Mobile `s=min(0.66·vw/w, 0.40·vh/h)` with the target centre at `(0.5·vw, 0.40·vh)`. `x = X − s·cx`, `y = Y − s·cy + scrollTop`. The world uses `transformOrigin: "0 0"`. The background scales to `1 + (s−1)·0.10`.
**Timings (GSAP):**
- Open: 1.35s `expo.inOut`. Overlays fade in with a 0.55s autoAlpha, 0.75s delay, 0.04 stagger.
- Next/prev: 0.95s, or 1.25s on a row jump, `expo.inOut`. Info swap: out 0.22s (y −8), then in 0.5s with a 0.45s delay.
- Close: 1.2s `expo.inOut`. On mobile, compute the new scrollTop (product centred, clamped), animate y to `oldScroll − newScroll`, then reset y to 0 and set scrollTop on completion.
- Flip: scaleX → 0 over 0.2s `power2.in`, swap the src, then → 1 over 0.38s `power3.out`, then `clearProps`.
- Mobile isolate: others go to opacity 0 over 0.5s (0.15s delay); on close, back to 1 over 0.6s.
- Lights-on: blackout flicker (0.75 / 1 / 0.35 / 0.9), then a 1.1s fade. Fits drop from y −18 and opacity 0, 0.9s `power3.out`, 0.07 stagger. **`clearProps:"transform"` afterwards**, or the CSS hover lift stops working.

## 6. Gotchas — these will bite if you skip them
1. **Image sharpness under zoom.** The zoom is a CSS transform, so `next/image` picks a srcset entry from the small *layout* size (~200px) and the product turns blurry at 3.5×. Either use `next/image` with `sizes="900px"` (and `quality={90}`), or use a plain `<img>`. Check visually that the zoomed product is crisp on a 2× screen.
2. **Don't leave `will-change: transform` on the world.** Chrome keeps the low-res raster. Let GSAP's default `force3D:"auto"` drop back to 2D at the end of a tween so it re-rasters sharply.
3. **No custom cursor on this route.** The reference uses the native pointer, like the video. Disable the P0 `Cursor` here. Also turn off the P0 `Grain` on this route; the wall texture already carries grain.
4. **Hydration.** Layout depends on `window`, so compute it in `useLayoutEffect` and render nothing visible until measured (the blackout covers this). Recompute on resize (60ms debounce). If you're zoomed when the window resizes, snap the camera to the new target without animating.
5. **Drag vs click.** A drag of more than 12px must suppress the click that follows. Ignore pointerdown that starts on the panel, the header or the arrows.
6. **Reduced motion:** every duration is 0, there's no intro and no flip squash, and everything still works.
7. Tailwind v4 syntax for custom properties: `text-(--cream)`, not `text-[--cream]`. Most of this component is easier as a CSS module copied from the reference `<style>`. That's fine, and preferred, for exactness.

## 7. Wiring
- **Add to bag** → the existing cart store `add(slug, size, 1)`. With no size chosen: the select underline turns amber, the select shakes (elastic), and a toast says "Pick a size first, regular". On success: the bag count bounces, the pill text becomes "Poured ✓", and a toast says `{name} · {size} — poured into your glass`.
- **Bag (n)** reads from the store. Clicking it opens the existing cart.
- **Deep link:** while zoomed, `history.replaceState` to `/?fit={slug}`. Loading `/?fit={slug}` skips the intro and opens zoomed on that product. This gives Parrv shareable links for Instagram now; the SSR `/product/[slug]` page comes in P2.
- Don't touch Razorpay, Neon, Drizzle, NextAuth, Klaviyo or reservations.

## 8. VERIFY (all of these, then report)
1. `pnpm dev`, then `/`: lights-on plays once; reload in the same tab and it skips.
2. Hover each ledge: amber glow, tag updates, **nothing flickers or disappears**.
3. Click → zoom framing matches the reference (product ~72% of viewport height, neighbours as edge slivers). Product is **crisp** at the end of the zoom.
4. Arrows, keys, drag and neighbour click all move along the aisle; 05→06 drops to row 2; Esc returns to the wall.
5. Front/Back flips; Design details opens and closes.
6. Add to bag with no size → nudge; with a size → the real cart increments.
7. `/?fit=ek-peg-aur` (or whatever slug you used) opens zoomed.
8. Mobile at 375×812 and 390×844: 2-col wall scrolls, tap zooms, others hidden, swipe works, `document.documentElement.scrollWidth === innerWidth`.
9. `prefers-reduced-motion`: usable, no animation.
10. `pnpm tsc --noEmit && pnpm lint && pnpm build` pass; `wallLayout` tests pass.
11. Open `wall-reference/index.html` and `localhost:3000` side by side at 1440×900 and 390×844. Screenshot both states (wall, zoomed) of each. **They should be indistinguishable apart from fonts loading.** Fix any difference by moving toward the reference.

Then move `wall-reference/` to `docs/reference/wall/` and commit:
`feat(theka): the wall — Last Dept.-style collection with camera zoom (redesign/v2)`

Report back with: files created and deleted, any deviation from the reference and why, the checkout/slug finding from §3, and the side-by-side screenshots.
