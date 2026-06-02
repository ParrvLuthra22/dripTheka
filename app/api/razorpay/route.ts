import { NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";
import { z } from "zod";

const schema = z.object({
  depositAmount: z.number().int().positive(),
  totalAmount:   z.number().int().positive(),
  email:         z.string().email(),
  phone:         z.string().optional(),
  items:         z.array(z.unknown()).min(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { depositAmount, email } = parsed.data;
  const order = await createOrder(depositAmount, `drip-${Date.now()}`, { email });
  return NextResponse.json({ orderId: order.id, amount: order.amount });
}
