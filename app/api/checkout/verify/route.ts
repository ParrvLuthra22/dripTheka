import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "../route";

interface VerifyBody {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function POST(request: Request) {
  const body = await request.json() as VerifyBody;
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Dev mode bypass
  if (razorpay_order_id.startsWith("order_dev_")) {
    return NextResponse.json({ success: true });
  }

  const valid = verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
