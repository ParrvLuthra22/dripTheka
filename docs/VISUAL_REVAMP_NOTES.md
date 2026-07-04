# Drip Theka — Visual Revamp Notes (Fix 01–08)

This document covers all components added or modified during the 8-fix visual revamp of the Pour #001 site. For context per fix see the git log.

---

## Fix 01 — Color Rules Baseline

**Files:** `docs/COLOR_RULES.md`, `styles/globals.css`

Established and documented the three legal colour pairs:
- cream bg → ink or blue text
- cobalt bg → cream text only
- ink bg → cream text

`#CCFF00` (neon) banned everywhere except `HappyHour.tsx`. All violations swept and corrected.

---

## Fix 02 — Brand Icon System + Form Element Overrides

**Files:** `components/icons/DripHeartIcon.tsx`, `components/icons/WineGlassIcon.tsx`, form-element global overrides in `styles/globals.css`

DripHeartIcon replaces browser-default hearts on Khata toggles. WineGlassIcon used in BartendersPick founder badge. Form inputs/selects use custom `--ink` border focus ring, no browser outline.

---

## Fix 03 — Atmosphere Layer 01: Grain + SVG Stickers

**Files:** `components/ui/Grain.tsx`, `components/ui/Sticker.tsx`

`Grain` renders a full-area `<svg>` with `filter="url(#dt-grain)"`, referencing the shared filter definition in `app/(site)/layout.tsx`. Parents must be `relative`. `Sticker` wraps named variants (`freshly-poured`, `wine-glass`, etc.) with configurable size/rotate.

---

## Fix 04 — Atmosphere Layer 02: Chalk + Handwriting

**Files:** `components/ui/ChalkMark.tsx`, `components/ui/HandText.tsx`

`ChalkMark` draws SVG paths (circle, underline, cross-out, asterisk) animated via Framer Motion `pathLength`. `HandText` renders scanned-handwriting text in the Caveat font, optionally animated via `TypeOnScroll`. Both accept `color`, `rotate`, and `className`.

---

## Fix 05 — Atmosphere Layer 03: Global Foam System

**Files:** `lib/store/foam.ts`, `components/ui/Foam.tsx`

Zustand store gatekeeps bubble count (5 desktop / 3 mobile). `Foam.tsx` subscribes and renders bubbles with rise + drift + 5% pop animation. Blocked on `/login`, `/account`, `/legal`. Respects `prefers-reduced-motion`.

---

## Fix 06 — Rebuild UpsellModal

**Files:** `components/ui/UpsellModal.tsx`, `data/copy.ts`

Full rebuild. Internal `UpsellCard` component with:
- Two cross-fading `ProductIllustration` layers for colour-flip on hover (avoids SVG CSS transition limitation)
- `isLightGarment` check prevents cream-on-cream invisibility
- `mt-8` clearance for BottleCap 32px overhang below card face
- PriceTag at -6deg with visible string
- BottleCap stickers at card corners
- DripHeart khata toggle

Modal shell:
- Backdrop 200ms, panel scale+fade 450ms, sticker spring 150ms after
- ChalkMark underline draw-in on headline
- Focus trap filters `aria-hidden="true"` and `offsetParent === null` elements
- Footer CTAs: `flex-col-reverse sm:flex-row` keeps tab order correct while SETTLE appears above on mobile

Added copy key: `beforeYouBounce`.

---

## Fix 07 — Product Sidebar Redesign

**Files:** `components/sections/product/ProductSidebar.tsx`, `components/ui/FabricChip.tsx`, `components/sections/product/MobileStickyAddBar.tsx`, `components/ui/PriceTag.tsx`, `data/copy.ts`

ProductSidebar rebuilt with 10 content sections:
1. Eyebrow: `ThekaLabel k="pour001"` + vol number from `id.split("-").pop()`
2. `NameWithUnderline` — ChalkMark under the garment-type word
3. PriceTag at -6deg
4. FabricChip colour selector (new component)
5. Size selector (BottleCap grid) with `ThekaLabel k="sizeSelector"`
6. Colour selector with `ThekaLabel k="colorSelector"`
7. Liquid-fill CTA: "ONE ROUND, PLEASE · ₹X,XXX" with `foam.spawn(3)` on add
8. IntersectionObserver sentinel drives `<MobileStickyAddBar visible={!ctaVisible} />`

`FabricChip`: 56×72px swatch, cobalt inset ring when active via `box-shadow` (no layout shift). `MobileStickyAddBar`: fixed bottom bar with safe-area padding, slides up from below.

`PriceTag` string: extended to `M -13 -18 C -4 -10 6 0 19 17` with `overflow="visible"` on SVG + knot circle at string end.

