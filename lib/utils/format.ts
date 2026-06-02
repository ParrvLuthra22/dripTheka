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
