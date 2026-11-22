// GET /api/reserve/count — live reservation progress for Pour #001.
//
// Reads pour_progress (auto-seeds the row on first call). NEVER invents numbers:
// if the database isn't configured or the query fails, answer 503 and let the UI
// hide the glass / counter instead of showing a made-up fill.

import { NextResponse } from "next/server";
import { eq }           from "drizzle-orm";
import { db, dbReady }  from "@/lib/db/client";
import { pourProgress } from "@/lib/db/schema";
import { POUR }         from "@/lib/config";

export const dynamic = "force-dynamic";

const unavailable = () =>
  NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  if (!dbReady()) return unavailable();

  try {
    let [row] = await db.select().from(pourProgress).where(eq(pourProgress.pourSlug, POUR.id)).limit(1);

    if (!row) {
      await db.insert(pourProgress).values({ pourSlug: POUR.id, reserved: 0, target: 100 }).onConflictDoNothing();
      [row] = await db.select().from(pourProgress).where(eq(pourProgress.pourSlug, POUR.id)).limit(1);
      if (!row) return unavailable();
    }

    const { reserved, target: total } = row;
    const pct = total > 0 ? +(reserved / total).toFixed(4) : 0;

    return NextResponse.json(
      { reserved, total, pct },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } },
    );
  } catch (err) {
    console.error("[reserve/count] DB error:", err);
    return unavailable();
  }
}
