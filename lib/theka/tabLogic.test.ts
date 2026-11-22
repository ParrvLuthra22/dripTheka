import { test } from "node:test";
import assert from "node:assert/strict";
import { balanceOptions, billTotals, linesOfDesign, MAX_QTY } from "./tabMath.ts";
import { DT_TABS_KEY, DT_TABS_MAX, readTabs, saveTab } from "./dtTabs.ts";
import { buildReserveBody, invalidFields, confirmOutcome, fieldOf, pollUntilPaid, razorpayOptions, reserveOutcome, type Details } from "./checkout.ts";

const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m }; };
const details: Details = { name: " Asha Rao ", phone: "+91 98765 43210", wa: true, email: " Asha@Example.com ", addr: "12 Test Street", pin: "110001", city: "New Delhi", state: "Delhi" };

// ── the bill ──
test("totals: deposit is the server's depositPaiseFor(subtotal), balance is the remainder — to the paisa", () => {
  const t = billTotals([{ unitPaise: 129900, qty: 2 }, { unitPaise: 129900, qty: 1 }]);
  assert.equal(t.subtotalPaise, 389700);
  assert.equal(t.depositPaise, Math.round(389700 * 0.3));   // 116910
  assert.equal(t.balancePaise, 389700 - 116910);
  assert.equal(t.units, 3);
  // a deposit with paise is NOT rounded to the rupee: 1 × ₹1,299 → ₹389.70
  assert.equal(billTotals([{ unitPaise: 129900, qty: 1 }]).depositPaise, 38970);
});
test("empty bill is all zeros", () => assert.deepEqual(billTotals([]), { subtotalPaise: 0, depositPaise: 0, balancePaise: 0, units: 0 }));
test("balance options come from POUR.balance", () => {
  assert.deepEqual(balanceOptions({ online: true, cod: true }), ["online", "cod"]);
  assert.deepEqual(balanceOptions({ online: false, cod: true }), ["cod"]);
  assert.deepEqual(balanceOptions({ online: false, cod: false }), []);
  assert.equal(MAX_QTY, 10);
});
test("a tapped design marks every colourway line of it", () => {
  const lines = [{ designId: "janwar", slug: "janwar-ink" }, { designId: "janwar", slug: "janwar-bone" }, { designId: "aap-zara", slug: "aap-zara-ink" }];
  assert.equal(linesOfDesign(lines, "janwar").length, 2);
});

// ── dt_tabs ──
test("dt_tabs: newest first, de-duplicated by order number, survives garbage and a throwing store", () => {
  const s = mem();
  assert.deepEqual(readTabs(s), []);
  saveTab(s, { orderNumber: "DT-A", token: "t1" });
  saveTab(s, { orderNumber: "DT-B", token: "t2" });
  assert.deepEqual(saveTab(s, { orderNumber: "DT-A", token: "t3" }), [{ orderNumber: "DT-A", token: "t3" }, { orderNumber: "DT-B", token: "t2" }]);
  s.m.set(DT_TABS_KEY, JSON.stringify([{ orderNumber: "DT-OK", token: "x" }, { orderNumber: 5 }, null, { orderNumber: "DT-NOTOKEN" }]));
  assert.deepEqual(readTabs(s), [{ orderNumber: "DT-OK", token: "x" }]);
  s.m.set(DT_TABS_KEY, "{not json");
  assert.deepEqual(readTabs(s), []);
  const throwing = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
  assert.deepEqual(readTabs(throwing), []);
  assert.doesNotThrow(() => saveTab(throwing, { orderNumber: "DT-X", token: "y" }));
  assert.deepEqual(readTabs(null), []);
});
test("dt_tabs is capped", () => {
  const s = mem();
  for (let i = 0; i < DT_TABS_MAX + 5; i++) saveTab(s, { orderNumber: `DT-${i}`, token: "t" });
  assert.equal(readTabs(s).length, DT_TABS_MAX);
  assert.equal(readTabs(s)[0].orderNumber, `DT-${DT_TABS_MAX + 4}`);
});

