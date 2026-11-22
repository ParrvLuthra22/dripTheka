// GET /api/account/referrals — returns the signed-in user's referral code,
// how many people redeemed it, and who they were (first name + city).
import { NextResponse } from "next/server";
import { getAccount }   from "@/lib/accounts/session";

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

type ReferralResponse = {
  code: string | null;
  redemptions: number;
  redeemedBy: { firstName: string; city: string }[];
};

const EMPTY: ReferralResponse = { code: null, redemptions: 0, redeemedBy: [] };

export async function GET() {
  const account = await getAccount();
  if (!account) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  // Referral data is keyed by email — only hand it to the holder of a VERIFIED one.
  if (!account.emailVerified || !account.email) {
    return NextResponse.json(EMPTY);
  }

  if (!dbReady()) {
    return NextResponse.json(EMPTY);
  }

  try {
    const { db }                   = await import("@/lib/db/client");
    const { regulars, referrals }  = await import("@/lib/db/schema");
    const { eq }                   = await import("drizzle-orm");

    const [regular] = await db
      .select({ referralCode: regulars.referralCode })
      .from(regulars)
      .where(eq(regulars.email, account.email))
      .limit(1);

    if (!regular) {
      return NextResponse.json(EMPTY);
    }

    const [referral] = await db
      .select({ redemptions: referrals.redemptions })
      .from(referrals)
      .where(eq(referrals.code, regular.referralCode))
      .limit(1);

    const redeemers = await db
      .select({ name: regulars.name, city: regulars.city })
      .from(regulars)
      .where(eq(regulars.referredBy, regular.referralCode));

    const response: ReferralResponse = {
      code: regular.referralCode,
      redemptions: referral?.redemptions ?? 0,
      redeemedBy: redeemers.map((r) => ({
        firstName: r.name.split(" ")[0],
        city: r.city,
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[account/referrals]", err);
    return NextResponse.json(EMPTY, { status: 200 });
  }
}
