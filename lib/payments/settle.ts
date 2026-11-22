// Money state transitions. The ONLY code that moves a reservation between
// pending/failed → deposit_paid → refunded. Shared by /api/reserve/confirm
// (browser) and /api/razorpay/webhook (Razorpay), so both obey the same rules.
//
// Concurrency model: every transition is a conditional UPDATE … WHERE status IN (…)
// RETURNING, in the same transaction as the pour_progress change. Only the caller
// that actually flips the row counts the units, so confirm + webhook (or a retried
// webhook) can never double-count.

import { and, eq, inArray, sql } from "drizzle-orm";
import { db, type Tx } from "@/lib/db/client";
import { paymentEvents, pourProgress, reservationItems, reservations } from "@/lib/db/schema";
import { POUR_SLUG } from "@/lib/config";
import { checkPaidOrder, type PaymentRejection, type RazorpayOrderLike } from "./check";

export type ReservationRow = typeof reservations.$inferSelect;
export type FetchOrder = (orderId: string) => Promise<RazorpayOrderLike>;

/** Statuses meaning "the deposit has been received". */
export const PAID_STATUSES = ["deposit_paid", "drop_unlocked", "fulfilled"] as const;
const PAYABLE_STATUSES = ["pending", "failed"] as const;

// ── primitives ────────────────────────────────────────────────────────────

async function unitsOf(tx: Tx, reservationId: string): Promise<number> {
  const [row] = await tx
    .select({ n: sql<number>`COALESCE(SUM(${reservationItems.qty}), 0)::int` })
    .from(reservationItems)
    .where(eq(reservationItems.reservationId, reservationId));
  return Number(row?.n ?? 0);
}

async function bumpProgress(tx: Tx, delta: number): Promise<void> {
  if (delta === 0) return;
  await tx
    .insert(pourProgress)
    .values({ pourSlug: POUR_SLUG, reserved: Math.max(delta, 0), target: 100 })
    .onConflictDoUpdate({
      target: pourProgress.pourSlug,
      set:    { reserved: sql`GREATEST(${pourProgress.reserved} + ${delta}, 0)` },
    });
}

/** pending|failed → deposit_paid. Returns true only for the caller that flipped it. */
export async function markDepositPaid(tx: Tx, reservationId: string, paymentId: string): Promise<boolean> {
  const [row] = await tx
    .update(reservations)
    .set({ status: "deposit_paid", razorpayPaymentId: paymentId, updatedAt: sql`now()` })
    .where(and(eq(reservations.id, reservationId), inArray(reservations.status, [...PAYABLE_STATUSES])))
    .returning({ id: reservations.id });
  if (!row) return false;
  await bumpProgress(tx, await unitsOf(tx, reservationId));
  return true;
}

/** pending → failed. The row is kept. */
export async function markPaymentFailed(tx: Tx, reservationId: string): Promise<boolean> {
  const [row] = await tx
    .update(reservations)
    .set({ status: "failed", updatedAt: sql`now()` })
    .where(and(eq(reservations.id, reservationId), eq(reservations.status, "pending")))
    .returning({ id: reservations.id });
  return !!row;
}

/** paid → refunded, giving the units back to pour_progress. */
export async function markRefunded(tx: Tx, reservationId: string): Promise<boolean> {
  const [row] = await tx
    .update(reservations)
    .set({ status: "refunded", updatedAt: sql`now()` })
    .where(and(eq(reservations.id, reservationId), inArray(reservations.status, [...PAID_STATUSES])))
    .returning({ id: reservations.id });
  if (!row) return false;
  await bumpProgress(tx, -(await unitsOf(tx, reservationId)));
  return true;
}

// ── browser confirm ───────────────────────────────────────────────────────

export type ConfirmOutcome =
  | { ok: true;  changed: boolean; reservation: ReservationRow }
  | { ok: false; reason: PaymentRejection | "not_found" | "not_payable" };

/**
 * Settle a payment the browser says succeeded. The caller has ALREADY verified the
 * Razorpay signature. This binds the payment to the reservation, re-checks the order
 * with Razorpay (server-side) and flips the status. Idempotent.
 *
 * `devStub`: `next dev` only — skips the Razorpay fetch for `order_dev_*` orders.
 */
export async function settleConfirmedPayment(
  args: { reservationId: string; orderId: string; paymentId: string; devStub?: boolean },
  deps: { fetchOrder: FetchOrder },
): Promise<ConfirmOutcome> {
  const [r] = await db.select().from(reservations).where(eq(reservations.id, args.reservationId)).limit(1);
  if (!r) return { ok: false, reason: "not_found" };

  // The paid order must be the one stored on THIS reservation.
  if (args.orderId !== r.razorpayOrderId) return { ok: false, reason: "order_mismatch" };

  if ((PAID_STATUSES as readonly string[]).includes(r.status)) return { ok: true, changed: false, reservation: r };
  if (!(PAYABLE_STATUSES as readonly string[]).includes(r.status)) return { ok: false, reason: "not_payable" };

  const rzp: RazorpayOrderLike = args.devStub
    ? { id: r.razorpayOrderId, amount: r.depositPaise, amount_paid: r.depositPaise, currency: "INR", status: "paid" }
    : await deps.fetchOrder(args.orderId); // network errors propagate → caller answers 5xx, webhook will catch up

  const check = checkPaidOrder(rzp, r, args.orderId);
  if (!check.ok) return { ok: false, reason: check.reason };

  const changed = await db.transaction((tx) => markDepositPaid(tx, r.id, args.paymentId));
  const [fresh] = await db.select().from(reservations).where(eq(reservations.id, r.id)).limit(1);
  return { ok: true, changed, reservation: fresh ?? r };
}

