// GET /api/reserve/receipt/[orderNumber]?t=<token>
// Full order data for the receipt page.
//
// Access: the order number alone is NOT enough. The caller must present either
//   • t — a signed receipt token (HMAC of order number + email; see lib/orders/receiptToken.ts), or
//   • a signed-in session that owns the order (user_id, or the same email).
// Anything else gets the same 404 as a non-existent order.
//
// Returns: { order, items } or 404.

import { NextResponse } from "next/server";

import { eq }                   from "drizzle-orm";
import { db, dbReady }          from "@/lib/db/client";
import { reservations, reservationItems } from "@/lib/db/schema";
import { verifyReceiptToken }   from "@/lib/orders/receiptToken";
import { auth }                 from "@/auth";

async function sessionOwns(order: { userId: string | null; email: string }): Promise<boolean> {
  try {
    const session = await auth();
    const u = session?.user;
    if (!u) return false;
    if (u.id && order.userId && u.id === order.userId) return true;
    return !!u.email && u.email.toLowerCase() === order.email.toLowerCase();
  } catch { return false; }
}

export async function GET(
  req: Request,
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
    const [order] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.orderNumber, orderNumber))
      .limit(1);

    let allowed = false;
    if (order) {
      const token = new URL(req.url).searchParams.get("t");
      try { allowed = verifyReceiptToken(token, order.orderNumber, order.email); }
      catch (e) { console.error("[receipt] token check unavailable:", e); }
      if (!allowed) allowed = await sessionOwns(order);
    }
    if (!order || !allowed) {
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
