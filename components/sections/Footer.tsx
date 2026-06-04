"use client";

// Footer — fixed zoomed-in weirdness.
//
// Video section now uses aspect-ratio instead of vh-based fixed height,
// so it scales correctly at any browser zoom level.
// Grid collapses gracefully with better responsive breakpoints.

import Link  from "next/link";
import Image from "next/image";

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
  return (
    <footer
      data-nav-tone="light"
      className="bg-[--ink] text-[--cream] overflow-hidden"
    >
      {/* ── Cinematic video section ────────────────────────────────────
           Uses aspect-ratio (16/7) so it scales at any zoom level
           rather than a vh-based fixed height.                         */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "16 / 7", minHeight: 200, maxHeight: 560 }}
      >
        <video
          src="/videos/follow.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.55) saturate(1.05)" }}
        />

        {/* Vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(20,21,24,0.4) 0%, transparent 25%, transparent 65%, rgba(20,21,24,0.9) 100%)",
          }}
        />

        {/* Logo overlay — centred, scales with the video */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image
            src="/dtlogo-cropped.png"
            alt="Drip Theka"
            width={1412}
            height={564}
            draggable={false}
            className="select-none w-[min(68%,600px)] h-auto"
            style={{ opacity: 0.92, mixBlendMode: "lighten" }}
          />
        </div>

        {/* Bottom meta */}
        <p className="absolute bottom-4 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-[--cream]/50 select-none px-4">
          Follow&nbsp;·&nbsp;@driptheka&nbsp;·&nbsp;Made in Delhi
        </p>
      </div>

      {/* ── Four-column grid ───────────────────────────────────────── */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
        style={{
          paddingInline:     "var(--pad-x)",
          paddingBlockStart: "clamp(2.5rem, 5vw, 4.5rem)",
          paddingBlockEnd:   "2.5rem",
        }}
      >
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
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4"
          style={{ paddingInline: "var(--pad-x)" }}
        >
          <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[--cream]/20">
            © 2026 Drip Theka · Made in Delhi · Pour #001 / V1.0
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
