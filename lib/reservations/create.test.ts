import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { createReservation, type CreateReservationInput } from "./create";
import { TappedOutError } from "./capacity";
import { seedReservation } from "@/lib/test/fixtures";

before(resetDb);
beforeEach(async () => { await db.execute(sql`TRUNCATE reservations, payment_events, pour_progress CASCADE`); });

const input = (slug: string, qty = 1, email = "x@example.com"): CreateReservationInput => ({
  userId: null, email, name: "Test Buyer", phone: "9876543210",
  address: { line1: "12 Test Street", city: "Delhi", state: "Delhi", pincode: "110001" },
  lines: [{ productSlug: slug, productName: "Tee", size: "M", qty, unitPricePaise: 129900, lineTotalPaise: 129900 * qty }],
  subtotalPaise: 129900 * qty, depositPaise: Math.round(129900 * qty * 0.3), balancePaise: 129900 * qty - Math.round(129900 * qty * 0.3),
});

// ── capacity ──────────────────────────────────────────────────────────────

test("capacity race: two buyers for the last slot — exactly one wins, the other gets tapped_out", async () => {
  for (let round = 0; round < 8; round++) {
    const slug = `race-${round}`;
    const opts = { capacityOf: () => 1 };
    const [a, b] = await Promise.allSettled([
      createReservation(input(slug, 1, "a@example.com"), opts),
      createReservation(input(slug, 1, "b@example.com"), opts),
    ]);
    const won  = [a, b].filter((x) => x.status === "fulfilled");
    const lost = [a, b].filter((x) => x.status === "rejected") as PromiseRejectedResult[];
    assert.equal(won.length, 1, `round ${round}: expected one winner`);
    assert.equal(lost.length, 1);
    assert.ok(lost[0].reason instanceof TappedOutError);
    assert.equal((lost[0].reason as TappedOutError).slug, slug);
  }
});

test("capacity: many concurrent buyers never exceed capacity", async () => {
  const slug = "burst";
  const results = await Promise.allSettled(
    Array.from({ length: 12 }, (_, i) => createReservation(input(slug, 1, `u${i}@example.com`), { capacityOf: () => 5 })),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 5);
});

test("capacity: a request bigger than what's left is refused whole", async () => {
  await seedReservation({ slug: "s1", qty: 4, status: "deposit_paid" });
  await assert.rejects(createReservation(input("s1", 2), { capacityOf: () => 5 }), TappedOutError);
  await createReservation(input("s1", 1), { capacityOf: () => 5 }); // exactly the last unit is fine
});

test("capacity counts deposit_paid and FRESH pending only; stale pending, failed, cancelled, refunded don't hold a slot", async () => {
  const slug = "holds";
  await seedReservation({ slug, qty: 1, status: "pending", ageMinutes: 31 });  // expired hold
  await seedReservation({ slug, qty: 1, status: "failed" });
  await seedReservation({ slug, qty: 1, status: "cancelled" });
  await seedReservation({ slug, qty: 1, status: "refunded" });
  await createReservation(input(slug, 1), { capacityOf: () => 1 });            // slot was free → ok

  await assert.rejects(createReservation(input(slug, 1), { capacityOf: () => 1 }), TappedOutError); // now held by a fresh pending

  const s2 = "holds-2";
  await seedReservation({ slug: s2, qty: 1, status: "pending", ageMinutes: 29 }); // still held
  await assert.rejects(createReservation(input(s2, 1), { capacityOf: () => 1 }), TappedOutError);
  const s3 = "holds-3";
  await seedReservation({ slug: s3, qty: 1, status: "deposit_paid", ageMinutes: 600 }); // paid never expires
  await assert.rejects(createReservation(input(s3, 1), { capacityOf: () => 1 }), TappedOutError);
});

test("capacity is per colourway: a full slug doesn't block another", async () => {
  await seedReservation({ slug: "full", qty: 1, status: "deposit_paid" });
  await assert.rejects(createReservation(input("full"), { capacityOf: () => 1 }), TappedOutError);
  await createReservation(input("other"), { capacityOf: () => 1 });
});

// ── order numbers ─────────────────────────────────────────────────────────

test("order number collision: retries with a fresh number instead of failing", async () => {
  await seedReservation({ orderNumber: "DT-2026-COLLIDEME1" });
  const seq = ["DT-2026-COLLIDEME1", "DT-2026-COLLIDEME1", "DT-2026-FRESHNUMBR2"];
  let calls = 0;
  const res = await createReservation(input("oc"), { capacityOf: () => 10, generateOrderNumber: () => seq[calls++] });
  assert.equal(res.orderNumber, "DT-2026-FRESHNUMBR2");
  assert.equal(calls, 3);
  const { rows } = await db.execute(sql`SELECT count(*)::int AS n FROM reservations WHERE order_number = 'DT-2026-COLLIDEME1'`);
  assert.equal((rows[0] as { n: number }).n, 1);
});

test("order number collision: gives up with an error (and writes nothing) if it can never get a unique number", async () => {
  await seedReservation({ orderNumber: "DT-2026-ALWAYSTAKEN" });
  await assert.rejects(
    createReservation(input("oc2"), { capacityOf: () => 10, generateOrderNumber: () => "DT-2026-ALWAYSTAKEN", maxOrderNumberAttempts: 3 }),
    /unique order number/,
  );
  const { rows } = await db.execute(sql`SELECT count(*)::int AS n FROM reservation_items WHERE product_slug = 'oc2'`);
  assert.equal((rows[0] as { n: number }).n, 0);
});

test("DB enforces unique order numbers", async () => {
  await seedReservation({ orderNumber: "DT-2026-UNIQUECHECK" });
  await assert.rejects(seedReservation({ orderNumber: "DT-2026-UNIQUECHECK" }));
});
