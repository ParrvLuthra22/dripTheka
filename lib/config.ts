// Drip Theka — business config. One place for the numbers that other modules
// (reserve route, webhook, UI countdowns, product data) must agree on.

/** Opening Night. Drives countdowns and receipt copy. (Set the real date here.) */
export const DROP_DATE = new Date("2026-09-01T18:00:00+05:30");

/** Share of the order value charged now; the rest is the balance. */
export const DEPOSIT_PERCENT = 30;

/** Deposit in paise for an order subtotal in paise. The ONLY place this is computed. */
export function depositPaiseFor(subtotalPaise: number): number {
  return Math.round((subtotalPaise * DEPOSIT_PERCENT) / 100);
}

/** Units per colourway that can be reserved. Placeholder until real numbers are set per product. */
export const DEFAULT_COLOURWAY_CAPACITY = 100;

/** A pending (unpaid) reservation holds its units for this long, then the slot is released. */
export const PENDING_HOLD_MINUTES = 30;

/** Pour that `pour_progress` tracks. */
export const POUR_SLUG = "001";
