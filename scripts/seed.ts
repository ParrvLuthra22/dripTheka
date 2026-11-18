#!/usr/bin/env tsx
// Drip Theka — Database seed script.
//
// Run with: pnpm db:seed
//
// Seeds:
//   1. pour_progress row for Pour #001 (reserved=0, target=100)
//   2. reserve_count_cache rows for all 6 V1 products (all at 0)
//
// Safe to re-run — uses INSERT ... ON CONFLICT DO NOTHING.

import "dotenv/config"; // loads .env.local in the same directory as package.json

import { db }                 from "../lib/db/client";
import { pourProgress, reserveCountCache } from "../lib/db/schema";
import { POURING_PRODUCTS }    from "../data/pour-001";

async function seed() {
  console.log("🍺  Drip Theka DB seed starting...\n");

  // ── 1. pour_progress ────────────────────────────────────────────────────
  console.log("  Seeding pour_progress...");

  const pourRows = await db
    .insert(pourProgress)
    .values({
      pourSlug: "001",
      reserved: 0,
      target:   100,
    })
    .onConflictDoNothing()
    .returning();

  if (pourRows.length > 0) {
    console.log("  ✓  Created pour_progress for pour 001 (target: 100)");
  } else {
    console.log("  —  pour_progress for pour 001 already exists, skipped");
  }

  // ── 2. reserve_count_cache ───────────────────────────────────────────────
  console.log("\n  Seeding reserve_count_cache...");

  for (const product of POURING_PRODUCTS) {
    const rows = await db
      .insert(reserveCountCache)
      .values({ productSlug: product.slug, reservedCount: 0 })
      .onConflictDoNothing()
      .returning();

    if (rows.length > 0) {
      console.log(`  ✓  Created cache entry for ${product.slug}`);
    } else {
      console.log(`  —  Cache entry for ${product.slug} already exists, skipped`);
    }
  }

  console.log("\n✅  Seed complete.");
}

seed()
  .catch((err) => {
    console.error("\n❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
