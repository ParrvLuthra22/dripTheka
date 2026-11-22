// POST /api/reserve/confirm — called by the browser after Razorpay Checkout succeeds.
//
//   1. Validate body
//   2. ALWAYS verify the Razorpay signature (HMAC of order_id|payment_id). No bypass, in any environment.
//   3. settleConfirmedPayment(): the order must be the one stored on THIS
//      reservation; Razorpay is asked (server-side) for the order, whose amount
//      must equal the deposit, currency INR, status paid; then pending → deposit_paid.
//   4. Idempotent: confirming again changes nothing and still answers ok.
//
// The webhook (/api/razorpay/webhook) does the same settlement if this call never arrives.

import { NextResponse, after } from "next/server";
import { z }             from "zod";
import { verifyPaymentSignature, fetchRazorpayOrder } from "@/lib/razorpay/client";
import { dbReady }       from "@/lib/db/client";
import { settleConfirmedPayment } from "@/lib/payments/settle";
import { notifyDepositPaid }      from "@/lib/payments/notify";
import { makeReceiptToken }       from "@/lib/orders/receiptToken";

const bodySchema = z.object({
  reservationId:       z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id:   z.string().min(1),
  razorpay_signature:  z.string().min(1),
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { reservationId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = parsed.data;

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    console.warn("[confirm] Invalid Razorpay signature for order:", razorpay_order_id);
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  if (!dbReady()) {
    return NextResponse.json({ error: "Reservations are temporarily unavailable." }, { status: 503 });
  }

  if (!UUID.test(reservationId)) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  try {
    const outcome = await settleConfirmedPayment(
      { reservationId, orderId: razorpay_order_id, paymentId: razorpay_payment_id },
      { fetchOrder: fetchRazorpayOrder },
    );

    if (!outcome.ok) {
      if (outcome.reason === "not_found") {
        return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
      }
      // Signature was valid but the payment doesn't match this reservation — tampering or a bug. Never mark paid.
      console.error(`[confirm] REJECTED reservation=${reservationId} order=${razorpay_order_id} reason=${outcome.reason}`);
      return NextResponse.json({ error: "Payment could not be verified for this reservation.", reason: outcome.reason }, { status: 409 });
    }

    if (outcome.changed) after(() => notifyDepositPaid(outcome.reservation));

    let receiptToken: string | undefined;
    try {
      receiptToken = makeReceiptToken(outcome.reservation.orderNumber, outcome.reservation.email);
    } catch (e) {
      console.error("[confirm] receipt token unavailable:", e);
    }
    return NextResponse.json({ ok: true, orderNumber: outcome.reservation.orderNumber, receiptToken });

  } catch (err) {
    // Razorpay or the DB is unreachable. The payment is safe at Razorpay; the webhook records it.
    console.error("[confirm] error:", err);
    return NextResponse.json(
      { error: "We're confirming your payment. If you were charged you don't need to pay again — check your email shortly." },
      { status: 502 },
    );
  }
}
