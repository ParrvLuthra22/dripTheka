"use client";

// Pour-level facts for the UI, from lib/config POUR — never typed in components.

import { useSyncExternalStore } from "react";
import { DEPOSIT_PERCENT, POUR, depositPaiseFor, isPourClosed } from "@/lib/config";
import { formatCloseDate } from "./glassMath";

export { DEPOSIT_PERCENT, depositPaiseFor };

/** "2 Dec" */
export const pourClosesLabel = (): string => formatCloseDate(POUR.closesAt);

const MAX_TIMEOUT = 2_147_483_647;
function subscribeClosed(fn: () => void) {
  let t = 0;
  const arm = () => {
    const ms = Date.parse(POUR.closesAt) - Date.now();
    if (ms <= 0) return;
    t = window.setTimeout(() => { fn(); arm(); }, Math.min(ms + 50, MAX_TIMEOUT));
  };
  arm();
  return () => clearTimeout(t);
}

/** True once POUR.closesAt has passed (false during SSR/hydration; flips live at the moment of closing). */
export function usePourClosed(): boolean {
  return useSyncExternalStore(subscribeClosed, () => isPourClosed(), () => false);
}
