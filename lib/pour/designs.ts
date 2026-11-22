// Design ↔ colourway mapping for the pour. Each design has ONE glass; its colourways
// (each its own product slug) share it. Derived from the product data, which is seeded
// from docs/reference/pour001/designs.json — designs.test.ts asserts they stay identical
// (14 colourway slugs → 7 designs).

import { POUR_001, hasWall } from "@/data/pour-001";

export interface PourDesign {
  /** Design slug, e.g. "bad-influence". The primary key of a glass. */
  id:    string;
  code:  string;
  name:  string;
  /** Colourway product slugs that share this glass, in wall order. */
  slugs: string[];
}

const bySlug = new Map<string, string>();               // product slug → design id
const slugsByDesign = new Map<string, string[]>();      // design id → product slugs

for (const p of POUR_001.products) {
  const design = p.design ?? p.slug;                    // a lone product is its own design
  bySlug.set(p.slug, design);
  slugsByDesign.set(design, [...(slugsByDesign.get(design) ?? []), p.slug]);
}

/** The glass a product slug pours into, or null for an unknown slug. */
export const designOf = (slug: string): string | null => bySlug.get(slug) ?? null;

/** Every colourway slug that shares a design's glass. */
export const slugsOfDesign = (design: string): string[] => slugsByDesign.get(design) ?? [];

/** The designs on The Wall (the ones with a glass the public sees), in wall order. */
export const POUR_DESIGNS: PourDesign[] = (() => {
  const out = new Map<string, PourDesign>();
  for (const p of POUR_001.products) {
    if (!hasWall(p)) continue;
    const id = p.design ?? p.slug;
    if (!out.has(id)) out.set(id, { id, code: p.code ?? "", name: p.name, slugs: slugsOfDesign(id) });
  }
  return [...out.values()];
})();

export const isKnownDesign = (id: string): boolean => slugsByDesign.has(id);
