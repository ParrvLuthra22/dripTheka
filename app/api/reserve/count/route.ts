// Mock reservation count — V1 hardcoded.
// V1.1: replace with Neon DB query SELECT COUNT(*) FROM orders WHERE status != 'cancelled'.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // never cache — always fresh count

export async function GET() {
  // Hardcoded mock for V1. Real: query orders table.
  const reserved = 38;
  const total    = 100;

  return NextResponse.json(
    { reserved, total, pct: +(reserved / total).toFixed(4) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
