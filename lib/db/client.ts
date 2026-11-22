// Drip Theka — Postgres + Drizzle ORM client.
//
// Pooled, transaction-capable driver (the old neon-http driver could not run
// interactive transactions, which the payment + capacity logic needs):
//   • Neon hosts (*.neon.tech)  → @neondatabase/serverless Pool over WebSocket
//   • anything else (local dev, test DB, CI) → node-postgres
//
// MODULE SAFETY: constructing a Pool opens no connection, so importing this
// during `next build` without DATABASE_URL is safe. With no usable URL every
// query fails with a network error at runtime — deliberately loud.

import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon }       from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg }         from "drizzle-orm/node-postgres";
import type { NodePgDatabase }          from "drizzle-orm/node-postgres";
import { Pool as PgPool }               from "pg";
import ws                               from "ws";
import * as schema                      from "./schema";
import { randomInt }                    from "node:crypto";

const FALLBACK_URL = "postgresql://noop:noop@127.0.0.1:1/noop";

const rawUrl = process.env.DATABASE_URL;
const DATABASE_URL: string =
  rawUrl && rawUrl !== "REPLACE_ME" && !rawUrl.includes("placeholder") ? rawUrl : FALLBACK_URL;

function isNeonHost(url: string): boolean {
  try { return new URL(url).hostname.endsWith(".neon.tech"); } catch { return false; }
}

/** Drizzle client. Use `db.transaction(async (tx) => …)` for anything multi-statement. */
export type Db = NodePgDatabase<typeof schema>;
/** What you get inside `db.transaction`. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const g = globalThis as unknown as { __dtDb?: Db; __dtDbUrl?: string };

function build(): Db {
  if (isNeonHost(DATABASE_URL)) {
    neonConfig.webSocketConstructor = (globalThis as { WebSocket?: typeof WebSocket }).WebSocket ?? (ws as unknown as typeof WebSocket);
    const pool = new NeonPool({ connectionString: DATABASE_URL, max: 5 });
    return drizzleNeon(pool, { schema }) as unknown as Db;
  }
  const pool = new PgPool({ connectionString: DATABASE_URL, max: 10 });
  return drizzlePg(pool, { schema });
}

// Reuse across dev HMR reloads / warm serverless invocations.
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
