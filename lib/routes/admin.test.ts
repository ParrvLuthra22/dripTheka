import "@/lib/test/setupDb";
import { resetDb } from "@/lib/test/setupDb";
import { test, before, afterEach } from "node:test";
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
