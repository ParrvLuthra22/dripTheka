// Razorpay server-side helpers — used by /app/api/razorpay/...
import crypto from "crypto";

export function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function createOrder(
  amount: number, // paise
  receipt: string,
  notes?: Record<string, string>
): Promise<{ id: string; amount: number }> {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key || !secret) {
    // Dev stub
    console.log(`[razorpay:dev] order for ₹${amount / 100}, receipt=${receipt}`);
    return { id: `order_dev_${Date.now()}`, amount };
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", receipt, notes }),
  });

  if (!res.ok) throw new Error(`Razorpay error: ${await res.text()}`);
  return res.json() as Promise<{ id: string; amount: number }>;
}
