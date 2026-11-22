import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { designOf, slugsOfDesign, POUR_DESIGNS } from "./designs";
import { POUR_001 } from "@/data/pour-001";
import { POUR, capFor } from "@/lib/config";

interface DesignsJson { price_inr: number; designs: { design: string; colourways: { slug: string }[] }[] }
const json = JSON.parse(readFileSync("docs/reference/pour001/designs.json", "utf8")) as DesignsJson;

test("designs.json: 14 colourway slugs map to 7 designs, and the app's mapping is identical", () => {
  const expected = new Map<string, string>();
  for (const d of json.designs) for (const c of d.colourways) expected.set(c.slug, d.design);
  assert.equal(expected.size, 14);
  assert.equal(new Set(expected.values()).size, 7);
  for (const [slug, design] of expected) assert.equal(designOf(slug), design, slug);
  assert.deepEqual(POUR_DESIGNS.map((d) => d.id), json.designs.map((d) => d.design));
  for (const d of json.designs) assert.deepEqual(slugsOfDesign(d.design), d.colourways.map((c) => c.slug));
});

test("two colourways of Bad Influence share one glass", () => {
  assert.equal(designOf("bad-influence-ink-cobalt"), "bad-influence");
  assert.equal(designOf("bad-influence-ink-pink"), "bad-influence");
  assert.equal(designOf("nonsense"), null);
});

test("prices come from the product data (designs.json price_inr × 100), not a constant elsewhere", () => {
  for (const p of POUR_001.products.filter((x) => x.design)) assert.equal(p.price, json.price_inr * 100);
});

test("cap: 50 per design by default, overridable per design", () => {
  assert.equal(POUR.capPerDesign, 50);
  assert.equal(capFor("janwar"), 50);
  (POUR.capOverrides as Record<string, number>)["janwar"] = 80;
  try { assert.equal(capFor("janwar"), 80); assert.equal(capFor("aap-zara"), 50); }
  finally { delete (POUR.capOverrides as Record<string, number>)["janwar"]; }
});
