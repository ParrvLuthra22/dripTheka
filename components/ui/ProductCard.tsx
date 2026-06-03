"use client";

// Shared ProductCard — used in CurrentlyPouring (home) and PourProductGrid (pour page).
// Includes 3D perspective tilt on hover (cursor drives rotateX/Y).

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { TappedOutStamp } from "@/components/glass/TappedOutStamp";
import { ProductIllustration } from "@/components/sections/ProductIllustration";
import { isTappedOut, getPriceDisplay, POUR_001 } from "@/data/pour-001";
import type { Product } from "@/data/pour-001";

// Theka-language tag palette
const TAGS: Record<string, string> = {
  "dt-001-001": "Freshly Poured",
  "dt-001-002": "Happy Hour",
  "dt-001-003": "Freshly Poured",
  "dt-001-004": "Last Round",
  "dt-001-005": "Tapped Out",
  "dt-001-006": "Freshly Poured",
};

interface ProductCardProps {
  product: Product;
  aspectRatio?: string;
  animDelay?: number;
}

export function ProductCard({
  product,
  aspectRatio = "aspect-[3/4]",
  animDelay   = 0,
}: ProductCardProps) {
  const router     = useRouter();
  const tappedOut  = isTappedOut(product.sizes);
  const tag        = TAGS[product.id] ?? "Freshly Poured";
  const primary    = product.colors[0];
  const accent     = product.colors[1] ?? "#E4E2DD";
  const productNum = POUR_001.products.findIndex((p) => p.id === product.id) + 1;

  // ── 3D tilt on hover ───────────────────────────────────────────────────
  const imgRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = imgRef.current;
    if (!el || tappedOut) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;  // -0.5..0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    // Subtle tilt — 6° max in either axis
    el.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg)`;
  }, [tappedOut]);

  const onMouseLeave = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  }, []);

  const handleClick = () => {
    if (!tappedOut) router.push(`/product/${product.slug}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.55, delay: animDelay, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <div
        role={tappedOut ? "presentation" : "button"}
        tabIndex={tappedOut ? -1 : 0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        aria-label={tappedOut ? `${product.name} — Tapped Out` : `View ${product.name}`}
        data-hover={!tappedOut || undefined}
        data-cursor={!tappedOut ? "view" : undefined}
        className={cn(
          "flex flex-col",
          tappedOut ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        {/* ── Illustration area — 3D tilt on hover ─────────────────── */}
        <div
          ref={imgRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className={cn(
            "relative overflow-hidden",
            aspectRatio,
            tappedOut && "[filter:grayscale(1)_brightness(0.8)]"
          )}
          style={{
            backgroundColor: primary,
            transformStyle: "preserve-3d",
            transition: "transform 0.45s cubic-bezier(.2,.9,.3,1)",
            willChange: "transform",
          }}
        >
          {/* Garment SVG */}
          <div className="absolute inset-0 flex items-center justify-center p-[8%] transition-transform duration-500 ease-out group-hover:scale-[1.06]">
            <ProductIllustration
              type={product.type}
              primaryColor={primary}
              accentColor={accent}
              className="w-full h-full"
            />
          </div>

          {/* Tapped Out watermark — typographic stamp */}
          {tappedOut && <TappedOutStamp />}

          {/* Tag pill — top left; rotates on hover */}
          <div className="absolute top-3 left-3 z-10">
            <span
              className={cn(
                "font-mono text-[8px] uppercase tracking-[0.14em] px-2 py-1",
                "inline-block transition-transform duration-300 group-hover:rotate-[-2deg]",
                tappedOut
                  ? "bg-[#3D0000] text-[#FF7070]"
                  : "bg-[--ink]/80 text-[--cream]"
              )}
            >
              {tag}
            </span>
          </div>

          {/* Price — top right */}
          <div className="absolute top-3 right-3 z-10">
            <span className="font-mono text-[9px] text-[--cream] bg-[--ink]/70 px-2 py-1 tabular-nums">
              {getPriceDisplay(product.price)}
            </span>
          </div>
        </div>

        {/* ── Metadata ──────────────────────────────────────────── */}
        <div className="pt-2.5 space-y-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/35">
            {String(productNum).padStart(2, "0")}&nbsp;/&nbsp;
            {product.type}s&nbsp;·&nbsp;
            {isTappedOut(product.sizes)
              ? "Tapped Out"
              : product.sizes.filter((s) => s.stock > 0).map((s) => s.size).join(" – ")}
          </p>

          <p
            className={cn(
              "font-display italic text-[--ink] leading-tight",
              "relative inline-block",
              !tappedOut && [
                "after:absolute after:bottom-0 after:left-0",
                "after:h-px after:w-full after:bg-[--ink]",
                "after:scale-x-0 after:origin-left",
                "after:transition-transform after:duration-300",
                "group-hover:after:scale-x-100",
              ].join(" "),
              tappedOut && "opacity-40 line-through"
            )}
            style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.15rem)" }}
          >
            {product.name}
          </p>

          {!tappedOut && (
            <div className="flex items-center justify-between mt-4">
              <p className="font-mono text-[9px] text-[--blue] font-bold tracking-[0.1em]">
                {getPriceDisplay(product.price)}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  router.push(`/product/${product.slug}`);
                }}
                data-cursor="add"
                className="font-display text-sm px-4 py-2 bg-[--neon] text-black border-2 border-black shadow-[2px_2px_0_0_#141518] hover:shadow-[0px_0px_0_0_#141518] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                ADD TO CART
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
