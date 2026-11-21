// wallLayout — pure geometry for The Wall. Every number is copied from
// pour001-reference/wall.html (layout() / target() / bgT()); no DOM, no GSAP, so it
// can be unit-tested. TheWall applies the results imperatively.
//
// Desktop: rows of 4, short rows centred (7 fits → 4 + 3). Mobile: 2 per row, the short last row
// stays LEFT-aligned — the Pour #002 teaser (wallDecor.ts) takes the free slot beside it.

/** Default aspect ratio (w/h) of a product box; a product can override it via `wall.ar`. */
export const AR = 1.0;
export const MOBILE_MAX = 820;
/** Mobile: side margin and the y where the first row's tees start (room for the neon above). */
export const MOBILE_MX = 16;
export const MOBILE_TOP = 250;

export interface Box {
  /** Horizontal centre. */
  cx: number;
  /** Ledge y — the product box sits with its bottom on this line. */
  ly: number;
  w: number;
  h: number;
  /** Camera centre: ledgeY − 0.48·h. */
  cy: number;
  /** Row index (0-based). Row jumps use this. */
  row: number;
  /** Number of fits in this item's row (short rows are centred). */
  inRow: number;
}

export interface Layout {
  items: Box[];
  mob: boolean;
  vw: number;
  vh: number;
  /** Fits per row: 4 desktop, 2 mobile. */
  cols: number;
  /** Height of #world in px. */
  worldHeight: number;
  /** True when the scroller scrolls vertically in wall mode (mobile). */
  scrollable: boolean;
  /** Intro copy position. */
  hello: { left: number; top: number };
}

export interface Camera {
  s: number;
  x: number;
  y: number;
}

/**
 * `products` is either a count (every box uses the default AR) or one aspect
 * ratio (w/h) per wall item.
 */
export function computeLayout(vw: number, vh: number, products: number | readonly number[]): Layout {
  const ars: readonly number[] =
    typeof products === "number" ? Array.from({ length: products }, () => AR) : products;
  const n = ars.length;
  const mob = vw <= MOBILE_MAX;
  const cols = mob ? 2 : 4;
  const rows = Math.max(1, Math.ceil(n / cols));
  const items: Box[] = [];

  if (!mob) {
    const mx = vw * 0.1;
    const pitch = (vw - 2 * mx) / cols;
    const ys = [vh * 0.545, vh * 0.885];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const inRow = Math.min(cols, n - r * cols);
      const ar = ars[i];
      const h = Math.min(vh * 0.215, (pitch * 0.66) / ar);
      const w = h * ar;
      const x0 = vw / 2 - (pitch * inRow) / 2;
      const ly = ys[r] ?? ys[1] + (r - 1) * vh * 0.34;
      items.push({ cx: x0 + pitch * (c + 0.5), ly, w, h, cy: ly - h * 0.48, row: r, inRow });
    }
    return {
      items, mob, vw, vh, cols,
      worldHeight: vh,
      scrollable: rows > 2,
      hello: { left: Math.max(16, vw * 0.026), top: vh * 0.17 },
    };
  }

  const mx = MOBILE_MX;
  const pitch = (vw - 2 * mx) / cols;
  const w = pitch * 0.84;
  const top = MOBILE_TOP;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const inRow = Math.min(cols, n - r * cols);
    const h = w / ars[i];
    const gap = h + 70;
    const ly = top + h + r * gap;
    items.push({ cx: mx + pitch * (c + 0.5), ly, w, h, cy: ly - h * 0.48, row: r, inRow });
  }
  const h0 = items[0]?.h ?? w / AR;
  return {
    items, mob, vw, vh, cols,
    // rows end at top + rows·gap; the rate list sits 40px below (yb), the enamel sign 190px under that,
    // and the world ends 300px under yb (wall.html layout())
    worldHeight: top + rows * (h0 + 70) + 40 + 300,
    scrollable: true,
    hello: { left: 16, top: 74 },
  };
}

/** Camera that frames item `i`; `scrollTop` is the scroller's current scroll. */
export function cameraTarget(layout: Layout, i: number, scrollTop: number): Camera {
  const it = layout.items[i];
  const { vw, vh, mob } = layout;
  let s: number, X: number, Y: number;
  if (!mob) {
    s = Math.min((vh * 0.7) / it.h, (vw * 0.4) / it.w);
    X = vw * 0.5;
    Y = vh * 0.55;
  } else {
    s = Math.min((vw * 0.8) / it.w, (vh * 0.4) / it.h);
    X = vw * 0.5;
    Y = vh * 0.4;
  }
  return { s, x: X - s * it.cx, y: Y - s * it.cy + scrollTop };
}

/** The wall background scales a little less than the world, for depth. */
export const bgScale = (cam: Camera): number => 1 + (cam.s - 1) * 0.1;

/**
 * scrollTop to land on when zooming back out: the product centred (clamped) in
 * scrollable layouts, 0 otherwise.
 */
export function scrollAfterClose(layout: Layout, i: number): number {
  if (!layout.scrollable) return 0;
  const max = Math.max(0, layout.worldHeight - layout.vh);
  return Math.min(max, Math.max(0, layout.items[i].cy - layout.vh * 0.45));
}

/** True when going from item a to item b changes row (camera takes longer). */
export const isRowJump = (layout: Layout, a: number, b: number): boolean =>
  layout.items[a].row !== layout.items[b].row;
