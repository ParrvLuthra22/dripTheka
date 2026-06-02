import { NextResponse } from "next/server";
import crypto from "crypto";

interface CheckoutBody {
  email: string;
  phone?: string;
  depositAmount: number;
  totalAmount: number;
  items: unknown[];
}

export async function POST(request: Request) {
  const body = await request.json() as CheckoutBody;
  const { email, phone, depositAmount, totalAmount, items } = body;

  if (!email || !depositAmount || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    // Dev mode — return a fake order
    console.log(`[Razorpay dev] Would create order for ₹${depositAmount / 100}`);
    return NextResponse.json({
      orderId: `order_dev_${Date.now()}`,
      amount: depositAmount,
    });
  }

  const orderData = {
    amount: depositAmount,
    currency: "INR",
    receipt: `drip-${Date.now()}`,
    notes: {
      email,
      phone: phone ?? "",
      totalAmount: String(totalAmount),
      itemCount: String(items.length),
    },
  };

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Razorpay error:", err);
    return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  }

  const order = await res.json() as { id: string; amount: number };

  return NextResponse.json({ orderId: order.id, amount: order.amount });
}

// Razorpay signature verification helper (used by /api/checkout/verify)
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const body = `${orderId}|${paymentId}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(signature)
  );
}
