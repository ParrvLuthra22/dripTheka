// GET /api/admin/stats — internal dashboard data.
//
// Protected by ADMIN_SECRET, sent as `Authorization: Bearer <secret>` (never in the URL —
// query strings end up in logs, history and referrers). Returns aggregate metrics:
//   - Total reservations by status
//   - Total deposit collected (paise)
//   - Recent regulars (last 10)
//   - Pour progress
//   - Revenue breakdown
//
// Usage: curl -H "Authorization: Bearer $ADMIN_SECRET" http://localhost:3000/api/admin/stats
// Set ADMIN_SECRET in .env.local to enable.

import { NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "node:crypto";
import { POUR } from "@/lib/config";

export const dynamic = "force-dynamic";

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

export async function GET(request: Request) {
  // Auth check — Bearer header only. A `?secret=` query string is ignored.
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || adminSecret === "REPLACE_ME") {
    // No secret configured — block everywhere except local `next dev`.
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 403 });
    }
  } else {
    const m = /^Bearer (.+)$/.exec(request.headers.get("authorization") ?? "");
    const digest = (v: string) => createHash("sha256").update(v).digest();
    if (!m || !timingSafeEqual(digest(m[1]), digest(adminSecret))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (!dbReady()) {
    return NextResponse.json({
      error: "Database not connected",
      hint:  "Set DATABASE_URL in .env.local and run pnpm db:push",
    }, { status: 503 });
  }

  try {
    const { db }            = await import("@/lib/db/client");
    const { reservations, regulars, pourProgress, reservationItems, opsAlerts, pourDesigns } = await import("@/lib/db/schema");
    const { eq, sql, desc, isNull } = await import("drizzle-orm");

    // Run all queries in parallel
    const [
      allReservations,
      recentRegulars,
      pourRow,
      itemStats,
      openAlerts,
      glassRows,
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
      .where(eq(pourProgress.pourSlug, POUR.id))
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

      // Things a human must act on (e.g. a late payment that overfilled a glass → refund one)
      db.select().from(opsAlerts).where(isNull(opsAlerts.resolvedAt)).orderBy(desc(opsAlerts.createdAt)),

      // One glass per design: cap + status
      db.select().from(pourDesigns).where(eq(pourDesigns.pourId, POUR.id)),
    ]);

    // Aggregate
    const totalReservations = allReservations.reduce((sum, r) => sum + r.count, 0);
    const depositCollected  = allReservations
      .filter(r => r.status === "deposit_paid" || r.status === "fulfilled")
      .reduce((sum, r) => sum + r.totalDeposit, 0);
    const totalRegulars = recentRegulars.length;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      pour: pourRow[0] ?? { pourSlug: POUR.id, reserved: 0, target: 0, unlockedAt: null },
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
      glasses: glassRows,
      // Unresolved ops alerts. Non-empty = someone needs to act (see `message`).
      opsAlerts: { openCount: openAlerts.length, open: openAlerts },
    });

  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: "Query failed", detail: String(err) }, { status: 500 });
  }
}
