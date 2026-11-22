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
  /**
   * One per fit: the box of its ledge glass (wall.html `.lg`: right of the tee, 15% × 27% of the tee's box), or null
   * when no clear spot exists (the glass is then simply not drawn). It never overlaps another fit's lamp cone, the
   * rate list, the teaser, the enamel sign, the neon, the story row or another tee. Where the reference's cones
   * would cover it (phones: a cone is 1.9 tees wide on a 1.2-tee pitch) the neighbouring CONE is narrowed instead.
   */
  glasses: ({ left: number; top: number; width: number; height: number } | null)[];
  /** Estimated painted boxes of the dressing (neon, enamel, rate, teaser, story row) — for overlap checks only. */
  rects: {
    neon: Rect; enamel: Rect; rate: Rect; teaser: Rect | null; storyRow: Rect | null;
    glasses: (Rect | null)[];
    /** The cones' bounding boxes as laid out (after any narrowing). */
    cones: Rect[];
  };
}

/** logo_neon.png is 1200 × 416. */
export const NEON_AR = 1200 / 416;
/** Painted size of the lamp body (.lampfx). */
export const LAMP = { w: 30, h: 15 };
/** Estimated sizes of the text-driven pieces (padding + type in wall.html), used for `rects` only. */
export const ENAMEL_EST = { w: 236, h: 64 };
export const RATE_EST_H = 145;
/**
 * The ledge glass, as fractions of its tee's box — wall.html `.lg { right:-12%; bottom:0; width:15%; height:27% }`.
 * `ownOverlap`: how far it may slide back over its own tee's box to find a clear spot; `minScale`: how much narrower
 * than the reference it may get; `minCone`: a cone is never narrowed below this many tee-widths (it must still light its tee).
 */
export const GLASS = { w: 0.15, h: 0.27, overhang: 0.12, ownOverlap: 0.08, minScale: 0.6, minCone: 1.2 };
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
  const rects = {
    neon: { x: neon.cx - neon.w / 2, y: neon.cy - neon.h / 2, w: neon.w, h: neon.h },
    enamel: { x: enamel.left, y: enamel.top, w: ew, h: ENAMEL_EST.h },
    rate: { x: rate.left, y: rate.top, w: rate.width, h: RATE_EST_H },
    teaser: teaser && { x: teaser.left, y: teaser.top, w: teaser.width, h: teaser.height },
    storyRow: storyRow && { x: storyRow.left, y: storyRow.top, w: storyRow.width, h: storyRow.height },
  };

  const glasses = placeGlasses(items, cones, [rects.neon, rects.enamel, rects.rate, rects.teaser, rects.storyRow], vw);

  return {
    neon, enamel, rate, teaser, lamps, cones, storyRow, glasses,
    rects: {
      glasses: glasses.map((g) => g && { x: g.left, y: g.top, w: g.width, h: g.height }),
      cones: cones.map((c) => ({ x: c.left, y: c.top, w: c.width, h: c.height })),
      neon: rects.neon, enamel: rects.enamel, rate: rects.rate, teaser: rects.teaser, storyRow: rects.storyRow,
    },
  };
}

const hit = (a: Rect, b: Rect) => a.x < b.x + b.w - 1e-6 && b.x < a.x + a.w - 1e-6 && a.y < b.y + b.h - 1e-6 && b.y < a.y + a.h - 1e-6;

/**
 * Glass i sits right of tee i. Preference order: the reference spot → slid back over its own tee (≤ ownOverlap) →
 * narrower (≥ minScale). The first spot that clears every blocker AND every other fit's cone wins; if none does, take
 * the first one that clears the hard blockers and narrow the cones it touches (never below minCone tee-widths); if
 * even that fails the glass is dropped (null) rather than drawn on top of something.
 * Mutates `cones` (narrowing is symmetric about the lamp, so the cone keeps its shape).
 */
function placeGlasses(items: Layout["items"], cones: Decor["cones"], fixed: (Rect | null)[], vw: number): Decor["glasses"] {
  const hard = fixed.filter((r): r is Rect => !!r);
  const tee = (b: Layout["items"][number]): Rect => ({ x: b.cx - b.w / 2, y: b.ly - b.h, w: b.w, h: b.h });
  const coneBox = (c: Decor["cones"][number]): Rect => ({ x: c.left, y: c.top, w: c.width, h: c.height });
  const tees = items.map(tee);

  /** Cones narrowed so none of them covers `r` (symmetric about their lamp), or null if one would get too thin. */
  const narrowed = (r: Rect, i: number): Decor["cones"] | null => {
    const next = cones.map((c) => ({ ...c }));
    for (let j = 0; j < next.length; j++) {
      const c = next[j];
      if (j === i || !hit(r, coneBox(c))) continue;
      const cx = c.left + c.width / 2;
      const half = r.x + r.w <= cx ? cx - (r.x + r.w) : r.x - cx;
      if (half < items[j].w * GLASS.minCone / 2) return null;
      c.left = cx - half; c.width = half * 2;
    }
    return next;
  };

  /** First spot (reference → slid back → narrower) that clears the hard blockers and the other tees, and passes `accept`. */
  const find = (i: number, accept: (r: Rect) => boolean): Rect | null => {
    const b = items[i];
    const gh = b.h * GLASS.h, top = b.ly - gh;
    const right0 = b.cx + b.w / 2 + b.w * GLASS.overhang;
    const minLeft = b.cx + b.w / 2 - b.w * GLASS.ownOverlap;
    for (const scale of [1, 0.9, 0.8, 0.7, GLASS.minScale]) {
      const gw = b.w * GLASS.w * scale;
      for (let right = right0; right - gw >= minLeft - 1e-9; right -= 1) {
        const r: Rect = { x: right - gw, y: top, w: gw, h: gh };
        if (r.x < 0 || r.x + r.w > vw) continue;
        if (hard.some((h) => hit(r, h))) continue;
        if (tees.some((t, j) => j !== i && hit(r, t))) continue;
        if (accept(r)) return r;
      }
    }
    return null;
  };

  const out: Decor["glasses"] = [];
  items.forEach((_, i) => {
    // 1) a spot no cone covers; 2) else a spot whose covering cones can be narrowed (they are, in place)
    let r = find(i, (g) => !cones.some((c, j) => j !== i && hit(g, coneBox(c))));
    if (!r) {
      r = find(i, (g) => narrowed(g, i) !== null);
      const next = r && narrowed(r, i);
      if (next) next.forEach((c, j) => { cones[j].left = c.left; cones[j].width = c.width; });
    }
    out.push(r && { left: r.x, top: r.y, width: r.w, height: r.h });
  });
  return out;
}
