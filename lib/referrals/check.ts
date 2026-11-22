// Referral rules at reserve time. A code is usable only if it exists and does NOT
// belong to the buyer — same email, same phone, or same signed-in user all count as "self".

import { and, eq, sql } from "drizzle-orm";
import type { Db, Tx } from "@/lib/db/client";
import { referrals, reservations, users } from "@/lib/db/schema";

export type ReferralVerdict =
  | { ok: true;  code: string }
  | { ok: false; reason: "unknown_code" | "self_referral" };

export async function checkReferral(
  conn:  Db | Tx,
  code:  string,
  buyer: { email: string; phone: string; userId: string | null },
): Promise<ReferralVerdict> {
  const normalised = code.trim().toUpperCase();
  const [ref] = await conn.select({ code: referrals.code, ownerEmail: referrals.ownerEmail })
    .from(referrals).where(eq(referrals.code, normalised)).limit(1);
  if (!ref) return { ok: false, reason: "unknown_code" };

  const ownerEmail = ref.ownerEmail.trim().toLowerCase();
  if (ownerEmail === buyer.email.trim().toLowerCase()) return { ok: false, reason: "self_referral" };

  // The owner's account, if they have one.
  if (buyer.userId) {
    const [owner] = await conn.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${ownerEmail}`).limit(1);
    if (owner && owner.id === buyer.userId) return { ok: false, reason: "self_referral" };
  }

  // The owner's phone is whatever they used on their own orders.
  const [samePhone] = await conn.select({ id: reservations.id }).from(reservations)
    .where(and(sql`lower(${reservations.email}) = ${ownerEmail}`, eq(reservations.phone, buyer.phone)))
    .limit(1);
  if (samePhone) return { ok: false, reason: "self_referral" };

  return { ok: true, code: ref.code };
}
