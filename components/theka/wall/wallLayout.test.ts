// Run with:  pnpm test   (node's built-in runner — Node ≥ 22.18 strips TS types)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AR, computeLayout, cameraTarget, bgScale, scrollAfterClose, isRowJump,
} from "./wallLayout.ts";

const close = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("desktop 1440×900, 7 items: rows of 4 then 3, ledges at .545 / .885 vh", () => {
  const L = computeLayout(1440, 900, 7);
  assert.equal(L.mob, false);
  assert.equal(L.cols, 4);
  assert.equal(L.items.length, 7);
  assert.deepEqual(L.items.map((b) => b.row), [0, 0, 0, 0, 1, 1, 1]);
  assert.deepEqual(L.items.map((b) => b.inRow), [4, 4, 4, 4, 3, 3, 3]);
  close(L.items[0].ly, 900 * 0.545);
  close(L.items[4].ly, 900 * 0.885);
  // margin .1·vw = 144; pitch = (1440 − 288) / 4 = 288
  close(L.items[0].cx, 144 + 144);
  close(L.items[1].cx - L.items[0].cx, 288);
  // h = min(.215·vh, pitch·.66/ar); ar = 1
  close(L.items[0].h, Math.min(900 * 0.215, (288 * 0.66) / AR));
  close(L.items[0].w, L.items[0].h * AR);
  close(L.items[0].cy, L.items[0].ly - L.items[0].h * 0.48);
  assert.equal(L.worldHeight, 900);
  assert.equal(L.scrollable, false);
  close(L.hello.left, Math.max(16, 1440 * 0.026));
  close(L.hello.top, 900 * 0.17);
});

test("desktop: the short row is centred on the viewport", () => {
  const L = computeLayout(1440, 900, 7);
  const row = L.items.slice(4);
  close((row[0].cx + row[2].cx) / 2, 720); // 3 centred items
  close(row[1].cx, 720);
  close(row[1].cx - row[0].cx, 288);
  // the full row is centred too (its centre is the viewport centre)
  close((L.items[0].cx + L.items[3].cx) / 2, 720);
});

test("mobile 390×844, 7 items: 2 per row, last row centred, w = .84·pitch, top 150, gap h + 70", () => {
  const L = computeLayout(390, 844, 7);
  assert.equal(L.mob, true);
  assert.equal(L.cols, 2);
  const pitch = (390 - 32) / 2;
  close(L.items[0].w, pitch * 0.84);
  close(L.items[0].h, L.items[0].w / AR);
  close(L.items[0].ly, 150 + L.items[0].h);
  close(L.items[2].ly - L.items[0].ly, L.items[0].h + 70);
  assert.deepEqual(L.items.map((b) => b.row), [0, 0, 1, 1, 2, 2, 3]);
  assert.deepEqual(L.items.map((b) => b.inRow), [2, 2, 2, 2, 2, 2, 1]);
  close(L.items[0].cx, 195 - pitch / 2);
  close(L.items[1].cx, 195 + pitch / 2);
  close(L.items[6].cx, 195); // lone last item is centred
  close(L.worldHeight, 150 + 4 * (L.items[0].h + 70) + 70);
  assert.equal(L.scrollable, true);
  assert.deepEqual(L.hello, { left: 16, top: 74 });
});

test("820px is mobile, 821px is desktop", () => {
  assert.equal(computeLayout(820, 800, 4).mob, true);
  assert.equal(computeLayout(821, 800, 4).mob, false);
});

test("a per-item aspect ratio changes that box only", () => {
  const L = computeLayout(1440, 900, [1, 2, 1]);
  close(L.items[1].w, L.items[1].h * 2);
  close(L.items[0].w, L.items[0].h);
});

test("cameraTarget desktop: s = min(.70vh/h, .40vw/w), centre (.5vw, .55vh)", () => {
  const L = computeLayout(1440, 900, 7);
  const it = L.items[2];
  const c = cameraTarget(L, 2, 0);
  close(c.s, Math.min((900 * 0.7) / it.h, (1440 * 0.4) / it.w));
  close(c.x, 720 - c.s * it.cx);
  close(c.y, 900 * 0.55 - c.s * it.cy);
  // the item's centre lands on the screen point
  close(c.x + c.s * it.cx, 720);
  close(c.y + c.s * it.cy, 495);
});

test("cameraTarget mobile: s = min(.80vw/w, .40vh/h), centre (.5vw, .40vh); scrollTop shifts y", () => {
  const L = computeLayout(390, 844, 7);
  const it = L.items[3];
  const a = cameraTarget(L, 3, 0), b = cameraTarget(L, 3, 120);
  close(a.s, Math.min((390 * 0.8) / it.w, (844 * 0.4) / it.h));
  close(a.x + a.s * it.cx, 195);
  close(a.y + a.s * it.cy, 844 * 0.4);
  close(b.y - a.y, 120);
});

test("bgScale is a tenth of the world zoom", () => {
  close(bgScale({ s: 3, x: 0, y: 0 }), 1.2);
  close(bgScale({ s: 1, x: 0, y: 0 }), 1);
});

test("scrollAfterClose: 0 on desktop, the item centred (clamped) on mobile", () => {
  assert.equal(scrollAfterClose(computeLayout(1440, 900, 7), 5), 0);
  const L = computeLayout(390, 844, 7);
  const max = L.worldHeight - 844;
  close(scrollAfterClose(L, 0), Math.min(max, Math.max(0, L.items[0].cy - 844 * 0.45)));
  assert.ok(scrollAfterClose(L, 6) <= max + 1e-9);
});

test("isRowJump uses each item's row", () => {
  const L = computeLayout(1440, 900, 7);
  assert.equal(isRowJump(L, 0, 3), false);
  assert.equal(isRowJump(L, 3, 4), true);
  const M = computeLayout(390, 844, 7);
  assert.equal(isRowJump(M, 0, 1), false);
  assert.equal(isRowJump(M, 1, 2), true);
});
