import type { NextConfig } from "next";
import { POUR_001, hasWall } from "./data/pour-001";

// Products with no wall art yet are rendered by app/(site)/shop/[slug] (the Theka shell
// lives in the (site) layout). Rewriting keeps their public URL at /product/[slug]
// while keeping the shell's JS out of the Wall product route.
const legacyProductSlugs = POUR_001.products.filter((p) => !hasWall(p)).map((p) => p.slug);

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["gsap", "framer-motion", "three"],
  },
  async rewrites() {
    return {
      beforeFiles: legacyProductSlugs.length
        ? [{ source: `/product/:slug(${legacyProductSlugs.join("|")})`, destination: "/shop/:slug" }]
        : [],
      afterFiles: [],
      fallback: [],
    };
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
