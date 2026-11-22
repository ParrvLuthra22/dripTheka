// The small backend additions the v2 tab drawer needs (docs: "Your tab" prompt §5):
//   reserve → orderNumber, balancePaise, holdExpiresAt, per-line designId; 409 TAPPED_OUT code; 400 field
//   confirm → depositPaise / balancePaise
//   status  → receiptToken only for the holder of the reservation id
//   receipt → balanceMethod, friendCode, designId (token-protected JSON)
//   newsletter signup keeps the referral code as attribution but never counts a redemption
import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { sql, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reservations, referrals, regulars } from "@/lib/db/schema";
import { POUR } from "@/lib/config";
import { makeReceiptToken } from "@/lib/orders/receiptToken";
import { seedReservation } from "@/lib/test/fixtures";

const env = process.env as Record<string, string | undefined>;
let server: http.Server;
let orderSeq = 0;
before(async () => {
  await resetDb();
  server = http.createServer((req, res) => {
    let body = ""; req.on("data", (c) => (body += c));
    req.on("end", () => {
      const amount = (JSON.parse(body || "{}") as { amount?: number }).amount ?? 0;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ id: `order_tab_${++orderSeq}`, amount }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  env.RAZORPAY_API_BASE = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  env.RAZORPAY_KEY_ID = "rzp_test_unit"; env.RAZORPAY_KEY_SECRET = "unit-secret";
  env.RECEIPT_TOKEN_SECRET = "unit-receipt-secret";
});
after(() => { server.close(); });
beforeEach(async () => {
  await db.execute(sql`TRUNCATE reservations, regulars, referrals, referral_redemptions, payment_events, pour_progress, pour_designs CASCADE`);
});

const base = {
  email: "buyer@example.com", name: "Test Buyer", phone: "9876543210",
  address: { line1: "12 Test Street", city: "Delhi", state: "Delhi", pincode: "110001" },
  items: [{ slug: "janwar-ink", size: "M", qty: 2 }, { slug: "bad-influence-ink-pink", size: "L", qty: 1 }],
};
const post = async (over: Record<string, unknown> = {}) => {
  const { POST } = await import("@/app/api/reserve/route");
  return POST(new Request("http://localhost/api/reserve", { method: "POST", body: JSON.stringify({ ...base, ...over }) }));
};
const json = async (r: Response) => (await r.json()) as Record<string, any>;

test("reserve answers with everything the drawer needs", async () => {
  const before = Date.now();
  const res = await post({ balanceMethod: "online", waOptIn: true });
  assert.equal(res.status, 200);
  const b = await json(res);
  const sub = 129900 * 3;
  assert.equal(b.depositPaise, Math.round(sub * POUR.depositPct));
  assert.equal(b.balancePaise, sub - b.depositPaise);
  assert.match(b.orderNumber, /^DT-[A-Z0-9]{10}$/);
  assert.ok(b.reservationId && b.razorpayOrderId && b.keyId);
  assert.deepEqual(b.lines, [
    { slug: "janwar-ink", designId: "janwar", size: "M", qty: 2 },
    { slug: "bad-influence-ink-pink", designId: "bad-influence", size: "L", qty: 1 },
  ]);
  // the hold runs holdMinutes from creation
  const held = Date.parse(b.holdExpiresAt) - before;
  assert.ok(held > (POUR.holdMinutes - 1) * 60_000 && held <= POUR.holdMinutes * 60_000 + 5_000, `hold ${held}ms`);
});

test("400s name the field; a tapped glass is code TAPPED_OUT; a short referral code is a friendly 400", async () => {
  const bad = await post({ address: { ...base.address, pincode: "11" } });
  assert.equal(bad.status, 400);
  assert.equal((await json(bad)).field, "address.pincode");
  const phone = await post({ phone: "12345" });
  assert.equal((await json(phone)).field, "phone");

  const short = await post({ referralCode: "ABC" });
  assert.equal(short.status, 400);
  const sb = await json(short);
  assert.equal(sb.error, "That referral code doesn't exist.");
  assert.equal(sb.field, "referralCode");

  await post({ items: [{ slug: "janwar-ink", size: "M", qty: 10 }] });
  await db.execute(sql`UPDATE pour_designs SET cap = 10 WHERE design_id = 'janwar'`);
  const tapped = await post({ items: [{ slug: "janwar-bone", size: "M", qty: 1 }], email: "late@example.com" });
  assert.equal(tapped.status, 409);
  const tb = await json(tapped);
  assert.deepEqual([tb.code, tb.error, tb.design, tb.slug], ["TAPPED_OUT", "tapped_out", "janwar", "janwar-bone"]);
});

test("status: the receipt token goes only to the holder of the reservation id, and only once paid", async () => {
  const { GET } = await import("@/app/api/reserve/status/[orderId]/route");
  const get = (orderId: string, r?: string) =>
    GET(new Request(`http://localhost/api/reserve/status/${orderId}${r ? `?r=${r}` : ""}`), { params: Promise.resolve({ orderId }) });

  const pending = await seedReservation({ status: "pending", orderId: "order_pend", email: "p@example.com" });
  const p = await json(await get("order_pend", pending.id));
  assert.equal(p.status, "pending");
  assert.equal(p.receiptToken, undefined);
  assert.equal(p.email, undefined);                         // never leaked

  const paid = await seedReservation({ status: "deposit_paid", orderId: "order_paid", email: "q@example.com", orderNumber: "DT-PAIDPAIDPA" });
  assert.equal((await json(await get("order_paid"))).receiptToken, undefined);               // no reservation id
  assert.equal((await json(await get("order_paid", pending.id))).receiptToken, undefined);   // someone else's id
  const ok = await json(await get("order_paid", paid.id));
  assert.equal(ok.receiptToken, makeReceiptToken("DT-PAIDPAIDPA", "q@example.com"));
  assert.equal(ok.orderNumber, "DT-PAIDPAIDPA");
});

test("receipt JSON: token-protected, and carries balanceMethod, designId and the buyer's own friend code", async () => {
  const { GET } = await import("@/app/api/reserve/receipt/[orderNumber]/route");
  const r = await seedReservation({ status: "deposit_paid", slug: "janwar-ink", email: "Fan@Example.com", orderNumber: "DT-RECEIPT123" });
  await db.update(reservations).set({ balanceMethod: "cod", waOptIn: true }).where(eq(reservations.id, r.id));
  await db.insert(regulars).values({ email: "fan@example.com", name: "Fan", city: "Delhi", referralCode: "FANCODE1" });
  await db.insert(referrals).values({ code: "FANCODE1", ownerEmail: "fan@example.com" });
  const get = (t?: string) =>
    GET(new Request(`http://localhost/api/reserve/receipt/DT-RECEIPT123${t ? `?t=${t}` : ""}`), { params: Promise.resolve({ orderNumber: "DT-RECEIPT123" }) });

  assert.equal((await get()).status, 404);
  assert.equal((await get("nope")).status, 404);
  const res = await get(makeReceiptToken("DT-RECEIPT123", "fan@example.com"));
  assert.equal(res.status, 200);
  const b = await json(res);
  assert.deepEqual([b.order.balanceMethod, b.order.waOptIn, b.order.friendCode], ["cod", true, "FANCODE1"]);
  assert.equal(b.items[0].designId, "janwar");
});

test("receipt: no friend code when the buyer isn't a Regular", async () => {
  const { GET } = await import("@/app/api/reserve/receipt/[orderNumber]/route");
  await seedReservation({ status: "deposit_paid", email: "solo@example.com", orderNumber: "DT-SOLOSOLO12" });
  const res = await GET(
    new Request(`http://localhost/api/reserve/receipt/DT-SOLOSOLO12?t=${makeReceiptToken("DT-SOLOSOLO12", "solo@example.com")}`),
    { params: Promise.resolve({ orderNumber: "DT-SOLOSOLO12" }) },
  );
  assert.equal((await json(res)).order.friendCode, null);
});

test("newsletter signup keeps the code as attribution but does NOT count a redemption; a paid deposit does", async () => {
  await db.insert(regulars).values({ email: "owner@example.com", name: "Owner", city: "Delhi", referralCode: "OWNERCDE" });
  await db.insert(referrals).values({ code: "OWNERCDE", ownerEmail: "owner@example.com" });
  const { POST } = await import("@/app/api/regulars/route");
  const res = await POST(new Request("http://localhost/api/regulars", {
    method: "POST", body: JSON.stringify({ email: "new@example.com", name: "New", city: "Pune", referred_by: "OWNERCDE" }),
  }));
  assert.equal(res.status, 200);
  const [row] = await db.select().from(regulars).where(eq(regulars.email, "new@example.com"));
  assert.equal(row.referredBy, "OWNERCDE");                                    // attribution kept
  const [ref] = await db.select().from(referrals).where(eq(referrals.code, "OWNERCDE"));
  assert.equal(ref.redemptions, 0);                                            // …but nothing counted

  // a paid deposit that used the code does count (settle.test.ts covers replay / concurrency)
  const { markDepositPaid } = await import("@/lib/payments/settle");
  const paid = await seedReservation({ status: "pending", referralCode: "OWNERCDE", orderId: "order_ref1" });
  await db.transaction((tx) => markDepositPaid(tx, paid.id, "pay_ref1"));
  const [after] = await db.select().from(referrals).where(eq(referrals.code, "OWNERCDE"));
  assert.equal(after.redemptions, 1);
});
