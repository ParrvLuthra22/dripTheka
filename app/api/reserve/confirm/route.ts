// POST /api/reserve/confirm — verify Razorpay payment and finalise reservation.
//
// Flow:
//   1. Validate body (Zod)
//   2. Verify Razorpay HMAC-SHA256 signature
//   3. Load reservation from DB (ensure it exists and is still "pending")
//   4. Update reservation → status: deposit_paid, razorpay_payment_id set
//   5. Atomically increment pour_progress.reserved by total qty
//   6. Fire Klaviyo "reservation_confirmed" event (non-blocking)
//   7. Return { ok: true, orderNumber }

import { NextResponse }          from "next/server";
import { z }                     from "zod";
import { verifyPaymentSignature } from "@/lib/razorpay/client";
import { sendOrderConfirmationEmail } from "@/lib/email";

// ── Schema ────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  reservationId:       z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id:   z.string().min(1),
  razorpay_signature:  z.string().min(1),
});

// ── DB ready? ─────────────────────────────────────────────────────────────

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

// ── Klaviyo "reservation_confirmed" event ─────────────────────────────────

async function trackKlaviyoReservation(opts: {
  email:       string;
  orderNumber: string;
  depositPaise: number;
  balancePaise: number;
}) {
  const key = process.env.KLAVIYO_PRIVATE_KEY;
  if (!key || key === "REPLACE_ME") return; // not configured

  try {
    await fetch("https://a.klaviyo.com/api/events/", {
      method:  "POST",
      headers: {
        revision:       "2024-10-15",
        "content-type": "application/json",
        Authorization:  `Klaviyo-API-Key ${key}`,
      },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            metric: {
              data: { type: "metric", attributes: { name: "reservation_confirmed" } },
            },
            profile: {
              data: { type: "profile", attributes: { email: opts.email } },
            },
            properties: {
              order_number:  opts.orderNumber,
              deposit_paise: opts.depositPaise,
              balance_paise: opts.balancePaise,
            },
            time: new Date().toISOString(),
          },
        },
      }),
    });
  } catch (e) {
    console.warn("[klaviyo] Failed to track reservation_confirmed:", e);
  }
}

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
  const { reservationId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = parsed.data;

  // 2. Verify signature
  //    Dev bypass: order IDs starting with "order_dev_" skip verification
  const isDev = razorpay_order_id.startsWith("order_dev_");
  if (!isDev) {
    const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) {
      console.warn("[confirm] Invalid Razorpay signature for order:", razorpay_order_id);
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }
  }

  // ── Dev mode: no DB ─────────────────────────────────────────────────────
  if (!dbReady() || isDev) {
    console.log(`[confirm:dev] Payment confirmed (dev mode), reservationId=${reservationId}`);
    return NextResponse.json({
      ok:          true,
      orderNumber: isDev ? `DT-${new Date().getFullYear()}-DEV01` : `DT-DEV`,
    });
  }

  // ── Production path ──────────────────────────────────────────────────────
  try {
    const { db }                                         = await import("@/lib/db/client");
    const { reservations, reservationItems, pourProgress } = await import("@/lib/db/schema");
    const { eq, sum, sql }                               = await import("drizzle-orm");

    // 3. Load reservation
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, reservationId))
      .limit(1);

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Guard: idempotency — already confirmed?
    if (reservation.status === "deposit_paid") {
      return NextResponse.json({ ok: true, orderNumber: reservation.orderNumber });
    }

    // 4. Update reservation status
    await db
      .update(reservations)
      .set({
        status:             "deposit_paid",
        razorpayPaymentId:  razorpay_payment_id,
        updatedAt:          new Date(),
      })
      .where(eq(reservations.id, reservationId));

    // 5. Compute total quantity from line items, then atomically increment pour_progress
    const [qtyRow] = await db
      .select({ total: sum(reservationItems.qty) })
      .from(reservationItems)
      .where(eq(reservationItems.reservationId, reservationId));

    const totalQty = Number(qtyRow?.total ?? 0);

    if (totalQty > 0) {
      await db
        .update(pourProgress)
        .set({
          reserved:  sql`${pourProgress.reserved} + ${totalQty}`,
          // updatedAt is implicit (the row reflects the latest update time)
        })
        .where(eq(pourProgress.pourSlug, "001"));
    }

    // 6. Klaviyo event (non-blocking — don't fail confirm if this errors)
    void trackKlaviyoReservation({
      email:        reservation.email,
      orderNumber:  reservation.orderNumber,
      depositPaise: reservation.depositPaise,
      balancePaise: reservation.balancePaise,
    });

    // 6b. Order confirmation email via Resend (non-blocking)
    void (async () => {
      try {
        const lineItems = await db
          .select({
            productName:    reservationItems.productName,
            size:           reservationItems.size,
            qty:            reservationItems.qty,
            lineTotalPaise: reservationItems.lineTotalPaise,
          })
          .from(reservationItems)
          .where(eq(reservationItems.reservationId, reservationId));

        await sendOrderConfirmationEmail({
          to:            reservation.email,
          customerName:  reservation.name,
          orderNumber:   reservation.orderNumber,
          items:         lineItems,
          subtotalPaise: reservation.subtotalPaise,
          depositPaise:  reservation.depositPaise,
          balancePaise:  reservation.balancePaise,
        });
      } catch (e) {
        console.warn("[confirm] Failed to send order confirmation email:", e);
      }
    })();

    // 7. Done
    return NextResponse.json({ ok: true, orderNumber: reservation.orderNumber });

  } catch (err) {
    console.error("[confirm] DB error:", err);
    return NextResponse.json(
      { error: "Failed to confirm reservation. Contact support with your payment ID." },
      { status: 500 }
    );
  }
}
