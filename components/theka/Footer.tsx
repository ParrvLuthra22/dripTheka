"use client";

// Footer — the Theka shell sign-off. Ink surface, cream type.
// Every string comes from lang.footer; colours are token utilities only.

import Link  from "next/link";
import { useEffect } from "react";
import { useHydrated } from "@/lib/theka/hooks";
import { lang } from "@/lib/theka/lang";
import { getSessionWisdom } from "@/lib/utils/copy";
import { Grain } from "./Grain";
import { Sticker } from "@/components/ui/Sticker";

const F = lang.footer;

const linkCls =
  "font-sans text-sm leading-snug text-cream/60 hover:text-cream transition-colors duration-200";
const headCls =
  "font-mono text-[9px] uppercase tracking-[0.14em] text-cream/40";

export function Footer() {
  // Session-pinned line; read only after hydration (sessionStorage).
  const hydrated = useHydrated();
  const wisdom   = hydrated ? getSessionWisdom() : "";

  useEffect(() => {
    const line = getSessionWisdom();

    // PostHog event — track which wisdom was shown
    if (typeof window !== "undefined" && (window as unknown as { posthog?: { capture: (n: string, p: object) => void } }).posthog) {
      (window as unknown as { posthog: { capture: (n: string, p: object) => void } }).posthog.capture(
        "voice_copy_loaded",
        { wisdom_line: line, wisdom_total: F.wisdom.length }
      );
    }
  }, []);

  return (
    <footer
      data-nav-tone="light"
      data-surface="ink"
      className="relative overflow-hidden bg-ink text-cream"
    >
      <Grain opacity={0.08} />

      {/* ── Wordmark band ──────────────────────────────────────────── */}
      <div
        className="relative w-full flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ paddingBlock: "clamp(3rem, 8vw, 6rem)", paddingInline: "var(--pad-x)" }}
      >
        <h2 className="type-loud-lg select-none text-cream">{lang.brand.wordmark}</h2>
        <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-cream/50 select-none">
          {F.followLine}
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
            className="font-display italic font-bold leading-tight text-cream max-w-[260px]"
            style={{ fontSize: "clamp(1.1rem, 1.6vw, 1.5rem)" }}
          >
            {lang.brand.manifesto}
          </p>
          <p className={headCls}>{lang.brand.est}</p>
        </div>

        {/* Col 2 — Pours */}
        <div className="flex flex-col gap-3">
          <p className={headCls}>{F.columns.pours}</p>
          <ul className="flex flex-col gap-2">
            {F.pours.map(({ label, href, muted }) => (
              <li key={href}>
                {muted ? (
                  <span className="font-sans text-sm leading-snug text-cream/30">{label}</span>
                ) : (
                  <Link href={href} data-hover className={linkCls}>{label}</Link>
                )}
              </li>
            ))}
            <li>
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-cream/50">
                {F.noRefills}
              </span>
            </li>
          </ul>
        </div>

        {/* Col 3 — Brand */}
        <div className="flex flex-col gap-3">
          <p className={headCls}>{F.columns.brand}</p>
          <ul className="flex flex-col gap-2">
            {F.brandLinks.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} data-hover className={linkCls}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4 — Connect */}
        <div className="flex flex-col gap-3">
          <p className={headCls}>{F.columns.connect}</p>
          <ul className="flex flex-col gap-2">
            {F.connectLinks.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} data-hover className={linkCls}>{label}</Link>
              </li>
            ))}
          </ul>

          <div className="border border-cream/10 p-3 mt-1">
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-cream/50 leading-relaxed">
              {F.payment}
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div className="border-t border-cream/10">
        {/* Theka Wisdom — one line, pinned for the session */}
        {wisdom && (
          <p
            className="text-center font-display italic text-xs text-cream/50 py-3 border-b border-cream/5 select-none"
            style={{ paddingInline: "var(--pad-x)" }}
          >
            {wisdom}
          </p>
        )}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4"
          style={{ paddingInline: "var(--pad-x)" }}
        >
          <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-cream/40">
            {F.copyright(2026)} · {F.madeIn} · {F.version}
          </p>
          <nav aria-label={F.legalAria} className="flex items-center gap-4">
            {F.legal.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                data-hover
                className="font-mono text-[8px] uppercase tracking-[0.12em] text-cream/40 hover:text-cream/70 transition-colors"
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
