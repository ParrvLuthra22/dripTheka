import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPaidOrder } from "./check";

const reservation = { razorpayOrderId: "order_A", depositPaise: 38970 };
const paid = { id: "order_A", amount: 38970, amount_paid: 38970, currency: "INR", status: "paid" };

test("accepts the exact paid deposit order", () => {
  assert.deepEqual(checkPaidOrder(paid, reservation, "order_A"), { ok: true });
});

test("rejects an order id that isn't this reservation's (client claims a different order)", () => {
  assert.deepEqual(checkPaidOrder(paid, reservation, "order_B"), { ok: false, reason: "order_mismatch" });
});

test("rejects when Razorpay returns a different order than the one stored", () => {
  assert.deepEqual(checkPaidOrder({ ...paid, id: "order_B" }, reservation, "order_A"), { ok: false, reason: "order_mismatch" });
});

test("rejects a tampered / smaller amount", () => {
  assert.deepEqual(checkPaidOrder({ ...paid, amount: 100, amount_paid: 100 }, reservation, "order_A"), { ok: false, reason: "amount_mismatch" });
});

test("rejects when less was actually paid than the order amount", () => {
  assert.deepEqual(checkPaidOrder({ ...paid, amount_paid: 100 }, reservation, "order_A"), { ok: false, reason: "amount_mismatch" });
});

test("rejects non-INR", () => {
  assert.deepEqual(checkPaidOrder({ ...paid, currency: "USD" }, reservation, "order_A"), { ok: false, reason: "currency_mismatch" });
});

test("rejects an order that isn't paid yet", () => {
  assert.deepEqual(checkPaidOrder({ ...paid, status: "attempted", amount_paid: 0 }, reservation, "order_A"), { ok: false, reason: "not_paid" });
  assert.deepEqual(checkPaidOrder({ ...paid, status: "created", amount_paid: 0 }, reservation, "order_A"), { ok: false, reason: "not_paid" });
});
