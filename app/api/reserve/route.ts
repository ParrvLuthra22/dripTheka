// POST /api/reserve — create a reservation + Razorpay deposit order.
//
// Flow:
//   1. Validate body (Zod); resolve products/sizes and price them server-side
//   2. Deposit / balance from lib/config (paise)
//   3. ONE transaction: capacity check ("tapped_out") → insert reservation
//      (unique 10-char order number, retried on collision) → insert items
//   4. Create the Razorpay order for the deposit; patch its id onto the row
//      (if Razorpay fails the hold is released: row → cancelled)
//   5. Return { reservationId, razorpayOrderId, depositPaise, keyId }

import { NextResponse }  from "next/server";
import { z }             from "zod";
import { eq, sql }       from "drizzle-orm";
import { POUR_001, isPouring, capacityOf } from "@/data/pour-001";
import { depositPaiseFor }                from "@/lib/config";
import { createRazorpayOrder, getPublicKeyId } from "@/lib/razorpay/client";
import { db, dbReady }                    from "@/lib/db/client";
import { reservations, users }            from "@/lib/db/schema";
import type { ShippingAddress }           from "@/lib/db/schema";
import { createReservation, type ReservationLine } from "@/lib/reservations/create";
import { TappedOutError }                 from "@/lib/reservations/capacity";
import { auth }                           from "@/auth";

const bodySchema = z.object({
  email:   z.string().email(),
  name:    z.string().min(2),
  phone:   z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
  address: z.object({
    line1:   z.string().min(5),
    line2:   z.string().optional(),
    city:    z.string().min(2),
    state:   z.string().min(2),
    pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  }),
  items: z
    .array(z.object({ slug: z.string(), size: z.string(), qty: z.number().int().positive().max(10) }))
    .min(1)
    .max(20),
});

/** The signed-in user's id (must exist in `users`), or null for guests. */
async function currentUserId(): Promise<string | null> {
  try {
    const session = await auth();
    const id = session?.user?.id;
    const email = session?.user?.email?.toLowerCase();
    if (id) {
      const [u] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
      if (u) return u.id;
    }
    if (email) {
      const [u] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
      if (u) return u.id;
    }
  } catch { /* no session / auth not configured → guest */ }
  return null;
}

export async function POST(request: Request) {
  // 1. Validate
  let raw: unknown;
  try { raw = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { name, phone, address, items } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  // 2. Resolve products + price (server-side prices only)
  let subtotalPaise = 0;
  const lines: ReservationLine[] = [];
  for (const item of items) {
    const product = POUR_001.products.find((p) => p.slug === item.slug);
    if (!product) {
      return NextResponse.json({ error: `Product not found: ${item.slug}` }, { status: 400 });
    }
    if (!isPouring(product)) {
      return NextResponse.json({ error: "not_pouring_yet" }, { status: 409 });
    }
    const variant = product.sizes.find((s) => s.size === item.size);
    if (!variant) {
      return NextResponse.json({ error: `Invalid size: ${item.size}` }, { status: 400 });
    }
    if (variant.stock <= 0) {
      return NextResponse.json({ error: "tapped_out", slug: product.slug }, { status: 409 });
    }
    const lineTotalPaise = product.price * item.qty;
    subtotalPaise += lineTotalPaise;
    lines.push({
      productSlug: product.slug, productName: product.name,
      size: item.size, qty: item.qty,
      unitPricePaise: product.price, lineTotalPaise,
    });
  }

  const depositPaise = depositPaiseFor(subtotalPaise);
  const balancePaise = subtotalPaise - depositPaise;

  // ── No database ─────────────────────────────────────────────────────────
  if (!dbReady()) {
    // Stub reservations exist for `next dev` only. Never take money without a record of it.
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Reservations are temporarily unavailable." }, { status: 503 });
    }
    console.log("[reserve:dev] DB not set — returning stub reservation");
    let rpOrder: { id: string; amount: number };
    try {
      rpOrder = await createRazorpayOrder(depositPaise, `dev-${Date.now()}`);
    } catch {
      rpOrder = { id: `order_dev_${Date.now()}`, amount: depositPaise };
    }
    return NextResponse.json({
      reservationId: `dev-${Date.now()}`, razorpayOrderId: rpOrder.id, depositPaise, keyId: getPublicKeyId(),
    });
  }

  // 3. Reserve (capacity-checked, transactional)
  let reservationId: string;
  let orderNumber:   string;
  try {
    ({ reservationId, orderNumber } = await createReservation(
      {
        userId: await currentUserId(),
        email, name, phone, address: address as ShippingAddress,
        lines, subtotalPaise, depositPaise, balancePaise,
      },
      {
        capacityOf: (slug) => {
          const p = POUR_001.products.find((x) => x.slug === slug);
          return p ? capacityOf(p) : 0;
        },
      },
    ));
  } catch (err) {
    if (err instanceof TappedOutError) {
      return NextResponse.json({ error: "tapped_out", slug: err.slug }, { status: 409 });
    }
    console.error("[reserve] Error:", err);
    return NextResponse.json({ error: "Failed to create reservation. Please try again." }, { status: 500 });
  }

  // 4. Razorpay order for the deposit
  try {
    const rpOrder = await createRazorpayOrder(depositPaise, reservationId, { email, orderNumber });
    await db.update(reservations)
      .set({ razorpayOrderId: rpOrder.id, updatedAt: sql`now()` })
      .where(eq(reservations.id, reservationId));
    return NextResponse.json({ reservationId, razorpayOrderId: rpOrder.id, depositPaise, keyId: getPublicKeyId() });
  } catch (err) {
    console.error("[reserve] Razorpay order failed:", err);
    // Release the hold right away instead of leaving it for 30 minutes.
    await db.update(reservations)
      .set({ status: "cancelled", updatedAt: sql`now()` })
      .where(eq(reservations.id, reservationId))
      .catch((e) => console.error("[reserve] could not cancel hold:", e));
    return NextResponse.json({ error: "Failed to create reservation. Please try again." }, { status: 500 });
  }
}