// ── webhook ───────────────────────────────────────────────────────────────

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined);
const entity = (payload: Obj, key: string): Obj => obj(obj(payload[key]).entity);

export interface WebhookResult {
  /** Event id had been processed before (retry / replay). Nothing changed. */
  duplicate: boolean;
  /** What we did, e.g. marked_paid | noop:already_paid | rejected:amount_mismatch | ignored:unknown_order. */
  outcome:   string;
  /** Set only when THIS call flipped the reservation to deposit_paid (send the receipt email). */
  newlyPaid?: ReservationRow;
}

/**
 * Process one verified Razorpay webhook event, idempotently by `eventId`
 * (X-Razorpay-Event-Id). The event id is stored in the SAME transaction as the
 * state change, so a crash rolls both back and Razorpay's retry reprocesses it.
 * Throws on transient failures (Razorpay API / DB down) so the route answers 5xx.
 */
export async function handleWebhookEvent(
  event:   { event?: string; payload?: unknown },
  eventId: string,
  deps:    { fetchOrder: FetchOrder },
): Promise<WebhookResult> {
  const name    = event.event ?? "unknown";
  const payload = obj(event.payload);

  const [seen] = await db.select({ id: paymentEvents.id }).from(paymentEvents).where(eq(paymentEvents.id, eventId)).limit(1);
  if (seen) return { duplicate: true, outcome: "duplicate" };

  // Decide (may call Razorpay) OUTSIDE the transaction; `apply` runs inside it.
  let apply: (tx: Tx) => Promise<string>;
  let paidReservationId: string | undefined;

  if (name === "payment.captured" || name === "order.paid") {
    const payment   = entity(payload, "payment");
    const orderId   = str(payment.order_id) ?? str(entity(payload, "order").id);
    const paymentId = str(payment.id);
    const [r] = orderId
      ? await db.select().from(reservations).where(eq(reservations.razorpayOrderId, orderId)).limit(1)
      : [];

    if (!orderId || !paymentId || !r) {
      apply = async () => "ignored:unknown_order";
    } else if ((PAID_STATUSES as readonly string[]).includes(r.status)) {
      apply = async () => "noop:already_paid";
    } else if (!(PAYABLE_STATUSES as readonly string[]).includes(r.status)) {
      apply = async () => `rejected:not_payable(${r.status})`;
    } else {
      const check = checkPaidOrder(await deps.fetchOrder(orderId), r, orderId);
      if (!check.ok) {
        console.error(`[webhook] REJECTED ${name} for ${r.orderNumber}: ${check.reason}`);
        apply = async () => `rejected:${check.reason}`;
      } else {
        paidReservationId = r.id;
        apply = async (tx) => ((await markDepositPaid(tx, r.id, paymentId)) ? "marked_paid" : "noop:already_paid");
      }
    }
  } else if (name === "payment.failed") {
    const orderId = str(entity(payload, "payment").order_id);
    const [r] = orderId
      ? await db.select({ id: reservations.id }).from(reservations).where(eq(reservations.razorpayOrderId, orderId)).limit(1)
      : [];
    apply = r
      ? async (tx) => ((await markPaymentFailed(tx, r.id)) ? "marked_failed" : "noop:not_pending")
      : async () => "ignored:unknown_order";
  } else if (name === "refund.processed") {
    const refund    = entity(payload, "refund");
    const paymentId = str(refund.payment_id);
    const amount    = num(refund.amount);
    const [r] = paymentId
      ? await db.select().from(reservations).where(eq(reservations.razorpayPaymentId, paymentId)).limit(1)
      : [];
    if (!r) {
      apply = async () => "ignored:unknown_payment";
    } else if (amount === undefined || amount < r.depositPaise) {
      // A partial refund doesn't end the reservation; leave it for a human.
      apply = async () => "noop:partial_refund";
    } else {
      apply = async (tx) => ((await markRefunded(tx, r.id)) ? "marked_refunded" : "noop:not_paid");
    }
  } else {
    apply = async () => `ignored:${name}`;
  }

  const outcome = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(paymentEvents)
      .values({ id: eventId, event: name, outcome: "processing" })
      .onConflictDoNothing()
      .returning({ id: paymentEvents.id });
    if (inserted.length === 0) return null; // lost a race with a concurrent delivery of the same event

    const result = await apply(tx);
    await tx.update(paymentEvents).set({ outcome: result }).where(eq(paymentEvents.id, eventId));
    return result;
  });

  if (outcome === null) return { duplicate: true, outcome: "duplicate" };

  let newlyPaid: ReservationRow | undefined;
  if (outcome === "marked_paid" && paidReservationId) {
    [newlyPaid] = await db.select().from(reservations).where(eq(reservations.id, paidReservationId)).limit(1);
  }
  return { duplicate: false, outcome, newlyPaid };
}
