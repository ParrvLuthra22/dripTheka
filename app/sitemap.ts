import type { MetadataRoute } from "next";
import { POURING_LISTING } from "@/data/pour-001";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://driptheka.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/pour/pour-001", "/story", "/regulars", "/building"];
  return [
    ...pages.map((path) => ({ url: `${SITE}${path}` })),
    // One URL per design (its first colourway); the other colourways are variants
    // whose pages canonical-point back to it, so they are not listed separately.
    ...POURING_LISTING.map((e) => ({ url: `${SITE}/product/${e.product.slug}` })),
  ];
}
