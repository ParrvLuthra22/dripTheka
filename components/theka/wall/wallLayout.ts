// wallLayout — pure geometry for The Wall. Every number is copied from
// wall-reference/index.html (layout() / target() / bgT()); no DOM, no GSAP, so it
// can be unit-tested. TheWall applies the results imperatively.

/** Aspect ratio (w/h) of a product box. */
export const AR = 0.84;
export const MOBILE_MAX = 820;

export interface Box {
  /** Horizontal centre. */
  cx: number;
  /** Ledge y — the product box sits with its bottom on this line. */
  ly: number;
  w: number;
  h: number;
  /** Camera centre: ledgeY − 0.46·h. */
  cy: number;
}

export interface Layout {
  items: Box[];
  mob: boolean;
  vw: number;
  vh: number;
  cols: number;
  /** Height of #world in px. */
  worldHeight: number;
  /** True when the scroller scrolls vertically in wall mode (mobile, or >2 desktop rows). */
  scrollable: boolean;
  /** Intro copy position. */
  hello: { left: number; top: number };
}

export interface Camera {
  s: number;
  x: number;
  y: number;
}

export function computeLayout(vw: number, vh: number, count: number): Layout {
  const mob = vw <= MOBILE_MAX;
  const items: Box[] = [];

  if (!mob) {
    const cols = 5;
    const mx = vw * 0.075;
    const pitch = (vw - 2 * mx) / cols;
    const h = Math.min(vh * 0.205, (pitch * 0.62) / AR);
    const w = h * AR;
    // rows 1 / 2 sit at .545 / .885 of the viewport; further rows keep the same pitch
    const rowY = (r: number) => vh * 0.545 + r * vh * 0.34;
    for (let i = 0; i < count; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      const ly = rowY(r);
      items.push({ cx: mx + pitch * (c + 0.5), ly, w, h, cy: ly - h * 0.46 });
    }
    const rows = Math.max(1, Math.ceil(count / cols));
    const scrollable = rows > 2;
    return {
      items, mob, vw, vh, cols,
      worldHeight: scrollable ? rowY(rows - 1) + vh * 0.115 : vh,
      scrollable,
      hello: { left: Math.max(16, vw * 0.026), top: vh * 0.17 },
    };
  }

  const cols = 2;
  const mx = 16;
  const pitch = (vw - 2 * mx) / cols;
  const w = pitch * 0.74;
  const h = w / AR;
  const top = 150;
  const gap = h + 74;
  for (let i = 0; i < count; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const ly = top + h + r * gap;
    items.push({ cx: mx + pitch * (c + 0.5), ly, w, h, cy: ly - h * 0.46 });
  }
  const rows = Math.max(1, Math.ceil(count / cols));
  return {
    items, mob, vw, vh, cols,
    worldHeight: top + rows * gap + 60,
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
    s = Math.min((vh * 0.72) / it.h, (vw * 0.42) / it.w);
    X = vw * 0.5;
    Y = vh * 0.55;
  } else {
    s = Math.min((vw * 0.66) / it.w, (vh * 0.4) / it.h);
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
  Math.floor(a / layout.cols) !== Math.floor(b / layout.cols);
