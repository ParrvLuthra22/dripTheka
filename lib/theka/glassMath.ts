// Pure glass helpers — no React, no aliases, so node's test runner can import them.
// The numbers in a glass come ONLY from /api/pour/001/glasses; nothing here invents one.

export type GlassState = "open" | "last" | "tapped";

export interface GlassInfo {
  design: string;
  cap: number;
  poured: number;
  left: number;
  state: GlassState;
}

export type GlassMap = ReadonlyMap<string, GlassInfo>;

const STATES: readonly string[] = ["open", "last", "tapped"];
const isCount = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

/**
 * Validate the API body. Anything that isn't exactly the documented shape → null (the UI then hides every glass
 * rather than draw a half-trusted one).
 */
export function parseGlasses(body: unknown): GlassMap | null {
  if (!body || typeof body !== "object") return null;
  const list = (body as { glasses?: unknown }).glasses;
  if (!Array.isArray(list)) return null;
  const out = new Map<string, GlassInfo>();
  for (const g of list) {
    if (!g || typeof g !== "object") return null;
    const { design, cap, poured, left, state } = g as Record<string, unknown>;
    if (typeof design !== "string" || !design) return null;
    if (!isCount(cap) || cap <= 0 || !isCount(poured) || !isCount(left)) return null;
    if (typeof state !== "string" || !STATES.includes(state)) return null;
    out.set(design, { design, cap, poured, left, state: state as GlassState });
  }
  return out.size ? out : null;
}

/** How full the glass is, 0…1 (poured / cap, clamped). */
export const fillFraction = (g: Pick<GlassInfo, "poured" | "cap">): number =>
  g.cap > 0 ? Math.min(1, Math.max(0, g.poured / g.cap)) : 0;

/** The liquid colour: cobalt, amber once the glass is at last call. (tapped keeps cobalt, like the reference.) */
export const LIQUID = { open: "#2f6bd6", last: "#F4A52C" } as const;
export const liquidColour = (state: GlassState): string => (state === "last" ? LIQUID.last : LIQUID.open);

/** The always-visible / hover label under a ledge glass. `null` = nothing to say until hovered. */
export function ledgeLabel(
  g: GlassInfo,
  t: { poured: (p: number, c: number) => string; lastCall: (left: number) => string; tapped: string },
): { text: string; always: boolean } {
  if (g.state === "tapped") return { text: t.tapped, always: true };
  if (g.state === "last") return { text: t.lastCall(g.left), always: true };
  return { text: t.poured(g.poured, g.cap), always: false };
}

/** "2 Dec" — the close date in the pour's own time zone (IST), whatever the visitor's. */
export function formatCloseDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}
