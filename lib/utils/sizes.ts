// Size ↔ volume mapping — single source of truth.
//
// Bottle caps display the VOLUME (theka joke: sizes poured like measures) while
// the size LETTER rides on the custom cursor when a cap is hovered.
//
// If a size has no volume mapping (e.g. "XS"), callers fall back to the letter.

export const SIZE_VOLUME = {
  S:   "30ml",
  M:   "60ml",
  L:   "90ml",
  XL:  "120ml",
  XXL: "150ml",
} as const;

export type MappedSize = keyof typeof SIZE_VOLUME;

// Inverse: volume → size letter
export const VOLUME_SIZE = Object.fromEntries(
  Object.entries(SIZE_VOLUME).map(([size, vol]) => [vol, size])
) as Record<string, MappedSize>;

/** Volume label for a size, or the upper-cased letter if unmapped. */
export function volumeForSize(size: string): string {
  const key = size.toUpperCase() as MappedSize;
  return SIZE_VOLUME[key] ?? size.toUpperCase();
}
