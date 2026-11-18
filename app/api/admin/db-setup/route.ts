// GET /api/admin/db-setup — DB health check + auto-seed.
//
// Returns connection status, table existence, and seed status.
// Dev-only: blocked in production.
// Also auto-seeds pour_progress if missing (same as reserve/count does).

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl === "REPLACE_ME" || dbUrl.includes("placeholder")) {
    return NextResponse.json({
      ok:      false,
      status:  "no_database",
      message: "DATABASE_URL not configured.",
      steps: [
        "1. Create a free Neon database at https://neon.tech",
        "2. Copy the connection string",
        "3. Set DATABASE_URL=postgresql://... in .env.local",
        "4. Run: pnpm db:push   (applies the schema)",
        "5. Run: pnpm db:seed   (seeds initial data)",
        "6. Restart: pnpm dev",
      ],
    });
  }

  try {
    const { db }         = await import("@/lib/db/client");
    const { pourProgress, regulars, reservations } = await import("@/lib/db/schema");
    const { sql, eq }    = await import("drizzle-orm");

    // Check tables exist by running lightweight queries
    const checks = await Promise.allSettled([
      db.select({ c: sql<number>`count(*)` }).from(pourProgress),
      db.select({ c: sql<number>`count(*)` }).from(regulars),
      db.select({ c: sql<number>`count(*)` }).from(reservations),
    ]);

    const tables = {
      pour_progress:  checks[0].status === "fulfilled",
      regulars:       checks[1].status === "fulfilled",
      reservations:   checks[2].status === "fulfilled",
    };

    const allTablesExist = Object.values(tables).every(Boolean);

    if (!allTablesExist) {
      return NextResponse.json({
        ok:      false,
        status:  "schema_missing",
        tables,
        message: "Some tables are missing. Run: pnpm db:push",
      });
    }

    // Auto-seed pour_progress if empty
    let seeded = false;
    if (checks[0].status === "fulfilled") {
      const count = (checks[0].value[0] as { c: number })?.c ?? 0;
      if (count === 0) {
        await db
          .insert(pourProgress)
          .values({ pourSlug: "001", reserved: 0, target: 100 })
          .onConflictDoNothing();

        // Also seed reserve_count_cache
        try {
          const { reserveCountCache } = await import("@/lib/db/schema");
          const { POURING_PRODUCTS }  = await import("@/data/pour-001");
          await db
            .insert(reserveCountCache)
            .values(POURING_PRODUCTS.map(p => ({
              productSlug:   p.slug,
              reservedCount: 0,
            })))
            .onConflictDoNothing();
        } catch { /* already seeded */ }

        seeded = true;
      }
    }

    const pourRows = await db.select().from(pourProgress).limit(1);
    const regularCount = checks[1].status === "fulfilled"
      ? ((checks[1].value as { c: number }[])[0]?.c ?? 0)
      : 0;
    const reservationCount = checks[2].status === "fulfilled"
      ? ((checks[2].value as { c: number }[])[0]?.c ?? 0)
      : 0;

    return NextResponse.json({
      ok:      true,
      status:  "connected",
      tables,
      seeded,
      data: {
        pour:         pourRows[0] ?? null,
        regulars:     regularCount,
        reservations: reservationCount,
      },
      message: seeded
        ? "✅ Database connected and seeded!"
        : "✅ Database connected.",
    });

  } catch (err) {
    return NextResponse.json({
      ok:     false,
      status: "connection_error",
      error:  String(err),
      hint:   "Check your DATABASE_URL is a valid Neon PostgreSQL connection string.",
    }, { status: 503 });
  }
}
