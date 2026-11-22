// One glass per design: colourways of a design share capacity.
import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { opsAlerts, pourDesigns } from "@/lib/db/schema";
import { POUR } from "@/lib/config";
import { createReservation } from "./create";
import { TappedOutError } from "./capacity";
import { markDepositPaid, markRefunded } from "@/lib/payments/settle";
import { seedReservation, statusOf, reservationInput as input, cartInput } from "@/lib/test/fixtures";

before(resetDb);
beforeEach(async () => { await db.execute(sql`TRUNCATE reservations, payment_events, pour_progress, pour_designs, ops_alerts CASCADE`); });

// Bad Influence: ONE glass, two colourways.
const COBALT = "bad-influence-ink-cobalt";
const PINK   = "bad-influence-ink-pink";
const DESIGN = "bad-influence";
const cap = (n: number) => ({ seedCap: () => n });

const glass = async (design = DESIGN) => {
  const [row] = await db.select().from(pourDesigns).where(eq(pourDesigns.designId, design));
  return row;
};
const pay = (id: string, p = `pay_${id.slice(0, 8)}`) => db.transaction((tx) => markDepositPaid(tx, id, p));

// ── colourways share the glass ────────────────────────────────────────────

test("two colourways of one design racing for the LAST slot: exactly one wins, the other is tapped out", async () => {
  for (let round = 0; round < 10; round++) {
    await db.execute(sql`TRUNCATE reservations, pour_designs CASCADE`);
    const [a, b] = await Promise.allSettled([
      createReservation(input(COBALT, 1, "a@example.com"), cap(1)),
      createReservation(input(PINK,   1, "b@example.com"), cap(1)),
    ]);
    const lost = [a, b].filter((x) => x.status === "rejected") as PromiseRejectedResult[];
    assert.equal([a, b].filter((x) => x.status === "fulfilled").length, 1, `round ${round}: one winner`);
    assert.equal(lost.length, 1);
    assert.ok(lost[0].reason instanceof TappedOutError);
    assert.equal((lost[0].reason as TappedOutError).design, DESIGN);
  }
});

test("a burst split across both colourways never exceeds the design's cap", async () => {
  const results = await Promise.allSettled(
    Array.from({ length: 14 }, (_, i) => createReservation(input(i % 2 ? PINK : COBALT, 1, `u${i}@example.com`), cap(5))),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 5);
  assert.equal(results.filter((r) => r.status === "rejected").length, 9);
});

test("colourway A filling the glass blocks colourway B, but not another design", async () => {
  await createReservation(input(COBALT, 1), cap(1));
  await assert.rejects(createReservation(input(PINK, 1, "p@example.com"), cap(1)), TappedOutError);
  await createReservation(input("janwar-ink", 1, "j@example.com"), cap(1)); // different glass
});

test("one cart mixing both colourways counts as ONE glass: 2 + 2 against a cap of 3 is refused whole", async () => {
  await assert.rejects(createReservation(cartInput([[COBALT, 2], [PINK, 2]]), cap(3)), TappedOutError);
  const { rows } = await db.execute(sql`SELECT count(*)::int AS n FROM reservations`);
  assert.equal((rows[0] as { n: number }).n, 0);
  await createReservation(cartInput([[COBALT, 2], [PINK, 1]]), cap(3));
});

test("a request bigger than what's left is refused; exactly the last unit is fine", async () => {
  await seedReservation({ slug: COBALT, qty: 4, status: "deposit_paid" });
  await assert.rejects(createReservation(input(PINK, 2), cap(5)), TappedOutError);
  await createReservation(input(PINK, 1), cap(5));
});

test("holds: deposit_paid and FRESH pending count; stale pending, failed, cancelled, refunded don't", async () => {
  await seedReservation({ slug: COBALT, qty: 1, status: "pending", ageMinutes: POUR.holdMinutes + 1 });
  await seedReservation({ slug: PINK,   qty: 1, status: "failed" });
  await seedReservation({ slug: COBALT, qty: 1, status: "cancelled" });
  await seedReservation({ slug: PINK,   qty: 1, status: "refunded" });
  await createReservation(input(COBALT, 1), cap(1));                                          // slot was free
  await assert.rejects(createReservation(input(PINK, 1), cap(1)), TappedOutError);            // now held (by the OTHER colourway)

  await db.execute(sql`TRUNCATE reservations, pour_designs CASCADE`);
  await seedReservation({ slug: PINK, qty: 1, status: "pending", ageMinutes: POUR.holdMinutes - 1 });
  await assert.rejects(createReservation(input(COBALT, 1), cap(1)), TappedOutError);          // still held

  await db.execute(sql`TRUNCATE reservations, pour_designs CASCADE`);
  await seedReservation({ slug: PINK, qty: 1, status: "deposit_paid", ageMinutes: 600 });
  await assert.rejects(createReservation(input(COBALT, 1), cap(1)), TappedOutError);          // paid never expires
});

// ── cap config + status ───────────────────────────────────────────────────

