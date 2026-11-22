import { test } from "node:test";
import assert from "node:assert/strict";
import { makeReceiptToken, verifyReceiptToken } from "./receiptToken";
import { generateOrderNumber, ORDER_ALPHABET } from "./orderNumber";

const S = "test-secret";

test("a token verifies for its own order number + email", () => {
  const t = makeReceiptToken("DT-2026-ABCDEFGHJK", "a@b.com", S);
  assert.equal(verifyReceiptToken(t, "DT-2026-ABCDEFGHJK", "a@b.com", S), true);
});

test("email is case/whitespace-insensitive", () => {
  const t = makeReceiptToken("DT-2026-ABCDEFGHJK", " A@B.com ", S);
  assert.equal(verifyReceiptToken(t, "DT-2026-ABCDEFGHJK", "a@b.COM", S), true);
});

test("rejects a different order number, a different email, a wrong secret, tampering, and empty", () => {
  const t = makeReceiptToken("DT-2026-ABCDEFGHJK", "a@b.com", S);
  assert.equal(verifyReceiptToken(t, "DT-2026-ZZZZZZZZZZ", "a@b.com", S), false);
  assert.equal(verifyReceiptToken(t, "DT-2026-ABCDEFGHJK", "evil@b.com", S), false);
  assert.equal(verifyReceiptToken(t, "DT-2026-ABCDEFGHJK", "a@b.com", "other-secret"), false);
  assert.equal(verifyReceiptToken(t.slice(0, -2) + "xx", "DT-2026-ABCDEFGHJK", "a@b.com", S), false);
  assert.equal(verifyReceiptToken("", "DT-2026-ABCDEFGHJK", "a@b.com", S), false);
  assert.equal(verifyReceiptToken(null, "DT-2026-ABCDEFGHJK", "a@b.com", S), false);
});

test("the order number alone is not a credential", () => {
  assert.equal(verifyReceiptToken("DT-2026-ABCDEFGHJK", "DT-2026-ABCDEFGHJK", "a@b.com", S), false);
});

test("order numbers: ≥10 chars from the unambiguous alphabet (no 0/O/1/I)", () => {
  assert.ok(!/[01OIL]/.test(ORDER_ALPHABET));
  for (let i = 0; i < 500; i++) {
    const [, , suffix] = generateOrderNumber().split("-");
    assert.ok(suffix.length >= 10);
    assert.match(suffix, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
  }
});
