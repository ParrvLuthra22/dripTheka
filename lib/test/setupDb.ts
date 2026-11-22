// Test database bootstrap. Import this FIRST in any DB test (before anything that
// imports @/lib/db/client), because the client reads DATABASE_URL when it loads.
//
// Safety: tests DROP and recreate the public schema, so this refuses to run unless
//   • TEST_DATABASE_URL is set,
//   • the database name contains "test",
//   • the host is local — or ALLOW_REMOTE_TEST_DB=1 is set explicitly (for a Neon *branch*).
// It never reads DATABASE_URL, so it can't be pointed at production by accident.

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error(
    "TEST_DATABASE_URL is not set. Start a local Postgres (see docs/PAYMENTS.md → Tests) and e.g.\n" +
    "  TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54329/drip_test pnpm test:payments",
  );
}
const parsed = new URL(url);
const local  = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname);
if (!parsed.pathname.slice(1).includes("test")) {
  throw new Error(`Refusing to run: database name "${parsed.pathname.slice(1)}" must contain "test".`);
}
if (!local && process.env.ALLOW_REMOTE_TEST_DB !== "1") {
  throw new Error(`Refusing to run against non-local host ${parsed.hostname}. Set ALLOW_REMOTE_TEST_DB=1 only for a throwaway Neon branch.`);
}

process.env.DATABASE_URL = url;
(process.env as Record<string, string>).NODE_ENV = "test";

/** Drop everything and apply the real migrations from ./drizzle. */
export async function resetDb(): Promise<void> {
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;");
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  } finally {
    await pool.end();
  }
}
