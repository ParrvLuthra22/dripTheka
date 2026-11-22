// Per-DESIGN capacity ("one glass per design"). A design's colourways share one glass.
//
// A unit is "committed" when its reservation is paid (deposit_paid and later) or is a
// pending hold younger than POUR.holdMinutes. Older pending rows are ignored — their
// slot is released automatically.
//
// Concurrency: reserving locks the design's pour_designs row (SELECT … FOR UPDATE), in
// sorted design order so two carts can't deadlock. Anything that reads "committed" and
// then writes does so while holding that lock, so two buyers racing for the last slot —
// even in different colourways — are serialised and exactly one wins.

import { and, eq, inArray, or, gt, sql } from "drizzle-orm";
import type { Db, Tx } from "@/lib/db/client";
import { opsAlerts, pourDesigns, reservationItems, reservations } from "@/lib/db/schema";
import { POUR, capFor } from "@/lib/config";
import { glassKeyOf, glassSlugs } from "@/lib/pour/designs";

export const PAID_STATUSES = ["deposit_paid", "drop_unlocked", "fulfilled"] as const;

export class TappedOutError extends Error {
  /** `design` is the glass that is full; `slug` is the first requested colourway of it. */
  constructor(public readonly design: string, public readonly slug: string = design) {
    super("tapped_out");
    this.name = "TappedOutError";
  }
}

/** Make sure the design's row exists, seeded from config. Never overwrites an existing cap. */
export async function ensurePourDesign(
  conn: Db | Tx, designId: string, seedCap: (design: string) => number = capFor,
): Promise<void> {
  await conn.insert(pourDesigns)
    .values({ pourId: POUR.id, designId, cap: seedCap(designId), status: "open" })
    .onConflictDoNothing();
}

/** Lock the design row for the rest of the transaction and return it. */
export async function lockDesign(tx: Tx, designId: string): Promise<{ cap: number; status: "open" | "tapped" | "refilling" }> {
  const [row] = await tx.select({ cap: pourDesigns.cap, status: pourDesigns.status })
    .from(pourDesigns)
    .where(and(eq(pourDesigns.pourId, POUR.id), eq(pourDesigns.designId, designId)))
    .for("update");
  if (!row) throw new Error(`pour_designs row missing for ${designId}`);
  return row;
}

/** Units of a design committed right now (paid + fresh pending holds). Age uses the DB clock. */
export async function committedUnits(conn: Db | Tx, designId: string): Promise<number> {
  const [row] = await conn
    .select({ n: sql<number>`COALESCE(SUM(${reservationItems.qty}), 0)::int` })
    .from(reservationItems)
    .innerJoin(reservations, eq(reservations.id, reservationItems.reservationId))
    .where(and(
      inArray(reservationItems.productSlug, glassSlugs(designId)),
      or(
        inArray(reservations.status, [...PAID_STATUSES]),
        and(
          eq(reservations.status, "pending"),
          gt(reservations.createdAt, sql`now() - make_interval(mins => ${POUR.holdMinutes})`),
        ),
      ),
    ));
  return Number(row?.n ?? 0);
}

/** Units of a design that are PAID (what "poured" means). */
export async function paidUnits(conn: Db | Tx, designId: string): Promise<number> {
  const [row] = await conn
    .select({ n: sql<number>`COALESCE(SUM(${reservationItems.qty}), 0)::int` })
    .from(reservationItems)
    .innerJoin(reservations, eq(reservations.id, reservationItems.reservationId))
    .where(and(
      inArray(reservationItems.productSlug, glassSlugs(designId)),
      inArray(reservations.status, [...PAID_STATUSES]),
    ));
  return Number(row?.n ?? 0);
}

/** The distinct designs a reservation touches, sorted (the global lock order). */
export async function designsOfReservation(conn: Db | Tx, reservationId: string): Promise<string[]> {
  const rows = await conn.select({ slug: reservationItems.productSlug }).from(reservationItems)
    .where(eq(reservationItems.reservationId, reservationId));
  return [...new Set(rows.map((r) => glassKeyOf(r.slug)))].sort();
}

/**
 * Run inside the transaction that just flipped a reservation to PAID.
 *  • paid units ≥ cap  → status 'tapped'
 *  • paid units > cap  → this payment overfilled the glass (it landed after its hold expired and
 *    someone else took the slot). We never discard money, so it stays paid, but we write an
 *    ops_alerts row and log at error level so a human refunds it.
 */
export async function afterPaid(tx: Tx, reservationId: string, reservationNumber?: string): Promise<void> {
  for (const design of await designsOfReservation(tx, reservationId)) {
    await ensurePourDesign(tx, design);
    const { cap, status } = await lockDesign(tx, design);
    const paid = await paidUnits(tx, design);

    if (paid >= cap && status === "open") {
      await tx.update(pourDesigns).set({ status: "tapped" })
        .where(and(eq(pourDesigns.pourId, POUR.id), eq(pourDesigns.designId, design)));
    }

    if (paid > cap) {
      const message = `OVERFILL: ${design} has ${paid} paid units for a cap of ${cap}. ` +
        `Reservation ${reservationNumber ?? reservationId} paid after its hold expired — refund the excess.`;
      const inserted = await tx.insert(opsAlerts)
        .values({ kind: "overfill", designId: design, reservationId, message, detail: { cap, paid, over: paid - cap } })
        .onConflictDoNothing()
        .returning({ id: opsAlerts.id });
      if (inserted.length) console.error(`[ops] ${message}`);
    }
  }
}

/** Run inside the transaction that just refunded a reservation: a tapped glass with room reopens. */
export async function afterRefund(tx: Tx, reservationId: string): Promise<void> {
  for (const design of await designsOfReservation(tx, reservationId)) {
    await ensurePourDesign(tx, design);
    const { cap, status } = await lockDesign(tx, design);
    if (status === "tapped" && (await paidUnits(tx, design)) < cap) {
      await tx.update(pourDesigns).set({ status: "open" })
        .where(and(eq(pourDesigns.pourId, POUR.id), eq(pourDesigns.designId, design)));
    }
  }
}
