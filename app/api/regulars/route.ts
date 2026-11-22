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
import { eq, sql }           from "drizzle-orm";
import { db, dbReady, generateReferralCode } from "@/lib/db/client";
import { regulars, referrals } from "@/lib/db/schema";

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

  const { name, city, college, instagram, heard_from, source, referred_by } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  // ── DB path ─────────────────────────────────────────────────────────────
  if (dbReady()) {
    try {
      const findExisting = () =>
        db.select({ referralCode: regulars.referralCode })
          .from(regulars)
          .where(sql`lower(${regulars.email}) = ${email}`)
          .limit(1);

      // Already a Regular — return their existing code. (Never counts as a redemption.)
      const [existing] = await findExisting();
      if (existing) {
        void klaviyoSubscribe(email);
        return NextResponse.json({ success: true, referralCode: existing.referralCode, returning: true });
      }

      // Only a code that exists counts, and nobody can redeem their own.
      let referrerCode: string | null = null;
      if (referred_by) {
        const [ref] = await db
          .select({ code: referrals.code, ownerEmail: referrals.ownerEmail })
          .from(referrals)
          .where(eq(referrals.code, referred_by))
          .limit(1);
        if (ref && ref.ownerEmail.trim().toLowerCase() !== email) referrerCode = ref.code;
      }

      // A fresh random code can (rarely) collide with an existing one: retry with a new one.
      for (let attempt = 0; attempt < 6; attempt++) {
        const referralCode = generateReferralCode();

        const created = await db.transaction(async (tx) => {
          const [row] = await tx
            .insert(regulars)
            .values({
              email,
              name:           name    ?? "Unknown",
              city:           city    ?? "Unknown",
              college:        college  ?? null,
              instagram:      instagram ?? null,
              referralSource: heard_from ?? source ?? null,
              referralCode,
              referredBy:     referrerCode,
            })
            .onConflictDoNothing() // email already inserted by a concurrent request, or code collision
            .returning({ id: regulars.id });
          if (!row) return false;

          await tx.insert(referrals).values({ code: referralCode, ownerEmail: email, redemptions: 0 });
          // `referredBy` above keeps the code as ATTRIBUTION. It is NOT a redemption: referrals.redemptions
          // counts only paid deposits (lib/payments/settle.ts → redeemReferral), so signing up adds nothing.
          return true;
        });

        if (created) {
          void klaviyoSubscribe(email);
          return NextResponse.json({ success: true, referralCode });
        }

        // Not created: either this email just got registered (race) or the code collided.
        const [raced] = await findExisting();
        if (raced) {
          void klaviyoSubscribe(email);
          return NextResponse.json({ success: true, referralCode: raced.referralCode, returning: true });
        }
      }

      throw new Error("could not allocate a unique referral code");

    } catch (err) {
      console.error("[regulars] DB error:", err);
      // Don't claim success with a referral code that isn't stored.
      return NextResponse.json({ error: "Couldn't sign you up right now. Try again." }, { status: 500 });
    }
  }

  // ── No DB (local dev) ────────────────────────────────────────────────────
  const referralCode = generateReferralCode();
  if (process.env.NODE_ENV === "development") {
    console.log("[regulars:dev]", { email, name, city, referralCode });
  }

  void klaviyoSubscribe(email);

  return NextResponse.json({ success: true, referralCode });
}
