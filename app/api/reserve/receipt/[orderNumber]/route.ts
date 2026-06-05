// GET /api/reserve/receipt/[orderNumber]
// Returns full order data for the receipt page.
//
// Access control: orderNumber is the authorization token for guest checkout.
// The format DT-YYYY-XXXXX (5 hex chars) gives ~1M combinations — not
// enumerable in practice. For logged-in users, session check is also fine.
//
// Returns: { order, items } or 404.

import { NextResponse } from "next/server";

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  if (!orderNumber) {
    return NextResponse.json({ error: "orderNumber required" }, { status: 400 });
  }

  if (!dbReady()) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  try {
    const { db }                              = await import("@/lib/db/client");
    const { reservations, reservationItems }   = await import("@/lib/db/schema");
    const { eq }                              = await import("drizzle-orm");

    const [order] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(reservationItems)
      .where(eq(reservationItems.reservationId, order.id));

    return NextResponse.json({
      order: {
        id:           order.id,
        orderNumber:  order.orderNumber,
        email:        order.email,
        name:         order.name,
        status:       order.status,
        subtotalPaise: order.subtotalPaise,
        depositPaise:  order.depositPaise,
        balancePaise:  order.balancePaise,
        createdAt:    order.createdAt,
      },
      items: items.map((i) => ({
        productSlug:    i.productSlug,
        productName:    i.productName,
        size:           i.size,
        qty:            i.qty,
        lineTotalPaise: i.lineTotalPaise,
      })),
    });
  } catch (err) {
    console.error("[receipt]", err);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}
