import { create } from "zustand";
import { persist } from "zustand/middleware";

// Recently Viewed — tracks the last few product pages a regular has visited,
// so The Board can surface "Recently Viewed" on the homepage.

const MAX_ITEMS = 8;

interface RecentlyViewedStore {
  slugs: string[];
  record: (slug: string) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      slugs: [],

      record: (slug) =>
        set((s) => ({
          slugs: [slug, ...s.slugs.filter((x) => x !== slug)].slice(0, MAX_ITEMS),
        })),
    }),
    { name: "drip-theka-recently-viewed" }
  )
);
