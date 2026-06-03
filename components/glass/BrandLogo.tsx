"use client";

// BrandLogo — renders the official Drip Theka brand PNG directly.
// No wrapper, no trickery. The logo has a #004AAD blue background.
// The navbar is also blue, so they blend seamlessly.

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const HEIGHTS = {
  sm:  32,
  md:  48,
  lg:  64,
  xl:  96,
} as const;

interface BrandLogoProps {
  size?: keyof typeof HEIGHTS | number;
  className?: string;
  tone?: "default" | "cream" | "ink"; // kept for API compat
  alt?: string;
  priority?: boolean;
}

export function BrandLogo({
  size = "md",
  className,
  alt = "Drip Theka",
  priority = false,
}: BrandLogoProps) {
  const h = typeof size === "number" ? size : HEIGHTS[size];
  // dt-nav-logo.png is square
  const w = h;

  return (
    <Image
      src="/dt-nav-logo.png"
      alt={alt}
      width={500}
      height={500}
      priority={priority}
      draggable={false}
      className={cn("select-none pointer-events-none block", className)}
      style={{ height: h, width: w, objectFit: "contain" }}
    />
  );
}
