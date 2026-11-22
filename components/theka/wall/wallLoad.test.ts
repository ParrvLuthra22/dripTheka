// Run with:  pnpm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { ART_AT, LOAD_ALL, LOAD_HOLD, NEON_AT, loadAtTime, openGates } from "./wallLoad.ts";

test("the Entry's timeline unlocks art at the aerial (1.2s) and the neon at the street (3.8s)", () => {
  assert.deepEqual(loadAtTime(0), LOAD_HOLD);
  assert.deepEqual(loadAtTime(ART_AT - 0.01), LOAD_HOLD);
  assert.deepEqual(loadAtTime(ART_AT), { art: true, neon: false });
  assert.deepEqual(loadAtTime(NEON_AT - 0.01), { art: true, neon: false });
  assert.deepEqual(loadAtTime(NEON_AT), LOAD_ALL);
  assert.equal(ART_AT, 1.2); assert.equal(NEON_AT, 3.8);
});

test("gates only ever open (scrolling back up never re-holds), and no-ops return the same object", () => {
  const open = openGates(LOAD_HOLD, { art: true });
  assert.deepEqual(open, { art: true, neon: false });
  assert.equal(openGates(open, loadAtTime(0)), open);       // scrolled back to the sky: still open
  assert.equal(openGates(open, { art: true }), open);       // idempotent → no re-render
  assert.deepEqual(openGates(open, { neon: true }), LOAD_ALL);
  assert.equal(openGates(LOAD_HOLD, {}), LOAD_HOLD);
});
