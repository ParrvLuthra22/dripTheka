// Metadata shared by both renderers of /product/[slug]: the Wall page
// (app/(bar)/product/[slug]) and the pre-Wall page for products with no wall art
// yet (app/(site)/shop/[slug], reached by a rewrite in next.config.ts).

import type { Metadata } from "next";
import { POUR_001, getPriceDisplay, hasWall } from "@/data/pour-001";

export function productMetadata(slug: string): Metadata {
  const product = POUR_001.products.find((p) => p.slug === slug);
  if (!product) return { title: "Not Found" };

  const title = `${product.name} — Drip Theka`;
  const description = hasWall(product)
    ? (product.blurb ?? product.tagline)
    : `${product.tagline} ${getPriceDisplay(product.price)} · Pour #${product.dropNumber}`;
  const url = `/product/${product.slug}`;
  // Colourways of one design are variants of a single listing: the page for the
  // first colourway is canonical for all of them (it is the one in the sitemap).
  const first = product.design ? POUR_001.products.find((p) => p.design === product.design) : undefined;
  const canonical = first ? `/product/${first.slug}` : url;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    // Demo-art tees are not for sale yet: keep them out of search until real designs land.
    ...(product.placeholderArt ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: "website", url, title, description, siteName: "Drip Theka" },
    twitter: { card: "summary_large_image", title, description },
  };
}
