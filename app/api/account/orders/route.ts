// GET /api/account/orders — returns the signed-in user's reservations.
import { NextResponse } from "next/server";
import { auth }         from "@/auth";

import { db, dbReady } from "@/lib/db/client";
import { reservations } from "@/lib/db/schema";
import { desc, or, eq, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!dbReady()) {
    return NextResponse.json([]); // No DB — return empty, account page shows empty state
  }

  try {
    const orders = await db
      .select({
        id:           reservations.id,
        orderNumber:  reservations.orderNumber,
        status:       reservations.status,
        depositPaise: reservations.depositPaise,
        balancePaise: reservations.balancePaise,
        createdAt:    reservations.createdAt,
      })
      .from(reservations)
      // Linked to the account by user_id, or (older / guest orders) by email.
      .where(or(
        session.user.id ? eq(reservations.userId, session.user.id) : undefined,
        sql`lower(${reservations.email}) = ${session.user.email.toLowerCase()}`,
      ))
      .orderBy(desc(reservations.createdAt))
      .limit(20);

    return NextResponse.json(orders);
  } catch (err) {
    console.error("[account/orders]", err);
    return NextResponse.json([], { status: 200 }); // Degrade gracefully
  }
}
