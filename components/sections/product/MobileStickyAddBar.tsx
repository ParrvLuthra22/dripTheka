"use client";

// MobileStickyAddBar — slides up from below on mobile when the sidebar's
// primary CTA scrolls off screen. Provides a persistent add-to-cart path.

import { motion, AnimatePresence } from "framer-motion";
import { ProductIllustration } from "@/components/sections/ProductIllustration";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Product, Size } from "@/data/pour-001";

interface MobileStickyAddBarProps {
  product:   Product;
  selectedSize: Size | null;
  qty:       number;
  onAdd:     () => void;
  addState:  "idle" | "adding" | "poured";
  visible:   boolean;
}

export function MobileStickyAddBar({
  product,
  selectedSize,
  qty,
  onAdd,
  addState,
  visible,
}: MobileStickyAddBarProps) {
  const totalPaise = product.price * qty;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-[150] md:hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="bg-[--cream] border-t border-[--ink]/12 flex items-center gap-3 px-4 py-3"
            style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
          >
            {/* Thumbnail — product illustration at pocket size */}
            <div className="w-10 h-14 shrink-0 border border-[--ink]/15 overflow-hidden flex items-center justify-center p-1"
              style={{ backgroundColor: "#E4E2DD" }}>
              <ProductIllustration
                type={product.type}
                primaryColor={product.colors[0]}
                accentColor="#E4E2DD"
                className="w-full h-full"
              />
            </div>

            {/* Name + price */}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/60 truncate">
                {product.name}
              </p>
              <p className="font-mono text-[11px] text-[--ink] font-medium">
                {formatPrice(totalPaise)}
              </p>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={onAdd}
              disabled={!selectedSize || addState !== "idle"}
              className={cn(
                "shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] px-4 py-3",
                "bg-[--blue] text-[--cream] border border-[--ink]",
                "transition-colors duration-150 hover:bg-[--ink]",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {selectedSize ? "ONE ROUND →" : "Pick size →"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
