// localStorage["dt_tabs"] — the orders a GUEST can find again on this device: [{ orderNumber, token }].
// The token is the signed receipt token the confirm route hands back; /tab reads each order through the
// token-protected receipt route. Newest first, de-duplicated by order number, capped.

export const DT_TABS_KEY = "dt_tabs";
export const DT_TABS_MAX = 30;

export interface TabRef { orderNumber: string; token: string }

type Store = Pick<Storage, "getItem" | "setItem">;

const ok = (v: unknown): v is TabRef =>
  !!v && typeof v === "object" && typeof (v as TabRef).orderNumber === "string" && !!(v as TabRef).orderNumber &&
  typeof (v as TabRef).token === "string" && !!(v as TabRef).token;

export function readTabs(store: Store | null | undefined): TabRef[] {
  try {
    const raw = store?.getItem(DT_TABS_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(ok).map((t) => ({ orderNumber: t.orderNumber, token: t.token })) : [];
  } catch { return []; }
}

/** Add (or refresh) an order; returns the saved list. Never throws (private windows, quota). */
export function saveTab(store: Store | null | undefined, entry: TabRef): TabRef[] {
  const next = [entry, ...readTabs(store).filter((t) => t.orderNumber !== entry.orderNumber)].slice(0, DT_TABS_MAX);
  try { store?.setItem(DT_TABS_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  return next;
}
