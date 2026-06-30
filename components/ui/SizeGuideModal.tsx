"use client";

// SizeGuideModal — centered overlay with garment measurements.
// Table varies by garment kind (tops / bottoms / headwear), filtered to the
// sizes the product actually stocks.

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product, Size } from "@/data/pour-001";
import { DripCloseIcon } from "@/components/icons/DripCloseIcon";

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
  product: Product;
}

type MeasureKind = "tops" | "bottoms" | "headwear";

const TOPS: Record<Size, { chest: number; length: number; sleeve: number }> = {
  XS:  { chest: 96,  length: 66, sleeve: 58 },
  S:   { chest: 101, length: 68, sleeve: 59 },
  M:   { chest: 106, length: 70, sleeve: 60 },
  L:   { chest: 111, length: 72, sleeve: 61 },
  XL:  { chest: 116, length: 74, sleeve: 62 },
  XXL: { chest: 121, length: 76, sleeve: 63 },
};

const BOTTOMS: Record<Size, { waist: number; hip: number; inseam: number }> = {
  XS:  { waist: 71, hip: 96,  inseam: 71 },
  S:   { waist: 76, hip: 101, inseam: 72 },
  M:   { waist: 81, hip: 106, inseam: 73 },
  L:   { waist: 86, hip: 111, inseam: 74 },
  XL:  { waist: 91, hip: 116, inseam: 75 },
  XXL: { waist: 96, hip: 121, inseam: 76 },
};

const HEADWEAR: Record<Size, string> = {
  XS:  "53 – 54",
  S:   "55 – 57",
  M:   "57 – 59",
  L:   "59 – 61",
  XL:  "61 – 63",
  XXL: "63 – 65",
};

function getMeasureKind(product: Product): MeasureKind {
  if (product.name.toLowerCase().includes("cap")) return "headwear";
  if (product.type === "cargo") return "bottoms";
  return "tops";
}

export function SizeGuideModal({ open, onClose, product }: SizeGuideModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const kind = getMeasureKind(product);
  const sizes = product.sizes.map((s) => s.size);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

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
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-[--cream] border-2 border-black shadow-[6px_6px_0_0_#141518] w-full max-w-md max-h-[85vh] overflow-y-auto p-6 md:p-8"
          >
            {/* Close */}
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close size guide"
              data-hover
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[--ink]/50 hover:text-[--ink] hover:rotate-90 transition-all duration-300"
            >
              <DripCloseIcon size={16} />
            </button>

            {/* Header */}
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--ink]/30 mb-2">
              Size Guide · {product.name}
            </p>
            <h2
              id="size-guide-title"
              className="font-display italic text-[--ink] leading-tight mb-6"
              style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
            >
              Find your pour.
            </h2>

            {/* Table */}
            <div className="border border-[--ink]/15 overflow-hidden">
              <table className="w-full font-mono text-[10px] uppercase tracking-[0.08em]">
                <thead>
                  <tr className="bg-[--ink] text-[--cream]">
                    <th className="text-left px-3 py-2.5">Size</th>
                    {kind === "tops" && (
                      <>
                        <th className="text-right px-3 py-2.5">Chest</th>
                        <th className="text-right px-3 py-2.5">Length</th>
                        <th className="text-right px-3 py-2.5">Sleeve</th>
                      </>
                    )}
                    {kind === "bottoms" && (
                      <>
                        <th className="text-right px-3 py-2.5">Waist</th>
                        <th className="text-right px-3 py-2.5">Hip</th>
                        <th className="text-right px-3 py-2.5">Inseam</th>
                      </>
                    )}
                    {kind === "headwear" && (
                      <th className="text-right px-3 py-2.5">Head (cm)</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--ink]/8">
                  {sizes.map((size) => (
                    <tr key={size} className="text-[--ink]">
                      <td className="px-3 py-2.5 font-bold">{size}</td>
                      {kind === "tops" && (
                        <>
                          <td className="text-right px-3 py-2.5 tabular-nums">{TOPS[size].chest} cm</td>
                          <td className="text-right px-3 py-2.5 tabular-nums">{TOPS[size].length} cm</td>
                          <td className="text-right px-3 py-2.5 tabular-nums">{TOPS[size].sleeve} cm</td>
                        </>
                      )}
                      {kind === "bottoms" && (
                        <>
                          <td className="text-right px-3 py-2.5 tabular-nums">{BOTTOMS[size].waist} cm</td>
                          <td className="text-right px-3 py-2.5 tabular-nums">{BOTTOMS[size].hip} cm</td>
                          <td className="text-right px-3 py-2.5 tabular-nums">{BOTTOMS[size].inseam} cm</td>
                        </>
                      )}
                      {kind === "headwear" && (
                        <td className="text-right px-3 py-2.5 tabular-nums">{HEADWEAR[size]}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note */}
            <p className="font-sans text-xs text-[--ink]/45 leading-relaxed mt-5">
              {kind === "headwear"
                ? "Measured around the head, just above the ears. Adjustable strap covers the rest."
                : "Flat measurements, garment laid on a table — not your body. When in doubt, size up. We won't judge. Much."}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
