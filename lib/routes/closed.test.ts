import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as config from "@/lib/config";
import { POUR, isPourClosed } from "@/lib/config";

const realNow = Date.now;
afterEach(() => { Date.now = realNow; });
const at = (iso: string) => { Date.now = () => Date.parse(iso); };

const body = JSON.stringify({
  email: "a@example.com", name: "Test Buyer", phone: "9876543210",
  address: { line1: "12 Test Street", city: "Delhi", state: "Delhi", pincode: "110001" },
  items: [{ slug: "janwar-ink", size: "M", qty: 1 }],
});
const post = async () => {
  const { POST } = await import("@/app/api/reserve/route");
  return POST(new Request("http://localhost/api/reserve", { method: "POST", body }));
};

test("config: POUR is the single source; DROP_DATE and the old per-colourway constants are gone", () => {
  assert.equal(POUR.id, "001");
  assert.equal(POUR.depositPct, 0.3);
  assert.equal(POUR.holdMinutes, 30);
  assert.equal(POUR.lastCallAt, 0.9);
  assert.deepEqual(POUR.balance, { online: true, cod: true });
  for (const gone of ["DROP_DATE", "DEFAULT_COLOURWAY_CAPACITY", "PENDING_HOLD_MINUTES", "POUR_SLUG"]) {
    assert.equal(gone in config, false, gone);
  }
});

test("isPourClosed flips exactly at closesAt", () => {
  const t = Date.parse(POUR.closesAt);
  assert.equal(isPourClosed(t - 1), false);
  assert.equal(isPourClosed(t), true);
});

test("reserve after closesAt → 410 { code: POUR_CLOSED }", async () => {
  at("2026-12-03T00:00:00+05:30");
  const res = await post();
  assert.equal(res.status, 410);
  assert.equal(((await res.json()) as { code: string }).code, "POUR_CLOSED");
});

test("reserve before closesAt is not blocked by the gate", async () => {
  at("2026-12-02T23:58:00+05:30");
  const res = await post();
  assert.notEqual(res.status, 410); // no DB in this test → 503, but never 410
});
