// GET /api/reserve/status/[orderId] — poll reservation status.
// Used by the tab drawer (and /checkout/success) after a "confirming…" timeout: polls until the
// webhook settles the reservation. Add ?r=<reservationId> (the id /api/reserve returned, known only
// to the buyer) and, once the deposit is paid, the response also carries `receiptToken` so the
// drawer can show the receipt and save the tab on this device.

import { NextResponse } from "next/server";

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

export async function GET(
  request: Request,
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
        email:        reservations.email,
      })
      .from(reservations)
      .where(eq(reservations.razorpayOrderId, orderId))
      .limit(1);

    if (!res) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const { email, ...rest } = res;
    const paid = ["deposit_paid", "drop_unlocked", "fulfilled"].includes(res.status);
    const asked = new URL(request.url).searchParams.get("r");
    let receiptToken: string | undefined;
    if (paid && asked && asked === res.id) {
      try {
        const { makeReceiptToken } = await import("@/lib/orders/receiptToken");
        receiptToken = makeReceiptToken(res.orderNumber, email);
      } catch (e) { console.error("[reserve/status] receipt token unavailable:", e); }
    }
    return NextResponse.json({ ...rest, ...(receiptToken ? { receiptToken } : {}) });
  } catch (err) {
    console.error("[reserve/status]", err);
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }
}
