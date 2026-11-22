import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { regulars, referrals, referralRedemptions, users } from "@/lib/db/schema";
import { checkReferral } from "./check";
import { markDepositPaid } from "@/lib/payments/settle";
import { seedReservation } from "@/lib/test/fixtures";

before(resetDb);
beforeEach(async () => {
  await db.execute(sql`TRUNCATE reservations, referrals, regulars, users, payment_events, pour_progress CASCADE`);
  await db.insert(regulars).values({ email: "owner@example.com", name: "Owner", city: "Delhi", referralCode: "OWNERCDE" });
  await db.insert(referrals).values({ code: "OWNERCDE", ownerEmail: "owner@example.com" });
});

const buyer = (o: Partial<{ email: string; phone: string; userId: string | null }> = {}) =>
  ({ email: "friend@example.com", phone: "9123456789", userId: null, ...o });

test("a friend can use someone else's code", async () => {
  assert.deepEqual(await checkReferral(db, "ownercde", buyer()), { ok: true, code: "OWNERCDE" });
});

test("unknown codes are refused", async () => {
  assert.deepEqual(await checkReferral(db, "NOPENOPE", buyer()), { ok: false, reason: "unknown_code" });
});

test("self-referral is blocked by email (any case / spacing)", async () => {
  assert.deepEqual(await checkReferral(db, "OWNERCDE", buyer({ email: "  Owner@Example.com " })), { ok: false, reason: "self_referral" });
});

test("self-referral is blocked by phone: the owner's own orders used that number", async () => {
  await seedReservation({ email: "owner@example.com", phone: "9000000001", status: "deposit_paid" });
  assert.deepEqual(await checkReferral(db, "OWNERCDE", buyer({ phone: "9000000001" })), { ok: false, reason: "self_referral" });
  assert.equal((await checkReferral(db, "OWNERCDE", buyer({ phone: "9000000002" }))).ok, true);
});

test("self-referral is blocked by signed-in user (the owner's account, different checkout email)", async () => {
  await db.insert(users).values({ id: "u-owner", email: "owner@example.com", name: "Owner" });
  assert.deepEqual(await checkReferral(db, "OWNERCDE", buyer({ userId: "u-owner" })), { ok: false, reason: "self_referral" });
  await db.insert(users).values({ id: "u-friend", email: "friend@example.com", name: "Friend" });
  assert.equal((await checkReferral(db, "OWNERCDE", buyer({ userId: "u-friend" }))).ok, true);
});

test("one redemption per reservation: replayed / concurrent payment marking counts once", async () => {
  const r = await seedReservation({ status: "pending", referralCode: "OWNERCDE" });
  const results = await Promise.all([1, 2, 3].map((i) => db.transaction((tx) => markDepositPaid(tx, r.id, `pay_${i}`))));
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(await redemptions(), 1);
  await db.transaction((tx) => markDepositPaid(tx, r.id, "pay_again")); // already paid → no-op
  assert.equal(await redemptions(), 1);
});

test("the DB itself refuses a second redemption row for the same reservation", async () => {
  const r = await seedReservation({ status: "deposit_paid", referralCode: "OWNERCDE" });
  await db.insert(referralRedemptions).values({ reservationId: r.id, code: "OWNERCDE" });
  await assert.rejects(db.insert(referralRedemptions).values({ reservationId: r.id, code: "OWNERCDE" }));
});

test("a reservation without a code redeems nothing", async () => {
  const r = await seedReservation({ status: "pending" });
  await db.transaction((tx) => markDepositPaid(tx, r.id, "pay_x"));
  assert.equal(await redemptions(), 0);
});

async function redemptions(): Promise<number> {
  const [row] = await db.select({ n: referrals.redemptions }).from(referrals).where(sql`${referrals.code} = 'OWNERCDE'`);
  return row.n;
}
