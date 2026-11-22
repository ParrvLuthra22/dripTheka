// Per-colourway capacity. A unit is "committed" when its reservation is paid
// (deposit_paid and later) or is a pending hold younger than POUR.holdMinutes.
// Older pending rows are ignored — their slot is released automatically.

import { sql } from "drizzle-orm";
import type { Db, Tx } from "@/lib/db/client";
import { POUR } from "@/lib/config";

export class TappedOutError extends Error {
  constructor(public readonly slug: string) {
    super("tapped_out");
    this.name = "TappedOutError";
  }
}

/** Units of `slug` currently committed (paid + fresh pending). Age is evaluated by the DB clock. */
export async function committedUnits(conn: Db | Tx, slug: string): Promise<number> {
  const res = await conn.execute(sql`
    SELECT COALESCE(SUM(ri.qty), 0)::int AS n
    FROM reservation_items ri
    JOIN reservations r ON r.id = ri.reservation_id
    WHERE ri.product_slug = ${slug}
      AND (
        r.status IN ('deposit_paid', 'drop_unlocked', 'fulfilled')
        OR (r.status = 'pending' AND r.created_at > now() - make_interval(mins => ${POUR.holdMinutes}))
      )
  `);
  return Number((res.rows[0] as { n: number } | undefined)?.n ?? 0);
}

/** Serialises capacity checks + inserts across all concurrent reservations. */
export async function lockCapacity(tx: Tx): Promise<void> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('drip-theka:capacity'))`);
}
