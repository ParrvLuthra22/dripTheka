// GET /api/account/orders — returns the signed-in user's reservations.
import { NextResponse } from "next/server";
import { auth }         from "@/auth";

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!dbReady()) {
    return NextResponse.json([]); // No DB — return empty, account page shows empty state
  }

  try {
    const { db }           = await import("@/lib/db/client");
    const { reservations } = await import("@/lib/db/schema");
    const { eq, desc }     = await import("drizzle-orm");

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
      .where(eq(reservations.email, session.user.email))
      .orderBy(desc(reservations.createdAt))
      .limit(20);

    return NextResponse.json(orders);
  } catch (err) {
    console.error("[account/orders]", err);
    return NextResponse.json([], { status: 200 }); // Degrade gracefully
  }
}
