// wallLoad — which of the Wall's imagery may start downloading yet.
//
// <TheWall> is mounted under the Entry from first paint, so its tee art, shadows, plaster, neon and
// the rate-board font would otherwise compete with the Entry's own first paint. While the Entry plays
// the Wall holds: its <img>s render without `src` (their boxes stay sized, so nothing shifts).
//
//   art   current colourway's backs + shadows. Opens when the Entry's timeline passes
//         ART_AT (the aerial) — or on idle after LCP, or when the Wall goes live — whichever is first.
//   neon  the neon wordmark, the Kalam rate board and the plaster (a viewport-sized background would otherwise
//         become the page's LCP candidate; it is only seen through the doorway, ~6s in). Opens at NEON_AT (the street), or when live.
//
// Other colourways and fronts are not gated here: TheWall warms them when a product view opens, or on
// idle once the Wall is live. Returning visitors and ?fit= deep links start with everything open.

export interface WallLoad {
  art: boolean;
  neon: boolean;
}

/** Entry timeline seconds (see Entry.tsx): the aerial fades in at 1.2, the street at 3.8. */
export const ART_AT = 1.2;
export const NEON_AT = 3.8;

export const LOAD_HOLD: WallLoad = { art: false, neon: false };
export const LOAD_ALL: WallLoad = { art: true, neon: true };

/** What the Entry timeline's playhead (seconds) unlocks. */
export function loadAtTime(t: number): WallLoad {
  return { art: t >= ART_AT, neon: t >= NEON_AT };
}

/** Gates only ever open: merge `next` into `prev`, returning `prev` itself when nothing changed. */
export function openGates(prev: WallLoad, next: Partial<WallLoad>): WallLoad {
  const art = prev.art || !!next.art, neon = prev.neon || !!next.neon;
  return art === prev.art && neon === prev.neon ? prev : { art, neon };
}

/**
 * Run `fn` once on idle after the page's largest contentful paint (or, where LCP isn't observable, after
 * `load`), and never later than `maxWait` ms from now. Returns a cancel function.
 */
export function afterLcpIdle(fn: () => void, maxWait = 4000): () => void {
  let done = false;
  let po: PerformanceObserver | null = null;
  let idleHandle = 0;
  const timers: number[] = [];
  const idle = typeof requestIdleCallback === "function"
    ? (cb: () => void) => { idleHandle = requestIdleCallback(cb, { timeout: 1500 }); }
    : (cb: () => void) => { timers.push(window.setTimeout(cb, 200)); };
  const fire = () => { if (done) return; done = true; cleanup(); fn(); };
  const cleanup = () => {
    po?.disconnect();
    if (idleHandle && typeof cancelIdleCallback === "function") cancelIdleCallback(idleHandle);
    timers.forEach(clearTimeout);
  };
  timers.push(window.setTimeout(fire, maxWait)); // hard cap: the Wall must not stay empty

  let seen = false;
  const onLcp = () => { if (seen) return; seen = true; idle(fire); };
  try {
    po = new PerformanceObserver((list) => { if (list.getEntries().length) onLcp(); });
    po.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    // no LCP support: after the load event
    if (document.readyState === "complete") onLcp();
    else addEventListener("load", onLcp, { once: true });
  }
  return () => { done = true; cleanup(); };
}
