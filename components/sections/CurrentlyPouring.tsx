"use client";

// Currently Pouring — asymmetric 12-column product grid.
// Tapped Out products: grayscale + tipped WineGlassMark watermark.

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { WineGlassMark } from "@/components/glass/WineGlassMark";
import { ProductIllustration } from "./ProductIllustration";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { POUR_001, isTappedOut, getPriceDisplay } from "@/data/pour-001";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

// Theka-flavoured tags per product position
const TAGS = [
  "Freshly Poured",
  "Happy Hour",
  "Freshly Poured",
  "Last Round",
  "Tapped Out",    // product 5 is fully tapped out
  "Freshly Poured",
];

// Grid column spans: asymmetric editorial layout
// Row 1: 7 + 5 = 12
// Row 2: 4 + 4 + 4 = 12
// Row 3: 12 (full)
const COL_SPANS = [
  "col-span-12 md:col-span-7",
  "col-span-12 md:col-span-5",
  "col-span-12 md:col-span-4",
  "col-span-12 md:col-span-4",
  "col-span-12 md:col-span-4",
  "col-span-12",
];

const ASPECT_RATIOS = [
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-square",
  "aspect-square",
  "aspect-square",
  "aspect-[21/8]",
];

interface ProductCardProps {
  product: (typeof POUR_001.products)[number];
  tag: string;
  colSpan: string;
  aspectRatio: string;
  index: number;
}

function ProductCard({ product, tag, colSpan, aspectRatio, index }: ProductCardProps) {
  const router = useRouter();
  const tappedOut = isTappedOut(product.sizes);
  const primaryColor = product.colors[0];
  const accentColor = product.colors[1] ?? "#E4E2DD";

  const handleClick = () => {
    if (!tappedOut) router.push(`/product/${product.slug}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className={cn(colSpan, "group")}
    >
      <div
        onClick={handleClick}
        role={tappedOut ? "presentation" : "button"}
        tabIndex={tappedOut ? -1 : 0}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        aria-label={tappedOut ? `${product.name} — Tapped Out` : `View ${product.name}`}
        data-hover={!tappedOut}
        className={cn(
          "relative flex flex-col",
          !tappedOut && "cursor-pointer",
          tappedOut && "cursor-not-allowed"
        )}
      >
        {/* ── Image area ──────────────────────────────────────────────── */}
        <div
          className={cn(
            "relative overflow-hidden",
            aspectRatio,
            tappedOut && "[filter:grayscale(100%)_brightness(0.85)]"
          )}
          style={{ backgroundColor: primaryColor }}
        >
          {/* Product illustration */}
          <div className="absolute inset-0 flex items-center justify-center p-[10%] transition-transform duration-500 ease-out group-hover:scale-[1.06]">
            <ProductIllustration
              type={product.type}
              primaryColor={primaryColor}
              accentColor={accentColor}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Tapped Out watermark — tipped wine glass */}
          {tappedOut && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <WineGlassMark
                size={96}
                tilt={-75}
                className="text-[#E4E2DD] opacity-30"
              />
            </div>
          )}

          {/* Tag pill — top left */}
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                "font-mono text-[8px] uppercase tracking-[0.14em] px-2 py-1",
                "transition-transform duration-300 inline-block",
                "group-hover:rotate-[-2deg]",
                tappedOut
                  ? "bg-[#3D0000] text-[#FF6B6B]"
                  : "bg-[--ink]/80 text-[--cream]"
              )}
            >
              {tag}
            </span>
          </div>

          {/* Price — top right */}
          <div className="absolute top-3 right-3">
            <span className="font-mono text-[9px] text-[--cream] bg-[--ink]/70 px-2 py-1">
              {getPriceDisplay(product.price)}
            </span>
          </div>
        </div>

        {/* ── Below image ─────────────────────────────────────────────── */}
        <div className="pt-3 pb-1 space-y-1">
          {/* Mono row */}
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/40">
            {String(POUR_001.products.indexOf(product) + 1).padStart(2, "0")}&nbsp;/&nbsp;
            {product.type}s&nbsp;·&nbsp;
            {product.sizes.filter(s => s.stock > 0).map(s => s.size).join("–") || "Tapped Out"}
          </p>

          {/* Name with hover underline */}
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
              tappedOut && "opacity-40"
            )}
            style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)" }}
          >
            {product.name}&nbsp;·&nbsp;Pour 001
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export function CurrentlyPouring() {
  return (
    <section className="bg-[--cream] py-20 md:py-28" aria-labelledby="pouring-heading">
      <div style={{ paddingInline: "var(--pad-x)" }}>

        {/* Section header */}
        <Reveal className="flex items-start justify-between mb-12 border-b border-[--ink]/10 pb-8">
          <div>
            <Eyebrow color="ink" className="mb-3">[02 / Currently Pouring]</Eyebrow>
            <h2
              id="pouring-heading"
              className="font-display italic text-[--ink] leading-none"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
            >
              The First Round.
            </h2>
          </div>
          <p className="hidden md:block font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/30 text-right max-w-[180px] leading-relaxed">
            {POUR_001.editorialNote}
          </p>
        </Reveal>

        {/* Asymmetric product grid */}
        <div className="grid grid-cols-12 gap-3 md:gap-4">
          {POUR_001.products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              tag={TAGS[index] ?? "Freshly Poured"}
              colSpan={COL_SPANS[index] ?? "col-span-12 md:col-span-4"}
              aspectRatio={ASPECT_RATIOS[index] ?? "aspect-square"}
              index={index}
            />
          ))}
        </div>

        {/* Section CTA */}
        <Reveal delay={100} className="mt-12 pt-8 border-t border-[--ink]/10 flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/30">
            {POUR_001.products.length}&nbsp;pieces&nbsp;·&nbsp;200 of each
          </p>
          <Link
            href="/pour/pour-001"
            data-hover
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[--blue] hover:text-[--ink] transition-colors duration-200 flex items-center gap-2"
          >
            See the full pour&nbsp;→
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
