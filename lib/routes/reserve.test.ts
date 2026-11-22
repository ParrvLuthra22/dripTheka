// POST /api/reserve — validation + new checkout fields, against a local Razorpay stub.
import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reservations, referrals, regulars } from "@/lib/db/schema";

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
      res.end(JSON.stringify({ id: `order_stub_${++orderSeq}`, amount }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  env.RAZORPAY_API_BASE = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  env.RAZORPAY_KEY_ID = "rzp_test_unit"; env.RAZORPAY_KEY_SECRET = "unit-secret";
});
after(() => { server.close(); });
beforeEach(async () => {
  await db.execute(sql`TRUNCATE reservations, regulars, referrals, payment_events, pour_progress, pour_designs CASCADE`);
  (POURMUT as { cod: boolean }).cod = true;
});
import { POUR } from "@/lib/config";
const POURMUT = POUR.balance as unknown as { online: boolean; cod: boolean };

const base = {
  email: "buyer@example.com", name: "Test Buyer", phone: "9876543210",
  address: { line1: "12 Test Street", city: "Delhi", state: "Delhi", pincode: "110001" },
  items: [{ slug: "janwar-ink", size: "M", qty: 2 }],
};
const post = async (over: Record<string, unknown> = {}) => {
  const { POST } = await import("@/app/api/reserve/route");
  return POST(new Request("http://localhost/api/reserve", { method: "POST", body: JSON.stringify({ ...base, ...over }) }));
};
const json = async (r: Response) => (await r.json()) as Record<string, unknown>;

test("happy path stores wa_opt_in and balance_method; price comes from product data (₹1,299 × 2, 30% deposit)", async () => {
  const res = await post({ waOptIn: true, balanceMethod: "cod" });
  assert.equal(res.status, 200);
  const [r] = await db.select().from(reservations);
  assert.equal(r.waOptIn, true);
  assert.equal(r.balanceMethod, "cod");
  assert.equal(r.subtotalPaise, 129900 * 2);
  assert.equal(r.depositPaise, Math.round(129900 * 2 * POUR.depositPct));
  assert.equal(r.userId, null);   // no session → guest
  assert.match(r.orderNumber, /^DT-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/);
});

test("the new fields are optional: defaults are wa_opt_in=false, balance_method=NULL", async () => {
  assert.equal((await post()).status, 200);
  const [r] = await db.select().from(reservations);
  assert.deepEqual([r.waOptIn, r.balanceMethod], [false, null]);
});

test("Indian mobile must match ^[6-9]\\d{9}$", async () => {
  for (const phone of ["1234567890", "5876543210", "98765", "98765432101", "+919876543210", "98765 43210"]) {
    assert.equal((await post({ phone })).status, 400, phone);
  }
  assert.equal((await post({ phone: "6000000000" })).status, 200);
});

test("PIN code must match ^\\d{6}$", async () => {
  for (const pincode of ["11000", "1100011", "11000a", " 110001"]) {
    assert.equal((await post({ address: { ...base.address, pincode } })).status, 400, pincode);
  }
});

test("balance_method must be enabled in POUR.balance", async () => {
  POURMUT.cod = false;
  const res = await post({ balanceMethod: "cod" });
  assert.equal(res.status, 400);
  assert.equal((await json(res)).code, "BALANCE_METHOD_UNAVAILABLE");
  assert.equal((await post({ balanceMethod: "online" })).status, 200);
  assert.equal((await post({ balanceMethod: "cheque" })).status, 400);
  assert.equal((await db.select().from(reservations)).length, 1);
});

test("referral code: unknown → 400, own code (same email) → 400, a friend's code is stored", async () => {
  await db.insert(regulars).values({ email: "owner@example.com", name: "Owner", city: "Delhi", referralCode: "OWNERCDE" });
  await db.insert(referrals).values({ code: "OWNERCDE", ownerEmail: "owner@example.com" });
  assert.equal((await json(await post({ referralCode: "NOPENOPE" }))).code, "UNKNOWN_REFERRAL");
  assert.equal((await json(await post({ referralCode: "OWNERCDE", email: "owner@example.com" }))).code, "SELF_REFERRAL");
  assert.equal((await post({ referralCode: "OWNERCDE" })).status, 200);
  assert.equal((await db.select().from(reservations))[0].referralCode, "OWNERCDE");
});

test("a glass that is full answers 409 tapped_out for BOTH colourways", async () => {
  assert.equal((await post({ items: [{ slug: "janwar-ink", size: "M", qty: 10 }] })).status, 200);
  await db.execute(sql`UPDATE pour_designs SET cap = 10 WHERE design_id = 'janwar'`);
  const res = await post({ items: [{ slug: "janwar-bone", size: "M", qty: 1 }], email: "late@example.com" });
  assert.equal(res.status, 409);
  const body = await json(res);
  assert.deepEqual([body.error, body.design], ["tapped_out", "janwar"]);
});
