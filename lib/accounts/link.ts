// Linking guest orders to an account — ONLY through a verified email.
//
// An email typed into checkout proves nothing; an email Google (or a magic link) has verified
// does. So guest reservations are attached to a user only when users.email_verified is set and
// the emails match. Auth.js leaves email_verified NULL for OAuth users, so auth.ts stamps it
// from Google's `email_verified` claim on sign-in.

import { and, eq, isNull, sql } from "drizzle-orm";
import type { Db, Tx } from "@/lib/db/client";
import { reservations, users } from "@/lib/db/schema";

/** Mark the user's email verified (idempotent). Call only when the provider vouches for it. */
export async function markEmailVerified(conn: Db | Tx, userId: string): Promise<void> {
  await conn.update(users).set({ emailVerified: new Date() }).where(and(eq(users.id, userId), isNull(users.emailVerified)));
}

/** Attach this user's unclaimed guest reservations. A user whose email isn't verified claims nothing. */
export async function backfillUserId(conn: Db | Tx, userId: string): Promise<number> {
  const rows = await conn.execute(sql`
    UPDATE reservations r SET user_id = u.id
    FROM users u
    WHERE u.id = ${userId}
      AND u.email_verified IS NOT NULL
      AND r.user_id IS NULL
      AND lower(r.email) = lower(u.email)
    RETURNING r.id
  `);
  return rows.rows.length;
}
