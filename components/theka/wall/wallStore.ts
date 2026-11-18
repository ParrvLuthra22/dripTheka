// Tiny external store for the wall's *view* state. TheWall drives the camera
// imperatively (GSAP) and pushes only what the React tree must render here:
// which fit the info panel shows, which side is showing, which ledge is lit and
// whether the chrome is in product-view mode.

export type Side = "front" | "back";

export interface WallView {
  /** Product-view chrome on ("← Collection", overlays) — flips the moment a zoom starts/ends. */
  zoomed: boolean;
  /** Fit the info/buy panels show (lags the camera by the .22s fade-out on a swap). */
  cur: number;
  side: Side;
  /** Lit ledge (hover/focus on the wall), −1 = none. */
  hover: number;
}

export function createWallStore() {
  let state: WallView = { zoomed: false, cur: 0, side: "front", hover: -1 };
  const subs = new Set<() => void>();
  return {
    get: (): WallView => state,
    set(patch: Partial<WallView>) {
      state = { ...state, ...patch };
      subs.forEach((fn) => fn());
    },
    subscribe(fn: () => void) {
      subs.add(fn);
      return () => { subs.delete(fn); };
    },
  };
}

export type WallStore = ReturnType<typeof createWallStore>;
