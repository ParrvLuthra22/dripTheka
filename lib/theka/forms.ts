// Pure form helpers shared by the refill form, the tab drawer's details step and their tests.
// (No aliases / React: node's test runner imports this directly.)

/** Indian mobile as typed → the 10 digits the API wants ("+91 98765 43210", "098765-43210" → "9876543210"). */
export function normalisePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}
export const validPhone = (raw: string): boolean => /^[6-9]\d{9}$/.test(normalisePhone(raw));
export const validEmail = (raw: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());
export const validPin = (raw: string): boolean => /^\d{6}$/.test(raw.trim());

/** What the refill endpoint's answer means for the person at the form. */
export type RefillOutcome =
  | { kind: "joined" }                    // 201, or 409 ALREADY_ON_LIST — either way they ARE on the list
  | { kind: "rate_limited" }
  | { kind: "invalid"; message: string }
  | { kind: "down" };

export function refillOutcome(status: number, body: { code?: string; error?: string } | null): RefillOutcome {
  if (status === 201 || status === 200) return { kind: "joined" };
  if (status === 409 && body?.code === "ALREADY_ON_LIST") return { kind: "joined" };
  if (status === 429) return { kind: "rate_limited" };
  if (status === 400) return { kind: "invalid", message: body?.error ?? "Invalid request" };
  return { kind: "down" };
}
