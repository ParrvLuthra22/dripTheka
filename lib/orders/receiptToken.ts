// Signed receipt links. The success-page / receipt link carries
//   t = base64url( HMAC-SHA256(secret, "receipt:v1|<ORDER NUMBER>|<email, lowercased>") )
// so knowing an order number alone is not enough to read an order.
// Secret: RECEIPT_TOKEN_SECRET (falls back to AUTH_SECRET). Never exposed to the client.

import { createHmac, timingSafeEqual } from "node:crypto";

function secretOrThrow(explicit?: string): string {
  const s = explicit ?? process.env.RECEIPT_TOKEN_SECRET ?? process.env.AUTH_SECRET;
  if (!s) throw new Error("RECEIPT_TOKEN_SECRET (or AUTH_SECRET) is not set");
  return s;
}

const norm = (email: string) => email.trim().toLowerCase();

export function makeReceiptToken(orderNumber: string, email: string, secret?: string): string {
  return createHmac("sha256", secretOrThrow(secret))
    .update(`receipt:v1|${orderNumber}|${norm(email)}`)
    .digest("base64url");
}

export function verifyReceiptToken(token: string | null | undefined, orderNumber: string, email: string, secret?: string): boolean {
  if (!token) return false;
  const expected = Buffer.from(makeReceiptToken(orderNumber, email, secret));
  const given    = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(expected, given);
}
