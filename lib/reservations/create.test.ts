import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { createReservation } from "./create";
import { seedReservation, reservationInput } from "@/lib/test/fixtures";

before(resetDb);
beforeEach(async () => { await db.execute(sql`TRUNCATE reservations, payment_events, pour_progress, pour_designs, ops_alerts CASCADE`); });

const input = (slug: string, qty = 1, email = "x@example.com") => reservationInput(slug, qty, email);

// ── order numbers ─────────────────────────────────────────────────────────

test("order number collision: retries with a fresh number instead of failing", async () => {
  await seedReservation({ orderNumber: "DT-COLLIDEME1" });
  const seq = ["DT-COLLIDEME1", "DT-COLLIDEME1", "DT-FRESHNUMBR2"];
  let calls = 0;
  const res = await createReservation(input("oc"), { seedCap: () => 10, generateOrderNumber: () => seq[calls++] });
  assert.equal(res.orderNumber, "DT-FRESHNUMBR2");
  assert.equal(calls, 3);
  const { rows } = await db.execute(sql`SELECT count(*)::int AS n FROM reservations WHERE order_number = 'DT-COLLIDEME1'`);
  assert.equal((rows[0] as { n: number }).n, 1);
});

test("order number collision: gives up with an error (and writes nothing) if it can never get a unique number", async () => {
  await seedReservation({ orderNumber: "DT-ALWAYSTAKEN" });
  await assert.rejects(
    createReservation(input("oc2"), { seedCap: () => 10, generateOrderNumber: () => "DT-ALWAYSTAKEN", maxOrderNumberAttempts: 3 }),
    /unique order number/,
  );
  const { rows } = await db.execute(sql`SELECT count(*)::int AS n FROM reservation_items WHERE product_slug = 'oc2'`);
  assert.equal((rows[0] as { n: number }).n, 0);
});

test("DB enforces unique order numbers", async () => {
  await seedReservation({ orderNumber: "DT-UNIQUECHECK" });
  await assert.rejects(seedReservation({ orderNumber: "DT-UNIQUECHECK" }));
});
