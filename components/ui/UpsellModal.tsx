"use client";

// UpsellModal — "would you like anything else?" overlay shown right after
// Add to Cart. Reuses the SizeGuideModal panel styling. Cards inside pass
// triggerUpsell={false} so a quick-add in here doesn't re-open itself.

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUpsellStore } from "@/lib/store/upsell";
import { ProductCard } from "@/components/ui/ProductCard";
import { POUR_001, isTappedOut } from "@/data/pour-001";
import { copy } from "@/data/copy";
import { DripCloseIcon } from "@/components/icons/DripCloseIcon";
import { Grain } from "@/components/ui/Grain";
import { Sticker } from "@/components/ui/Sticker";

export function UpsellModal() {
  const router = useRouter();
  const open        = useUpsellStore((s) => s.open);
  const excludeSlug = useUpsellStore((s) => s.excludeSlug);
  const hide        = useUpsellStore((s) => s.hide);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, hide]);

  const related = POUR_001.products
    .filter((p) => p.slug !== excludeSlug && !isTappedOut(p.sizes))
    .slice(0, 3);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[--ink]/60 backdrop-blur-sm"
            onClick={hide}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upsell-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-[--cream] border-2 border-black shadow-[6px_6px_0_0_#141518] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8"
          >
            <Grain opacity={0.04} />
            <Sticker variant="freshly-poured" rotate={8} size={64}
              className="absolute -top-8 left-4 max-md:hidden z-10" />
            {/* Close */}
            <button
              ref={closeRef}
              onClick={hide}
              aria-label="Close"
              data-hover
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[--ink]/50 hover:text-[--ink] hover:rotate-90 transition-all duration-300"
            >
              <DripCloseIcon size={16} />
            </button>

            {/* Header */}
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--ink]/30 mb-2">
              {copy.upsell.eyebrow}
            </p>
            <h2
              id="upsell-title"
              className="font-display italic text-[--ink] leading-tight mb-2"
              style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)" }}
            >
              {copy.upsell.title}
            </h2>
            <p className="font-sans text-sm text-[--ink]/50 mb-6">
              {copy.upsell.subtitle}
            </p>

            {/* Related products */}
            {related.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
                {related.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    aspectRatio="aspect-[3/4]"
                    animDelay={i * 0.05}
                    triggerUpsell={false}
                  />
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={hide}
                data-hover
                className="flex-1 font-mono text-[10px] uppercase tracking-[0.16em] border-2 border-[#141518] text-[#141518] py-3.5 shadow-[3px_3px_0_0_#141518] hover:shadow-[1px_1px_0_0_#141518] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150"
              >
                {copy.upsell.keepBrowsing}
              </button>
              <button
                onClick={() => { hide(); router.push("/checkout"); }}
                data-hover-big
                className="flex-1 font-mono text-[10px] uppercase tracking-[0.16em] bg-[#004AAD] text-[#E4E2DD] border-2 border-[#141518] py-3.5 shadow-[3px_3px_0_0_#141518] hover:shadow-[1px_1px_0_0_#141518] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150"
              >
                {copy.cta.checkout}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
