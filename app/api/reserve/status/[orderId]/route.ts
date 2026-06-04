// GET /api/reserve/status/[orderId] — poll reservation status.
// Used by /checkout/success to show real order details if DB is connected.

import { NextResponse } from "next/server";

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  if (!dbReady()) {
    return NextResponse.json({ status: "unknown", mock: true });
  }

  try {
    const { db }          = await import("@/lib/db/client");
    const { reservations } = await import("@/lib/db/schema");
    const { eq }          = await import("drizzle-orm");

    const [res] = await db
      .select({
        id:           reservations.id,
        orderNumber:  reservations.orderNumber,
        status:       reservations.status,
        depositPaise: reservations.depositPaise,
        balancePaise: reservations.balancePaise,
        createdAt:    reservations.createdAt,
      })
      .from(reservations)
      .where(eq(reservations.razorpayOrderId, orderId))
      .limit(1);

    if (!res) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    return NextResponse.json(res);
  } catch (err) {
    console.error("[reserve/status]", err);
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }
}
