// POST /api/reserve — create a reservation + Razorpay deposit order.
//
// Flow:
//   1. Validate body (Zod)
//   2. Look up prices from /data/pour-001.ts (hardcoded V1 source of truth)
//   3. Compute subtotal / deposit (30%) / balance (70%) in paise
//   4. Insert reservations row (status: pending)
//   5. Insert reservation_items rows
//   6. Create Razorpay order (amount = depositPaise)
//   7. Patch reservation with razorpay_order_id
//   8. Return { reservationId, razorpayOrderId, depositPaise, keyId }

import { NextResponse }  from "next/server";
import { z }             from "zod";
import crypto            from "crypto";
import { POUR_001, isPouring } from "@/data/pour-001";
import { createRazorpayOrder, getPublicKeyId } from "@/lib/razorpay/client";
import { generateOrderNumber }                  from "@/lib/db/client";
import type { ShippingAddress }                 from "@/lib/db/schema";

// ── Zod schema ────────────────────────────────────────────────────────────

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

// ── DB configured? ────────────────────────────────────────────────────────

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

// ── Handler ───────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Validate
  const raw    = await request.json() as unknown;
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
  const { email, name, phone, address, items } = parsed.data;

  // 2. Resolve products + compute pricing
  let subtotalPaise = 0;
  const lineItems: {
    productSlug: string; productName: string;
    size: string; qty: number;
    unitPricePaise: number; lineTotalPaise: number;
  }[] = [];

  for (const item of items) {
    const product = POUR_001.products.find((p) => p.slug === item.slug);
    if (!product) {
      return NextResponse.json({ error: `Product not found: ${item.slug}` }, { status: 400 });
    }
    // Demo tees (placeholderArt) can be bagged but not reserved yet.
    if (!isPouring(product)) {
      return NextResponse.json({ error: "not_pouring_yet" }, { status: 409 });
    }
    const lineTotalPaise = product.price * item.qty;
    subtotalPaise += lineTotalPaise;
    lineItems.push({
      productSlug: product.slug, productName: product.name,
      size: item.size, qty: item.qty,
      unitPricePaise: product.price, lineTotalPaise,
    });
  }

  const depositPaise = Math.round(subtotalPaise * 0.3);
  const balancePaise = subtotalPaise - depositPaise;

  // ── Dev mode: no DB configured ───────────────────────────────────────────
  if (!dbReady()) {
    console.log("[reserve:dev] DB not set — returning stub reservation");
    let rpOrder: { id: string; amount: number };
    try {
      rpOrder = await createRazorpayOrder(depositPaise, `dev-${Date.now()}`);
    } catch {
      rpOrder = { id: `order_dev_${Date.now()}`, amount: depositPaise };
    }
    return NextResponse.json({
      reservationId:   `dev-${Date.now()}`,
      razorpayOrderId: rpOrder.id,
      depositPaise,
      keyId: getPublicKeyId(),
    });
  }

  // ── Production path ───────────────────────────────────────────────────────
  try {
    const { db }                            = await import("@/lib/db/client");
    const { reservations, reservationItems } = await import("@/lib/db/schema");
    const { eq }                            = await import("drizzle-orm");

    const reservationId = crypto.randomUUID();
    const orderNumber   = generateOrderNumber(reservationId);

    // 4. Insert reservation (razorpay_order_id placeholder filled in step 7)
    await db.insert(reservations).values({
      id: reservationId, orderNumber,
      email, name, phone,
      address:          address as ShippingAddress,
      subtotalPaise, depositPaise, balancePaise,
      razorpayOrderId:  "pending",
      status:           "pending",
    });

    // 5. Insert line items
    await db.insert(reservationItems).values(
      lineItems.map((li) => ({ ...li, reservationId }))
    );

    // 6. Create Razorpay order
    const rpOrder = await createRazorpayOrder(
      depositPaise,
      reservationId,
      { email, orderNumber }
    );

    // 7. Patch reservation with real razorpay_order_id
    await db.update(reservations)
      .set({ razorpayOrderId: rpOrder.id })
      .where(eq(reservations.id, reservationId));

    // 8. Return
    return NextResponse.json({
      reservationId,
      razorpayOrderId: rpOrder.id,
      depositPaise,
      keyId: getPublicKeyId(),
    });

  } catch (err) {
    console.error("[reserve] Error:", err);
    return NextResponse.json(
      { error: "Failed to create reservation. Please try again." },
      { status: 500 }
    );
  }
}
