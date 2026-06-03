"use client";

// BrandLogo — the official Drip Theka lockup.
// Renders /public/dtlogo.png via next/image when available, falls back to
// a typographic version so the site works even before the asset is uploaded.
//
// The dtlogo.png is the artwork that includes the wine glass as the "e"
// in "Ka" — it IS the complete brand mark. No need to compose with WineGlassMark.

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const HEIGHTS = {
  sm: 22,
  md: 32,
  lg: 56,
  xl: 96,
} as const;

interface BrandLogoProps {
  /** Named size or explicit pixel height */
  size?: keyof typeof HEIGHTS | number;
  className?: string;
  /** Use cream-on-cobalt version if you have one at /public/dtlogo-cream.png */
  tone?: "default" | "cream" | "ink";
  /** alt text — default "Drip Theka" */
  alt?: string;
  priority?: boolean;
}

export function BrandLogo({
  size = "md",
  className,
  tone = "default",
  alt = "Drip Theka",
  priority = false,
}: BrandLogoProps) {
  const height = typeof size === "number" ? size : HEIGHTS[size];
  // Logo is roughly 4:1 wide (the actual file's intrinsic aspect)
  // We'll let next/image figure it out from the file dimensions
  const [errored, setErrored] = useState(false);

  // Image path — V1 single file. V1.1 could ship tone variants.
  // We use the cropped version (content-bounded, ~2.5:1 aspect)
  // rather than the raw 2000x2000 source. Falls back to /dtlogo.png if
  // /dtlogo-cropped.png is missing.
  const src = "/dtlogo-cropped.png";

  if (errored) {
    // Typographic fallback — used when /public/dtlogo.png isn't there yet
    return (
      <span
        className={cn(
          "inline-flex items-baseline gap-2 font-display italic font-semibold tracking-tight whitespace-nowrap",
          tone === "cream" && "text-[--cream]",
          tone === "ink"   && "text-[--ink]",
          className
        )}
        style={{ fontSize: height * 0.7, lineHeight: 1 }}
        aria-label={alt}
      >
        <span>drip</span>
        <span className="opacity-50">·</span>
        <span>theka</span>
      </span>
    );
  }

  // The cropped source is 1412×564 (~2.5:1), content-bounded.
  // next/image needs the intrinsic dims to compute aspect ratio;
  // we apply visual height via inline style and let width auto-scale.
  return (
    <Image
      src={src}
      alt={alt}
      width={1412}
      height={564}
      priority={priority}
      onError={() => setErrored(true)}
      className={cn(
        "select-none pointer-events-none",
        className
      )}
      style={{ height: `${height}px`, width: "auto" }}
      draggable={false}
    />
  );
}
