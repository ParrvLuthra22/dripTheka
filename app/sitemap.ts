import type { MetadataRoute } from "next";
import { POURING_PRODUCTS } from "@/data/pour-001";

// Demo-art (placeholderArt) tees are deliberately absent: POURING_PRODUCTS already
// excludes them, and their pages are noindex. They join once real designs land.
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://driptheka.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/pour/pour-001", "/story", "/regulars", "/building"];
  return [
    ...pages.map((path) => ({ url: `${SITE}${path}` })),
    ...POURING_PRODUCTS.map((p) => ({ url: `${SITE}/product/${p.slug}` })),
  ];
}
