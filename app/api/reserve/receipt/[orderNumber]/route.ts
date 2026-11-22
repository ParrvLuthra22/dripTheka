// GET /api/reserve/receipt/[orderNumber]?t=<token>
// Full order data for the receipt page.
//
// Access: the order number alone is NOT enough. The caller must present either
//   • t — a signed receipt token (HMAC of order number + email; see lib/orders/receiptToken.ts), or
//   • a signed-in session that owns the order (user_id, or the same email).
// Anything else gets the same 404 as a non-existent order.
//
// Returns JSON: { order, items } or 404. (It was always JSON — there is no HTML variant to add.)
//   order.balanceMethod / order.waOptIn / order.referralCodeUsed — what the buyer chose at checkout
//   order.friendCode — the buyer's OWN referral code (their Regulars row, matched by email), or null
//   items[].designId — the glass each line pours into (so /tab can draw its live glass bar)

import { NextResponse } from "next/server";

import { eq }                   from "drizzle-orm";
import { db, dbReady }          from "@/lib/db/client";
import { reservations, reservationItems, regulars } from "@/lib/db/schema";
import { sql }                  from "drizzle-orm";
import { designOf }             from "@/lib/pour/designs";
import { verifyReceiptToken }   from "@/lib/orders/receiptToken";
import { getAccount }            from "@/lib/accounts/session";

async function sessionOwns(order: { userId: string | null; email: string }): Promise<boolean> {
  const account = await getAccount();
  if (!account) return false;
  if (order.userId) return order.userId === account.userId;
  // Unclaimed guest order: only the holder of the VERIFIED email may see it.
  return account.emailVerified && !!account.email && account.email === order.email.trim().toLowerCase();
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

    const [mine] = await db.select({ code: regulars.referralCode }).from(regulars)
      .where(sql`lower(${regulars.email}) = ${order.email.trim().toLowerCase()}`).limit(1);

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
        balanceMethod: order.balanceMethod,
        waOptIn:      order.waOptIn,
        referralCodeUsed: order.referralCode,
        friendCode:   mine?.code ?? null,
      },
      items: items.map((i) => ({
        productSlug:    i.productSlug,
        designId:       designOf(i.productSlug),
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
