// Run with:  npm test   (node's built-in runner — Node ≥ 22.18 strips TS types)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AR, computeLayout, cameraTarget, bgScale, scrollAfterClose, isRowJump,
} from "./wallLayout.ts";

const close = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("desktop 1440×900: 5 columns, two ledge rows at .545 / .885 vh", () => {
  const L = computeLayout(1440, 900, 10);
  assert.equal(L.mob, false);
  assert.equal(L.cols, 5);
  assert.equal(L.items.length, 10);
  close(L.items[0].ly, 900 * 0.545);
  close(L.items[5].ly, 900 * 0.885);
  assert.equal(L.items[4].ly, L.items[0].ly);
  // pitch = (1440 − 2·108) / 5 = 244.8; first centre = 108 + 122.4
  close(L.items[0].cx, 230.4);
  close(L.items[1].cx - L.items[0].cx, 244.8);
  // h = min(.205·900, 244.8·.62/AR)
  close(L.items[0].h, Math.min(900 * 0.205, (244.8 * 0.62) / AR));
  close(L.items[0].w, L.items[0].h * AR);
  close(L.items[0].cy, L.items[0].ly - L.items[0].h * 0.46);
  assert.equal(L.worldHeight, 900);
  assert.equal(L.scrollable, false);
  close(L.hello.left, Math.max(16, 1440 * 0.026));
  close(L.hello.top, 900 * 0.17);
});

test("desktop >2 rows generalises: same row pitch, scrollable world", () => {
  const L = computeLayout(1440, 900, 12);
  const pitch = 900 * 0.34;
  close(L.items[10].ly - L.items[5].ly, pitch);
  assert.equal(L.scrollable, true);
  assert.ok(L.worldHeight > 900);
  close(L.worldHeight, L.items[10].ly + 900 * 0.115);
});

test("mobile 375×812: 2 columns, 150px lead-in, row gap = h + 74", () => {
  const L = computeLayout(375, 812, 10);
  assert.equal(L.mob, true);
  assert.equal(L.cols, 2);
  const pitch = (375 - 32) / 2;
  close(L.items[0].w, pitch * 0.74);
  close(L.items[0].h, L.items[0].w / AR);
  close(L.items[0].ly, 150 + L.items[0].h);
  close(L.items[2].ly - L.items[0].ly, L.items[0].h + 74);
  close(L.items[0].cx, 16 + pitch * 0.5);
  close(L.items[1].cx, 16 + pitch * 1.5);
  close(L.worldHeight, 150 + 5 * (L.items[0].h + 74) + 60); // 10 items → 5 rows
  assert.equal(L.scrollable, true);
  assert.deepEqual(L.hello, { left: 16, top: 74 });
});

test("820px is mobile, 821px is desktop", () => {
  assert.equal(computeLayout(820, 800, 4).mob, true);
  assert.equal(computeLayout(821, 800, 4).mob, false);
});

test("desktop camera: ~72% of viewport height, centred at (.5vw, .55vh)", () => {
  const L = computeLayout(1440, 900, 10);
  const it = L.items[3];
  const cam = cameraTarget(L, 3, 0);
  close(cam.s, Math.min((900 * 0.72) / it.h, (1440 * 0.42) / it.w));
  // screen position of the item centre after the camera = target point
  close(cam.x + cam.s * it.cx, 1440 * 0.5);
  close(cam.y + cam.s * it.cy, 900 * 0.55);
  // product fills ~72% of the viewport height when height-limited
  assert.ok(cam.s * it.h <= 900 * 0.72 + 1e-6);
});

test("mobile camera: centre at (.5vw, .40vh); scrollTop is added to y", () => {
  const L = computeLayout(375, 812, 10);
  const it = L.items[5];
  const cam0 = cameraTarget(L, 5, 0);
  const cam1 = cameraTarget(L, 5, 120);
  close(cam0.s, Math.min((375 * 0.66) / it.w, (812 * 0.4) / it.h));
  close(cam0.x + cam0.s * it.cx, 375 * 0.5);
  close(cam0.y + cam0.s * it.cy, 812 * 0.4);
  close(cam1.y - cam0.y, 120);
  assert.equal(cam1.x, cam0.x);
});

test("background scales a tenth as much as the world", () => {
  close(bgScale({ s: 3.5, x: 0, y: 0 }), 1 + 2.5 * 0.1);
  close(bgScale({ s: 1, x: 0, y: 0 }), 1);
});

test("scrollAfterClose: 0 on a fixed desktop wall, centred+clamped when scrollable", () => {
  assert.equal(scrollAfterClose(computeLayout(1440, 900, 10), 7), 0);
  const M = computeLayout(375, 812, 10);
  const max = M.worldHeight - 812;
  assert.equal(scrollAfterClose(M, 0), 0); // clamped to the top
  assert.equal(scrollAfterClose(M, 9), Math.min(max, M.items[9].cy - 812 * 0.45));
  close(scrollAfterClose(M, 4), M.items[4].cy - 812 * 0.45);
});

test("row jump: 05→06 on desktop drops to row 2; neighbours in a row do not", () => {
  const L = computeLayout(1440, 900, 10);
  assert.equal(isRowJump(L, 4, 5), true);
  assert.equal(isRowJump(L, 5, 4), true);
  assert.equal(isRowJump(L, 1, 2), false);
  assert.equal(isRowJump(L, 9, 0), true); // wrap-around
});
