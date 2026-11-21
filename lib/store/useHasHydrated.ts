"use client";

import { useSyncExternalStore } from "react";

interface Persisted {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
}

/**
 * False for the server render and the first client render, true once the persisted
 * zustand store has rehydrated from localStorage. Gate anything that renders
 * persisted state behind it, or the first client render disagrees with the server
 * HTML (React hydration error #418).
 */
export function useHasHydrated(store: Persisted): boolean {
  return useSyncExternalStore(
    (notify) => store.persist.onFinishHydration(notify),
    () => store.persist.hasHydrated(),
    () => false, // server render + the hydrating client render
  );
}
