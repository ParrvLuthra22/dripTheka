import { NextResponse } from "next/server";
import { subscribeToList } from "@/lib/klaviyo";
import { z } from "zod";

// Extended schema — accepts all fields from the Regulars sign-up form
const schema = z.object({
  email:      z.string().email("Invalid email"),
  name:       z.string().optional(),
  city:       z.string().optional(),
  college:    z.string().optional(),
  instagram:  z.string().optional(),
  heard_from: z.string().optional(),
  source:     z.string().optional(), // e.g. "last-call", "regulars-page", "refill:productId"
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json() as unknown);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { email, name, city, college, instagram, heard_from, source } = parsed.data;

  try {
    // Subscribe email to Klaviyo Regulars list
    // Custom properties logged for V1 — V1.1 passes them to Klaviyo profile
    if (process.env.NODE_ENV === "development") {
      console.log("[regulars] subscribe:", { email, name, city, college, instagram, heard_from, source });
    }

    await subscribeToList(email);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
