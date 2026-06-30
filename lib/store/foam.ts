import { create } from "zustand";

// Foam store — gatekeeps bubble count so the page never has more than
// maxBubbles (5 desktop / 3 mobile) on screen at once.
//
// The store does NOT render anything. Foam.tsx subscribes and renders.
// Individual trigger sites call spawn(); the Foam component calls removeBubble()
// on animation end.

export interface FoamBubble {
  id:       string;
  x:        number;  // viewport x — Foam.tsx positions the bubble here
  y:        number;  // viewport y
  size:     number;  // diameter px
  duration: number;  // rise animation duration in seconds
  driftX:   number;  // total horizontal displacement at peak (px, signed)
  pop:      boolean; // 5% chance — bubble pops mid-rise instead of reaching top
}

interface FoamStore {
  bubbles: FoamBubble[];
  maxBubbles: number;
  spawn(opts: {
    x:        number;
    y:        number;
    count:    number;
    source:   string;
    duration?: number; // optional override (e.g. modal-headline uses 5s)
  }): void;
  removeBubble(id: string): void;
}

const BLOCKED_PATHS = ["/login", "/account", "/legal"];

let _nextId = 0;

export const useFoamStore = create<FoamStore>((set, get) => ({
  bubbles:    [],
  maxBubbles: 5,

  spawn({ x, y, count, source: _source, duration: durationOverride }) {
    if (typeof window === "undefined") return;

    // prefers-reduced-motion — silent no-op
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Blocked routes
    const path = window.location.pathname;
    if (BLOCKED_PATHS.some((p) => path.startsWith(p))) return;

    // Mobile: smaller cap + smaller sizes
    const isMobile = window.innerWidth <= 640;
    const cap      = isMobile ? 3 : get().maxBubbles;
    const current  = get().bubbles.length;
    const slots    = Math.max(0, cap - current);
    if (slots === 0) return;

    const toSpawn   = Math.min(count, slots);
    const newBubbles: FoamBubble[] = [];

    for (let i = 0; i < toSpawn; i++) {
      const minSz = isMobile ? 6  : 8;
      const maxSz = isMobile ? 14 : 20;
      const size     = minSz + Math.random() * (maxSz - minSz);
      const duration = durationOverride ?? (2.4 + Math.random() * 1.2);
      const driftX   = (Math.random() - 0.5) * 80; // –40 to +40 px
      const pop      = Math.random() < 0.05;

      newBubbles.push({
        id:       `foam-${++_nextId}`,
        x:        x + (Math.random() - 0.5) * 36,
        y,
        size,
        duration,
        driftX,
        pop,
      });
    }

    set((s) => ({ bubbles: [...s.bubbles, ...newBubbles] }));
  },

  removeBubble(id) {
    set((s) => ({ bubbles: s.bubbles.filter((b) => b.id !== id) }));
  },
}));
