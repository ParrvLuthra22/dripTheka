// GET /api/account/orders — returns the signed-in user's reservations.
import { NextResponse } from "next/server";
import { auth }         from "@/auth";

import { db, dbReady } from "@/lib/db/client";
import { reservations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { getAccount, ownedBy } from "@/lib/accounts/session";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!dbReady()) {
    return NextResponse.json([]); // No DB — return empty, account page shows empty state
  }

  try {
    const account = await getAccount();
    if (!account) return NextResponse.json([]); // signed in, but no such user row yet → nothing to show
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
      // By user_id, falling back to the account's VERIFIED email (older / guest orders).
      .where(ownedBy(account))
      .orderBy(desc(reservations.createdAt))
      .limit(20);

    return NextResponse.json(orders);
  } catch (err) {
    console.error("[account/orders]", err);
    return NextResponse.json([], { status: 200 }); // Degrade gracefully
  }
}