// ── reserve ──
test("reserve body: cart, details, wa_opt_in, balance_method and the referral code — tidied", () => {
  const b = buildReserveBody({ lines: [{ slug: "janwar-ink", size: "M", qty: 2 }], details, balanceMethod: "cod", referralCode: " abcd1234 " });
  assert.deepEqual(b, {
    email: "Asha@Example.com", name: "Asha Rao", phone: "9876543210",
    address: { line1: "12 Test Street", city: "New Delhi", state: "Delhi", pincode: "110001" },
    waOptIn: true, balanceMethod: "cod", referralCode: "ABCD1234",
    items: [{ slug: "janwar-ink", size: "M", qty: 2 }],
  });
  const bare = buildReserveBody({ lines: [], details: { ...details, wa: false }, balanceMethod: null, referralCode: "  " });
  assert.equal("referralCode" in bare, false);
  assert.equal("balanceMethod" in bare, false);
  assert.equal(bare.waOptIn, false);
});
const okBody = { reservationId: "r", razorpayOrderId: "order_1", keyId: "rzp_test_x", orderNumber: "DT-1", depositPaise: 38970, balancePaise: 90930, holdExpiresAt: "x", lines: [] };
test("reserve answers: ok / 409 TAPPED_OUT / 410 closed / 400 field / 503 / other", () => {
  assert.equal(reserveOutcome(200, okBody).kind, "ok");
  assert.equal(reserveOutcome(200, { reservationId: "r" }).kind, "error");   // a half-formed 200 is not a success
  assert.deepEqual(reserveOutcome(409, { code: "TAPPED_OUT", error: "tapped_out", slug: "janwar-ink", design: "janwar" }), { kind: "tapped", slug: "janwar-ink", designId: "janwar" });
  assert.deepEqual(reserveOutcome(409, { error: "tapped_out", slug: "x" }), { kind: "tapped", slug: "x", designId: null });
  assert.equal(reserveOutcome(409, { error: "not_pouring_yet" }).kind, "not_pouring");
  assert.equal(reserveOutcome(410, { code: "POUR_CLOSED" }).kind, "closed");
  assert.deepEqual(reserveOutcome(400, { error: "You can't use your own referral code.", code: "SELF_REFERRAL", field: "referralCode" }), { kind: "field", field: "referral", message: "You can't use your own referral code." });
  assert.deepEqual(reserveOutcome(400, { error: "Invalid pincode", field: "address.pincode" }), { kind: "field", field: "pin", message: "Invalid pincode" });
  assert.deepEqual(reserveOutcome(400, { error: "Product not found: x" }), { kind: "error", message: "Product not found: x" });
  assert.equal(reserveOutcome(503, {}).kind, "unavailable");
  assert.equal(reserveOutcome(500, null).kind, "error");
});
test("server field paths map onto the details form", () => {
  assert.deepEqual(["name", "phone", "email", "address.line1", "address.city", "address.state", "address.pincode", "referralCode"].map(fieldOf),
    ["name", "phone", "email", "addr", "city", "state", "pin", "referral"]);
  assert.equal(fieldOf("items"), null); assert.equal(fieldOf(undefined), null);
});

// ── confirm + polling ──
test("confirm: 200 → paid (token + figures); 5xx / timeout / offline → keep waiting; 4xx → rejected", () => {
  assert.deepEqual(confirmOutcome(200, { ok: true, orderNumber: "DT-1", receiptToken: "t", depositPaise: 5, balancePaise: 7 }), { kind: "paid", data: { orderNumber: "DT-1", receiptToken: "t", depositPaise: 5, balancePaise: 7 } });
  assert.equal(confirmOutcome(502, {}).kind, "pending");
  assert.equal(confirmOutcome(null, null).kind, "pending");
  assert.equal(confirmOutcome(409, { reason: "amount_mismatch" }).kind, "rejected");
  assert.equal(confirmOutcome(400, {}).kind, "rejected");
  assert.equal(confirmOutcome(200, {}).kind, "rejected");
});
test("polling stops the moment the webhook has settled it, gives up after maxAttempts, and can be cancelled", async () => {
  let n = 0; const sleeps: number[] = [];
  const sleep = async (ms: number) => { sleeps.push(ms); };
  const got = await pollUntilPaid(async () => (++n < 3 ? { status: "pending" } : { status: "deposit_paid", orderNumber: "DT-9", receiptToken: "t" }), { sleep, intervalMs: 3000 });
  assert.equal(got?.receiptToken, "t"); assert.equal(n, 3); assert.deepEqual(sleeps, [3000, 3000]);
  assert.equal(await pollUntilPaid(async () => null, { sleep, maxAttempts: 4 }), null);
  assert.equal(await pollUntilPaid(async () => ({ status: "pending" }), { sleep, maxAttempts: 5, cancelled: () => true }), null);
  assert.equal((await pollUntilPaid(async () => ({ status: "fulfilled" }), { sleep }))?.status, "fulfilled");
});

// ── Razorpay Checkout options ──
test("Razorpay options: prefill, notes.order_number, theme #004AAD, UPI first (intent / QR / collect), then cards, netbanking, wallets", () => {
  const o = razorpayOptions({ keyId: "rzp_test_x", orderId: "order_1", amountPaise: 38970, orderNumber: "DT-1", pct: 30,
    prefill: { name: "Asha", email: "a@b.co", contact: "9876543210" }, onPaid: () => {}, onDismiss: () => {} });
  assert.equal(o.key, "rzp_test_x"); assert.equal(o.order_id, "order_1"); assert.equal(o.amount, 38970); assert.equal(o.currency, "INR");
  assert.deepEqual(o.prefill, { name: "Asha", email: "a@b.co", contact: "9876543210" });
  assert.deepEqual(o.notes, { order_number: "DT-1" });
  assert.equal(o.theme.color, "#004AAD");
  const d = o.config.display;
  assert.deepEqual(d.sequence, ["block.upi", "block.other"]);
  assert.deepEqual(d.blocks.upi.instruments, [{ method: "upi", flows: ["intent", "qr", "collect"] }]);
  assert.deepEqual(d.blocks.other.instruments.map((i) => i.method), ["card", "netbanking", "wallet"]);
  assert.equal(d.preferences.show_default_blocks, false);
  assert.equal(typeof o.modal.ondismiss, "function");
});

