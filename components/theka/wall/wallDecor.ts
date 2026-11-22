// wallDecor — pure geometry for what hangs on The Wall besides the tees: the neon wordmark,
// the enamel sign, the rate-list board, the Pour #002 teaser, one lamp + light cone per fit.
// Every number is copied from story-wall-reference/wall.html (layout()); no DOM, no GSAP, so it
// can be unit-tested. TheWall applies the results imperatively (wallDecorDom.ts), inside #world,
// so the dressing moves with the camera zoom exactly like the tees.

import { MOBILE_MX, MOBILE_TOP, type Layout } from "./wallLayout.ts";

export interface Rect { x: number; y: number; w: number; h: number }

export interface Decor {
  /** Neon wordmark, anchored by its centre. `h` follows the logo's aspect (1200 × 416). */
  neon: { cx: number; cy: number; w: number; h: number };
  /** Enamel sign. `width` null = shrink-wrap (desktop). */
  enamel: { left: number; top: number; width: number | null };
  rate: { left: number; top: number; width: number };
  /** Pour #002 ledge. null = no free slot (mobile with full rows): hide it. */
  teaser: { left: number; top: number; width: number; height: number } | null;
  /** One per fit: lamp body centre-x / top, and the stem length above it. */
  lamps: { x: number; top: number; stem: number }[];
  cones: { left: number; top: number; width: number; height: number }[];
  /** Mobile only: the in-flow "Our story ↓" row under the enamel sign (desktop keeps the fixed link). */
  storyRow: { left: number; top: number; width: number; height: number } | null;
  /** Estimated painted boxes of the dressing (neon, enamel, rate, teaser, story row) — for overlap checks only. */
  rects: { neon: Rect; enamel: Rect; rate: Rect; teaser: Rect | null; storyRow: Rect | null };
}

/** logo_neon.png is 1200 × 416. */
export const NEON_AR = 1200 / 416;
/** Painted size of the lamp body (.lampfx). */
export const LAMP = { w: 30, h: 15 };
/** Estimated sizes of the text-driven pieces (padding + type in wall.html), used for `rects` only. */
export const ENAMEL_EST = { w: 236, h: 64 };
export const RATE_EST_H = 145;
/** Mobile story row: gap under the enamel sign, and its height (a comfortable tap target). */
export const STORY_ROW = { gap: 28, h: 56, maxW: 320 };

export function computeDecor(layout: Layout, vw: number, vh: number): Decor {
  const { items, mob, cols } = layout;
  const n = items.length;
  const rows = Math.max(1, Math.ceil(n / cols));
  const first = items[0];

  let neon: Decor["neon"], enamel: Decor["enamel"], rate: Decor["rate"], teaser: Decor["teaser"];
  let storyRow: Decor["storyRow"] = null;

  if (!mob) {
    const mx = vw * 0.1;
    const pitch = (vw - 2 * mx) / cols;
    const ly1 = vh * 0.885;
    const w = first?.w ?? 0, h = first?.h ?? 0;
    const nw = Math.min(vw * 0.22, vh * 0.4);
    neon = { cx: vw / 2, cy: vh * 0.2, w: nw, h: nw / NEON_AR };
    enamel = { left: vw * 0.79, top: vh * 0.15, width: null };
    // row 2's outer slots: the rate list on the left, the teaser (a tee-sized ledge) on the right
    teaser = { left: vw / 2 + pitch * 2 - w / 2, top: ly1 - h, width: w, height: h };
    const bw = Math.min(pitch * 0.82, 250);
    rate = { left: vw / 2 - pitch * 2 - bw / 2, top: ly1 - h * 0.92, width: bw };
  } else {
    const mx = MOBILE_MX;
    const pitch = (vw - 2 * mx) / cols;
    const w = first?.w ?? 0, h = first?.h ?? 0;
    const gap = h + 70;
    const nw = Math.min(vw * 0.62, 300);
    neon = { cx: vw / 2, cy: 182, w: nw, h: nw / NEON_AR };
    // the short last row stays left; the teaser takes the free slot
    const free = n % cols !== 0;
    teaser = free ? { left: mx + pitch * 1.5 - w / 2, top: MOBILE_TOP + (rows - 1) * gap, width: w, height: h } : null;
    const yb = MOBILE_TOP + rows * gap + 40;
    rate = { left: vw / 2 - 120, top: yb, width: 240 };
    enamel = { left: vw / 2 - 125, top: yb + 190, width: 250 };
    const sw = Math.min(vw - 2 * mx, STORY_ROW.maxW);
    storyRow = { left: vw / 2 - sw / 2, top: enamel.top + ENAMEL_EST.h + STORY_ROW.gap, width: sw, height: STORY_ROW.h };
  }

  const lamps: Decor["lamps"] = [];
  const cones: Decor["cones"] = [];
  for (const it of items) {
    const lt = mob ? it.ly - it.h - 46 : it.row ? vh * 0.545 + 22 : vh * 0.085;
    // Lower rows hang from the ledge above. On phones the first row has no ledge above it and a 400px
    // cord would cross the neon, so it hangs from just above its tee on the same short 24px cord.
    const stem = mob ? 24 : it.row ? 18 : 400;
    lamps.push({ x: it.cx, top: lt, stem });
    cones.push({ left: it.cx - it.w * 0.95, top: lt + 12, width: it.w * 1.9, height: it.ly - lt - 8 });
  }

  const ew = enamel.width ?? ENAMEL_EST.w;
  return {
    neon, enamel, rate, teaser, lamps, cones, storyRow,
    rects: {
      neon: { x: neon.cx - neon.w / 2, y: neon.cy - neon.h / 2, w: neon.w, h: neon.h },
      enamel: { x: enamel.left, y: enamel.top, w: ew, h: ENAMEL_EST.h },
      rate: { x: rate.left, y: rate.top, w: rate.width, h: RATE_EST_H },
      teaser: teaser && { x: teaser.left, y: teaser.top, w: teaser.width, h: teaser.height },
      storyRow: storyRow && { x: storyRow.left, y: storyRow.top, w: storyRow.width, h: storyRow.height },
    },
  };
}
