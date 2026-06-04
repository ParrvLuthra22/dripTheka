// POST /api/regulars — subscribe a user to the Regulars list.
//
// Flow:
//   1. Validate body (email required, others optional)
//   2. If DB is configured: upsert into regulars table, create referrals row
//   3. Track referred_by if a referral code was passed
//   4. Subscribe to Klaviyo non-blocking
//   5. Return { success: true, referralCode }

import { NextResponse } from "next/server";
import { z }            from "zod";
import { generateReferralCode } from "@/lib/db/client";

const schema = z.object({
  email:       z.string().email("Invalid email"),
  name:        z.string().optional(),
  city:        z.string().optional(),
  college:     z.string().optional(),
  instagram:   z.string().optional(),
  heard_from:  z.string().optional(),
  source:      z.string().optional(),
  // Referral code that brought them in (optional)
  referred_by: z.string().length(8).toUpperCase().optional(),
});

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

// Non-blocking Klaviyo subscribe — don't fail the sign-up if Klaviyo is down
async function klaviyoSubscribe(email: string): Promise<void> {
  const key    = process.env.KLAVIYO_PRIVATE_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;
  if (!key || key === "REPLACE_ME" || !listId || listId === "REPLACE_ME") return;

  try {
    const BASE = "https://a.klaviyo.com/api";
    const REV  = "2024-10-15";
    const hdrs = {
      accept:         "application/json",
      revision:       REV,
      "content-type": "application/json",
      Authorization:  `Klaviyo-API-Key ${key}`,
    };

    // Upsert profile
    const pRes = await fetch(`${BASE}/profiles/`, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify({ data: { type: "profile", attributes: { email } } }),
    });
    type PRes = { data?: { id: string }; errors?: Array<{ meta?: { duplicate_profile_id?: string } }> };
    const pData = await pRes.json() as PRes;
    const profileId = pData.data?.id ?? pData.errors?.[0]?.meta?.duplicate_profile_id;

    if (!profileId) return;

    // Add to list
    await fetch(`${BASE}/lists/${listId}/relationships/profiles/`, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify({ data: [{ type: "profile", id: profileId }] }),
    });
  } catch { /* silent */ }
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json() as unknown);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { email, name, city, college, instagram, heard_from, source, referred_by } = parsed.data;

  // Generate referral code for this new Regular
  const referralCode = generateReferralCode();

  // ── DB path ─────────────────────────────────────────────────────────────
  if (dbReady()) {
    try {
      const { db }               = await import("@/lib/db/client");
      const { regulars, referrals } = await import("@/lib/db/schema");
      const { eq }               = await import("drizzle-orm");

      // Upsert regular — if email already exists, return existing referral code
      const existing = await db
        .select({ referralCode: regulars.referralCode, id: regulars.id })
        .from(regulars)
        .where(eq(regulars.email, email))
        .limit(1);

      if (existing.length > 0) {
        // Already a Regular — return their existing code
        void klaviyoSubscribe(email);
        return NextResponse.json({
          success:      true,
          referralCode: existing[0].referralCode,
          returning:    true,
        });
      }

      // Insert new Regular
      const [newRegular] = await db
        .insert(regulars)
        .values({
          email,
          name:           name    ?? "Unknown",
          city:           city    ?? "Unknown",
          college:        college  ?? null,
          instagram:      instagram ?? null,
          referralSource: heard_from ?? source ?? null,
          referralCode,
          referredBy:     referred_by ?? null,
        })
        .returning({ id: regulars.id });

      // Create referrals ledger entry for this new code
      if (newRegular) {
        await db.insert(referrals).values({
          code:       referralCode,
          ownerEmail: email,
          redemptions: 0,
        });

        // Increment redemptions on the code that referred them
        if (referred_by) {
          await db
            .update(referrals)
            .set({ redemptions: db.$count(referrals, eq(referrals.code, referred_by)) })
            .where(eq(referrals.code, referred_by));
        }
      }

      // Klaviyo (non-blocking)
      void klaviyoSubscribe(email);

      return NextResponse.json({ success: true, referralCode });

    } catch (err) {
      console.error("[regulars] DB error:", err);
      // Fall through to Klaviyo-only path
    }
  }

  // ── No DB / fallback path ────────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    console.log("[regulars:dev]", { email, name, city, referralCode });
  }

  void klaviyoSubscribe(email);

  return NextResponse.json({ success: true, referralCode });
}
