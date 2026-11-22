import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, afterEach } from "node:test";
import assert from "node:assert/strict";

before(resetDb);
const env = process.env as Record<string, string | undefined>;
const SAVED = { NODE_ENV: env.NODE_ENV, K: env.RAZORPAY_KEY_SECRET, I: env.RAZORPAY_KEY_ID };
afterEach(() => { env.NODE_ENV = SAVED.NODE_ENV; env.RAZORPAY_KEY_SECRET = SAVED.K; env.RAZORPAY_KEY_ID = SAVED.I; });

test("no order_dev_ bypass: even under NODE_ENV=development an unsigned order_dev_* confirm is rejected", async () => {
  env.NODE_ENV = "development";
  env.RAZORPAY_KEY_SECRET = "unit-test-secret";
  const { POST } = await import("@/app/api/reserve/confirm/route");
  const res = await POST(new Request("http://localhost/api/reserve/confirm", {
    method: "POST",
    body: JSON.stringify({
      reservationId: "11111111-1111-4111-8111-111111111111",
      razorpay_order_id: "order_dev_123", razorpay_payment_id: "pay_dev_1", razorpay_signature: "deadbeef",
    }),
  }));
  assert.equal(res.status, 400);
});

test("no stub orders: creating a Razorpay order without keys throws, even in development", async () => {
  env.NODE_ENV = "development";
  env.RAZORPAY_KEY_ID = ""; env.RAZORPAY_KEY_SECRET = "";
  const { createRazorpayOrder } = await import("@/lib/razorpay/client");
  await assert.rejects(createRazorpayOrder(1000, "r1"), /credentials not configured/);
});
