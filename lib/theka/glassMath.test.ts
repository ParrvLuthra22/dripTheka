import { test } from "node:test";
import assert from "node:assert/strict";
import { fillFraction, formatCloseDate, ledgeLabel, liquidColour, parseGlasses, type GlassInfo } from "./glassMath.ts";

const g = (over: Partial<GlassInfo> = {}): GlassInfo => ({ design: "janwar", cap: 50, poured: 18, left: 32, state: "open", ...over });
const T = { poured: (p: number, c: number) => `${p}/${c} poured`, lastCall: (l: number) => `LAST CALL · ${l} left`, tapped: "TAPPED OUT" };

test("parseGlasses accepts the API shape and keys by design", () => {
  const m = parseGlasses({ pourId: "001", closesAt: "x", glasses: [g(), g({ design: "no-smoking", poured: 45, left: 5, state: "last" })] })!;
  assert.deepEqual([...m.keys()], ["janwar", "no-smoking"]);
  assert.equal(m.get("no-smoking")!.state, "last");
});

test("parseGlasses refuses anything off-shape — the UI then shows no glass at all", () => {
  for (const bad of [null, undefined, "x", {}, { glasses: [] }, { glasses: "no" }, { glasses: [null] },
    { glasses: [g({ cap: 0 })] }, { glasses: [g({ poured: -1 })] }, { glasses: [g({ left: NaN })] },
    { glasses: [{ ...g(), state: "full" }] }, { glasses: [{ ...g(), design: "" }] }, { glasses: [{ ...g(), cap: "50" }] }]) {
    assert.equal(parseGlasses(bad), null, JSON.stringify(bad));
  }
});

test("liquid height is poured/cap, clamped", () => {
  assert.equal(fillFraction(g()), 18 / 50);
  assert.equal(fillFraction(g({ poured: 50 })), 1);
  assert.equal(fillFraction(g({ poured: 60 })), 1);
  assert.equal(fillFraction(g({ poured: 0 })), 0);
});

test("liquid is cobalt, amber once the state is last", () => {
  assert.equal(liquidColour("open"), "#2f6bd6");
  assert.equal(liquidColour("last"), "#F4A52C");
  assert.equal(liquidColour("tapped"), "#2f6bd6");
});

test("label: n/cap on hover only; LAST CALL and TAPPED OUT always", () => {
  assert.deepEqual(ledgeLabel(g(), T), { text: "18/50 poured", always: false });
  assert.deepEqual(ledgeLabel(g({ state: "last", poured: 46, left: 4 }), T), { text: "LAST CALL · 4 left", always: true });
  assert.deepEqual(ledgeLabel(g({ state: "tapped", poured: 50, left: 0 }), T), { text: "TAPPED OUT", always: true });
});

test("close date is read in IST: 2026-12-02T23:59+05:30 is '2 Dec' everywhere", () => {
  assert.equal(formatCloseDate("2026-12-02T23:59:00+05:30"), "2 Dec");
  assert.equal(formatCloseDate("2026-12-02T00:30:00+05:30"), "2 Dec"); // 1 Dec in UTC — still the 2nd in Delhi
});
