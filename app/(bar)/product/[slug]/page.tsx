// /product/[slug] — a shareable link that lands on the Wall's zoomed product view.
//
// Wall products (those with `wall` cutouts) render ProductStage: the same
// plaster, light and ledge as the live Wall, framed by CSS so the server HTML is
// already the finished picture (no camera animation), then a scrolling "below the
// fold". Products with no wall art yet keep the legacy split-screen page, served
// from app/(site)/shop/[slug] via a rewrite (see next.config.ts).
//
// Lives in the (bar) group — like the Wall itself it has its own header and
// native cursor, and shouldn't load the (site) chrome (Nav, Cursor, Grain, glass…).

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  POUR_001, hasWall, isTappedOut,
  type WallProduct,
} from "@/data/pour-001";
import { ProductStage, type StageCell } from "@/components/theka/wall/ProductStage";
import { ProductBelow } from "@/components/theka/wall/ProductBelow";
import { productMetadata } from "@/lib/theka/productMetadata";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://driptheka.com";
const COLS = 5; // the Wall's desktop grid

const wallProducts = (): WallProduct[] => POUR_001.products.filter(hasWall);

export function generateStaticParams() {
  return wallProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return productMetadata(slug);
}

function availability(p: WallProduct): string {
  if (p.placeholderArt) return "https://schema.org/PreOrder";
  return isTappedOut(p.sizes) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock";
}

function jsonLd(p: WallProduct) {
  const url = `${SITE}/product/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.blurb ?? p.tagline,
    sku: p.id.toUpperCase(),
    image: [`${SITE}${p.wall.front}`, `${SITE}${p.wall.back}`],
    brand: { "@type": "Brand", name: "Drip Theka" },
    color: p.colourway,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: (p.price / 100).toFixed(2),
      availability: availability(p),
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = POUR_001.products.find((p) => p.slug === slug);
  if (!product) notFound();

  // Products with no wall art yet render at app/(site)/shop/[slug] (rewritten from this
  // URL in next.config.ts) so the Theka shell stays out of this route's JS.
  if (!hasWall(product)) notFound();

  // ── Wall product ──────────────────────────────────────────────────────────
  const all = wallProducts();
  const total = all.length;
  const index = all.findIndex((p) => p.slug === product.slug);
  const at = (i: number) => all[(i + total) % total];

  // Same-row neighbours peek in at the edges (desktop). Mobile isolates the fit (CSS).
  const row = Math.floor(index / COLS);
  const cells: StageCell[] = all
    .map((p, i) => ({ product: p, col: i % COLS, row: Math.floor(i / COLS), i }))
    .filter((c) => c.row === row && Math.abs(c.i - index) <= 1)
    .map(({ product: p, col, row: r }) => ({ product: p, col, row: r }));

  // Three more from the aisle, wrapping round.
  const related = [1, 2, 3].map((d) => at(index + d)).filter((p) => p.slug !== product.slug);

  // No preload() here: the front <img> (fetchPriority="high") is already in the server HTML,
  // and a preload hint would also fire whenever a neighbouring page is prefetched.

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(product)).replace(/</g, "\\u003c") }}
      />
      <main>
      <ProductStage
        product={product}
        index={index}
        total={total}
        cells={cells}
        ars={all.map((p) => p.wall.ar ?? 0.84)}
        prevHref={`/product/${at(index - 1).slug}`}
        nextHref={`/product/${at(index + 1).slug}`}
        backHref={`/?fit=${product.slug}`}
      />
      <ProductBelow product={product} related={related} />
      </main>
    </>
  );
}