test("details validation: the reference's rules, plus city and state for the server", () => {
  assert.deepEqual(invalidFields(details), []);
  assert.deepEqual(invalidFields({ ...details, name: "A", phone: "12345", email: "nope", addr: "x", pin: "11", city: "", state: "" }),
    ["name", "phone", "email", "addr", "pin", "city", "state"]);
  assert.deepEqual(invalidFields({ ...details, phone: "+91 98765-43210" }), []);        // +91, spaces and dashes are fine
  assert.deepEqual(invalidFields({ ...details, phone: "5876543210" }), ["phone"]);      // must start 6-9
});

// ── /tab ──
import { firstName, glassBar, mergeOrders, parseReceipt, pillOf, timelineStates, type TabOrder } from "./tabOrders.ts";
const receipt = (over: Record<string, unknown> = {}) => ({
  order: { orderNumber: "DT-1", name: "Asha Rao", status: "deposit_paid", depositPaise: 38970, balancePaise: 90930, balanceMethod: "cod", waOptIn: true, friendCode: "ASHA1234", createdAt: "2026-11-20T10:00:00Z", ...over },
  items: [{ productSlug: "janwar-ink", designId: "janwar", productName: "Janwar", size: "M", qty: 1, lineTotalPaise: 129900 }, { nope: 1 }],
});
test("receipt → order: paid statuses only, junk items dropped", () => {
  const o = parseReceipt(receipt())!;
  assert.deepEqual([o.orderNumber, o.balanceMethod, o.waOptIn, o.friendCode, o.items.length], ["DT-1", "cod", true, "ASHA1234", 1]);
  assert.equal(parseReceipt(receipt({ status: "pending" })), null);
  assert.equal(parseReceipt(receipt({ status: "failed" })), null);
  assert.equal(parseReceipt({ order: {} }), null);
  assert.equal(parseReceipt(null), null);
  assert.equal(parseReceipt(receipt({ balanceMethod: "weird", friendCode: "" }))!.balanceMethod, null);
});
test("merge de-duplicates by order number (session copy wins), newest first", () => {
  const a = parseReceipt(receipt({ orderNumber: "DT-A", createdAt: "2026-11-01T00:00:00Z" }))!;
  const b = parseReceipt(receipt({ orderNumber: "DT-B", createdAt: "2026-11-10T00:00:00Z" }))!;
  const aGuest: TabOrder = { ...a, name: "guest copy" };
  const m = mergeOrders([a], [b, aGuest]);
  assert.deepEqual(m.map((o) => o.orderNumber), ["DT-B", "DT-A"]);
  assert.equal(m[1].name, "Asha Rao");
});
test("timeline: reserved ✓, then the amber ring walks pour-closes → we pour → balance/ready → poured", () => {
  assert.deepEqual(timelineStates("deposit_paid", false), ["done", "now", "todo", "todo", "todo"]);
  assert.deepEqual(timelineStates("deposit_paid", true), ["done", "done", "now", "todo", "todo"]);
  assert.deepEqual(timelineStates("drop_unlocked", true), ["done", "done", "done", "now", "todo"]);
  assert.deepEqual(timelineStates("fulfilled", true), ["done", "done", "done", "done", "done"]);
  assert.deepEqual(["deposit_paid", "drop_unlocked", "fulfilled", "refunded"].map(pillOf), ["reserved", "balance", "shipped", "refunded"]);
});
test("glass bar: from the live glass, or nothing at all (never an invented number)", () => {
  const m = new Map([["janwar", { design: "janwar", cap: 50, poured: 46, left: 4, state: "last" as const }], ["x", { design: "x", cap: 50, poured: 50, left: 0, state: "tapped" as const }]]);
  assert.deepEqual(glassBar(m, "janwar"), { pct: 92, last: true, tapped: false, poured: 46, cap: 50, left: 4 });
  assert.equal(glassBar(m, "x")!.tapped, true);
  assert.equal(glassBar(null, "janwar"), null);
  assert.equal(glassBar(m, "unknown"), null);
  assert.equal(glassBar(m, null), null);
});
test("first name", () => { assert.equal(firstName("  Asha  Rao "), "Asha"); assert.equal(firstName(null), ""); });
