// Run with:  npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cover, aerialBase, streetBase, camTransform, duckZ, DUCK_FY, doorwayHoleClip, cssTransform,
} from "./entryCamera.ts";

const close = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("cover 1440×900: scale from height, x clamped into the image", () => {
  const b = cover(880, 450, 1440, 900);
  close(b.s, Math.max(1440 / 1536, 900 / 864));
  close(b.y, 0); // image is exactly as tall as the cover scale needs → clamped
  assert.ok(b.x <= 0 && b.x >= 1440 - 1536 * b.s);
});

test("cover never reveals past the image edges", () => {
  for (const [vw, vh] of [[1440, 900], [1920, 1080], [2560, 1000], [390, 844]]) {
    const b = cover(785, 400, vw, vh);
    assert.ok(b.x <= 1e-9 && b.x >= vw - 1536 * b.s - 1e-9);
    assert.ok(b.y <= 1e-9 && b.y >= vh - 864 * b.s - 1e-9);
  }
});

test("streetBase mobile special case: s = vw/560, x = vw/2 − 938s, y = max(60, .44vh − 450s)", () => {
  const b = streetBase(390, 844);
  close(b.s, 390 / 560);
  close(b.x, 195 - 938 * (390 / 560));
  close(b.y, Math.max(60, 844 * 0.44 - 450 * (390 / 560)));
  assert.equal(b.y >= 60, true);
});

test("streetBase desktop is cover(880,450)", () => {
  assert.deepEqual(streetBase(1440, 900), cover(880, 450, 1440, 900));
});

test("aerialBase uses fy 420 on mobile, 400 on desktop", () => {
  assert.deepEqual(aerialBase(390, 844), cover(785, 420, 390, 844));
  assert.deepEqual(aerialBase(1440, 900), cover(785, 400, 1440, 900));
});

test("camTransform with k = 0 keeps the anchor pinned on screen at any zoom", () => {
  const b = streetBase(1440, 900);
  for (const z of [1, 1.14, 1.2, 3]) {
    const p = camTransform(b, { z, fx: 904, fy: 488, k: 0 }, 1440, 900);
    close(p.tx + 904 * p.s, p.px);
    close(p.ty + 488 * p.s, p.py);
    close(p.s, b.s * z);
    close(p.px, b.x + 904 * b.s);
    close(p.py, b.y + 488 * b.s);
  }
});

test("camTransform moves the anchor toward the screen centre by k: p = p0 + (centre − p0)·k", () => {
  for (const [vw, vh] of [[1440, 900], [390, 844]]) {
    const b = streetBase(vw, vh);
    const p0 = camTransform(b, { z: 1, fx: 904, fy: 488, k: 0 }, vw, vh);
    for (const k of [0.25, 0.5, 1]) {
      const p = camTransform(b, { z: 1.3, fx: 904, fy: 488, k }, vw, vh);
      close(p.px, p0.px + (vw / 2 - p0.px) * k);
      close(p.py, p0.py + (vh / 2 - p0.py) * k);
      // the anchor is still pinned to (px, py) in screen space
      close(p.tx + 904 * p.s, p.px);
      close(p.ty + 488 * p.s, p.py);
    }
    const c = camTransform(b, { z: 2, fx: 904, fy: 488, k: 1 }, vw, vh);
    close(c.px, vw / 2);
    close(c.py, vh / 2);
  }
});

test("k = 1 with fy = 612 puts scene (904, 612) — the middle of the gap — dead centre", () => {
  for (const [vw, vh] of [[1440, 900], [390, 844]]) {
    const b = streetBase(vw, vh);
    const p = camTransform(b, { z: duckZ(b, vw, vh), fx: 904, fy: DUCK_FY, k: 1 }, vw, vh);
    close(p.tx + 904 * p.s, vw / 2);
    close(p.ty + 612 * p.s, vh / 2);
  }
});

test("zoom only grows: the camera never zooms out", () => {
  const b = streetBase(1440, 900);
  let prev = 0;
  for (const z of [1, 1.05, 1.14, 1.2, duckZ(b, 1440, 900)]) {
    const p = camTransform(b, { z, fx: 904, fy: 488, k: 0 }, 1440, 900);
    assert.ok(p.s > prev);
    prev = p.s;
  }
});

test("duckZ = max(vw/2/210, vh/2/112, vh/2/122) / base.s · 1.04", () => {
  for (const [vw, vh] of [[1440, 900], [1920, 1080], [390, 844]]) {
    const b = streetBase(vw, vh);
    close(duckZ(b, vw, vh), (Math.max(vw / 2 / 210, vh / 2 / 112, vh / 2 / 122) / b.s) * 1.04);
    assert.ok(duckZ(b, vw, vh) > 1.2, "ducking must go past the 1.2 hold");
  }
});

test("duckZ: the gap under the half-raised shutter covers the screen", () => {
  for (const [vw, vh] of [[1440, 900], [1920, 1080], [390, 844], [2560, 1000]]) {
    const b = streetBase(vw, vh);
    const p = camTransform(b, { z: duckZ(b, vw, vh), fx: 904, fy: DUCK_FY, k: 1 }, vw, vh);
    assert.ok(p.px - 210 * p.s <= 1e-6, "left edge covered");
    assert.ok(p.px + 210 * p.s >= vw - 1e-6, "right edge covered");
    // the gap is scene y 488 → 736 (124 either side of 612); the shutter edge sits on the top 488 line
    assert.ok(p.py - 124 * p.s <= 1e-6, "top edge covered");
    assert.ok(p.py + 124 * p.s >= vh - 1e-6, "bottom edge covered");
  }
});

test("doorwayHoleClip is an evenodd polygon with the hole 40px-offset", () => {
  const p = camTransform(streetBase(390, 844), { z: 1, fx: 904, fy: 488, k: 0 }, 390, 844);
  const c = doorwayHoleClip(p, 390, 844);
  assert.ok(c.startsWith("polygon(evenodd,-50px -50px,490px -50px,490px 944px,-50px 944px,-50px -50px,"));
  assert.ok(c.includes(`${p.tx + 694 * p.s + 40}px ${p.ty + 240 * p.s + 40}px`));
});

test("cssTransform is translate3d + scale (never a filter)", () => {
  const t = cssTransform({ s: 2, tx: 1, ty: 2, px: 0, py: 0 });
  assert.equal(t, "translate3d(1px,2px,0) scale(2)");
});