Added copy keys: `sizeSelector`, `colorSelector`.

---

## Fix 08 — Final Density, Rhythm, Full-Site Audit

### Part B — Rotation/Tilt Pass

**`components/sections/BartendersPick.tsx`**
- Added `transform: "rotate(-3deg)"` to the featured `motion.div` wrapper. The card now sits at a lazy tilt by default, consistent with the hangtag / PriceTag tilt language across the site.

### Part C — Card Density

**`components/ui/ProductCard.tsx`**
- Added `slugHash(slug)` — deterministic hash → integer 3–47. Pure function, no side effects.
- Added "available in N sizes · in M glasses" mono row below product name. N = live available-size count; M = slugHash. Always visible (0 sizes shown for tapped-out = informative, not broken).
- Added foam-on-hover with 800ms cooldown on the quick-add button. Uses `useFoamStore.spawn` at button center with `count: 1`.

**Known gap — UpsellCard:** The `UpsellCard` inside `UpsellModal.tsx` doesn't yet have the density row. Deferred to V1.1 — the modal is compact and the row would make it crowded without a layout rework.

### Part D — Atmospheric Coverage

Pages that were missing atmosphere primitives, now patched:

| Page | Added |
|------|-------|
| `/building` | `<Grain opacity={0.04} />` + `<HandText>` footer annotation |
| `/khata` | `<Grain opacity={0.04} />` |
| `/checkout` | `<Grain opacity={0.04} />` |
| `/checkout/success` | `<Grain opacity={0.035} />` |

All four outer containers now have `relative` so the Grain `absolute inset-0` positions correctly.

**Exempted pages (no atmosphere added):** `/login`, `/account`, `/legal/[doc]` — functional-only pages where atmospheric decoration would be noise.

**Remaining gaps (V1.1 targets):**
- `/building/[slug]` (individual post pages) — no Grain or ChalkMark
- `/pour/[slug]` sections already have atmosphere via PourHeroStrip + FillBar; no action needed
- Sticker per-page requirement not met on `/khata`, `/checkout`, `/building` — adding Sticker to transactional pages feels gratuitous; revisit in V1.1 with a specific placement concept
- Foam on non-transactional pages (building, khata) intentionally skipped — no natural interaction surface for it

### Parts E–H — Browser/DevTools Audits

These require live browser inspection and are not automatable from code:

**Part E — Mobile 375px audit:** Run at 375×667 in DevTools. Check: nav collapse, ProductCard 2-col grid, MobileStickyAddBar safe-area, UpsellModal full-screen.

**Part F — Reduced motion audit:** Enable `prefers-reduced-motion: reduce` in OS or DevTools. Verify: Foam no-ops, ChalkMark draw-in skipped, Reveal fades only (no y-translate), TypeOnScroll shows full text immediately.

**Part G — Contrast sweep:** Run Lighthouse accessibility → check all text/bg pairs. Known risk: `text-[--ink]/28` in the new density row — if below 4.5:1 on cream, bump to `/40`.

**Part H — Brand vibe check:** No actionable code changes flagged in prior review.

---

## Component inventory (new components added across all fixes)

| Component | File | Purpose |
|-----------|------|---------|
| `Grain` | `components/ui/Grain.tsx` | Full-area noise overlay |
| `Sticker` | `components/ui/Sticker.tsx` | Named SVG sticker variants |
| `ChalkMark` | `components/ui/ChalkMark.tsx` | Animated chalk-path decorations |
| `HandText` | `components/ui/HandText.tsx` | Handwritten-style annotation text |
| `Foam` / `useFoamStore` | `components/ui/Foam.tsx`, `lib/store/foam.ts` | Global bubble system |
| `FabricChip` | `components/ui/FabricChip.tsx` | Colour swatch for product sidebar |
| `MobileStickyAddBar` | `components/sections/product/MobileStickyAddBar.tsx` | Persistent mobile CTA |

---

## V1.1 todo list

- [ ] Add density row + ThekaLabel to `UpsellCard` in `UpsellModal.tsx`
- [ ] Atmosphere pass on `/building/[slug]` post pages
- [ ] Sticker placements on `/khata` and `/checkout` (need design decision)
- [ ] Reduced-motion audit: verify `Reveal` and `TypeOnScroll` correctly no-op
- [ ] Contrast audit: `text-[--ink]/28` density row may need bump to `/40`
- [ ] Section eyebrow tilt: `-1.5deg` on `CurrentlyPouring`, `JoinRegulars`, other section headers
- [ ] Happy Hour page: only page where `#CCFF00` neon is permitted — ensure it's still isolated

---

*Last updated: Pour #001 V1 launch prep — all 8 fixes applied.*
