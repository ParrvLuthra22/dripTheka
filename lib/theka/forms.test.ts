import { test } from "node:test";
import assert from "node:assert/strict";
import { normalisePhone, refillOutcome, validEmail, validPhone, validPin } from "./forms.ts";

test("phone: Indian mobile ^[6-9]\\d{9}$ after tidying +91 / 0 / spaces", () => {
  for (const ok of ["9876543210", "98765 43210", "+91 98765 43210", "+919876543210", "09876543210", "98765-43210", "6000000000"]) {
    assert.ok(validPhone(ok), ok);
    assert.equal(normalisePhone(ok).length, 10);
  }
  for (const bad of ["", "1234567890", "5876543210", "98765", "98765432101", "+91 12345 67890", "abcdefghij", "9876543210987"]) assert.ok(!validPhone(bad), bad);
});

test("email and PIN", () => {
  assert.ok(validEmail(" a@b.co ")); assert.ok(!validEmail("a@b")); assert.ok(!validEmail("a b@c.com")); assert.ok(!validEmail(""));
  assert.ok(validPin("110001")); assert.ok(!validPin("11000")); assert.ok(!validPin("1100011")); assert.ok(!validPin("11000a"));
});

test("refill answers: 201 and duplicate are both 'you're on the list'; 429 is friendly; 400 keeps the server's words", () => {
  assert.deepEqual(refillOutcome(201, { }), { kind: "joined" });
  assert.deepEqual(refillOutcome(409, { code: "ALREADY_ON_LIST" }), { kind: "joined" });
  assert.deepEqual(refillOutcome(429, { code: "RATE_LIMITED" }), { kind: "rate_limited" });
  assert.deepEqual(refillOutcome(400, { error: "Invalid mobile number" }), { kind: "invalid", message: "Invalid mobile number" });
  assert.deepEqual(refillOutcome(409, { code: "OTHER" }), { kind: "down" });
  assert.deepEqual(refillOutcome(503, null), { kind: "down" });
});
