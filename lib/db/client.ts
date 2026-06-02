// Drip Theka — Neon serverless + Drizzle ORM client.
//
// MODULE SAFETY: `neon()` stores the URL string but makes NO network calls
// at initialisation time — connections happen on first query. This means
// importing this module during `next build` is safe even without DATABASE_URL.
//
// If DATABASE_URL is not configured, every query throws a network error at
// runtime. This is intentional: deploy fails loudly rather than silently.

import { neon }    from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema  from "./schema";

// ── Connection URL ─────────────────────────────────────────────────────────
// We fall back to a syntactically-valid but unreachable URL so that
// `neon()` can initialise without throwing. Any query against this URL
// will fail with a network error — which surfaces early in development.

const DATABASE_URL: string =
  (process.env.DATABASE_URL &&
   process.env.DATABASE_URL !== "REPLACE_ME" &&
   !process.env.DATABASE_URL.includes("placeholder"))
    ? process.env.DATABASE_URL
    : "postgresql://noop:noop@noop.neon.tech/noop";

// ── Client ─────────────────────────────────────────────────────────────────

const sql = neon(DATABASE_URL);

/**
 * Drizzle ORM client bound to the Drip Theka schema.
 *
 * Usage (server components / API routes):
 *   import { db } from "@/lib/db/client";
 *   import { pourProgress } from "@/lib/db/schema";
 *   import { eq } from "drizzle-orm";
 *
 *   const rows = await db.select().from(pourProgress).where(eq(...));
 *
 * In API routes that guard against missing DB, wrap in a try/catch and
 * check `process.env.DATABASE_URL` before calling.
 */
export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Derive a human-readable order number from a UUID.
 * Format: DT-YYYY-XXXXX (5 uppercase hex chars from the UUID tail).
 * V1.1: replace with a Postgres sequence for strict ordering.
 */
export function generateOrderNumber(id: string): string {
  const year   = new Date().getFullYear();
  const suffix = id.replace(/-/g, "").slice(-5).toUpperCase();
  return `DT-${year}-${suffix}`;
}

/**
 * Generate an 8-char uppercase referral code.
 * Excludes visually ambiguous chars: 0/O, 1/I/L.
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}
