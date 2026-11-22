// The glasses: one per design. What the public sees of a pour — how full each design is.
//
//   poured = PAID units            (deposit_paid and later)
//   left   = cap − poured − fresh pending holds   (what a buyer can actually still get)
//   state  = 'tapped'  status isn't 'open' (tapped / refilling) or poured ≥ cap
//            'last'    poured ≥ lastCallAt (90%) of cap — LAST CALL
//            'open'    otherwise
//
// Numbers come ONLY from the database (plus the configured cap for a design nobody has touched
// yet). If the database can't be read the caller must answer 503 — never invent a fill.

import { sql } from "drizzle-orm";
import type { Db, Tx } from "@/lib/db/client";
import { db } from "@/lib/db/client";
import { pourDesigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { POUR, capFor } from "@/lib/config";
import { POUR_DESIGNS, glassKeyOf } from "./designs";

export type GlassState = "open" | "last" | "tapped";

export interface Glass {
  design: string;
  cap:    number;
  poured: number;
  left:   number;
  state:  GlassState;
}

export function glassState(poured: number, cap: number, status: "open" | "tapped" | "refilling" = "open"): GlassState {
  if (status !== "open" || poured >= cap) return "tapped";
  if (poured >= cap * POUR.lastCallAt - 1e-9) return "last";
  return "open";
}

export async function getGlasses(conn: Db | Tx = db): Promise<Glass[]> {
  const [rows, units] = await Promise.all([
    conn.select().from(pourDesigns).where(eq(pourDesigns.pourId, POUR.id)),
    conn.execute(sql`
      SELECT ri.product_slug AS slug,
        COALESCE(SUM(ri.qty) FILTER (WHERE r.status IN ('deposit_paid', 'drop_unlocked', 'fulfilled')), 0)::int AS paid,
        COALESCE(SUM(ri.qty) FILTER (WHERE r.status = 'pending' AND r.created_at > now() - make_interval(mins => ${POUR.holdMinutes})), 0)::int AS held
      FROM reservation_items ri JOIN reservations r ON r.id = ri.reservation_id
      GROUP BY ri.product_slug
    `),
  ]);

  const paid = new Map<string, number>();
  const held = new Map<string, number>();
  for (const u of units.rows as { slug: string; paid: number; held: number }[]) {
    const d = glassKeyOf(u.slug);
    paid.set(d, (paid.get(d) ?? 0) + Number(u.paid));
    held.set(d, (held.get(d) ?? 0) + Number(u.held));
  }
  const byDesign = new Map(rows.map((r) => [r.designId, r]));

  return POUR_DESIGNS.map(({ id }) => {
    const row    = byDesign.get(id);
    const cap    = row?.cap ?? capFor(id);
    const poured = paid.get(id) ?? 0;
    const state  = glassState(poured, cap, row?.status ?? "open");
    const left   = state === "tapped" ? 0 : Math.max(cap - poured - (held.get(id) ?? 0), 0);
    return { design: id, cap, poured, left, state };
  });
}
