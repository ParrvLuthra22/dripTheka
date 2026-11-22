import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { refillRequests } from "@/lib/db/schema";
import { consume } from "@/lib/ratelimit";

before(resetDb);
beforeEach(async () => { await db.execute(sql`TRUNCATE refill_requests, rate_limits`); });

let ip = 0;
const post = async (body: unknown, headers: Record<string, string> = {}) => {
  const { POST } = await import("@/app/api/pour/refill/route");
  return POST(new Request("http://localhost/api/pour/refill", {
    method: "POST", headers: { "x-forwarded-for": `10.0.0.${++ip}`, ...headers }, body: JSON.stringify(body),
  }));
};
const good = { design: "janwar", email: "fan@example.com", phone: "9876543210", waOptIn: true };
const code = async (r: Response) => ((await r.json()) as { code?: string }).code;

test("a valid signup is stored (email lower-cased)", async () => {
  const res = await post({ ...good, email: "Fan@Example.com" });
  assert.equal(res.status, 201);
  const rows = await db.select().from(refillRequests);
  assert.equal(rows.length, 1);
  assert.deepEqual([rows[0].designId, rows[0].email, rows[0].phone, rows[0].waOptIn], ["janwar", "fan@example.com", "9876543210", true]);
});

test("a duplicate signup (same design + email, any case) is rejected with 409", async () => {
  assert.equal((await post(good)).status, 201);
  const dup = await post({ ...good, email: "FAN@example.com" });
  assert.equal(dup.status, 409);
  assert.equal(await code(dup), "ALREADY_ON_LIST");
  assert.equal((await db.select().from(refillRequests)).length, 1);
});

test("the same email can join the list of a different design", async () => {
  assert.equal((await post(good)).status, 201);
  assert.equal((await post({ ...good, design: "aap-zara" })).status, 201);
});

test("an invalid phone is rejected with 400", async () => {
  for (const phone of ["1234567890", "98765", "98765432101", "+919876543210", "abcdefghij"]) {
    const res = await post({ ...good, phone });
    assert.equal(res.status, 400, phone);
    assert.equal(await code(res), "INVALID");
  }
  assert.equal((await db.select().from(refillRequests)).length, 0);
});

test("other validation: bad email, unknown design, WhatsApp opt-in without a phone, non-JSON", async () => {
  assert.equal((await post({ ...good, email: "nope" })).status, 400);
  assert.equal((await post({ ...good, design: "not-a-design" })).status, 400);
  assert.equal((await post({ design: "janwar", email: "a@b.co", waOptIn: true })).status, 400);
  assert.equal((await post({ design: "janwar", email: "a@b.co", phone: "" })).status, 201); // blank phone = none
  const { POST } = await import("@/app/api/pour/refill/route");
  assert.equal((await POST(new Request("http://localhost/x", { method: "POST", body: "{nope" }))).status, 400);
});

test("rate limit: an IP gets 10 attempts per window, then 429 with Retry-After", async () => {
  const h = { "x-forwarded-for": "203.0.113.9" };
  for (let i = 0; i < 10; i++) assert.equal((await post({ ...good, email: `u${i}@example.com` }, h)).status, 201);
  const res = await post({ ...good, email: "late@example.com" }, h);
  assert.equal(res.status, 429);
  assert.equal(await code(res), "RATE_LIMITED");
  assert.ok(Number(res.headers.get("retry-after")) >= 1);
  assert.equal((await post({ ...good, email: "other@example.com" }, { "x-forwarded-for": "203.0.113.10" })).status, 201); // different IP
});

test("rate limit: one email can't be hammered across IPs (3 / hour)", async () => {
  const email = "victim@example.com";
  await post({ ...good, email });                       // 201
  await post({ ...good, email });                       // 409 (still counts)
  await post({ ...good, email });                       // 409
  assert.equal((await post({ ...good, email })).status, 429);
});

test("consume(): window resets after it expires", async () => {
  assert.equal((await consume(db, "k", 2, 60)).ok, true);
  assert.equal((await consume(db, "k", 2, 60)).ok, true);
  assert.equal((await consume(db, "k", 2, 60)).ok, false);
  await db.execute(sql`UPDATE rate_limits SET window_start = now() - interval '2 minutes' WHERE key = 'k'`);
  const r = await consume(db, "k", 2, 60);
  assert.equal(r.ok, true);
  assert.equal(r.count, 1);
});
