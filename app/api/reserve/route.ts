import { NextResponse } from "next/server";
import { verifySignature } from "@/lib/razorpay";
import { z } from "zod";

const schema = z.object({
  razorpay_order_id:   z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature:  z.string(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  // Dev bypass
  if (razorpay_order_id.startsWith("order_dev_")) {
    return NextResponse.json({ success: true });
  }

  const valid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
