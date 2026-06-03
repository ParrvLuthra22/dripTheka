"use client";

// Footer — cinematic video header + 4-col grid.
// /videos/follow.mp4 plays muted/looped at the top, with the brand mark
// overlaid. Below: 4-column link grid. Bottom: legal bar.

import { useRef } from "react";
import Link  from "next/link";
import Image from "next/image";

const POURS = [
  { label: "Pour #001 — The First Round", href: "/pour/pour-001" },
  { label: "Pour #002 — Coming soon",     href: "#",              muted: true },
];

const BRAND = [
  { label: "The Story",   href: "/story" },
  { label: "Building",    href: "/building" },
  { label: "Last Call",   href: "/regulars" },
];

const CONNECT = [
  { label: "@driptheka",            href: "#" },
  { label: "Regulars early access", href: "/regulars" },
];

export function Footer() {
  const ref = useRef<HTMLElement>(null);

  return (
    <footer
      ref={ref}
      data-nav-tone="light"
      className="bg-[--ink] text-[--cream] overflow-hidden relative"
    >
      {/* ── Cinematic video header ─────────────────────────────────────
           /videos/follow.mp4 plays muted+looped as a brand "outro" moment.
           Logo overlaid in the centre — large, semi-transparent.            */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "clamp(280px, 50vh, 600px)" }}
      >
        <video
          src="/videos/follow.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            // Slight cream-tinted darkening so the logo reads
            filter: "brightness(0.55) saturate(1.05)",
          }}
        />

        {/* Vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(20,21,24,0.35) 0%, rgba(20,21,24,0) 30%, rgba(20,21,24,0) 70%, rgba(20,21,24,0.85) 100%)",
          }}
        />

        {/* Brand mark overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image
            src="/dtlogo-cropped.png"
            alt="Drip Theka"
            width={1412}
            height={564}
            draggable={false}
            className="select-none"
            style={{
              maxWidth: "min(72%, 720px)",
              height:   "auto",
              opacity:  0.95,
              mixBlendMode: "lighten",
            }}
          />
        </div>

        {/* Bottom-left small eyebrow */}
        <p className="absolute bottom-5 left-6 font-mono text-[9px] uppercase tracking-[0.18em] text-[--cream]/60 select-none">
          Follow&nbsp;·&nbsp;@driptheka
        </p>

        {/* Bottom-right small eyebrow */}
        <p className="absolute bottom-5 right-6 font-mono text-[9px] uppercase tracking-[0.18em] text-[--cream]/60 select-none">
          Made in Delhi
        </p>
      </div>

      {/* ── Four-column grid ───────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16"
        style={{
          paddingInline:    "var(--pad-x)",
          paddingBlockStart: "clamp(3rem, 5vw, 5rem)",
          paddingBlockEnd:   "2.5rem",
        }}
      >
        {/* Col 1 — Manifesto */}
        <div className="flex flex-col gap-5">
          <p
            className="font-display italic font-bold leading-tight text-[--cream] max-w-[260px]"
            style={{ fontSize: "clamp(1.3rem, 1.8vw, 1.7rem)" }}
          >
            The actual product is belonging.
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/30">
            Est. MMXXVI · Delhi
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
            <li>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--blue]/70">
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

          <div className="mt-2 border border-[--cream]/10 p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--cream]/40 leading-relaxed">
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
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--cream]/20">
            © 2026 Drip Theka&nbsp;·&nbsp;Made in Delhi&nbsp;·&nbsp;Pour #001 / V1.0
          </p>

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
