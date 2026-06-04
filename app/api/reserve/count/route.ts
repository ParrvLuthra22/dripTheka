// GET /api/reserve/count — live reservation progress for Pour #001.
//
// Reads from pour_progress table.
// Auto-seeds the pour_progress row if it doesn't exist yet (first-run UX).
// Falls back to hardcoded mock if DB is not connected.
//
// Cached for 10 seconds at the edge (ISR) so polls are cheap.

import { NextResponse } from "next/server";

export const revalidate = 10;

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");


export async function GET() {
  if (!dbReady()) {
    return NextResponse.json({ reserved: 38, total: 100, pct: 0.38 });
  }

  try {
    const { db }         = await import("@/lib/db/client");
    const { pourProgress } = await import("@/lib/db/schema");
    const { eq }         = await import("drizzle-orm");

    let [row] = await db
      .select()
      .from(pourProgress)
      .where(eq(pourProgress.pourSlug, "001"))
      .limit(1);

    // Auto-seed on first request if pour_progress doesn't exist yet
    if (!row) {
      await db
        .insert(pourProgress)
        .values({ pourSlug: "001", reserved: 0, target: 100 })
        .onConflictDoNothing();

      // Also seed reserve_count_cache for all products
      try {
        const { reserveCountCache } = await import("@/lib/db/schema");
        const { POUR_001 }          = await import("@/data/pour-001");
        await db
          .insert(reserveCountCache)
          .values(POUR_001.products.map(p => ({
            productSlug:   p.slug,
            reservedCount: 0,
          })))
          .onConflictDoNothing();
      } catch { /* if cache already seeded, that's fine */ }

      row = { pourSlug: "001", reserved: 0, target: 100, unlockedAt: null };
    }

    const { reserved, target: total } = row;
    const pct = total > 0 ? +(reserved / total).toFixed(4) : 0;

    return NextResponse.json({ reserved, total, pct });

  } catch (err) {
    console.error("[reserve/count] DB error:", err);
    return NextResponse.json({ reserved: 38, total: 100, pct: 0.38 });
  }
}
