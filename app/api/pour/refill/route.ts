// POST /api/pour/refill  { design, email, phone?, waOptIn? }
// Join the refill list for a design ("tell me when it's poured again").
//
//   400 INVALID          body failed validation (bad email, Indian mobile ^[6-9]\d{9}$, unknown design,
//                        waOptIn without a phone)
//   409 ALREADY_ON_LIST  this email is already on that design's list
//   429 RATE_LIMITED     too many attempts (per IP and per email), with Retry-After
//   503                  database unavailable
//   201 { ok: true }

import { NextResponse } from "next/server";
import { db, dbReady }  from "@/lib/db/client";
import { refillSchema, addRefillRequest } from "@/lib/pour/refill";
import { consume, hashKey, clientIp } from "@/lib/ratelimit";

const IP_LIMIT    = { limit: 10, windowSeconds: 600 };   // 10 / 10 min / IP
const EMAIL_LIMIT = { limit: 3,  windowSeconds: 3600 };  // 3 / hour / email

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch {
    return NextResponse.json({ code: "INVALID", error: "Invalid request" }, { status: 400 });
  }
  const parsed = refillSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID", error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  if (!dbReady()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  try {
    const hits = [
      await consume(db, `refill:ip:${hashKey(clientIp(request))}`, IP_LIMIT.limit, IP_LIMIT.windowSeconds),
      await consume(db, `refill:email:${hashKey(parsed.data.email)}`, EMAIL_LIMIT.limit, EMAIL_LIMIT.windowSeconds),
    ];
    const blocked = hits.find((h) => !h.ok);
    if (blocked) {
      return NextResponse.json(
        { code: "RATE_LIMITED", error: "Too many attempts. Try again in a bit." },
        { status: 429, headers: { "Retry-After": String(blocked.retryAfterSeconds) } },
      );
    }

    const result = await addRefillRequest(parsed.data);
    if (result === "duplicate") {
      return NextResponse.json({ code: "ALREADY_ON_LIST", error: "You're already on the refill list for this one." }, { status: 409 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[pour/refill] error:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
