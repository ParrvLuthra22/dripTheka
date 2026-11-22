import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { settleConfirmedPayment, handleWebhookEvent } from "./settle";
import { seedReservation, statusOf, reservedCount, paidOrder } from "@/lib/test/fixtures";

before(resetDb);
beforeEach(async () => {
  await db.execute(sql`TRUNCATE reservations, payment_events, pour_progress CASCADE`);
});

const fetchOrderFor = (amount: number) => async (id: string) => paidOrder(id, amount);
const captured = (orderId: string, paymentId: string, amount = 38970) => ({
  event: "payment.captured",
  payload: { payment: { entity: { id: paymentId, order_id: orderId, amount, currency: "INR", status: "captured" } } },
});

// ── confirm ───────────────────────────────────────────────────────────────

test("confirm: a tampered amount is rejected and nothing is marked paid", async () => {
  const r = await seedReservation({ orderId: "order_T1", depositPaise: 38970, qty: 2 });
  // Razorpay says the order was for ₹1, not the ₹389.70 deposit.
  const out = await settleConfirmedPayment(
    { reservationId: r.id, orderId: "order_T1", paymentId: "pay_1" },
    { fetchOrder: fetchOrderFor(100) },
  );
  assert.deepEqual(out, { ok: false, reason: "amount_mismatch" });
  assert.equal(await statusOf(r.id), "pending");
  assert.equal(await reservedCount(), 0);
});

test("confirm: a payment for reservation A can't be used to confirm reservation B", async () => {
  const a = await seedReservation({ orderId: "order_A", depositPaise: 100 });
  const b = await seedReservation({ orderId: "order_B", depositPaise: 38970 });
  // Attacker pays A's tiny order, then submits A's (valid) order/payment ids against B.
  const out = await settleConfirmedPayment(
    { reservationId: b.id, orderId: "order_A", paymentId: "pay_A" },
    { fetchOrder: fetchOrderFor(100) },
  );
  assert.deepEqual(out, { ok: false, reason: "order_mismatch" });
  assert.equal(await statusOf(b.id), "pending");
  assert.equal(await statusOf(a.id), "pending");
});

test("confirm: unpaid / wrong-currency orders are rejected", async () => {
  const r = await seedReservation({ orderId: "order_U" });
  const unpaid = await settleConfirmedPayment(
    { reservationId: r.id, orderId: "order_U", paymentId: "pay_U" },
    { fetchOrder: async (id) => ({ id, amount: 38970, amount_paid: 0, currency: "INR", status: "attempted" }) },
  );
  assert.deepEqual(unpaid, { ok: false, reason: "not_paid" });
  const usd = await settleConfirmedPayment(
    { reservationId: r.id, orderId: "order_U", paymentId: "pay_U" },
    { fetchOrder: async (id) => ({ id, amount: 38970, amount_paid: 38970, currency: "USD", status: "paid" }) },
  );
  assert.deepEqual(usd, { ok: false, reason: "currency_mismatch" });
  assert.equal(await statusOf(r.id), "pending");
});

test("confirm: idempotent — confirming twice counts the units once", async () => {
  const r = await seedReservation({ orderId: "order_I", qty: 3 });
  const args = { reservationId: r.id, orderId: "order_I", paymentId: "pay_I" };
  const first  = await settleConfirmedPayment(args, { fetchOrder: fetchOrderFor(38970) });
  const second = await settleConfirmedPayment(args, { fetchOrder: fetchOrderFor(38970) });
  assert.ok(first.ok && first.changed);
  assert.ok(second.ok && !second.changed);
  assert.equal(await statusOf(r.id), "deposit_paid");
  assert.equal(await reservedCount(), 3);
});

test("confirm: concurrent confirms flip the row once", async () => {
  const r = await seedReservation({ orderId: "order_C", qty: 2 });
  const args = { reservationId: r.id, orderId: "order_C", paymentId: "pay_C" };
  const outs = await Promise.all([1, 2, 3, 4].map(() => settleConfirmedPayment(args, { fetchOrder: fetchOrderFor(38970) })));
  assert.equal(outs.filter((o) => o.ok && o.changed).length, 1);
  assert.equal(await reservedCount(), 2);
});

// ── webhook ───────────────────────────────────────────────────────────────

test("webhook: a replayed event is a no-op", async () => {
  const r = await seedReservation({ orderId: "order_W1", qty: 2 });
  const deps = { fetchOrder: fetchOrderFor(38970) };
  const first  = await handleWebhookEvent(captured("order_W1", "pay_W1"), "evt_1", deps);
  const replay = await handleWebhookEvent(captured("order_W1", "pay_W1"), "evt_1", deps);
  assert.equal(first.outcome, "marked_paid");
  assert.ok(first.newlyPaid);
  assert.equal(replay.duplicate, true);
  assert.equal(replay.newlyPaid, undefined);
  assert.equal(await statusOf(r.id), "deposit_paid");
  assert.equal(await reservedCount(), 2);
});

