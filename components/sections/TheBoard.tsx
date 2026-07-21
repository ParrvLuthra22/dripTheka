"use client";

// The Board — homepage "what's on tap" section.
// Three horizontal-scroll rows: Fresh Pour (new), Most Poured (best-sellers),
// Recently Viewed (per-browser, via lib/store/recentlyViewed).

import { ProductCard } from "@/components/ui/ProductCard";
import { ThekaLabel, type ThekaKey } from "@/components/ui/ThekaLabel";
import { Reveal } from "@/components/motion/Reveal";
import { POUR_001, getFreshPour, getMostPoured } from "@/data/pour-001";
import type { Product } from "@/data/pour-001";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewed";

interface BoardRowProps {
  titleKey: ThekaKey;
  products: Product[];
}

function BoardRow({ titleKey, products }: BoardRowProps) {
  if (products.length === 0) return null;

  return (
    <div className="mb-12 last:mb-0">
      <Reveal className="mb-5">
        <ThekaLabel k={titleKey} color="ink" />
      </Reveal>

      <div
        className={[
          "flex gap-4 md:gap-5 pb-2",
          "overflow-x-auto",
          "snap-x snap-mandatory",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "pr-[var(--pad-x)]",
        ].join(" ")}
      >
        {products.map((product, i) => (
          <div key={product.id} className="snap-start shrink-0 w-[200px] sm:w-[240px]">
            <ProductCard product={product} aspectRatio="aspect-[3/4]" animDelay={i * 0.05} />
          </div>
        ))}
        <div className="shrink-0 w-[var(--pad-x)]" aria-hidden="true" />
      </div>
    </div>
  );
}

export function TheBoard() {
  const recentSlugs = useRecentlyViewedStore((s) => s.slugs);
  const recentlyViewed = recentSlugs
    .map((slug) => POUR_001.products.find((p) => p.slug === slug))
    .filter((p): p is Product => Boolean(p));

  return (
    <section
      data-section="the-board"
      data-nav-tone="dark"
      className="bg-[--cream] py-20 md:py-28 border-t border-[--ink]/8"
      aria-labelledby="board-heading"
    >
      <div style={{ paddingInline: "var(--pad-x)" }}>
        <Reveal className="mb-12 border-b border-[--ink]/10 pb-8">
          <div className="mb-5"><ThekaLabel k="theBoard" color="ink" /></div>
          <h2
            id="board-heading"
            className="font-display italic text-[--ink] leading-[1.05]"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
          >
            What&apos;s on tap.
          </h2>
        </Reveal>

        <BoardRow titleKey="freshPour" products={getFreshPour()} />
        <BoardRow titleKey="mostPoured" products={getMostPoured()} />
        <BoardRow titleKey="recentlyViewed" products={recentlyViewed} />
      </div>
    </section>
  );
}
