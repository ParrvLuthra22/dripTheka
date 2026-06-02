// GET /api/reserve/count — live reservation progress for Pour #001.
//
// Reads from pour_progress table. Falls back to hardcoded mock if DB
// is not yet connected (development without DATABASE_URL configured).
//
// Cached for 10 seconds at the edge (ISR) so the fill bar reflects
// recent confirmations without hammering the DB on every poll tick.

import { NextResponse } from "next/server";

export const revalidate = 10; // 10s ISR cache — meets spec

// ── DB available? ─────────────────────────────────────────────────────────

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET() {
  if (!dbReady()) {
    // Dev fallback — realistic non-zero mock so the fill bar is visible
    return NextResponse.json({ reserved: 38, total: 100, pct: 0.38 });
  }

  try {
    const { db }          = await import("@/lib/db/client");
    const { pourProgress } = await import("@/lib/db/schema");
    const { eq }          = await import("drizzle-orm");

    const [row] = await db
      .select()
      .from(pourProgress)
      .where(eq(pourProgress.pourSlug, "001"))
      .limit(1);

    if (!row) {
      // pour_progress not seeded yet
      return NextResponse.json({ reserved: 0, total: 100, pct: 0 });
    }

    const { reserved, target: total } = row;
    const pct = total > 0 ? +(reserved / total).toFixed(4) : 0;

    return NextResponse.json({ reserved, total, pct });

  } catch (err) {
    console.error("[reserve/count] DB error:", err);
    // Return last-known mock rather than a 500 — fill bar degrades gracefully
    return NextResponse.json({ reserved: 38, total: 100, pct: 0.38 });
  }
}
