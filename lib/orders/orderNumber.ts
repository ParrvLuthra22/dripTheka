// Order numbers: DT-<year>-<10 chars>. The 10 chars come from an alphabet with
// no look-alikes (no 0/O, 1/I, L) — 31^10 ≈ 8×10^14 values — drawn from a CSPRNG,
// so they are neither guessable nor sequential. Uniqueness is enforced by the DB
// (UNIQUE order_number); `insertWithUniqueOrderNumber` retries on collision.

import { randomInt } from "node:crypto";

export const ORDER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ORDER_SUFFIX_LENGTH = 10;

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const suffix = Array.from({ length: ORDER_SUFFIX_LENGTH }, () => ORDER_ALPHABET[randomInt(ORDER_ALPHABET.length)]).join("");
  return `DT-${year}-${suffix}`;
}
