import { create } from "zustand";

// Upsell modal — opened right after Add to Cart, offers a couple of related
// pieces with quick-add, then "Keep browsing" or "Checkout now".

interface UpsellStore {
  open: boolean;
  excludeSlug: string | null;
  show: (excludeSlug: string) => void;
  hide: () => void;
}

export const useUpsellStore = create<UpsellStore>((set) => ({
  open: false,
  excludeSlug: null,
  show: (excludeSlug) => set({ open: true, excludeSlug }),
  hide: () => set({ open: false, excludeSlug: null }),
}));
