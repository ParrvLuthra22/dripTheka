"use client";

// Sticker — brand SVG decorative sticker layer.
//
// Seven hand-crafted variants inspired by real vinyl stickers, rubber stamps,
// and bottle caps. Always pointer-events-none + aria-hidden. Drop into any
// position:relative container and pass className for absolute positioning.
//
// Variants:
//   wine-glass       — square cream tile with WineGlassMark
//   bottle-cap       — 12-peak zigzag cap, cobalt fill, "DT" monogram
//   drip-theka-mark  — horizontal double-rule stamp, cream bg
//   made-in-delhi    — circular stamp with arc text + star
//   regulars-only    — horizontal banner, deep red bg
//   freshly-poured   — circular stamp with arc text + glass silhouette
//   21-plus          — square ink tile with oversized "21+"

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { WineGlassMark } from "@/components/glass/WineGlassMark";

export type StickerVariant =
  | "wine-glass"
  | "bottle-cap"
  | "drip-theka-mark"
  | "made-in-delhi"
  | "regulars-only"
  | "freshly-poured"
  | "21-plus";

interface StickerProps {
  variant: StickerVariant;
  /** Resting rotation in degrees. Defaults vary per variant. */
  rotate?: number;
  /** Pixel size — diameter for circles, side for squares, width for rectangles. */
  size?: number;
  className?: string;
}

// Precomputed 12-peak bottle-cap polygon points (viewBox 0 0 100 100, center 50,50)
const CAP_POINTS =
  "50,3 60.4,11.4 73.5,9.3 78.3,21.7 90.7,26.5 88.6,39.6 97,50 " +
  "88.6,60.4 90.7,73.5 78.3,78.3 73.5,90.7 60.4,88.6 50,97 " +
  "39.6,88.6 26.5,90.7 21.7,78.3 9.3,73.5 11.4,60.4 3,50 " +
  "11.4,39.6 9.3,26.5 21.7,21.7 26.5,9.3 39.6,11.4";

const LOUD = "var(--font-loud, Impact, 'Arial Black', sans-serif)";
const MONO   = "var(--font-jetbrains, 'JetBrains Mono', monospace)";
const SERIF  = "var(--font-fraunces, Georgia, serif)";

interface VariantRenderProps {
  size: number;
  uid: string;
}

function BottleCapSvg({ size, uid: _ }: VariantRenderProps) {
  const labelSize = Math.round(size * 0.3);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <polygon points={CAP_POINTS} fill="#004AAD" stroke="#141518" strokeWidth="2.5" />
      <text
        x="50" y="60"
        textAnchor="middle"
        style={{ fontFamily: LOUD, fontSize: labelSize, fill: "#E4E2DD" }}
      >
        DT
      </text>
    </svg>
  );
}

function MadeInDelhiSvg({ size, uid }: VariantRenderProps) {
  const topId = `${uid}-t`;
  const botId = `${uid}-b`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <path id={topId} d="M 14 50 A 36 36 0 0 1 86 50" />
        <path id={botId} d="M 14 50 A 36 36 0 0 0 86 50" />
      </defs>
      <circle cx="50" cy="50" r="48" fill="#E4E2DD" stroke="#141518" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#141518" strokeWidth="0.8" strokeDasharray="3 2" />
      <text style={{ fontFamily: MONO, fontSize: "8px", fill: "#141518", letterSpacing: "2px" }}>
        <textPath href={`#${topId}`} startOffset="50%" textAnchor="middle">MADE IN DELHI</textPath>
      </text>
      <text
        x="50" y="58"
        textAnchor="middle"
        style={{ fontFamily: LOUD, fontSize: "20px", fill: "#141518" }}
      >
        ✦
      </text>
      <text style={{ fontFamily: MONO, fontSize: "7.5px", fill: "#141518", letterSpacing: "2px" }}>
        <textPath href={`#${botId}`} startOffset="50%" textAnchor="middle">EST. 2026</textPath>
      </text>
    </svg>
  );
}

