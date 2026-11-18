"use client";

// AlsoPouring — 3 related products below the fold.
// Excludes the current product; takes the next 3 from POUR_001.

import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/ui/ProductCard";
import { POUR_001 } from "@/data/pour-001";

interface AlsoPouring {
  currentSlug: string;
}

export function AlsoPouring({ currentSlug }: AlsoPouring) {
  const related = POUR_001.products
    .filter((p) => p.slug !== currentSlug)
    .slice(0, 3);

  if (!related.length) return null;

  return (
    <section
      className="bg-(--cream) py-20 md:py-28 border-t border-(--ink)/8"
      aria-label="Also pouring"
    >
      <div style={{ paddingInline: "var(--pad-x)" }}>
        {/* Header */}
        <Reveal className="flex items-center justify-between mb-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-(--ink)/30">
            Also Pouring
          </p>
          <Link
            href="/pour/pour-001"
            data-hover
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-(--blue) hover:text-(--ink) transition-colors"
          >
            See all →
          </Link>
        </Reveal>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {related.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              aspectRatio="aspect-[3/4]"
              animDelay={i * 0.08}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
