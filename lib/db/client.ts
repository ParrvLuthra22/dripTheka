// Drip Theka — Postgres + Drizzle ORM client.
//
// node-postgres (`pg`) Pool over TCP, for every host — local, CI and Neon.
// Transaction-capable (the payment + capacity logic needs real interactive transactions).
//
// Why not Neon's WebSocket Pool: Neon's current guidance for Vercel *Fluid compute* is
// "use a standard Postgres TCP driver (node-postgres) and a connection pool", created at
// module scope and registered with `attachDatabasePool` from @vercel/functions, which
// closes idle clients before the instance is suspended so they can't leak across
// invocations. (https://neon.com/docs/guides/vercel-connection-methods) The serverless
// driver is for runtimes that can't keep a pool between requests. Use Neon's POOLED
// connection string (host contains "-pooler") so many instances share a few server connections.
//
// MODULE SAFETY: constructing a Pool opens no connection, so importing this
// during `next build` without DATABASE_URL is safe. With no usable URL every
// query fails with a network error at runtime — deliberately loud.

import { drizzle }          from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool }             from "pg";
import { attachDatabasePool } from "@vercel/functions";
import * as schema          from "./schema";
import { randomInt }        from "node:crypto";

const FALLBACK_URL = "postgresql://noop:noop@127.0.0.1:1/noop";

const rawUrl = process.env.DATABASE_URL;
const DATABASE_URL: string =
  rawUrl && rawUrl !== "REPLACE_ME" && !rawUrl.includes("placeholder") ? rawUrl : FALLBACK_URL;

/** Drizzle client. Use `db.transaction(async (tx) => …)` for anything multi-statement. */
export type Db = NodePgDatabase<typeof schema>;
/** What you get inside `db.transaction`. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const g = globalThis as unknown as { __dtDb?: Db; __dtDbUrl?: string };

function build(): Db {
  const pool = new Pool({
    connectionString:        DATABASE_URL,
    max:                     8,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis:       10_000,
  });
  // On Vercel, hand the pool to the platform so idle connections are released before suspension.
  if (process.env.VERCEL) attachDatabasePool(pool);
  return drizzle(pool, { schema });
}

// One pool per instance: reused across warm invocations and dev HMR reloads.
export const db: Db =
  g.__dtDb && g.__dtDbUrl === DATABASE_URL ? g.__dtDb : (g.__dtDb = build(), g.__dtDbUrl = DATABASE_URL, g.__dtDb);

/** True when a real DATABASE_URL is configured. */
export const dbReady = (): boolean => DATABASE_URL !== FALLBACK_URL;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Postgres unique_violation (also matches the wrapped `cause` Drizzle adds). */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export { generateOrderNumber } from "@/lib/orders/orderNumber";

/**
 * Generate an 8-char uppercase referral code from an unambiguous alphabet
 * (no 0/O, 1/I/L). Uses a CSPRNG; callers must still handle UNIQUE collisions.
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[randomInt(chars.length)]).join("");
}
