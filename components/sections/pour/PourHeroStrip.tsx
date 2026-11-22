"use client";

// Pour page hero strip — blue band, 50vh.
// Left eyebrow / center animated title / right countdown.

import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ChalkMark } from "@/components/ui/ChalkMark";
import { POUR_001, POURING_LISTING } from "@/data/pour-001";
import { pourClosesAt } from "@/lib/config";
import { copy } from "@/data/copy";

type TimeLeft = { days: number; hours: number; mins: number } | null;

function computeTimeLeft(): TimeLeft {
  const diff = pourClosesAt().getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days:  Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    mins:  Math.floor((diff % 3_600_000) / 60_000),
  };
}

// "Pour Number One." split into per-char spans for stagger animation
const TITLE = "Pour Number One.";
const CHARS = TITLE.split("");

// Group into words preserving spaces so kerning is natural
type Word = { chars: string[]; isSpace: boolean };
function splitWords(text: string): Word[] {
  return text.split(" ").reduce<Word[]>((acc, word, i, arr) => {
    acc.push({ chars: word.split(""), isSpace: false });
    if (i < arr.length - 1) acc.push({ chars: [" "], isSpace: true });
    return acc;
  }, []);
}
const WORDS = splitWords(TITLE);

export function PourHeroStrip() {
  const containerRef = useRef<HTMLElement>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(computeTimeLeft);

  // Update countdown every minute
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(computeTimeLeft()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Letter-stagger reveal
  useGSAP(() => {
    const chars = containerRef.current?.querySelectorAll(".pour-hero-char");
    if (!chars?.length) return;

    gsap.from(chars, {
      yPercent: 115,
      stagger:  0.03,
      duration: 0.85,
      ease:     "power3.out",
      delay:    0.15,
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      data-nav-tone="light"
      data-surface="blue"
      className="relative flex flex-col justify-between overflow-hidden"
      style={{ backgroundColor: "#004AAD", minHeight: "50vh", paddingInline: "var(--pad-x)" }}
      aria-label={`Pour #${POUR_001.number} — ${POUR_001.title}`}
    >
      {/* ── Top row ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between pt-6 md:pt-8">
        {/* Left — Pour #001 · pehla pyaala */}
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#E4E2DD]/50">
          {copy.language.pour001.en}
          <span className="lowercase italic opacity-50 tracking-normal not-uppercase ml-1">
            · {copy.language.pour001.hi}
          </span>
        </p>

        {/* Right countdown */}
        <div className="text-right">
          {timeLeft ? (
            <>
              {/* "Pour closes in · 14D 06H 22M" */}
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#E4E2DD]/40 mb-1">
                Pour closes in
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#E4E2DD] tabular-nums">
                {String(timeLeft.days).padStart(2, "0")}D&nbsp;
                {String(timeLeft.hours).padStart(2, "0")}H&nbsp;
                {String(timeLeft.mins).padStart(2, "0")}M
              </p>
            </>
          ) : (
            <>
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#E4E2DD]/40 mb-1">
                Status
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#004AAD] bg-[#E4E2DD] px-2 py-0.5 flex items-center gap-1.5">
                Pour closed
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Center title ─────────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center py-8 md:py-12"
        aria-label={TITLE}
      >
        {/* overflow-hidden per word so chars slide up inside */}
        <h1
          className="font-display italic text-[#E4E2DD] leading-[0.88]"
          style={{ fontSize: "clamp(2.5rem, 8vw, 7.5rem)" }}
        >
          {WORDS.map((word, wi) =>
            word.isSpace ? (
              <span key={wi}>&nbsp;</span>
            ) : wi === WORDS.length - 1 ? (
              // Last word — underline below via ChalkMark (outside overflow-hidden)
              <span key={wi} className="relative inline-block align-bottom">
                <span className="inline-block overflow-hidden align-bottom">
                  {word.chars.map((ch, ci) => (
                    <span key={ci} className="pour-hero-char inline-block" aria-hidden="true">{ch}</span>
                  ))}
                </span>
                <ChalkMark variant="underline" color="#E4E2DD" animate={false}
                  className="absolute -bottom-2 left-0 w-full h-[10px]" />
              </span>
            ) : (
              <span key={wi} className="inline-block overflow-hidden align-bottom">
                {word.chars.map((ch, ci) => (
                  <span
                    key={ci}
                    className="pour-hero-char inline-block"
                    aria-hidden="true"
                  >
                    {ch}
                  </span>
                ))}
              </span>
            )
          )}
        </h1>
      </div>

      {/* ── Bottom meta ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between pb-6 md:pb-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E4E2DD]/30">
          {POURING_LISTING.length}&nbsp;pieces&nbsp;·&nbsp;200 of each
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E4E2DD]/30 hidden sm:block">
          {POUR_001.subtitle}
        </p>
      </div>

      {/* Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize:   "200px 200px",
        }}
      />
    </section>
  );
}
