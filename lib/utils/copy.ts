/**
 * /lib/utils/copy.ts — Helpers for working with /data/copy.ts
 *
 * Three exported utilities:
 *   pickRandom<T>     — randomly pick from an array
 *   getCartMessage    — map item count → cart state message
 *   getBadge          — map order count → loyalty badge label
 *   getSessionWisdom  — pin one footer wisdom line for the whole session
 *
 * All fully typed. No `any`. Safe in SSR (guards on sessionStorage).
 */

import { copy } from "@/data/copy";

// ── pickRandom ────────────────────────────────────────────────────────────

/**
 * Return a random element from a non-empty readonly array.
 *
 *   pickRandom(copy.loading.generic)  → "Bottle's stuck. One sec."
 *   pickRandom(copy.cart.addedToast) → "Poured."
 */
export function pickRandom<T>(arr: ReadonlyArray<T>): T {
  if (arr.length === 0) {
    throw new RangeError("pickRandom: array must not be empty");
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── getCartMessage ────────────────────────────────────────────────────────

/**
 * Map an item count to the matching cart state message.
 *
 *   getCartMessage(0)  → "Glass is dry. Sad."
 *   getCartMessage(3)  → "Bro you're not even hiding it."
 *   getCartMessage(10) → "Stop. Please. The bartender's tired."
 *
 * Falls back to copy.cart.empty if no range covers the count
 * (shouldn't happen, but defensive is better than "undefined").
 */
export function getCartMessage(itemCount: number): string {
  const match = copy.cart.states.find(
    ({ range }) => itemCount >= range[0] && itemCount <= range[1]
  );
  return match ? match.message : copy.cart.empty;
}

// ── getBadge ──────────────────────────────────────────────────────────────

export interface Badge {
  label: string;
  tier: number;
  perk?: string;
}

/** Tier table — index doubles as the `tier` number. Order count is inclusive of `min`. */
const BADGE_TIERS: ReadonlyArray<{ min: number; label: string; perk?: string }> = [
  { min: 0, label: "WALK-IN" },
  { min: 1, label: "FIRST-TIMER",        perk: "you broke the seal" },
  { min: 2, label: "FAMILIAR FACE",      perk: "we're starting to recognise you" },
  { min: 4, label: "REGULAR",            perk: "your stool is waiting" },
  { min: 6, label: "VIP · ON THE HOUSE", perk: "next round's on us (figuratively)" },
];

/**
 * Map a user's total confirmed order count to their Regular Status badge.
 *
 *   getBadge(0) → { label: "WALK-IN", tier: 0 }
 *   getBadge(1) → { label: "FIRST-TIMER", tier: 1, perk: "you broke the seal" }
 *   getBadge(5) → { label: "REGULAR", tier: 3, perk: "your stool is waiting" }
 *   getBadge(6) → { label: "VIP · ON THE HOUSE", tier: 4, perk: "..." }
 */
export function getBadge(orderCount: number): Badge {
  let tier = 0;
  for (let i = 0; i < BADGE_TIERS.length; i++) {
    if (orderCount >= BADGE_TIERS[i].min) tier = i;
  }
  const { label, perk } = BADGE_TIERS[tier];
  return { label, tier, perk };
}

/**
 * Progress toward the next Regular Status tier.
 * Returns null once the user has hit the top tier (VIP).
 *
 *   getBadgeProgress(4) → { current: 4, target: 6, nextLabel: "VIP · ON THE HOUSE", percent: 50 }
 */
export function getBadgeProgress(
  orderCount: number
): { current: number; target: number; nextLabel: string; percent: number } | null {
  const { tier } = getBadge(orderCount);
  if (tier >= BADGE_TIERS.length - 1) return null;

  const prevThreshold = BADGE_TIERS[tier].min;
  const target        = BADGE_TIERS[tier + 1].min;
  const percent       = Math.min(100, ((orderCount - prevThreshold) / (target - prevThreshold)) * 100);

  return { current: orderCount, target, nextLabel: BADGE_TIERS[tier + 1].label, percent };
}

// ── getSessionWisdom ──────────────────────────────────────────────────────

const WISDOM_SESSION_KEY = "dt-footer-wisdom-idx";

/**
 * Return one footer wisdom line, stable for the entire browser session.
 * A random index is picked on first call and saved to sessionStorage,
 * so the line doesn't change as the user navigates between pages.
 *
 * SSR-safe: returns the first wisdom line when window is unavailable.
 *
 *   getSessionWisdom() → "phir milenge, regular."
 */
export function getSessionWisdom(): string {
  const wisdom = copy.footer.wisdom;

  // SSR — no sessionStorage available
  if (typeof window === "undefined") {
    return wisdom[0];
  }

  const stored = sessionStorage.getItem(WISDOM_SESSION_KEY);

  if (stored !== null) {
    const idx = parseInt(stored, 10);
    // Guard against stale index if the wisdom array shrinks
    if (!Number.isNaN(idx) && idx >= 0 && idx < wisdom.length) {
      return wisdom[idx];
    }
  }

  // First visit this session — pick and persist
  const idx = Math.floor(Math.random() * wisdom.length);
  sessionStorage.setItem(WISDOM_SESSION_KEY, String(idx));
  return wisdom[idx];
}
