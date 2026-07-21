"use client";

// Footer — fixed zoomed-in weirdness.
//
// Video section now uses aspect-ratio instead of vh-based fixed height,
// so it scales correctly at any browser zoom level.
// Grid collapses gracefully with better responsive breakpoints.

import Link  from "next/link";
import { useState, useEffect } from "react";
import { copy } from "@/data/copy";
import { getSessionWisdom } from "@/lib/utils/copy";
import { Grain } from "@/components/ui/Grain";
import { Sticker } from "@/components/ui/Sticker";

const POURS = [
  { label: "Pour #001 — The First Round", href: "/pour/pour-001" },
  { label: "Pour #002 — Coming soon",     href: "#", muted: true },
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
  const [wisdom, setWisdom] = useState<string>("");

  useEffect(() => {
    const line = getSessionWisdom();
    setWisdom(line);

    // PostHog event — track which wisdom was shown
    if (typeof window !== "undefined" && (window as unknown as { posthog?: { capture: (n: string, p: object) => void } }).posthog) {
      (window as unknown as { posthog: { capture: (n: string, p: object) => void } }).posthog.capture(
        "voice_copy_loaded",
        { wisdom_line: line, wisdom_total: copy.footer.wisdom.length }
      );
    }
  }, []);

  return (
    <footer
      data-nav-tone="light"
      data-surface="ink"
      className="relative overflow-hidden"
      // Explicit hex: the `-[--var]` Tailwind bracket form is inert in this
      // build, so bg-[--ink]/text-[--cream] never applied. The footer relied on
      // the (now-removed) video for its dark look — set it directly instead.
      style={{ backgroundColor: "#141518", color: "#E4E2DD" }}
    >
      <Grain opacity={0.08} />
      {/* ── Wordmark band ──────────────────────────────────────────────
           Large solid cream "DRIP THEKA" wordmark. (The footer video was
           removed — this is the plain, high-clarity brand sign-off.)     */}
      <div
        className="relative w-full flex flex-col items-center justify-center text-center overflow-hidden"
        style={{
          paddingBlock: "clamp(3rem, 8vw, 6rem)",
          paddingInline: "var(--pad-x)",
        }}
      >
        <h2
          className="type-tanker-lg select-none leading-[0.9]"
          style={{ letterSpacing: "-0.01em", color: "#E4E2DD" }}
        >
          DRIP THEKA
        </h2>
        <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-[--cream]/50 select-none">
          Follow&nbsp;·&nbsp;@driptheka&nbsp;·&nbsp;Made in Delhi
        </p>
      </div>

      {/* ── Four-column grid ───────────────────────────────────────── */}
      <div
        className="relative grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
        style={{
          paddingInline:     "var(--pad-x)",
          paddingBlockStart: "clamp(2.5rem, 5vw, 4.5rem)",
          paddingBlockEnd:   "2.5rem",
        }}
      >
        <Sticker variant="drip-theka-mark" rotate={5} size={72}
          className="absolute top-6 right-[6vw] max-md:hidden z-10" />
        {/* Col 1 — Manifesto */}
        <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
          <p
            className="font-display italic font-bold leading-tight text-[--cream] max-w-[260px]"
            style={{ fontSize: "clamp(1.1rem, 1.6vw, 1.5rem)" }}
          >
            The actual product is belonging.
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/30">
            Est. MMXXVI · Delhi
          </p>
        </div>

        {/* Col 2 — Pours */}
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/30">
            The Pours
          </p>
          <ul className="flex flex-col gap-2">
            {POURS.map(({ label, href, muted }) => (
              <li key={href}>
                <Link
                  href={href}
                  data-hover
                  className={[
                    "font-sans text-sm leading-snug transition-colors duration-200",
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
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[--blue]/70">
                No refills. That&apos;s the point.
              </span>
            </li>
          </ul>
        </div>

        {/* Col 3 — Brand */}
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/30">
            Brand
          </p>
          <ul className="flex flex-col gap-2">
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
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/30">
            Connect
          </p>
          <ul className="flex flex-col gap-2">
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
            <li>
              <Link
                href="/account"
                data-hover
                className="font-sans text-sm text-[--cream]/60 hover:text-[--cream] transition-colors duration-200"
              >
                My Account
              </Link>
            </li>
          </ul>

          <div className="border border-[--cream]/10 p-3 mt-1">
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[--cream]/40 leading-relaxed">
              30% now · 70% when it ships
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div className="border-t border-[--cream]/8">
        {/* Theka Wisdom — one line, pinned for the session via getSessionWisdom() */}
        {wisdom && (
          <p
            className="text-center font-mono text-[9px] italic text-[--cream]/40 py-3 border-b border-[--cream]/5 select-none"
            style={{ paddingInline: "var(--pad-x)" }}
          >
            {wisdom}
          </p>
        )}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4"
          style={{ paddingInline: "var(--pad-x)" }}
        >
          <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[--cream]/20">
            © 2026 Drip Theka · {copy.footer.madeIn} · Pour #001 / V1.0
          </p>
          <nav aria-label="Legal" className="flex items-center gap-4">
            {[
              { label: "Privacy",  href: "/legal/privacy" },
              { label: "Terms",    href: "/legal/terms" },
              { label: "Returns",  href: "/legal/returns" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                data-hover
                className="font-mono text-[8px] uppercase tracking-[0.12em] text-[--cream]/20 hover:text-[--cream]/50 transition-colors"
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
