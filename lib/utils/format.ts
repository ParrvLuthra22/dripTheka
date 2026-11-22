/** Format paise to INR display string: 249900 → "₹2,499" */
export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

/** Return 30% deposit of a price in paise */
export function depositAmount(paise: number): number {
  return Math.round(paise * 0.3);
}

/** Format deposit for display */
export function formatDeposit(paise: number): string {
  return formatPrice(depositAmount(paise));
}

/**
 * Exact money for the deposit flow: whole rupees stay "₹1,299", a deposit with paise shows them
 * ("₹389.70") — so the panel, the bill and Razorpay Checkout always read the same amount.
 */
export function formatPaise(paise: number): string {
  const whole = paise % 100 === 0;
  return `₹${(paise / 100).toLocaleString("en-IN", whole ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
