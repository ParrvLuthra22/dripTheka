// GET /api/pour/[pourId]/glasses
//   → { pourId, closesAt, glasses: [{ design, cap, poured, left, state: 'open'|'last'|'tapped' }] }
//
// Cached at the CDN for 30 s (s-maxage=30). When the database is unavailable this answers 503
// (uncached) — it NEVER invents numbers; the UI hides the glasses instead.

import { NextResponse } from "next/server";
import { dbReady }      from "@/lib/db/client";
import { POUR }         from "@/lib/config";
import { getGlasses }   from "@/lib/pour/glasses";

export const dynamic = "force-dynamic";

const unavailable = () =>
  NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });

export async function GET(_req: Request, { params }: { params: Promise<{ pourId: string }> }) {
  const { pourId } = await params;
  if (pourId !== POUR.id) {
    return NextResponse.json({ error: "Pour not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  if (!dbReady()) return unavailable();

  try {
    const glasses = await getGlasses();
    return NextResponse.json(
      { pourId: POUR.id, closesAt: POUR.closesAt, glasses },
      { headers: { "Cache-Control": "public, s-maxage=30" } },
    );
  } catch (err) {
    console.error("[pour/glasses] DB error:", err);
    return unavailable();
  }
}
