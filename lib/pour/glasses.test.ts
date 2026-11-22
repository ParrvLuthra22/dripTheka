import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { POUR } from "@/lib/config";
import { createReservation } from "@/lib/reservations/create";
import { markDepositPaid } from "@/lib/payments/settle";
import { seedReservation, reservationInput } from "@/lib/test/fixtures";
import { glassState, getGlasses } from "./glasses";
import { POUR_DESIGNS } from "./designs";

before(resetDb);
beforeEach(async () => { await db.execute(sql`TRUNCATE reservations, payment_events, pour_progress, pour_designs, ops_alerts CASCADE`); });

const route = async (pourId = "001") => {
  const { GET } = await import("@/app/api/pour/[pourId]/glasses/route");
  return GET(new Request(`http://localhost/api/pour/${pourId}/glasses`), { params: Promise.resolve({ pourId }) });
};
type Body = { pourId: string; closesAt: string; glasses: { design: string; cap: number; poured: number; left: number; state: string }[] };
const janwar = async () => ((await (await route()).json()) as Body).glasses.find((g) => g.design === "janwar")!;

test("config: cap 50, last call at 90%", () => { assert.equal(POUR.capPerDesign, 50); assert.equal(POUR.lastCallAt, 0.9); });

test("glassState: open below 90%, last from 90%, tapped at cap or when the row is tapped/refilling", () => {
  assert.equal(glassState(0, 50), "open");
  assert.equal(glassState(44, 50), "open");
  assert.equal(glassState(45, 50), "last");
  assert.equal(glassState(49, 50), "last");
  assert.equal(glassState(50, 50), "tapped");
  assert.equal(glassState(51, 50), "tapped");
  assert.equal(glassState(10, 50, "tapped"), "tapped");
  assert.equal(glassState(10, 50, "refilling"), "tapped");
  assert.equal(glassState(0, 0), "tapped");
});

test("route: 0 of 50 → open, nothing poured, 50 left", async () => {
  const g = await janwar();
  assert.deepEqual(g, { design: "janwar", cap: 50, poured: 0, left: 50, state: "open" });
});

test("route: 44 of 50 → open (88%)", async () => {
  await seedReservation({ slug: "janwar-ink", qty: 44, status: "deposit_paid" });
  assert.deepEqual(await janwar(), { design: "janwar", cap: 50, poured: 44, left: 6, state: "open" });
});

test("route: 45 of 50 → last (90%)", async () => {
  await seedReservation({ slug: "janwar-ink", qty: 45, status: "deposit_paid" });
  assert.deepEqual(await janwar(), { design: "janwar", cap: 50, poured: 45, left: 5, state: "last" });
});

test("route: 50 of 50 → tapped, nothing left", async () => {
  await seedReservation({ slug: "janwar-ink", qty: 50, status: "deposit_paid" });
  assert.deepEqual(await janwar(), { design: "janwar", cap: 50, poured: 50, left: 0, state: "tapped" });
});

test("both colourways pour into the same glass; pending holds reduce `left` but not `poured`", async () => {
  await seedReservation({ slug: "janwar-ink",  qty: 20, status: "deposit_paid" });
  await seedReservation({ slug: "janwar-bone", qty: 15, status: "deposit_paid" });
  await seedReservation({ slug: "janwar-bone", qty: 5,  status: "pending" });              // fresh hold
  await seedReservation({ slug: "janwar-bone", qty: 9,  status: "pending", ageMinutes: 99 }); // expired — ignored
  assert.deepEqual(await janwar(), { design: "janwar", cap: 50, poured: 35, left: 10, state: "open" });
});

test("route: tapping through real payments flips the glass to tapped", async () => {
  const r = await createReservation(reservationInput("janwar-bone", 50));
  assert.equal((await janwar()).state, "open");
  await db.transaction((tx) => markDepositPaid(tx, r.reservationId, "pay_full"));
  assert.equal((await janwar()).state, "tapped");
});

test("route: one entry per wall design (7), shape + 30s CDN cache + closesAt", async () => {
  const res = await route();
  assert.equal(res.status, 200);
  assert.match(res.headers.get("cache-control") ?? "", /s-maxage=30/);
  const body = (await res.json()) as Body;
  assert.equal(body.closesAt, POUR.closesAt);
  assert.equal(body.glasses.length, 7);
  assert.deepEqual(body.glasses.map((g) => g.design), POUR_DESIGNS.map((d) => d.id));
  for (const g of body.glasses) assert.deepEqual(Object.keys(g).sort(), ["cap", "design", "left", "poured", "state"]);
  assert.deepEqual((await getGlasses()).map((g) => g.design), body.glasses.map((g) => g.design));
});

test("route: unknown pour → 404", async () => { assert.equal((await route("999")).status, 404); });

test("route: database unavailable → 503, uncached, no invented numbers", async () => {
  await db.execute(sql`ALTER TABLE pour_designs RENAME TO pour_designs_gone`);
  try {
    const res = await route();
    assert.equal(res.status, 503);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.deepEqual(await res.json(), { error: "unavailable" });
  } finally {
    await db.execute(sql`ALTER TABLE pour_designs_gone RENAME TO pour_designs`);
  }
});
