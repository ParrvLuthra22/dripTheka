// /tab: turning receipt JSON (+ the live glasses) into what an order card shows. Pure — no React, no aliases.
// Nothing here invents a number: a glass bar exists only when the glasses API answered.

import type { GlassMap } from "./glassMath.ts";

export interface TabItem { productSlug: string; designId: string | null; productName: string; size: string; qty: number; lineTotalPaise: number }
export interface TabOrder {
  orderNumber: string;
  name: string;
  status: string;
  depositPaise: number;
  balancePaise: number;
  balanceMethod: "online" | "cod" | null;
  waOptIn: boolean;
  friendCode: string | null;
  createdAt: string;
  items: TabItem[];
}

/** Statuses a visitor should see on their tab (a `pending` row is an unpaid hold, not an order). */
export const TAB_STATUSES = ["deposit_paid", "drop_unlocked", "fulfilled", "refunded"] as const;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Parse /api/reserve/receipt JSON → TabOrder, or null when it isn't a tab-worthy order. */
export function parseReceipt(body: unknown): TabOrder | null {
  const b = body as { order?: Record<string, unknown>; items?: unknown[] } | null;
  const o = b?.order;
  if (!o || typeof o.orderNumber !== "string" || !o.orderNumber) return null;
  const status = str(o.status);
  if (!(TAB_STATUSES as readonly string[]).includes(status)) return null;
  const bm = o.balanceMethod;
  return {
    orderNumber: o.orderNumber, name: str(o.name), status,
    depositPaise: num(o.depositPaise), balancePaise: num(o.balancePaise),
    balanceMethod: bm === "online" || bm === "cod" ? bm : null,
    waOptIn: o.waOptIn === true, friendCode: str(o.friendCode) || null, createdAt: str(o.createdAt),
    items: (Array.isArray(b?.items) ? b.items : []).flatMap((i): TabItem[] => {
      const r = i as Record<string, unknown>;
      return typeof r?.productSlug === "string" ? [{ productSlug: r.productSlug, designId: typeof r.designId === "string" ? r.designId : null, productName: str(r.productName), size: str(r.size), qty: num(r.qty), lineTotalPaise: num(r.lineTotalPaise) }] : [];
    }),
  };
}

/** Merge lists of orders, keeping the first copy of each order number (put the session's list first), newest first. */
export function mergeOrders(...lists: readonly (readonly TabOrder[])[]): TabOrder[] {
  const seen = new Map<string, TabOrder>();
  for (const l of lists) for (const o of l) if (!seen.has(o.orderNumber)) seen.set(o.orderNumber, o);
  return [...seen.values()].sort((a, b) => Date.parse(b.createdAt || "0") - Date.parse(a.createdAt || "0"));
}

export type StepState = "done" | "now" | "todo";
/** The 5 timeline steps; `now` is the amber-ring one. Indexes: 0 reserved · 1 pour closes · 2 we pour · 3 balance / ready · 4 poured. */
export function timelineStates(status: string, closed: boolean): StepState[] {
  let now: number;                                  // index of the current step; 5 = everything done
  if (status === "fulfilled") now = 5;
  else if (status === "drop_unlocked") now = 3;
  else now = closed ? 2 : 1;                        // deposit_paid (and refunded, shown muted by the pill)
  return [0, 1, 2, 3, 4].map((i): StepState => (i < now ? "done" : i === now ? "now" : "todo"));
}

export type Pill = "reserved" | "balance" | "shipped" | "refunded";
export const pillOf = (status: string): Pill => (status === "fulfilled" ? "shipped" : status === "drop_unlocked" ? "balance" : status === "refunded" ? "refunded" : "reserved");

export interface GlassBar { pct: number; last: boolean; tapped: boolean; poured: number; cap: number; left: number }
/** The bar under an item: from the live glass, or null (no glasses data → no bar, no numbers). */
export function glassBar(glasses: GlassMap | null, designId: string | null): GlassBar | null {
  const g = designId ? glasses?.get(designId) : undefined;
  if (!g) return null;
  return { pct: Math.min(100, Math.max(0, (g.poured / g.cap) * 100)), last: g.state === "last", tapped: g.state === "tapped", poured: g.poured, cap: g.cap, left: g.left };
}

export const firstName = (full: string | null | undefined): string => (full ?? "").trim().split(/\s+/)[0] ?? "";
