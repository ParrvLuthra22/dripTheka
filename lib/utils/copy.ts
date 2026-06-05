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

/**
 * Map a user's total confirmed order count to their loyalty badge label.
 *
 *   getBadge(0)  → "Walk-in · aao baithe raho"
 *   getBadge(1)  → "First Round · welcome"
 *   getBadge(4)  → "Familiar Face · waapas aa gaye"
 *   getBadge(8)  → "Regular · table ready hai"
 *   getBadge(11) → "Khaas Mehman · permanent tab"
 */
export function getBadge(orderCount: number): string {
  if (orderCount <= 0) return copy.badges.walkIn;
  if (orderCount === 1) return copy.badges.firstTimer;
  if (orderCount <= 5) return copy.badges.familiarFace;
  if (orderCount <= 10) return copy.badges.regular;
  return copy.badges.vip;
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
