// entryCamera — pure geometry for the Entry's camera. Every number is copied from
// pour001-reference/index.html (cover / place / duckZ). No DOM, no GSAP, so it can be
// unit-tested like wallLayout.

/** Scene (image) space the aerial and the street are authored in. */
export const IW = 1536;
export const IH = 864;
export const MOBILE_MAX = 820;

/** Zoom anchors: the lane's glow (aerial) and the shop's doorway centre (street). */
export const AERIAL_ANCHOR = { fx: 785, fy: 330 } as const;
export const STREET_ANCHOR = { fx: 904, fy: 488 } as const;

/** The doorway hole in store_cut.webp, scene space. */
export const DOORWAY = { x1: 694, y1: 240, x2: 1114, y2: 736 } as const;

export interface Base { s: number; x: number; y: number }
/** z: zoom · (fx, fy): the anchor in scene space · k: 0 = the anchor stays put on screen, 1 = it has glided to the screen centre. */
export interface Cam { z: number; fx: number; fy: number; k: number }
export interface Placed { s: number; tx: number; ty: number; px: number; py: number }

/** Cover-fit the 1536×864 scene to the viewport, centred on (fx, fy), clamped to the edges. */
export function cover(fx: number, fy: number, vw: number, vh: number): Base {
  const s = Math.max(vw / IW, vh / IH);
  let x = vw / 2 - fx * s;
  let y = vh / 2 - fy * s;
  x = Math.min(0, Math.max(vw - IW * s, x));
  y = Math.min(0, Math.max(vh - IH * s, y));
  return { s, x, y };
}

/** Aerial base: cover on the lane's glow (a touch lower on phones). */
export function aerialBase(vw: number, vh: number): Base {
  return cover(AERIAL_ANCHOR.fx, vw <= MOBILE_MAX ? 420 : 400, vw, vh);
}

/** Street base. Desktop: cover. Mobile special case: fit the sign, doorway lower-middle. */
export function streetBase(vw: number, vh: number): Base {
  if (vw <= MOBILE_MAX) {
    const s = vw / 560;
    return { s, x: vw / 2 - 938 * s, y: Math.max(60, vh * 0.44 - 450 * s) };
  }
  return cover(880, 450, vw, vh);
}

/**
 * Zoom about the anchor (fx, fy). The anchor sits where the base put it (p0), moved toward the
 * screen centre by k: p = p0 + (centre − p0)·k. (k = 0 → classic pinned zoom.)
 */
export function camTransform(b: Base, c: Cam, vw: number, vh: number): Placed {
  const px0 = b.x + c.fx * b.s;
  const py0 = b.y + c.fy * b.s;
  const px = px0 + (vw / 2 - px0) * c.k;
  const py = py0 + (vh / 2 - py0) * c.k;
  const s = b.s * c.z;
  return { s, tx: px - c.fx * s, ty: py - c.fy * s, px, py };
}

export const cssTransform = (p: Placed) => `translate3d(${p.tx}px,${p.ty}px,0) scale(${p.s})`;

/**
 * Ducking under the half-raised shutter: the gap (scene y 488 → 736, 210 either side of the anchor's x)
 * is centred on screen and must cover it — 210 across, 112 above and 122 below the centre line.
 */
export function duckZ(b: Base, vw: number, vh: number): number {
  return (Math.max(vw / 2 / 210, vh / 2 / 112, vh / 2 / 122) / b.s) * 1.04;
}

/** The scene-y the anchor glides to while ducking (the middle of the 488 → 736 gap). */
export const DUCK_FY = 612;

/**
 * Evenodd clip-path for the mobile letterbox backdrop: the whole viewport (with a
 * 50px bleed) minus the doorway rect in screen space, so the Wall shows through.
 * The backdrop element is inset −40px, hence the +40 offset (as in the reference).
 */
export function doorwayHoleClip(s: Placed, vw: number, vh: number): string {
  const x1 = s.tx + DOORWAY.x1 * s.s + 40;
  const y1 = s.ty + DOORWAY.y1 * s.s + 40;
  const x2 = s.tx + DOORWAY.x2 * s.s + 40;
  const y2 = s.ty + DOORWAY.y2 * s.s + 40;
  return `polygon(evenodd,-50px -50px,${vw + 100}px -50px,${vw + 100}px ${vh + 100}px,-50px ${vh + 100}px,-50px -50px,${x1}px ${y1}px,${x2}px ${y1}px,${x2}px ${y2}px,${x1}px ${y2}px,${x1}px ${y1}px)`;
}
