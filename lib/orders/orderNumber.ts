// Order numbers: DT-<10 chars>. The 10 chars come from a 32-letter alphabet with the
// look-alikes removed (no 0, 1, I, O) — 32^10 ≈ 1.1×10^15 values — drawn with
// crypto.randomInt, so they are neither guessable nor sequential. Uniqueness is
// enforced by the DB (UNIQUE order_number); `insertWithUniqueOrderNumber` retries on collision.

import { randomInt } from "node:crypto";

export const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ORDER_SUFFIX_LENGTH = 10;

export function generateOrderNumber(): string {
  const suffix = Array.from({ length: ORDER_SUFFIX_LENGTH }, () => ORDER_ALPHABET[randomInt(ORDER_ALPHABET.length)]).join("");
  return `DT-${suffix}`;
}
