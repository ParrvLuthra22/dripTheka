// Drip Theka — business config. One place for the numbers that other modules
// (reserve route, webhook, glasses API, UI countdowns, product data) must agree on.
// Prices are NOT here: they always come from the product data (data/pour-001.ts).

export const POUR = {
  id: "001",
  closesAt: "2026-12-02T23:59:00+05:30", // TODO founders: confirm
  depositPct: 0.30,
  capPerDesign: 50,                     // TODO founders: confirm
  /** Per-design override of capPerDesign, keyed by design slug, e.g. { "janwar": 80 }. */
  capOverrides: {} as Record<string, number>,
  lastCallAt: 0.9,                      // LAST CALL at 90% full
  holdMinutes: 30,
  balance: { online: true, cod: true },
} as const;

/**
 * The "buy a friend a round" reward shown on the receipt and /tab copy, in paise. Display only for now:
 * nothing applies it at settlement yet. TODO founders: confirm the amount and when it is applied.
 */
export const REFERRAL_REWARD_PAISE = 10000;

/** Whole-number deposit percentage, for display / product data. */
export const DEPOSIT_PERCENT = Math.round(POUR.depositPct * 100);

/** Deposit in paise for an order subtotal in paise. The ONLY place this is computed. */
export function depositPaiseFor(subtotalPaise: number): number {
  return Math.round(subtotalPaise * POUR.depositPct);
}

/** Capacity (units) a design is SEEDED with: its override, else the pour-wide default. */
export function capFor(designId: string): number {
  return POUR.capOverrides[designId] ?? POUR.capPerDesign;
}

/** When the pour closes. */
export const pourClosesAt = (): Date => new Date(POUR.closesAt);

/** True once the pour has closed (reserve answers 410 POUR_CLOSED). */
export const isPourClosed = (now: number = Date.now()): boolean => now >= Date.parse(POUR.closesAt);
