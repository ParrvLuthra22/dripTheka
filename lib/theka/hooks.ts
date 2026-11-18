"use client";

// Shell hooks — hydration-safe browser reads without setState-in-effect.

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** false during SSR + hydration, true once running on the client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Live media-query match. `serverValue` is used during SSR/hydration. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
