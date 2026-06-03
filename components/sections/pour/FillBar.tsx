"use client";

// FillBar — the FOMO mechanism.
// Horizontal wine glass on its side; liquid fills left→right as reservations grow.
// Polls /api/reserve/count every 30s; animates deltas.

import { useRef, useEffect, useState, useCallback, useId } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Horizontal glass SVG geometry constants (viewBox 0 0 1000 160)
// Glass lays on its side: base at left, bowl opens right.
const VB_W = 1000;
const VB_H = 160;
const CY   = VB_H / 2; // 80 — vertical centre

// Base foot oval (far left)
const BASE_CX = 60;
const BASE_RX = 52;
const BASE_RY = 72;

// Stem: thin bar connecting base to bowl
const STEM_START_X = BASE_CX + BASE_RX; // ≈ 112
const STEM_END_X   = 290;
const STEM_HH      = 9;   // half-height of stem (18px total)

// Bowl outer path (opens to the right)
const BOWL_START_X = STEM_END_X;
const BOWL_RIM_X   = 972;
const BOWL_RIM_RX  = 7;
const BOWL_RIM_RY  = 78;

// Liquid fill span
const FILL_START_X = STEM_START_X;
const FILL_SPAN    = BOWL_RIM_X - FILL_START_X; // ≈ 860

// Outer bowl path string — M from stem join, curve to rim, arc back, curve back
function bowlPath(inset = 0): string {
  const sx = BOWL_START_X + inset;
  const ry = CY - STEM_HH - inset;
  const rx = BOWL_RIM_X - inset;
  const rry = BOWL_RIM_RY - inset;
  return [
    `M ${sx} ${CY - STEM_HH + inset}`,
    `C ${sx + 120} ${CY - ry * 0.85} ${rx - 200} ${inset + 6} ${rx} ${inset + 4}`,
    `A ${BOWL_RIM_RX} ${rry} 0 0 1 ${rx} ${VB_H - inset - 4}`,
    `C ${rx - 200} ${VB_H - inset - 6} ${sx + 120} ${CY + ry * 0.85} ${sx} ${CY + STEM_HH - inset}`,
    "Z",
  ].join(" ");
}

type CountData = { reserved: number; total: number };

async function fetchCount(): Promise<CountData> {
  const res = await fetch("/api/reserve/count", { cache: "no-store" });
  if (!res.ok) throw new Error("count fetch failed");
  return res.json() as Promise<CountData>;
}

export function FillBar() {
  const uid       = useId().replace(/:/g, "");
  const clipId    = `fill-bar-clip-${uid}`;

  const sectionRef  = useRef<HTMLElement>(null);
  const fillRectRef = useRef<SVGRectElement>(null);
  const countRef    = useRef<HTMLSpanElement>(null);

  const animatedPct = useRef(0);
  const hasAnimated = useRef(false);

  const [data,    setData]    = useState<CountData>({ reserved: 0, total: 100 });
  const [loading, setLoading] = useState(true);

  // Animate fill from current animated position to target
  const animateTo = useCallback((targetPct: number) => {
    const el      = fillRectRef.current;
    const countEl = countRef.current;
    if (!el || !countEl) return;

    const total = data.total;

    gsap.to(animatedPct, {
      current: targetPct,
      duration: 1.6,
      ease:     "power2.out",
      overwrite: true,
      onUpdate() {
        const pct = animatedPct.current;
        el.setAttribute("width", String(Math.max(0, pct * FILL_SPAN)));
        countEl.textContent = String(Math.round(pct * total)).padStart(4, "0");
      },
    });
  }, [data.total]);

  // Fetch on mount + poll every 30s
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const d = await fetchCount();
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      } catch { /* silent — show last known state */ }
    };

    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Animate delta when data changes (after first animation)
  useEffect(() => {
    if (!hasAnimated.current || loading) return;
    animateTo(data.reserved / data.total);
  }, [data, loading, animateTo]);

  // Scroll-triggered initial fill
  useGSAP(() => {
    if (loading) return;

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start:   "top 75%",
      once:    true,
      onEnter: () => {
        hasAnimated.current = true;
        animateTo(data.reserved / data.total);
      },
    });
  }, { scope: sectionRef, dependencies: [loading, data] });

  const pct     = data.reserved / data.total;
  const pctStr  = (pct * 100).toFixed(0);

  return (
    <section
      ref={sectionRef}
      data-nav-tone="dark"
      className="bg-[--cream] py-16 md:py-20"
      style={{ paddingInline: "var(--pad-x)" }}
      aria-label="Reservation fill level"
    >
      {/* ── Eyebrow row ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <span
            className="block w-2 h-2 rounded-full bg-[--blue] animate-pulse"
            aria-hidden="true"
          />
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--ink]">
            Reservations&nbsp;·&nbsp;Live
          </p>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/30">
          {pctStr}% reserved
        </p>
      </div>

      {/* ── Horizontal wine glass SVG ────────────────────────────── */}
      <div className="w-full max-w-[70vw]" style={{ height: "clamp(60px, 12vh, 120px)" }}>
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          role="img"
          aria-label={`${data.reserved} of ${data.total} spots reserved`}
        >
          <defs>
            {/* Clip path = bowl interior for liquid fill */}
            <clipPath id={clipId}>
              <path d={bowlPath(3)} />
            </clipPath>
          </defs>

          {/* Liquid fill (clipped, grows from stem left toward rim) */}
          <rect
            ref={fillRectRef}
            x={FILL_START_X}
            y={0}
            width={0}
            height={VB_H}
            fill="#004AAD"
            clipPath={`url(#${clipId})`}
          />

          {/* Meniscus at fill edge (a thin vertical ellipse) */}
          {/* Positioned dynamically via JS — skip SVG static version */}

          {/* Base foot — vertical oval at far left */}
          <ellipse
            cx={BASE_CX}
            cy={CY}
            rx={BASE_RX}
            ry={BASE_RY}
            stroke="#141518"
            strokeWidth="1.5"
          />

          {/* Stem — thin horizontal bar */}
          <rect
            x={STEM_START_X}
            y={CY - STEM_HH}
            width={STEM_END_X - STEM_START_X}
            height={STEM_HH * 2}
            stroke="#141518"
            strokeWidth="1.5"
            rx={3}
          />

          {/* Bowl outer outline */}
          <path
            d={bowlPath(0)}
            stroke="#141518"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Rim ellipse detail */}
          <ellipse
            cx={BOWL_RIM_X}
            cy={CY}
            rx={BOWL_RIM_RX}
            ry={BOWL_RIM_RY}
            stroke="#141518"
            strokeWidth="1"
            opacity={0.4}
          />
        </svg>
      </div>

      {/* ── Count ticker ─────────────────────────────────────────── */}
      <div className="mt-6 flex items-baseline gap-3">
        <span
          className="font-mono tabular-nums text-[--ink]"
          style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)" }}
        >
          <span ref={countRef}>0000</span>
        </span>
        <span
          className="font-mono text-[--ink]/40"
          style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)" }}
        >
          / {String(data.total).padStart(4, "0")}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/30 self-center ml-2">
          Reserved
        </span>
      </div>

      {/* ── Caption ──────────────────────────────────────────────── */}
      <p
        className="font-display italic text-[--ink]/50 mt-3"
        style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)" }}
      >
        When the glass is full, the doors open.
      </p>
    </section>
  );
}
