import { NextResponse } from "next/server";

// Development-only DB connectivity probe.
// Remove before production or gate behind an auth check.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const { db } = await import("@/lib/db/client");
    const { pourProgress } = await import("@/lib/db/schema");

    const rows = await db.select().from(pourProgress);
    return NextResponse.json({ ok: true, pour_progress: rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
