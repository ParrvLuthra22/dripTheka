import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { POUR_001, POURING_PRODUCTS, getPriceDisplay } from "@/data/pour-001";
import { ProductHero }   from "@/components/sections/product/ProductHero";
import { ProductSidebar } from "@/components/sections/product/ProductSidebar";
import { HowItPours }    from "@/components/sections/product/HowItPours";
import { AlsoPouring }   from "@/components/sections/product/AlsoPouring";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return POURING_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = POUR_001.products.find((p) => p.slug === slug);
  if (!product) return { title: "Not Found" };

  return {
    title:       `${product.name} — Drip Theka`,
    description: `${product.tagline} ${getPriceDisplay(product.price)} · Pour #${product.dropNumber}`,
    openGraph: {
      title:       `${product.name} — Drip Theka`,
      description: product.tagline,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = POUR_001.products.find((p) => p.slug === slug);
  if (!product) notFound();

  return (
    <>
      {/*
        Split-screen layout:
          Mobile:  sidebar first (product info) → illustrations below
          Desktop: illustrations left (scroll) | sidebar right (sticky)

        The CSS grid swaps order via `order` utilities.
      */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_440px] items-start">
        {/* LEFT — illustrations (order-2 on mobile so sidebar shows first) */}
        <div className="order-2 md:order-1">
          <ProductHero product={product} />
        </div>

        {/* RIGHT — purchase sidebar (order-1 on mobile = shown above gallery) */}
        <div className="order-1 md:order-2">
          <ProductSidebar product={product} />
        </div>
      </div>

      {/* ── Below the fold ─────────────────────────────────────────── */}
      <HowItPours product={product} />
      <AlsoPouring currentSlug={product.slug} />
    </>
  );
}
