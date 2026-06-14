import { create } from "zustand";
import { persist } from "zustand/middleware";

// Khata — the running tab. At a real theka, the khata is the notebook where
// the owner writes down what you owe. Here it's the wishlist: pieces you're
// not ready to pour yet, but you don't want the bartender to forget.

interface KhataStore {
  slugs: string[];
  toggle:  (slug: string) => void;
  has:     (slug: string) => boolean;
  remove:  (slug: string) => void;
  clear:   () => void;
}

export const useKhataStore = create<KhataStore>()(
  persist(
    (set, get) => ({
      slugs: [],

      toggle: (slug) =>
        set((s) => ({
          slugs: s.slugs.includes(slug)
            ? s.slugs.filter((x) => x !== slug)
            : [...s.slugs, slug],
        })),

      has: (slug) => get().slugs.includes(slug),

      remove: (slug) =>
        set((s) => ({ slugs: s.slugs.filter((x) => x !== slug) })),

      clear: () => set({ slugs: [] }),
    }),
    { name: "drip-theka-khata" }
  )
);
