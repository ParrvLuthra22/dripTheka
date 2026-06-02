"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice, formatDeposit } from "@/lib/utils";
import { isTappedOut, getAvailableSizes } from "@/data/pour-001";
import type { Product, Size } from "@/data/pour-001";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [adding, setAdding] = useState(false);

  const tappedOut = isTappedOut(product.sizes);
  const availableSizes = getAvailableSizes(product.sizes);

  const handleAddToGlass = () => {
    if (!selectedSize || tappedOut) return;
    setAdding(true);
    addItem(product, selectedSize, product.colorNames[selectedColor]);
    setTimeout(() => {
      setAdding(false);
      openCart();
    }, 600);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col border border-[#141518]/10 hover:border-[#004AAD] transition-colors duration-300"
    >
      {/* Image area — editorial illustration placeholder */}
      <Link href={`/pour/pour-001#${product.slug}`} className="block">
        <div
          className="relative aspect-[3/4] overflow-hidden"
          style={{ backgroundColor: product.colors[selectedColor] }}
        >
          {/* Product visual placeholder — cobalt/cream/ink swatch */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="80"
              height="120"
              viewBox="0 0 80 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-30"
            >
              <path
                d="M20 30 Q20 80 40 100 Q60 80 60 30"
                stroke={product.colors[selectedColor] === "#E4E2DD" ? "#141518" : "#E4E2DD"}
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="40"
                cy="20"
                r="12"
                stroke={product.colors[selectedColor] === "#E4E2DD" ? "#141518" : "#E4E2DD"}
                strokeWidth="2"
                fill="none"
              />
              <line
                x1="40"
                y1="100"
                x2="40"
                y2="115"
                stroke={product.colors[selectedColor] === "#E4E2DD" ? "#141518" : "#E4E2DD"}
                strokeWidth="2"
              />
              <line
                x1="20"
                y1="115"
                x2="60"
                y2="115"
                stroke={product.colors[selectedColor] === "#E4E2DD" ? "#141518" : "#E4E2DD"}
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Tapped Out overlay */}
          {tappedOut && (
            <div className="absolute inset-0 bg-[#141518]/60 flex items-center justify-center">
              <span className="font-mono text-sm uppercase tracking-widest text-[#E4E2DD] border border-[#E4E2DD] px-4 py-2">
                Tapped Out
              </span>
            </div>
          )}

          {/* Drop number */}
          <div className="absolute top-3 left-3">
            <span className="font-mono text-[10px] uppercase tracking-widest bg-[#141518]/80 text-[#E4E2DD] px-2 py-1">
              #{product.dropNumber}
            </span>
          </div>

          {/* Limited units */}
          {product.isLimited && !tappedOut && (
            <div className="absolute top-3 right-3">
              <span className="font-mono text-[10px] uppercase tracking-widest bg-[#004AAD] text-[#E4E2DD] px-2 py-1">
                {product.totalUnits} only
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Name + tagline */}
        <div>
          <h3 className="font-display italic text-lg text-[#141518] leading-tight">
            {product.name}
          </h3>
          <p className="font-mono text-xs text-[#141518]/50 mt-0.5">
            {product.tagline}
          </p>
        </div>

        {/* Color swatches */}
        {product.colors.length > 1 && (
          <div className="flex gap-2">
            {product.colors.map((color, i) => (
              <button
                key={color}
                onClick={() => setSelectedColor(i)}
                aria-label={`Select ${product.colorNames[i]}`}
                className="w-5 h-5 rounded-full border-2 transition-all duration-150"
                style={{
                  backgroundColor: color,
                  borderColor: selectedColor === i ? "#004AAD" : "transparent",
                  boxShadow: selectedColor === i ? "0 0 0 1px #004AAD" : "0 0 0 1px rgba(20,21,24,0.2)",
                }}
              />
            ))}
          </div>
        )}

        {/* Size selector */}
        {!tappedOut && (
          <div className="flex flex-wrap gap-1.5">
            {product.sizes.map((variant) => (
              <button
                key={variant.size}
                onClick={() => setSelectedSize(variant.size)}
                disabled={variant.stock === 0}
                aria-label={`Size ${variant.size}${variant.stock === 0 ? " — Tapped Out" : ""}`}
                className={`font-mono text-xs px-2.5 py-1 border transition-all duration-150 ${
                  variant.stock === 0
                    ? "border-[#141518]/10 text-[#141518]/20 cursor-not-allowed line-through"
                    : selectedSize === variant.size
                    ? "border-[#004AAD] bg-[#004AAD] text-[#E4E2DD]"
                    : "border-[#141518]/30 text-[#141518] hover:border-[#004AAD]"
                }`}
              >
                {variant.size}
              </button>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div>
            <p className="font-mono text-sm text-[#141518]">
              {formatPrice(product.price)}
            </p>
            {!tappedOut && (
              <p className="font-mono text-[10px] text-[#004AAD]">
                {formatDeposit(product.price)} now
              </p>
            )}
          </div>

          <button
            onClick={handleAddToGlass}
            disabled={tappedOut || !selectedSize || adding}
            className={`font-mono text-[10px] uppercase tracking-widest px-4 py-2 transition-all duration-200 ${
              tappedOut
                ? "bg-[#141518]/10 text-[#141518]/30 cursor-not-allowed"
                : !selectedSize
                ? "border border-[#141518]/30 text-[#141518]/40 cursor-default"
                : adding
                ? "bg-[#004AAD] text-[#E4E2DD] scale-95"
                : "bg-[#004AAD] text-[#E4E2DD] hover:bg-[#141518]"
            }`}
          >
            {tappedOut
              ? "Tapped Out"
              : adding
              ? "Poured ✓"
              : !selectedSize
              ? "Pick a size"
              : "Add to Glass"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
