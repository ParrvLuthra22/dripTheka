"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { WineGlassMark } from "@/components/glass/WineGlassMark";
import { PintGlassNav } from "@/components/glass/PintGlass";
import { HeroPourFallback } from "@/components/glass/HeroPour";
import { useCartStore } from "@/lib/store/cart";
import { useSoundStore } from "@/lib/store/sound";
import { POUR_001 } from "@/data/pour-001";

// Three.js hero — lazy loaded, SSR off
const HeroPour = dynamic(
  () => import("@/components/glass/HeroPour").then((m) => ({ default: m.HeroPour })),
  { ssr: false, loading: () => <HeroPourFallback /> }
);

const SECTION = "border-b border-[--ink]/10 pb-16 mb-16";
const LABEL   = "font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/30 mb-6 block";
const H2      = "font-display italic text-3xl text-[--ink] mb-2";

export function TestGlassesClient() {
  const { addItem, removeItem, items, clearCart } = useCartStore();
  const { muted, toggle } = useSoundStore();
  const [heroDone, setHeroDone] = useState(false);
  const [wineLevel, setWineLevel] = useState(0);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  // Use first product for test adds
  const testProduct = POUR_001.products[0];

  const handleAdd = useCallback(() => {
    addItem(testProduct, "M", "Cobalt");
  }, [addItem, testProduct]);

  const handleRemove = useCallback(() => {
    if (items.length > 0) {
      const last = items[items.length - 1];
      removeItem(last.product.id, last.size);
    }
  }, [items, removeItem]);

  return (
    <div className="bg-[--cream] min-h-screen px-8 py-24 max-w-[1200px] mx-auto">
      <h1 className="font-display italic text-5xl text-[--ink] mb-3">
        Glass Components
      </h1>
      <p className="font-mono text-xs text-[--ink]/30 uppercase tracking-widest mb-16">
        /test-glasses — remove before production
      </p>

      {/* ── Sound toggle ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-16 p-4 bg-[--ink]/5 font-mono text-xs">
        <span className="text-[--ink]/50 uppercase tracking-widest">Sound:</span>
        <button
          onClick={toggle}
          aria-pressed={!muted}
          className="border border-[--ink]/30 px-3 py-1 text-[--ink] hover:bg-[--ink] hover:text-[--cream] transition-colors uppercase tracking-widest"
        >
          {muted ? "OFF — click to enable" : "ON — click to mute"}
        </button>
        <span className="text-[--ink]/30">(pour sound plays on Add when ON)</span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: WineGlassMark                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className={SECTION}>
        <span className={LABEL}>Component 1 of 3</span>
        <h2 className={H2}>WineGlassMark</h2>
        <p className="font-sans text-sm text-[--ink]/50 mb-10 max-w-[480px]">
          Pure SVG brand mark. Three size variants. Liquid fill (0–100) and tilt props.
          Used in nav, footer, watermarks, "Tapped Out" overlays.
        </p>

        {/* Size variants */}
        <div className="flex items-end gap-12 mb-10">
          <div className="flex flex-col items-center gap-3">
            <WineGlassMark size="sm" className="text-[--ink]" />
            <span className="font-mono text-[9px] text-[--ink]/30">sm · 24px</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <WineGlassMark size="md" className="text-[--ink]" />
            <span className="font-mono text-[9px] text-[--ink]/30">md · 48px</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <WineGlassMark size="lg" className="text-[--ink]" />
            <span className="font-mono text-[9px] text-[--ink]/30">lg · 160px</span>
          </div>
        </div>

        {/* Liquid fill slider */}
        <div className="flex items-center gap-8 mb-8">
          <WineGlassMark size="lg" liquid={wineLevel} className="text-[--ink]" />
          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs text-[--blue] uppercase tracking-widest">
              liquid = {wineLevel}%
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={wineLevel}
              onChange={(e) => setWineLevel(Number(e.target.value))}
              className="w-48 accent-[--blue]"
            />
            <div className="flex gap-2 flex-wrap">
              {[0, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => setWineLevel(v)}
                  className="font-mono text-[10px] border border-[--ink]/20 px-2 py-1 hover:border-[--blue] hover:text-[--blue] transition-colors uppercase tracking-widest"
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tilt / Tapped Out */}
        <div className="flex items-end gap-10">
          <div className="flex flex-col items-center gap-2">
            <WineGlassMark size="md" tilt={-45} liquid={20} className="text-[--ink]" />
            <span className="font-mono text-[9px] text-[--ink]/30">tilt −45° · liquid 20%</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <WineGlassMark size="md" tilt={-90} className="text-[--ink]/30" />
            <span className="font-mono text-[9px] text-[--ink]/30">tilt −90° (Tapped Out)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <WineGlassMark size="md" liquid={60} className="text-[--blue]" />
            <span className="font-mono text-[9px] text-[--ink]/30">currentColor [blue]</span>
          </div>
          <div className="flex flex-col items-center gap-2 bg-[--ink] p-4">
            <WineGlassMark size="md" className="text-[--cream]" />
            <span className="font-mono text-[9px] text-[--cream]/30">on dark bg</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: PintGlass (cart indicator)                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className={SECTION}>
        <span className={LABEL}>Component 2 of 3</span>
        <h2 className={H2}>PintGlass — Cart Indicator</h2>
        <p className="font-sans text-sm text-[--ink]/50 mb-4 max-w-[480px]">
          The floating cart glass lives fixed bottom-right. The nav version
          (mobile) is shown inline here. Add/remove items and watch the liquid fill
          and foam animate. Pour sound plays when sound is ON.
        </p>
        <p className="font-mono text-xs text-[--ink]/30 mb-10">
          Floating glass → bottom-right of this page (desktop only)
        </p>

        <div className="flex items-start gap-10 flex-wrap">
          {/* Controls */}
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[9px] text-[--ink]/30 uppercase tracking-widest">
              Cart: {totalItems} item{totalItems !== 1 ? "s" : ""} · fill {Math.min(100, Math.round((totalItems / 10) * 100))}%
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleAdd}
                className="font-mono text-xs bg-[--blue] text-[--cream] px-5 py-2.5 hover:bg-[--ink] transition-colors uppercase tracking-widest"
              >
                + Add to Glass
              </button>
              <button
                onClick={handleRemove}
                disabled={totalItems === 0}
                className="font-mono text-xs border border-[--ink]/30 text-[--ink] px-5 py-2.5 hover:border-[--ink] transition-colors uppercase tracking-widest disabled:opacity-30"
              >
                − Remove
              </button>
              <button
                onClick={clearCart}
                disabled={totalItems === 0}
                className="font-mono text-xs text-[--ink]/40 hover:text-[--ink] transition-colors uppercase tracking-widest disabled:opacity-30"
              >
                Clear
              </button>
            </div>

            {/* Milestones */}
            <div className="flex gap-1 mt-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 border border-[--ink]/20 transition-all duration-300"
                  style={{
                    backgroundColor: i < totalItems ? "var(--blue)" : "transparent",
                  }}
                />
              ))}
            </div>
            <p className="font-mono text-[9px] text-[--ink]/30">
              Each square = 1 item · 10 items = full glass
            </p>
          </div>

          {/* Mobile nav version shown inline */}
          <div className="flex flex-col items-center gap-3 bg-[--ink]/5 p-6">
            <span className="font-mono text-[9px] text-[--ink]/30 uppercase tracking-widest">
              Mobile nav version
            </span>
            <PintGlassNav />
            <span className="font-mono text-[9px] text-[--ink]/30 mt-1">
              (with bounce on add)
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: HeroPour (Three.js)                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="pb-8">
        <span className={LABEL}>Component 3 of 3</span>
        <h2 className={H2}>HeroPour — WebGL Glass</h2>
        <p className="font-sans text-sm text-[--ink]/50 mb-4 max-w-[480px]">
          Three.js lathe geometry wine glass. Liquid fills on load with a pour
          stream, then settles with a meniscus surface wave. Mobile shows
          SVG fallback. Orthographic camera, 60fps target.
        </p>
        {heroDone && (
          <p className="font-mono text-[10px] text-[--blue] uppercase tracking-widest mb-6">
            ✓ Animation complete
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Three.js version */}
          <div>
            <p className="font-mono text-[9px] text-[--ink]/30 uppercase tracking-widest mb-3">
              WebGL (lazy-loaded)
            </p>
            <div
              className="bg-[--ink] relative"
              style={{ height: 520 }}
            >
              <HeroPour
                className="w-full h-full"
                onReady={() => setHeroDone(true)}
              />
            </div>
          </div>

          {/* SVG fallback */}
          <div>
            <p className="font-mono text-[9px] text-[--ink]/30 uppercase tracking-widest mb-3">
              SVG fallback (mobile / no WebGL)
            </p>
            <div
              className="bg-[--cream] border border-[--ink]/10 relative flex items-center justify-center"
              style={{ height: 520 }}
            >
              <HeroPourFallback />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
