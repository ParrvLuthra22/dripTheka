import { test } from "node:test";
import assert from "node:assert/strict";
import { makeReceiptToken, verifyReceiptToken } from "./receiptToken";
import { generateOrderNumber, ORDER_ALPHABET } from "./orderNumber";

const S = "test-secret";

test("a token verifies for its own order number + email", () => {
  const t = makeReceiptToken("DT-ABCDEFGHJK", "a@b.com", S);
  assert.equal(verifyReceiptToken(t, "DT-ABCDEFGHJK", "a@b.com", S), true);
});

test("email is case/whitespace-insensitive", () => {
  const t = makeReceiptToken("DT-ABCDEFGHJK", " A@B.com ", S);
  assert.equal(verifyReceiptToken(t, "DT-ABCDEFGHJK", "a@b.COM", S), true);
});

test("rejects a different order number, a different email, a wrong secret, tampering, and empty", () => {
  const t = makeReceiptToken("DT-ABCDEFGHJK", "a@b.com", S);
  assert.equal(verifyReceiptToken(t, "DT-2026-ZZZZZZZZZZ", "a@b.com", S), false);
  assert.equal(verifyReceiptToken(t, "DT-ABCDEFGHJK", "evil@b.com", S), false);
  assert.equal(verifyReceiptToken(t, "DT-ABCDEFGHJK", "a@b.com", "other-secret"), false);
  assert.equal(verifyReceiptToken(t.slice(0, -2) + "xx", "DT-ABCDEFGHJK", "a@b.com", S), false);
  assert.equal(verifyReceiptToken("", "DT-ABCDEFGHJK", "a@b.com", S), false);
  assert.equal(verifyReceiptToken(null, "DT-ABCDEFGHJK", "a@b.com", S), false);
});

test("the order number alone is not a credential", () => {
  assert.equal(verifyReceiptToken("DT-ABCDEFGHJK", "DT-ABCDEFGHJK", "a@b.com", S), false);
});

test("order numbers: DT- + exactly 10 chars from ABCDEFGHJKLMNPQRSTUVWXYZ23456789", () => {
  assert.equal(ORDER_ALPHABET, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789");
  assert.ok(!/[01OI]/.test(ORDER_ALPHABET));
  assert.equal(new Set(ORDER_ALPHABET).size, 32);
  for (let i = 0; i < 500; i++) assert.match(generateOrderNumber(), /^DT-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/);
  assert.notEqual(generateOrderNumber(), generateOrderNumber());
});
