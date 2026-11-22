// The bill, as pure maths. Every figure comes from the product data (unit price, in paise) and lib/config POUR
// (deposit %, hold, balance options) — the same functions the server prices with, so the drawer, Razorpay Checkout and
// the database always agree to the paisa.

import { depositPaiseFor, POUR } from "../config.ts";

/** One line of the bill: design + colourway (its own product slug) + size + qty. */
export interface BillLine {
  slug: string;
  /** The glass this colourway pours into. */
  designId: string;
  name: string;
  colourway: string;
  size: string;
  qty: number;
  /** Unit price in paise, from the product data. */
  unitPaise: number;
}

export interface BillTotals { subtotalPaise: number; depositPaise: number; balancePaise: number; units: number }

export function billTotals(lines: readonly Pick<BillLine, "unitPaise" | "qty">[]): BillTotals {
  const subtotalPaise = lines.reduce((t, l) => t + l.unitPaise * l.qty, 0);
  const depositPaise = depositPaiseFor(subtotalPaise);   // THE deposit formula (server uses the same)
  return { subtotalPaise, depositPaise, balancePaise: subtotalPaise - depositPaise, units: lines.reduce((t, l) => t + l.qty, 0) };
}

/** The most one line can hold: /api/reserve accepts qty ≤ 10 per line. */
export const MAX_QTY = 10;
/** …and ≤ 20 lines. */
export const MAX_LINES = 20;

/** Which balance methods the pour offers, in display order (POUR.balance). */
export function balanceOptions(balance: { online: boolean; cod: boolean } = POUR.balance): ("online" | "cod")[] {
  return (["online", "cod"] as const).filter((m) => balance[m]);
}

/** Lines whose glass is tapped (a 409 named its design). */
export const linesOfDesign = <T extends Pick<BillLine, "designId">>(lines: readonly T[], designId: string): T[] =>
  lines.filter((l) => l.designId === designId);

/** A stable identity for "what would be reserved": a changed cart / detail / method is a NEW reservation. */
export const fingerprint = (parts: unknown): string => JSON.stringify(parts);
