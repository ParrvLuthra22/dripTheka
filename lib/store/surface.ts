// Surface store — which background the floating glasses currently sit over.
//
// Sections declare their surface via `data-surface="blue|cream|ink"`. A single
// global <SurfaceTracker> samples which declared section is behind the floating
// PintGlass on scroll and writes the result here. Glass components read this to
// flip liquid colour so it never camouflages against a matching background.
//
//   blue  → liquid flips to CREAM   (cobalt liquid would vanish on cobalt bg)
//   cream → liquid stays COBALT
//   ink   → liquid stays COBALT

import { create } from "zustand";

export type Surface = "blue" | "cream" | "ink";

interface SurfaceState {
  surface: Surface;
  setSurface: (s: Surface) => void;
}

export const useSurfaceStore = create<SurfaceState>((set) => ({
  surface: "cream",
  setSurface: (surface) =>
    set((prev) => (prev.surface === surface ? prev : { surface })),
}));
