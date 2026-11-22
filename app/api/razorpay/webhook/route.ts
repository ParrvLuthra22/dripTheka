// POST /api/razorpay/webhook — Razorpay → us. See docs/PAYMENTS.md for dashboard setup.
//
// • Signature: X-Razorpay-Signature = HMAC-SHA256(RAW body, RAZORPAY_WEBHOOK_SECRET). The body is
//   read as text and verified BEFORE it is parsed.
// • Idempotent by X-Razorpay-Event-Id (stored in payment_events with the state change).
// • 200 for anything handled/ignored/rejected-for-good; 5xx only for transient failures, so
//   Razorpay retries those.

import { NextResponse, after } from "next/server";
import { createHash }   from "node:crypto";
import { verifyWebhookSignature, fetchRazorpayOrder } from "@/lib/razorpay/client";
import { dbReady }      from "@/lib/db/client";
import { handleWebhookEvent } from "@/lib/payments/settle";
import { notifyDepositPaid }  from "@/lib/payments/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET is not set — refusing events");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody   = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: unknown };
  try { event = JSON.parse(rawBody) as typeof event; } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!dbReady()) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    `body:${createHash("sha256").update(rawBody).digest("hex")}`;

  try {
    const result = await handleWebhookEvent(event, eventId, { fetchOrder: fetchRazorpayOrder });
    if (result.newlyPaid) {
      const paid = result.newlyPaid;
      after(() => notifyDepositPaid(paid));
    }
    return NextResponse.json({ ok: true, outcome: result.outcome, duplicate: result.duplicate });
  } catch (err) {
    console.error(`[webhook] ${event.event ?? "?"} ${eventId} failed:`, err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
