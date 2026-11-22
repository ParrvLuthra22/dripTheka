// The deposit flow's wire format, as pure functions: what we POST, what each answer means, and the Razorpay
// Checkout options. The drawer (components/theka/tab) wires these to fetch() and the Razorpay SDK.

import { normalisePhone, validEmail, validPhone, validPin } from "./forms.ts";

export interface Details { name: string; phone: string; wa: boolean; email: string; addr: string; pin: string; city: string; state: string }
/** Which details-step fields fail the reference's validation (name, phone, email, address, PIN) plus city and state, which the server requires. */
export function invalidFields(d: Details): FormField[] {
  const bad: FormField[] = [];
  if (d.name.trim().length <= 1) bad.push("name");
  if (!validPhone(d.phone)) bad.push("phone");
  if (!validEmail(d.email)) bad.push("email");
  if (d.addr.trim().length <= 5) bad.push("addr");
  if (!validPin(d.pin)) bad.push("pin");
  if (d.city.trim().length < 2) bad.push("city");
  if (d.state.trim().length < 2) bad.push("state");
  return bad;
}

export interface WireLine { slug: string; size: string; qty: number }
export type BalanceMethod = "online" | "cod";

export function buildReserveBody(a: { lines: readonly WireLine[]; details: Details; balanceMethod: BalanceMethod | null; referralCode?: string }) {
  const { details: d } = a;
  const code = a.referralCode?.trim().toUpperCase();
  return {
    email: d.email.trim(), name: d.name.trim(), phone: normalisePhone(d.phone),
    address: { line1: d.addr.trim(), city: d.city.trim(), state: d.state.trim(), pincode: d.pin.trim() },
    waOptIn: d.wa,
    ...(a.balanceMethod ? { balanceMethod: a.balanceMethod } : {}),
    ...(code ? { referralCode: code } : {}),
    items: a.lines.map((l) => ({ slug: l.slug, size: l.size, qty: l.qty })),
  };
}

// ── /api/reserve ─────────────────────────────────────────────────────────────────────────────────────

export interface ReserveData {
  reservationId: string; razorpayOrderId: string; keyId: string;
  orderNumber: string; depositPaise: number; balancePaise: number; holdExpiresAt: string;
  lines: { slug: string; designId: string | null; size: string; qty: number }[];
}

/** Form fields the details step shows errors on, by the server's body path. */
export type FormField = "name" | "phone" | "email" | "addr" | "pin" | "city" | "state" | "referral";
const FIELDS: Record<string, FormField> = {
  name: "name", phone: "phone", email: "email", "address.line1": "addr", "address.line2": "addr", "address.city": "city",
  "address.state": "state", "address.pincode": "pin", referralCode: "referral",
};
export const fieldOf = (serverField: string | undefined): FormField | null => (serverField ? FIELDS[serverField] ?? null : null);

export type ReserveOutcome =
  | { kind: "ok"; data: ReserveData }
  | { kind: "tapped"; slug: string | null; designId: string | null }
  | { kind: "closed" }
  | { kind: "field"; field: FormField; message: string }
  | { kind: "not_pouring" }
  | { kind: "unavailable" }
  | { kind: "error"; message: string | null };

interface ReserveBody { code?: string; error?: string; field?: string; slug?: string; design?: string | null }

export function reserveOutcome(status: number, body: unknown): ReserveOutcome {
  const b = (body && typeof body === "object" ? body : {}) as ReserveBody & Partial<ReserveData>;
  if (status === 200 && b.reservationId && b.razorpayOrderId && typeof b.depositPaise === "number") return { kind: "ok", data: b as ReserveData };
  if (status === 410 || b.code === "POUR_CLOSED") return { kind: "closed" };
  if (status === 409 && (b.code === "TAPPED_OUT" || b.error === "tapped_out")) return { kind: "tapped", slug: b.slug ?? null, designId: b.design ?? null };
  if (status === 409 && b.error === "not_pouring_yet") return { kind: "not_pouring" };
  if (status === 400) {
    const field = fieldOf(b.field);
    if (field) return { kind: "field", field, message: b.error ?? "" };
    return { kind: "error", message: b.error ?? null };
  }
  if (status === 503) return { kind: "unavailable" };
  return { kind: "error", message: null };
}

// ── /api/reserve/confirm ─────────────────────────────────────────────────────────────────────────────

export interface ConfirmData { orderNumber: string; receiptToken?: string; depositPaise: number; balancePaise: number }
export type ConfirmOutcome =
  | { kind: "paid"; data: ConfirmData }
  | { kind: "pending" }      // 5xx / timeout / offline: the payment is safe at Razorpay; the webhook settles it — poll
  | { kind: "rejected" };    // 4xx: the payment couldn't be matched to this reservation

export function confirmOutcome(status: number | null, body: unknown): ConfirmOutcome {
  if (status === null || status >= 500) return { kind: "pending" };
  const b = (body && typeof body === "object" ? body : {}) as Partial<ConfirmData> & { ok?: boolean };
  if (status === 200 && b.ok && b.orderNumber) {
    return { kind: "paid", data: { orderNumber: b.orderNumber, receiptToken: b.receiptToken, depositPaise: b.depositPaise ?? 0, balancePaise: b.balancePaise ?? 0 } };
  }
  return { kind: "rejected" };
}

const PAID = ["deposit_paid", "drop_unlocked", "fulfilled"];

export interface StatusBody { status?: string; orderNumber?: string; receiptToken?: string; depositPaise?: number; balancePaise?: number }

/**
 * Poll /api/reserve/status until the webhook has settled the deposit. `fetchStatus` returns the body or null (any
 * failure); `sleep` is injected so tests don't wait. Resolves with the paid status body, or null when `maxAttempts` ran out.
 */
export async function pollUntilPaid(
  fetchStatus: () => Promise<StatusBody | null>,
  opts: { intervalMs?: number; maxAttempts?: number; sleep?: (ms: number) => Promise<void>; cancelled?: () => boolean } = {},
): Promise<StatusBody | null> {
  const { intervalMs = 3000, maxAttempts = 40, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), cancelled = () => false } = opts;
  for (let i = 0; i < maxAttempts; i++) {
    if (cancelled()) return null;
    const s = await fetchStatus();
    if (s?.status && PAID.includes(s.status)) return s;
    await sleep(intervalMs);
  }
  return null;
}

// ── Razorpay Standard Checkout ────────────────────────────────────────────────────────────────────────

/**
 * Options for `new Razorpay(options)`: UPI first (intent apps on a phone, QR / collect on a desktop), then cards,
 * net banking and wallets. Real UPI-app selection happens INSIDE Checkout — the drawer only hints at it.
 */
export function razorpayOptions(a: {
  keyId: string; orderId: string; amountPaise: number; orderNumber: string; pct: number;
  prefill: { name: string; email: string; contact: string };
  onPaid: (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  onDismiss: () => void;
}) {
  return {
    key: a.keyId,
    amount: a.amountPaise,
    currency: "INR",
    name: "Drip Theka",
    description: `Pour #001 — ${a.pct}% deposit`,
    order_id: a.orderId,
    prefill: a.prefill,
    notes: { order_number: a.orderNumber },
    theme: { color: "#004AAD" },
    config: {
      display: {
        blocks: {
          upi: { name: "Pay with UPI", instruments: [{ method: "upi", flows: ["intent", "qr", "collect"] }] },
          other: { name: "Cards, net banking, wallets", instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }] },
        },
        sequence: ["block.upi", "block.other"],
        preferences: { show_default_blocks: false },
      },
    },
    modal: { ondismiss: a.onDismiss },
    handler: a.onPaid,
  };
}
