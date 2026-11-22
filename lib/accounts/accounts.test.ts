import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reservations, users } from "@/lib/db/schema";
import { createReservation } from "@/lib/reservations/create";
import { seedReservation, reservationInput } from "@/lib/test/fixtures";
import { accountForUserId, ownedBy } from "./session";
import { backfillUserId, markEmailVerified } from "./link";

before(resetDb);
beforeEach(async () => { await db.execute(sql`TRUNCATE reservations, users, payment_events, pour_progress, pour_designs CASCADE`); });

const user = (id: string, email: string, verified: boolean) =>
  db.insert(users).values({ id, email, name: id, emailVerified: verified ? new Date() : null });
const userIdOf = async (reservationId: string) =>
  (await db.select({ u: reservations.userId }).from(reservations).where(eq(reservations.id, reservationId)))[0].u;

// ── user_id set at creation ───────────────────────────────────────────────

test("user_id is set on the reservation when the visitor is signed in", async () => {
  await user("u1", "me@example.com", true);
  const account = await accountForUserId(db, "u1");
  const res = await createReservation(reservationInput("janwar-ink", 1, "someone-else@example.com", account?.userId ?? null));
  assert.equal(await userIdOf(res.reservationId), "u1");   // even though the checkout email differs
});

test("a guest (no account) reservation has a NULL user_id", async () => {
  assert.equal(await accountForUserId(db, undefined), null);
  assert.equal(await accountForUserId(db, "no-such-user"), null);
  const res = await createReservation(reservationInput("janwar-ink", 1, "guest@example.com", null));
  assert.equal(await userIdOf(res.reservationId), null);
});

// ── backfill: verified emails only ────────────────────────────────────────

test("backfill links guest orders for a VERIFIED email (case-insensitive)", async () => {
  await user("u1", "Me@Example.com", true);
  const a = await seedReservation({ email: "me@example.com" });
  const b = await seedReservation({ email: "ME@EXAMPLE.COM" });
  const other = await seedReservation({ email: "other@example.com" });
  assert.equal(await backfillUserId(db, "u1"), 2);
  assert.equal(await userIdOf(a.id), "u1");
  assert.equal(await userIdOf(b.id), "u1");
  assert.equal(await userIdOf(other.id), null);
});

test("backfill does NOTHING for an unverified email — typing someone's email at checkout is not proof", async () => {
  await user("u2", "victim@example.com", false);
  const r = await seedReservation({ email: "victim@example.com" });
  assert.equal(await backfillUserId(db, "u2"), 0);
  assert.equal(await userIdOf(r.id), null);
  await markEmailVerified(db, "u2");                       // provider vouches → now it links
  assert.equal(await backfillUserId(db, "u2"), 1);
  assert.equal(await userIdOf(r.id), "u2");
});

test("backfill never steals an order already linked to another account", async () => {
  await user("u1", "a@example.com", true);
  await user("u2", "b@example.com", true);
  const r = await seedReservation({ email: "a@example.com", userId: "u1" });
  assert.equal(await backfillUserId(db, "u2"), 0);
  assert.equal(await userIdOf(r.id), "u1");
  assert.equal(await backfillUserId(db, "u1"), 0);   // already linked → nothing left to claim
});

test("the migration's own backfill statement is gated on email_verified", () => {
  const sqlText = readFileSync("drizzle/0001_payments_hardening.sql", "utf8");
  const line = sqlText.split("\n").find((l) => l.includes('UPDATE "reservations" r SET "user_id"'))!;
  assert.match(line, /"email_verified" IS NOT NULL/);
});

// ── account routes query by user_id, falling back to VERIFIED email ───────

const visible = async (userId: string) => {
  const account = (await accountForUserId(db, userId))!;
  return new Set((await db.select({ id: reservations.id }).from(reservations).where(ownedBy(account))).map((r) => r.id));
};

test("account queries: by user_id; guest orders under the verified email; never under an unverified one", async () => {
  await user("v", "verified@example.com", true);
  await user("n", "unverified@example.com", false);
  const linked      = await seedReservation({ email: "anything@example.com", userId: "v" });
  const guestV      = await seedReservation({ email: "Verified@example.com" });
  const guestN      = await seedReservation({ email: "unverified@example.com" });
  const linkedOther = await seedReservation({ email: "verified@example.com", userId: "n" }); // belongs to another account
  const stranger    = await seedReservation({ email: "stranger@example.com" });

  const v = await visible("v");
  assert.deepEqual([...v].sort(), [linked.id, guestV.id].sort());
  assert.ok(!v.has(linkedOther.id) && !v.has(stranger.id));

  const n = await visible("n");
  assert.deepEqual([...n].sort(), [linkedOther.id]);   // own user_id yes; the unverified-email guest order no
  assert.ok(!n.has(guestN.id));
});
