"use client";

// Building Theka Teaser — GSAP ScrollTrigger pinned horizontal scroll on desktop.
// Mobile: native horizontal scroll with snap points.

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { BUILDING_POSTS } from "@/data/building";

gsap.registerPlugin(ScrollTrigger);

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase()
    .replace(",", " ·");
}

function JournalCard({ post, index }: { post: (typeof BUILDING_POSTS)[number]; index: number }) {
  return (
    <Link
      href={`/building/${post.slug}`}
      data-hover
      className="group block shrink-0 w-[min(80vw,360px)] md:w-[360px] bg-white p-8 border-4 border-black shadow-[8px_8px_0_0_#141518] hover:shadow-[0px_0px_0_0_#141518] hover:translate-x-2 hover:translate-y-2 transition-all duration-200 relative"
      aria-label={`Read: ${post.title}`}
    >
      {/* Top Header Row */}
      <div className="flex justify-between items-start mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-black">
          {formatDate(post.date)}
        </p>
        <span className="font-mono text-xl font-bold text-black leading-none">
          #{String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Title */}
      <h3
        className="font-display text-black uppercase leading-tight mb-4"
        style={{ fontSize: "clamp(1.5rem, 2vw, 2rem)" }}
      >
        {post.title}
      </h3>

      {/* Peek on hover */}
      <p className="font-sans text-sm text-black/70 leading-relaxed line-clamp-3 transition-all duration-300 opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-40 overflow-hidden">
        {post.excerpt}
      </p>

      {/* Arrow */}
      <div className="absolute bottom-6 right-6 font-mono text-xs font-bold text-[--neon] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">
        READ →
      </div>
    </Link>
  );
}

export function BuildingTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef   = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={sectionRef}
      data-nav-tone="dark"
      className="bg-[--cream] overflow-hidden relative isolate"
      aria-labelledby="building-heading"
    >
      <div
        className="py-20 md:py-28"
        style={{ paddingInline: "var(--pad-x)" }}
      >
        {/* Header */}
        <Reveal className="flex items-start justify-between mb-12">
          <div>
            <Eyebrow color="ink" className="mb-3">[04 / Building Theka]</Eyebrow>
            <h2
              id="building-heading"
              className="font-display italic text-[--ink] leading-none"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
            >
              From the Founder.
            </h2>
          </div>
          <Eyebrow color="ink" className="hidden md:flex">{BUILDING_POSTS.length} dispatches</Eyebrow>
        </Reveal>

        {/*
          Native horizontal scroll with snap for all devices.
        */}
        <div
          ref={trackRef}
          className={[
            "flex gap-5 pb-4",
            "overflow-x-auto",
            "snap-x snap-mandatory",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "pr-[var(--pad-x)]",
          ].join(" ")}
        >
          {BUILDING_POSTS.map((post, i) => (
            <div key={post.slug} className="snap-center shrink-0 md:shrink-0">
              <JournalCard post={post} index={i} />
            </div>
          ))}

          {/* Spacer so the last card doesn't sit against the edge */}
          <div className="shrink-0 w-[var(--pad-x)]" aria-hidden="true" />
        </div>

        {/* CTA */}
        <Reveal delay={120} className="mt-10 flex justify-end">
          <Link
            href="/building"
            data-hover
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[--blue] hover:text-[--ink] transition-colors duration-200"
          >
            Read the journal&nbsp;→
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
