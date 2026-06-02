// Drip Theka — Razorpay server-side client.
// Only ever imported by API routes (Node.js runtime).
// Never import this from client components.

import crypto from "crypto";

// ── Config ────────────────────────────────────────────────────────────────

const isConfigured = () =>
  !!(process.env.RAZORPAY_KEY_ID &&
     process.env.RAZORPAY_KEY_ID !== "rzp_test_REPLACE_ME" &&
     process.env.RAZORPAY_KEY_SECRET &&
     process.env.RAZORPAY_KEY_SECRET !== "REPLACE_ME");

/** Key ID exposed to the client (NEXT_PUBLIC_RAZORPAY_KEY_ID). */
export function getPublicKeyId(): string {
  return (
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ??
    process.env.RAZORPAY_KEY_ID ??
    "rzp_test_REPLACE_ME"
  );
}

// ── Create order ──────────────────────────────────────────────────────────

export interface RazorpayOrderResult {
  id:     string;
  amount: number; // paise
}

/**
 * Create a Razorpay order.
 *
 * In development without credentials:
 *   returns a fake `order_dev_*` ID so the checkout page can be tested
 *   without a real Razorpay account.
 *
 * In production: throws if credentials are missing.
 */
export async function createRazorpayOrder(
  amount:  number,          // paise
  receipt: string,          // e.g. reservation ID
  notes?:  Record<string, string>,
): Promise<RazorpayOrderResult> {
  if (!isConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Razorpay credentials not configured");
    }
    console.log(`[razorpay:dev] stub order — ₹${amount / 100}, receipt=${receipt}`);
    return { id: `order_dev_${Date.now()}`, amount };
  }

  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency: "INR", receipt, notes }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay createOrder failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<RazorpayOrderResult>;
}

// ── Verify payment signature ──────────────────────────────────────────────

/**
 * Verify a Razorpay payment signature.
 * HMAC-SHA256(orderId + "|" + paymentId) using RAZORPAY_KEY_SECRET.
 *
 * Returns `false` when credentials are missing (dev stub IDs bypass this).
 */
export function verifyPaymentSignature(
  orderId:   string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || secret === "REPLACE_ME") return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    // Buffer lengths differ → invalid signature
    return false;
  }
}

// ── Re-export old names so /lib/razorpay/index.ts callers don't break ─────
export { verifyPaymentSignature as verifySignature, createRazorpayOrder as createOrder };
