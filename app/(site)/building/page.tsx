"use client";

// Building — founder-journey journal index.
// List layout with hover row state + WineGlassMark per post.

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ThekaLabel }    from "@/components/ui/ThekaLabel";
import { Reveal }        from "@/components/motion/Reveal";
import { Grain }         from "@/components/theka/Grain";
import { HandText }      from "@/components/ui/HandText";
import { BUILDING_POSTS } from "@/data/building";
import { cn }             from "@/lib/utils/cn";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }).toUpperCase()
    + " · " + d.getFullYear();
}

export default function BuildingIndexPage() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div data-nav-tone="dark" className="relative bg-(--cream) min-h-screen">
      <Grain opacity={0.04} />
      {/* Header */}
      <header
        className="py-16 md:py-24 border-b border-(--ink)/8"
        style={{ paddingInline: "var(--pad-x)" }}
      >
        <Reveal className="mb-5">
          <ThekaLabel k="buildingTheka" />
        </Reveal>
        <Reveal delay={80}>
          <h1
            className="font-display italic text-(--ink) leading-tight"
            style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)" }}
          >
            From the founders.
          </h1>
        </Reveal>
        <Reveal delay={160} className="mt-4">
          <p className="font-sans text-(--ink)/50 max-w-[480px]" style={{ fontSize: "clamp(0.9rem, 1.6vw, 1.1rem)" }}>
            The unfiltered build log. Mistakes, decisions, pivots, and the occasional win.
          </p>
        </Reveal>
      </header>

      {/* Post list */}
      <ul className="divide-y divide-(--ink)/8" style={{ paddingInline: "var(--pad-x)" }}>
        {BUILDING_POSTS.map((post, i) => (
          <li key={post.slug}>
            <Link
              href={`/building/${post.slug}`}
              data-hover
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="group relative flex items-center gap-5 md:gap-8 py-7 md:py-9 transition-colors duration-200"
              aria-label={post.title}
            >
              {/* Hover bg — cream-warm tint */}
              {hoveredIdx === i && (
                <motion.div
                  layoutId="building-hover"
                  className="absolute inset-x-0 inset-y-0 pointer-events-none -z-0"
                  style={{ backgroundColor: "var(--cream-warm, #EFEAD8)", marginInline: "calc(var(--pad-x) * -1)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 35 }}
                />
              )}

              {/* Date */}
              <span className="relative z-10 shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-(--ink)/35 w-28 hidden sm:block">
                {fmtDate(post.date)}
              </span>

              {/* Title */}
              <span
                className="relative z-10 flex-1 font-display italic text-(--ink) leading-tight group-hover:text-(--blue) transition-colors duration-200"
                style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.6rem)" }}
              >
                {post.title}
              </span>

              {/* Post number + glass mark */}
              <div className="relative z-10 shrink-0 flex flex-col items-end gap-0.5">
                <motion.span
                  className="font-display italic text-(--ink)/30 group-hover:text-(--blue) transition-colors duration-200"
                  animate={{ x: hoveredIdx === i ? -4 : 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)", lineHeight: 1 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </motion.span>
                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-(--ink)/20 group-hover:text-(--blue) transition-colors duration-200">
                  Dispatch
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Footer note */}
      <div className="py-12 text-center border-t border-(--ink)/8" style={{ paddingInline: "var(--pad-x)" }}>
        <HandText size="sm" rotate={-2} color="var(--ink)" className="opacity-25 mb-3">
          more dispatches coming
        </HandText>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-(--ink)/20">
          {BUILDING_POSTS.length} dispatches · More coming
        </p>
      </div>
    </div>
  );
}
