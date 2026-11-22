// Pure checks that a Razorpay order really is the paid deposit for THIS reservation.
// Used by /api/reserve/confirm and the webhook so both apply identical rules.

export interface RazorpayOrderLike {
  id:           string;
  amount:       number;   // paise
  amount_paid?: number;   // paise
  currency:     string;
  status:       string;
}

export type PaymentRejection =
  | "order_mismatch"      // the order isn't the one stored on this reservation
  | "amount_mismatch"     // amount (or amount paid) ≠ the reservation's deposit
  | "currency_mismatch"   // not INR
  | "not_paid";           // Razorpay says the order isn't paid

export type PaymentCheck = { ok: true } | { ok: false; reason: PaymentRejection };

export function checkPaidOrder(
  rzp:           RazorpayOrderLike,
  reservation:   { razorpayOrderId: string; depositPaise: number },
  claimedOrderId: string,
): PaymentCheck {
  if (claimedOrderId !== reservation.razorpayOrderId || rzp.id !== reservation.razorpayOrderId) {
    return { ok: false, reason: "order_mismatch" };
  }
  if (rzp.status !== "paid")  return { ok: false, reason: "not_paid" };
  if (rzp.currency !== "INR") return { ok: false, reason: "currency_mismatch" };
  if (rzp.amount !== reservation.depositPaise ||
      (rzp.amount_paid !== undefined && rzp.amount_paid !== reservation.depositPaise)) {
    return { ok: false, reason: "amount_mismatch" };
  }
  return { ok: true };
}