function FreshlyPouredSvg({ size, uid }: VariantRenderProps) {
  const topId = `${uid}-t`;
  const botId = `${uid}-b`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <path id={topId} d="M 14 50 A 36 36 0 0 1 86 50" />
        <path id={botId} d="M 14 50 A 36 36 0 0 0 86 50" />
      </defs>
      <circle cx="50" cy="50" r="48" fill="#004AAD" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#E4E2DD" strokeWidth="0.8" strokeDasharray="3 2" />
      <text style={{ fontFamily: MONO, fontSize: "7.5px", fill: "#E4E2DD", letterSpacing: "1.5px" }}>
        <textPath href={`#${topId}`} startOffset="50%" textAnchor="middle">FRESHLY POURED</textPath>
      </text>
      {/* Simplified wine glass silhouette */}
      <path
        d="M 43 37 L 57 37 L 54 49 L 54 56 L 46 56 L 46 49 Z"
        fill="none" stroke="#E4E2DD" strokeWidth="1.3" strokeLinejoin="round" opacity="0.55"
      />
      <line x1="42" y1="56" x2="58" y2="56" stroke="#E4E2DD" strokeWidth="1.5" opacity="0.55" />
      <text style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "7.5px", fill: "#E4E2DD", letterSpacing: "0.8px" }}>
        <textPath href={`#${botId}`} startOffset="50%" textAnchor="middle">abhi nikla hai</textPath>
      </text>
    </svg>
  );
}

function renderVariant(variant: StickerVariant, size: number, uid: string) {
  switch (variant) {
    case "wine-glass":
      return (
        <div
          className="flex items-center justify-center bg-[#E4E2DD] border-2 border-[#141518] shadow-[3px_3px_0_0_#141518]"
          style={{ width: size, height: size }}
        >
          <WineGlassMark
            size={Math.round(size * 0.52)}
            liquid={32}
            liquidColor="#004AAD"
          />
        </div>
      );

    case "bottle-cap":
      return <BottleCapSvg size={size} uid={uid} />;

    case "drip-theka-mark":
      return (
        <div
          className="flex flex-col items-center justify-center bg-[#E4E2DD] border-2 border-[#141518] shadow-[3px_3px_0_0_#141518] px-3 py-2"
          style={{ minWidth: Math.round(size * 1.4) }}
        >
          <span style={{ fontFamily: LOUD, fontSize: Math.round(size * 0.36), color: "#141518", lineHeight: 1, textTransform: "uppercase" }}>
            DRIP
          </span>
          <div style={{ width: "100%", height: 1, background: "rgba(20,21,24,0.18)", margin: "3px 0" }} />
          <span style={{ fontFamily: LOUD, fontSize: Math.round(size * 0.36), color: "#141518", lineHeight: 1, textTransform: "uppercase" }}>
            THEKA
          </span>
        </div>
      );

    case "made-in-delhi":
      return <MadeInDelhiSvg size={size} uid={uid} />;

    case "regulars-only":
      return (
        <div
          className="flex items-center justify-center border-2 border-[#141518] shadow-[3px_3px_0_0_#141518] px-4 py-2"
          style={{ background: "#7C1F1A" }}
        >
          <span style={{ fontFamily: LOUD, fontSize: Math.round(size * 0.26), color: "#E4E2DD", textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1 }}>
            REGULARS ONLY
          </span>
        </div>
      );

    case "freshly-poured":
      return <FreshlyPouredSvg size={size} uid={uid} />;

    case "21-plus":
      return (
        <div
          className="flex flex-col items-center justify-center border-2 border-[#004AAD] shadow-[3px_3px_0_0_#004AAD]"
          style={{ width: size, height: size, background: "#141518" }}
        >
          <span style={{ fontFamily: LOUD, fontSize: Math.round(size * 0.44), color: "#E4E2DD", lineHeight: 1, textTransform: "uppercase" }}>
            21+
          </span>
          <span style={{ fontFamily: MONO, fontSize: Math.round(size * 0.085), color: "rgba(228,226,221,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1, marginTop: 4 }}>
            verify at door
          </span>
        </div>
      );
  }
}

export function Sticker({
  variant,
  rotate = -6,
  size = 80,
  className,
}: StickerProps) {
  const reactId        = useId();
  const uid            = reactId.replace(/:/g, "");
  const prefersReduced = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className={cn("pointer-events-none select-none inline-block", className)}
      style={{ transformOrigin: "center" }}
      initial={prefersReduced
        ? { opacity: 0 }
        : { opacity: 0, scale: 0.3, rotate: rotate - 22 }}
      whileInView={prefersReduced
        ? { opacity: 1 }
        : { opacity: 1, scale: 1, rotate }}
      viewport={{ once: true, margin: "-30px" }}
      whileHover={prefersReduced ? undefined : { rotate: rotate + 5, scale: 1.08 }}
      transition={{ type: "spring", stiffness: 260, damping: 14 }}
    >
      {renderVariant(variant, size, uid)}
    </motion.span>
  );
}
