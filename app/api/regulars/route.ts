import { NextResponse } from "next/server";
import { subscribeToList } from "@/lib/klaviyo";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  try {
    await subscribeToList(parsed.data.email);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
