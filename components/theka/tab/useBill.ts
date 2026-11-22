"use client";

// The cart store IS the bill (no second cart). Each cart line is re-resolved against the product data by slug, so a
// stale persisted price can never reach the drawer, Razorpay or the server — and a retired slug simply drops out.

import { useMemo } from "react";
import { POUR_001 } from "@/data/pour-001";
import { designOf } from "@/lib/pour/designs";
import { useCartStore } from "@/lib/store/cart";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import { billTotals, type BillLine } from "@/lib/theka/tabMath";

export interface BillItem extends BillLine { productId: string }

export function useBill() {
  const items = useCartStore((s) => s.items);
  const hydrated = useHasHydrated(useCartStore);
  return useMemo(() => {
    const lines: BillItem[] = [];
    for (const it of hydrated ? items : []) {
      const p = POUR_001.products.find((x) => x.slug === it.product.slug);
      const designId = designOf(it.product.slug);
      if (!p || !designId) continue;
      lines.push({
        productId: p.id, slug: p.slug, designId, name: p.name, size: it.size, qty: it.quantity,
        colourway: p.colourway ?? it.colorName, unitPaise: p.price,
      });
    }
    return { lines, totals: billTotals(lines) };
  }, [items, hydrated]);
}
