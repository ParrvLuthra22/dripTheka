// The pre-Wall split-screen product page, for products with no wall art yet.
// Public URL is /product/[slug] — next.config.ts rewrites those slugs here so the
// Theka shell (this route's (site) layout) never lands in the Wall pages' JS.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { POUR_001, POURING_PRODUCTS, hasWall } from "@/data/pour-001";
import { productMetadata } from "@/lib/theka/productMetadata";
import { ProductHero }    from "@/components/sections/product/ProductHero";
import { ProductSidebar } from "@/components/sections/product/ProductSidebar";
import { HowItPours }     from "@/components/sections/product/HowItPours";
import { AlsoPouring }    from "@/components/sections/product/AlsoPouring";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return POURING_PRODUCTS.filter((p) => !hasWall(p)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return productMetadata(slug);
}

export default async function ShopProductPage({ params }: Props) {
  const { slug } = await params;
  const product = POUR_001.products.find((p) => p.slug === slug);
  if (!product || hasWall(product)) notFound();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_440px] items-start">
        <div className="order-2 md:order-1"><ProductHero product={product} /></div>
        <div className="order-1 md:order-2"><ProductSidebar product={product} /></div>
      </div>
      <HowItPours product={product} />
      <AlsoPouring currentSlug={product.slug} />
    </>
  );
}
