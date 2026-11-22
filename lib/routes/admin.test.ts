import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, afterEach } from "node:test";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { opsAlerts } from "@/lib/db/schema";
import assert from "node:assert/strict";

before(resetDb);
const env = process.env as Record<string, string | undefined>;
const SAVED = { NODE_ENV: env.NODE_ENV, ADMIN_SECRET: env.ADMIN_SECRET };
afterEach(() => { env.NODE_ENV = SAVED.NODE_ENV; env.ADMIN_SECRET = SAVED.ADMIN_SECRET; });

const stats = async (headers: Record<string, string> = {}, qs = "") => {
  const { GET } = await import("@/app/api/admin/stats/route");
  return GET(new Request(`http://localhost/api/admin/stats${qs}`, { headers }));
};

test("admin/stats: secret in the query string is NOT accepted", async () => {
  env.ADMIN_SECRET = "s3cret-value";
  assert.equal((await stats({}, "?secret=s3cret-value")).status, 403);
});

test("admin/stats: wrong or missing Bearer is refused; correct Bearer works", async () => {
  env.ADMIN_SECRET = "s3cret-value";
  assert.equal((await stats()).status, 403);
  assert.equal((await stats({ authorization: "Bearer nope" })).status, 403);
  assert.equal((await stats({ authorization: "s3cret-value" })).status, 403);
  assert.equal((await stats({ authorization: "Bearer s3cret-value" })).status, 200);
});

test("admin/stats: with no ADMIN_SECRET it is closed outside `next dev`", async () => {
  delete env.ADMIN_SECRET;
  env.NODE_ENV = "production";
  assert.equal((await stats()).status, 403);
});

test("admin/db-setup and db-test answer 404 in production", async () => {
  env.NODE_ENV = "production";
  const setup = await import("@/app/api/admin/db-setup/route");
  const probe = await import("@/app/api/db-test/route");
  assert.equal((await setup.GET()).status, 404);
  assert.equal((await probe.GET()).status, 404);
});

test("admin/stats surfaces unresolved ops alerts (the overfill → refund case) and the glasses", async () => {
  env.ADMIN_SECRET = "s3cret-value";
  await db.execute(sql`TRUNCATE ops_alerts, pour_designs CASCADE`);
  await db.insert(opsAlerts).values([
    { kind: "overfill", designId: "janwar", message: "OVERFILL: janwar has 51 paid units for a cap of 50.", detail: { cap: 50, paid: 51, over: 1 } },
    { kind: "overfill", designId: "aap-zara", message: "old one", resolvedAt: new Date() },
  ]);
  const res = await stats({ authorization: "Bearer s3cret-value" });
  const body = await res.json() as { opsAlerts: { openCount: number; open: { designId: string; message: string }[] }; glasses: unknown[] };
  assert.equal(body.opsAlerts.openCount, 1);
  assert.equal(body.opsAlerts.open[0].designId, "janwar");
  assert.match(body.opsAlerts.open[0].message, /OVERFILL/);
  assert.ok(Array.isArray(body.glasses));
});
