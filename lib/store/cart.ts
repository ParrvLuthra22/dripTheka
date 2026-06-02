import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, Size } from "@/data/pour-001";

export interface CartItem {
  product: Product;
  size: Size;
  colorName: string;
  quantity: number;
  depositAmount: number; // paise
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, size: Size, colorName: string) => void;
  removeItem: (productId: string, size: Size) => void;
  updateQuantity: (productId: string, size: Size, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: () => number;
  totalDeposit: () => number;
  totalFull: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, size, colorName) => {
        const existing = get().items.find(
          (i) => i.product.id === product.id && i.size === size
        );
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.product.id === product.id && i.size === size
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          }));
        } else {
          const depositAmount = Math.round(product.price * 0.3);
          set((s) => ({
            items: [
              ...s.items,
              { product, size, colorName, quantity: 1, depositAmount },
            ],
          }));
        }
      },

      removeItem: (productId, size) => {
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.product.id === productId && i.size === size)
          ),
        }));
      },

      updateQuantity: (productId, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size);
          return;
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.product.id === productId && i.size === size
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalDeposit: () =>
        get().items.reduce(
          (sum, i) => sum + i.depositAmount * i.quantity,
          0
        ),

      totalFull: () =>
        get().items.reduce(
          (sum, i) => sum + i.product.price * i.quantity,
          0
        ),
    }),
    { name: "drip-theka-cart" }
  )
);