test("webhook: the same event delivered concurrently is processed once", async () => {
  await seedReservation({ orderId: "order_W2", qty: 1 });
  const deps = { fetchOrder: fetchOrderFor(38970) };
  const results = await Promise.all([1, 2, 3, 4, 5].map(() => handleWebhookEvent(captured("order_W2", "pay_W2"), "evt_race", deps)));
  assert.equal(results.filter((x) => !x.duplicate).length, 1);
  assert.equal(await reservedCount(), 1);
});

test("webhook: payment.captured then order.paid (different event ids) count once", async () => {
  const r = await seedReservation({ orderId: "order_W3", qty: 2 });
  const deps = { fetchOrder: fetchOrderFor(38970) };
  await handleWebhookEvent(captured("order_W3", "pay_W3"), "evt_a", deps);
  const second = await handleWebhookEvent(
    { event: "order.paid", payload: { order: { entity: { id: "order_W3" } }, payment: { entity: { id: "pay_W3", order_id: "order_W3" } } } },
    "evt_b", deps,
  );
  assert.equal(second.outcome, "noop:already_paid");
  assert.equal(await statusOf(r.id), "deposit_paid");
  assert.equal(await reservedCount(), 2);
});

test("webhook records a payment even though the tab was closed (confirm never ran), and a later confirm is a no-op", async () => {
  const r = await seedReservation({ orderId: "order_W4", qty: 1 });
  const deps = { fetchOrder: fetchOrderFor(38970) };
  await handleWebhookEvent(captured("order_W4", "pay_W4"), "evt_closed_tab", deps);
  assert.equal(await statusOf(r.id), "deposit_paid");
  const late = await settleConfirmedPayment({ reservationId: r.id, orderId: "order_W4", paymentId: "pay_W4" }, deps);
  assert.ok(late.ok && !late.changed);
  assert.equal(await reservedCount(), 1);
});

test("webhook: an amount that doesn't match the deposit is rejected (and recorded, so no retry loop)", async () => {
  const r = await seedReservation({ orderId: "order_W5", depositPaise: 38970 });
  const res = await handleWebhookEvent(captured("order_W5", "pay_W5", 100), "evt_bad", { fetchOrder: fetchOrderFor(100) });
  assert.equal(res.outcome, "rejected:amount_mismatch");
  assert.equal(await statusOf(r.id), "pending");
  const again = await handleWebhookEvent(captured("order_W5", "pay_W5", 100), "evt_bad", { fetchOrder: fetchOrderFor(100) });
  assert.equal(again.duplicate, true);
});

test("webhook: unknown order ids are ignored", async () => {
  const res = await handleWebhookEvent(captured("order_nope", "pay_x"), "evt_unknown", { fetchOrder: fetchOrderFor(1) });
  assert.equal(res.outcome, "ignored:unknown_order");
});

test("webhook: a transient Razorpay failure throws and is NOT recorded, so the retry still works", async () => {
  const r = await seedReservation({ orderId: "order_W6" });
  await assert.rejects(
    handleWebhookEvent(captured("order_W6", "pay_W6"), "evt_retry", { fetchOrder: async () => { throw new Error("razorpay down"); } }),
  );
  const retry = await handleWebhookEvent(captured("order_W6", "pay_W6"), "evt_retry", { fetchOrder: fetchOrderFor(38970) });
  assert.equal(retry.outcome, "marked_paid");
  assert.equal(await statusOf(r.id), "deposit_paid");
});

test("webhook: payment.failed keeps the row as failed; a later successful retry still pays it; a failure never downgrades a paid row", async () => {
  const r = await seedReservation({ orderId: "order_W7", qty: 1 });
  const deps = { fetchOrder: fetchOrderFor(38970) };
  const failed = { event: "payment.failed", payload: { payment: { entity: { id: "pay_f", order_id: "order_W7" } } } };
  assert.equal((await handleWebhookEvent(failed, "evt_f1", deps)).outcome, "marked_failed");
  assert.equal(await statusOf(r.id), "failed");

  assert.equal((await handleWebhookEvent(captured("order_W7", "pay_ok"), "evt_ok", deps)).outcome, "marked_paid");
  assert.equal(await statusOf(r.id), "deposit_paid");

  assert.equal((await handleWebhookEvent(failed, "evt_f2", deps)).outcome, "noop:not_pending");
  assert.equal(await statusOf(r.id), "deposit_paid");
  assert.equal(await reservedCount(), 1);
});

test("webhook: refund.processed marks refunded and gives the units back; partial refunds don't", async () => {
  const r = await seedReservation({ orderId: "order_W8", qty: 2 });
  const deps = { fetchOrder: fetchOrderFor(38970) };
  await handleWebhookEvent(captured("order_W8", "pay_W8"), "evt_p", deps);
  assert.equal(await reservedCount(), 2);

  const refund = (amount: number) => ({ event: "refund.processed", payload: { refund: { entity: { id: "rfnd_1", payment_id: "pay_W8", amount } } } });
  assert.equal((await handleWebhookEvent(refund(1000), "evt_r0", deps)).outcome, "noop:partial_refund");
  assert.equal(await statusOf(r.id), "deposit_paid");

  assert.equal((await handleWebhookEvent(refund(38970), "evt_r1", deps)).outcome, "marked_refunded");
  assert.equal(await statusOf(r.id), "refunded");
  assert.equal(await reservedCount(), 0);
});
