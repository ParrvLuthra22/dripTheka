// Run with:  pnpm test   (node's built-in runner — Node ≥ 22.18 strips TS types)
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLayout } from "./wallLayout.ts";
import { computeDecor, LAMP, NEON_AR, type Rect } from "./wallDecor.ts";

const close = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const SIZES: [number, number][] = [[1440, 900], [1280, 720], [390, 844]];

test("mobile: the short last row stays left-aligned (col 0), full rows keep both columns", () => {
  const L = computeLayout(390, 844, 7);
  const pitch = (390 - 32) / 2;
  assert.deepEqual(L.items.map((b) => b.row), [0, 0, 1, 1, 2, 2, 3]);
  close(L.items[6].cx, 16 + pitch / 2);
  close(L.items[6].cx, L.items[4].cx);
  close(L.items[0].ly, 250 + L.items[0].h);
});

test("mobile: the teaser takes the free slot beside the last tee (col 1 of the last row)", () => {
  const L = computeLayout(390, 844, 7);
  const D = computeDecor(L, 390, 844);
  const t = D.teaser!;
  assert.ok(t);
  const last = L.items[6], prev = L.items[5];
  close(t.left + t.width / 2, prev.cx);          // same column as the tee above-left of it
  close(t.top + t.height, last.ly);              // same ledge line as the last tee
  close(t.width, last.w);
  close(t.height, last.h);
  assert.ok(!hit(D.rects.teaser!, { x: last.cx - last.w / 2, y: last.ly - last.h, w: last.w, h: last.h }));
});

test("mobile: no free slot → no teaser (full rows)", () => {
  assert.equal(computeDecor(computeLayout(390, 844, 8), 390, 844).teaser, null);
});

test("desktop: rate list and teaser sit in row 2's outer slots (50vw ∓ 2·pitch), a tee wide", () => {
  const L = computeLayout(1440, 900, 7);
  const D = computeDecor(L, 1440, 900);
  const pitch = 288, it = L.items[0];
  close(D.rate.left + D.rate.width / 2, 720 - 2 * pitch);
  close(D.rate.width, Math.min(pitch * 0.82, 250));
  close(D.rate.top, 900 * 0.885 - it.h * 0.92);
  const t = D.teaser!;
  close(t.left + t.width / 2, 720 + 2 * pitch);
  close(t.width, it.w);
  close(t.top + t.height, 900 * 0.885);
});

test("neon, enamel, lamps, cones: reference numbers", () => {
  const L = computeLayout(1440, 900, 7);
  const D = computeDecor(L, 1440, 900);
  close(D.neon.cx, 720); close(D.neon.cy, 180); close(D.neon.w, Math.min(1440 * 0.22, 900 * 0.4));
  close(D.neon.h, D.neon.w / NEON_AR);
  close(D.enamel.left, 1440 * 0.79); close(D.enamel.top, 900 * 0.15);
  // row 1 lamps hang from the ceiling (0.085vh, 400px stem); row 2 from under row 1's ledge (0.545vh + 22, 18px stem)
  close(D.lamps[0].top, 900 * 0.085); assert.equal(D.lamps[0].stem, 400);
  close(D.lamps[4].top, 900 * 0.545 + 22); assert.equal(D.lamps[4].stem, 18);
  close(D.lamps[2].x, L.items[2].cx);
  // cone: a 1.9·w trapezoid from the lamp to the ledge
  const c = D.cones[0], it = L.items[0];
  close(c.width, it.w * 1.9); close(c.left, it.cx - it.w * 0.95);
  close(c.top, D.lamps[0].top + 12); close(c.height, it.ly - D.lamps[0].top - 8);
  // mobile
  const M = computeLayout(390, 844, 7), MD = computeDecor(M, 390, 844);
  close(MD.lamps[0].top, M.items[0].ly - M.items[0].h - 46); assert.equal(MD.lamps[0].stem, 400);
  assert.equal(MD.lamps[2].stem, 24);
  close(MD.neon.cy, 182); close(MD.neon.w, Math.min(390 * 0.62, 300));
  const yb = 250 + 4 * (M.items[0].h + 70) + 40;
  close(MD.rate.top, yb); close(MD.rate.width, 240); close(MD.rate.left, 195 - 120);
  close(MD.enamel.top, yb + 190); close(MD.enamel.width!, 250);
  close(M.worldHeight, yb + 300);
});

for (const [vw, vh] of SIZES) {
  test(`nothing overlaps the tees at ${vw}×${vh}`, () => {
    const L = computeLayout(vw, vh, 7);
    const D = computeDecor(L, vw, vh);
    const tees: Rect[] = L.items.map((b) => ({ x: b.cx - b.w / 2, y: b.ly - b.h, w: b.w, h: b.h }));
    const pieces: [string, Rect | null][] = [
      ["neon", D.rects.neon], ["enamel", D.rects.enamel], ["rate list", D.rects.rate], ["teaser", D.rects.teaser],
      ...D.lamps.map((l, i): [string, Rect] => [`lamp ${i}`, { x: l.x - LAMP.w / 2, y: l.top, w: LAMP.w, h: LAMP.h }]),
    ];
    for (const [name, r] of pieces) {
      if (!r) continue;
      tees.forEach((t, i) => assert.ok(!hit(r, t), `${name} overlaps tee ${i} at ${vw}×${vh}`));
    }
    // and the dressing stays inside the world
    const worldW = vw;
    for (const [name, r] of pieces) if (r) assert.ok(r.x >= 0 && r.x + r.w <= worldW + 0.5, `${name} leaves the wall horizontally`);
  });
}