test("cap is seeded from config (50) and a per-design override is honoured", async () => {
  await createReservation(input("janwar-ink"));
  assert.equal((await glass("janwar")).cap, POUR.capPerDesign);
  assert.equal(POUR.capPerDesign, 50);

  (POUR.capOverrides as Record<string, number>)["aap-zara"] = 7;
  try {
    await createReservation(input("aap-zara-ink"));
    assert.equal((await glass("aap-zara")).cap, 7);
  } finally { delete (POUR.capOverrides as Record<string, number>)["aap-zara"]; }
});

test("an existing row's cap is the authority: config changes don't rewrite it", async () => {
  await createReservation(input(COBALT), cap(3));
  await createReservation(input(PINK), cap(99));
  assert.equal((await glass()).cap, 3);
});

test("status 'tapped' or 'refilling' closes the glass even with units free", async () => {
  await createReservation(input(COBALT), cap(10));
  for (const status of ["tapped", "refilling"] as const) {
    await db.update(pourDesigns).set({ status }).where(eq(pourDesigns.designId, DESIGN));
    await assert.rejects(createReservation(input(PINK), cap(10)), TappedOutError, status);
  }
  await db.update(pourDesigns).set({ status: "open" }).where(eq(pourDesigns.designId, DESIGN));
  await createReservation(input(PINK), cap(10));
});

test("carts touching several designs in opposite orders never deadlock", async () => {
  const results = await Promise.allSettled(
    Array.from({ length: 16 }, (_, i) =>
      createReservation(cartInput(i % 2 ? [[COBALT, 1], ["janwar-ink", 1]] : [["janwar-bone", 1], [PINK, 1]], `m${i}@example.com`), cap(100))),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 16);
});

// ── tapping, overfill, refund ─────────────────────────────────────────────

test("when PAID quantity reaches the cap the glass is tapped (not before)", async () => {
  const a = await createReservation(input(COBALT, 2, "a@example.com"), cap(3));
  const b = await createReservation(input(PINK,   1, "b@example.com"), cap(3));
  await pay(a.reservationId);
  assert.equal((await glass()).status, "open");            // 2 of 3
  await pay(b.reservationId);
  assert.equal((await glass()).status, "tapped");          // 3 of 3, across two colourways
});

test("a pending hold alone does not tap the glass", async () => {
  await createReservation(input(COBALT, 3), cap(3));
  assert.equal((await glass()).status, "open");
});

test("a payment landing AFTER its hold expired is still recorded as paid; if it overfills, ops_alerts + error log", async () => {
  const slow = await createReservation(input(COBALT, 1, "slow@example.com"), cap(1));
  await db.execute(sql`UPDATE reservations SET created_at = now() - make_interval(mins => ${POUR.holdMinutes + 5}) WHERE id = ${slow.reservationId}`);
  const fast = await createReservation(input(PINK, 1, "fast@example.com"), cap(1)); // hold expired → slot was free
  await pay(fast.reservationId);
  assert.equal((await glass()).status, "tapped");
  assert.equal((await db.select().from(opsAlerts)).length, 0);

  const err = mock.method(console, "error", () => {});
  try {
    assert.equal(await pay(slow.reservationId, "pay_late"), true);                  // money is never discarded
  } finally { err.mock.restore(); }

  assert.equal(await statusOf(slow.reservationId), "deposit_paid");
  const alerts = await db.select().from(opsAlerts);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].kind, "overfill");
  assert.equal(alerts[0].designId, DESIGN);
  assert.equal(alerts[0].reservationId, slow.reservationId);
  assert.deepEqual(alerts[0].detail, { cap: 1, paid: 2, over: 1 });
  assert.equal(alerts[0].resolvedAt, null);
  assert.ok(err.mock.calls.some((c) => String(c.arguments[0]).includes("OVERFILL")), "logged at error level");
  assert.equal((await glass()).status, "tapped");
});

test("replaying the late payment doesn't duplicate the alert", async () => {
  const slow = await createReservation(input(COBALT, 1, "slow@example.com"), cap(1));
  await db.execute(sql`UPDATE reservations SET created_at = now() - make_interval(mins => 99) WHERE id = ${slow.reservationId}`);
  const fast = await createReservation(input(PINK, 1, "fast@example.com"), cap(1));
  await pay(fast.reservationId);
  const err = mock.method(console, "error", () => {});
  try { await pay(slow.reservationId); await pay(slow.reservationId, "pay_again"); } finally { err.mock.restore(); }
  assert.equal((await db.select().from(opsAlerts)).length, 1);
});

test("a full refund of a paid unit reopens a tapped glass that now has room", async () => {
  const a = await createReservation(input(COBALT, 1), cap(1));
  await pay(a.reservationId);
  assert.equal((await glass()).status, "tapped");
  await db.transaction((tx) => markRefunded(tx, a.reservationId));
  assert.equal((await glass()).status, "open");
  await createReservation(input(PINK, 1, "again@example.com"), cap(1));
});
