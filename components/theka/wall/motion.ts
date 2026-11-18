/** True when the user prefers reduced motion (client only). */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
