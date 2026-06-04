// GET /api/admin/stats — internal dashboard data.
//
// Protected by ADMIN_SECRET env var. Returns aggregate metrics:
//   - Total reservations by status
//   - Total deposit collected (paise)
//   - Recent regulars (last 10)
//   - Pour progress
//   - Revenue breakdown
//
// Usage: curl "http://localhost:3000/api/admin/stats?secret=YOUR_SECRET"
// Set ADMIN_SECRET in .env.local to enable.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

export async function GET(request: Request) {
  // Auth check
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || adminSecret === "REPLACE_ME") {
    // No secret configured — block in production, allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 403 });
    }
  } else if (secret !== adminSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!dbReady()) {
    return NextResponse.json({
      error: "Database not connected",
      hint:  "Set DATABASE_URL in .env.local and run pnpm db:push",
    }, { status: 503 });
  }

  try {
    const { db }            = await import("@/lib/db/client");
    const { reservations, regulars, pourProgress, reservationItems } = await import("@/lib/db/schema");
    const { eq, sql, desc } = await import("drizzle-orm");

    // Run all queries in parallel
    const [
      allReservations,
      recentRegulars,
      pourRow,
      itemStats,
    ] = await Promise.all([
      // Reservations grouped by status
      db.select({
        status:       reservations.status,
        count:        sql<number>`cast(count(*) as int)`,
        totalDeposit: sql<number>`cast(sum(${reservations.depositPaise}) as int)`,
        totalBalance: sql<number>`cast(sum(${reservations.balancePaise}) as int)`,
      })
      .from(reservations)
      .groupBy(reservations.status),

      // Recent 10 regulars
      db.select({
        email:        regulars.email,
        name:         regulars.name,
        city:         regulars.city,
        referralCode: regulars.referralCode,
        createdAt:    regulars.createdAt,
      })
      .from(regulars)
      .orderBy(desc(regulars.createdAt))
      .limit(10),

      // Pour progress
      db.select()
      .from(pourProgress)
      .where(eq(pourProgress.pourSlug, "001"))
      .limit(1),

      // Top products by reservation count
      db.select({
        productSlug:    reservationItems.productSlug,
        totalQty:       sql<number>`cast(sum(${reservationItems.qty}) as int)`,
        totalRevenue:   sql<number>`cast(sum(${reservationItems.lineTotalPaise}) as int)`,
      })
      .from(reservationItems)
      .groupBy(reservationItems.productSlug)
      .orderBy(sql`sum(${reservationItems.qty}) desc`)
      .limit(10),
    ]);

    // Aggregate
    const totalReservations = allReservations.reduce((sum, r) => sum + r.count, 0);
    const depositCollected  = allReservations
      .filter(r => r.status === "deposit_paid" || r.status === "fulfilled")
      .reduce((sum, r) => sum + r.totalDeposit, 0);
    const totalRegulars = recentRegulars.length;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      pour: pourRow[0] ?? { pourSlug: "001", reserved: 0, target: 100, unlockedAt: null },
      reservations: {
        total:           totalReservations,
        depositCollected,
        depositInINR:    (depositCollected / 100).toLocaleString("en-IN"),
        byStatus:        allReservations,
      },
      regulars: {
        total:  totalRegulars,
        recent: recentRegulars,
      },
      products: itemStats,
    });

  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: "Query failed", detail: String(err) }, { status: 500 });
  }
}
