// Who is making this request, as far as orders are concerned.
//
// `userId` comes from the signed session. `emailVerified` is read from the DATABASE (users.email_verified),
// not from the JWT, so a stale or forged claim can't widen access. Account routes match
// reservations by user_id first and fall back to the email ONLY when it is verified.

import { and, eq, isNull, or, sql, type SQL } from "drizzle-orm";
import { db, dbReady, type Db, type Tx } from "@/lib/db/client";
import { reservations, users } from "@/lib/db/schema";

export interface Account {
  userId:        string;
  /** Lower-cased account email. */
  email:         string | null;
  emailVerified: boolean;
}

/** Resolve a session's user id to an account (null if there is no such user). */
export async function accountForUserId(conn: Db | Tx, userId: string | null | undefined): Promise<Account | null> {
  if (!userId) return null;
  const [u] = await conn.select({ id: users.id, email: users.email, emailVerified: users.emailVerified })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return null;
  return { userId: u.id, email: u.email ? u.email.trim().toLowerCase() : null, emailVerified: !!u.emailVerified };
}

/** The signed-in account for this request, or null for a guest / when auth or the DB isn't available. */
export async function getAccount(): Promise<Account | null> {
  if (!dbReady()) return null;
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    return await accountForUserId(db, session?.user?.id);
  } catch { return null; } // no session / auth not configured → guest
}

/** WHERE clause: reservations this account owns — its user_id, or an unclaimed guest order under its VERIFIED email. */
export function ownedBy(account: Account): SQL {
  const byUser = eq(reservations.userId, account.userId);
  if (!account.emailVerified || !account.email) return byUser;
  return or(byUser, and(isNull(reservations.userId), sql`lower(${reservations.email}) = ${account.email}`))!;
}
