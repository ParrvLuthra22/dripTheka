"use client";

// Footer — ink background, cream text.
// Massive stroked-outline wordmark parallaxes on scroll.

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { BrandLogo } from "@/components/glass/BrandLogo";

const POURS = [
  { label: "Pour #001 — The First Round", href: "/pour/pour-001" },
  { label: "Pour #002 — Coming soon",     href: "#",              muted: true },
];

const BRAND = [
  { label: "The Story",   href: "/story" },
  { label: "Building",    href: "/building" },
  { label: "Last Call",   href: "/regulars" }, // Theka: newsletter = Last Call
];

const CONNECT = [
  { label: "@driptheka",        href: "#" },
  { label: "Regulars early access", href: "/regulars" },
];

export function Footer() {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  // Wordmark drifts upward as footer scrolls into view — parallax effect
  const wordmarkY = useTransform(scrollYProgress, [0, 1], ["6%", "-8%"]);

  return (
    <footer ref={ref} data-nav-tone="light" className="bg-[--ink] text-[--cream] overflow-hidden relative">

      {/* ── Massive stroked wordmark ──────────────────────────────────────── */}
      <div
        className="relative overflow-hidden select-none pointer-events-none w-full"
        aria-hidden="true"
        style={{ paddingBlockStart: "clamp(2.5rem, 4vw, 5rem)", paddingBlockEnd: "0.5rem" }}
      >
        <motion.p
          style={{
            y:                    wordmarkY,
            fontSize:             "clamp(80px, 18vw, 320px)",
            WebkitTextStroke:     "1px rgba(228,226,221,0.2)",
            color:                "transparent",
            fontFamily:           "var(--font-display, serif)",
            fontStyle:            "italic",
            fontWeight:           600,
            lineHeight:           0.9,
            letterSpacing:        "-0.03em",
            whiteSpace:           "nowrap",
            willChange:           "transform",
            paddingInline:        "var(--pad-x)",
          }}
        >
          drip theka
        </motion.p>
      </div>

      {/* ── Four-column grid ─────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16"
        style={{
          paddingInline:    "var(--pad-x)",
          paddingBlockStart: "clamp(2.5rem, 5vw, 4rem)",
          paddingBlockEnd:   "2.5rem",
        }}
      >
        {/* Col 1 — The Manifesto */}
        <div className="flex flex-col gap-5">
          <Link href="/" className="w-fit group hover:opacity-70 transition-opacity duration-200" data-hover>
            <BrandLogo size="sm" />
          </Link>
          <p className="font-sans text-sm text-[--cream]/50 leading-relaxed max-w-[220px]">
            The actual product is belonging.
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/20">
            Est. 2024 · Delhi
          </p>
        </div>

        {/* Col 2 — Pours */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/30">
            The Pours
          </p>
          <ul className="flex flex-col gap-2.5">
            {POURS.map(({ label, href, muted }) => (
              <li key={href}>
                <Link
                  href={href}
                  data-hover
                  className={[
                    "font-sans text-sm transition-colors duration-200",
                    muted
                      ? "text-[--cream]/20 pointer-events-none"
                      : "text-[--cream]/60 hover:text-[--cream]",
                  ].join(" ")}
                >
                  {label}
                </Link>
              </li>
            ))}
            {/* Theka Language: no "Restock" — it's "Refill" */}
            <li>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--blue]/60">
                No refills. That&apos;s the point.
              </span>
            </li>
          </ul>
        </div>

        {/* Col 3 — Brand */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/30">
            Brand
          </p>
          <ul className="flex flex-col gap-2.5">
            {BRAND.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  data-hover
                  className="font-sans text-sm text-[--cream]/60 hover:text-[--cream] transition-colors duration-200"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/legal/returns"
                data-hover
                className="font-sans text-sm text-[--cream]/60 hover:text-[--cream] transition-colors duration-200"
              >
                Returns
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4 — Connect */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/30">
            Connect
          </p>
          <ul className="flex flex-col gap-2.5">
            {CONNECT.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  data-hover
                  className="font-sans text-sm text-[--cream]/60 hover:text-[--cream] transition-colors duration-200"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Deposit reminder */}
          <div className="mt-2 border border-[--cream]/10 p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--cream]/30 leading-relaxed">
              30% now · 70% when it ships
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────── */}
      <div className="border-t border-[--cream]/8">
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-5"
          style={{ paddingInline: "var(--pad-x)" }}
        >
          {/* Left */}
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--cream]/20">
            © 2026 Drip Theka&nbsp;·&nbsp;Made in Delhi&nbsp;·&nbsp;Pour #001 / V1.0
          </p>

          {/* Right — legal links */}
          <nav
            aria-label="Legal"
            className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[--cream]/20"
          >
            {[
              { label: "Privacy",  href: "/legal/privacy" },
              { label: "Terms",    href: "/legal/terms" },
              { label: "Returns",  href: "/legal/returns" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                data-hover
                className="hover:text-[--cream]/50 transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
