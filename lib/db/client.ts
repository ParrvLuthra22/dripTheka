// Drip Theka — Neon serverless + Drizzle ORM client.
//
// Uses Neon's HTTP transport (`neon()`) which works in:
//   - Next.js Server Components
//   - API Routes (Edge + Node runtime)
//   - CI scripts (via tsx)
//
// DATABASE_URL must be set in .env.local (or the deployment environment).
// Format: postgresql://user:pass@host/db?sslmode=require

import { neon }   from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// ── Validate env before connecting ───────────────────────────────────────

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url || url === "REPLACE_ME") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[db] DATABASE_URL is not set. Add your Neon connection string to the environment."
      );
    }
    // Development: surface a clear warning instead of crashing at import time
    console.warn(
      "\n[db] ⚠️  DATABASE_URL not configured.\n" +
      "    Database queries will throw at runtime.\n" +
      "    Set DATABASE_URL in .env.local to enable DB features.\n"
    );
    return "postgresql://placeholder:placeholder@placeholder/placeholder";
  }
  return url;
}

// ── Client ────────────────────────────────────────────────────────────────

const sql = neon(getDatabaseUrl());

/**
 * Drizzle ORM client with full schema.
 *
 * Usage:
 *   import { db } from "@/lib/db/client";
 *   import { pourProgress } from "@/lib/db/schema";
 *
 *   const rows = await db.select().from(pourProgress).where(eq(pourProgress.pourSlug, "001"));
 */
export const db = drizzle(sql, { schema, logger: process.env.NODE_ENV === "development" });

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Generate a DT order number from a UUID.
 * Format: DT-YYYY-XXXXX (5 uppercase hex chars from UUID tail).
 * V1.1: replace with a DB sequence for strict ordering.
 */
export function generateOrderNumber(id: string): string {
  const year    = new Date().getFullYear();
  const suffix  = id.replace(/-/g, "").slice(-5).toUpperCase();
  return `DT-${year}-${suffix}`;
}

/**
 * Generate an 8-char uppercase referral code.
 * Excludes ambiguous chars: 0, O, 1, I, L.
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}
