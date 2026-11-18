"use client";

// ProductHero — left scrollable column.
// Hero illustration + 3 detail views, each with GSAP parallax (-8 yPercent on scroll).
// Panel i=0 has persistent FRONT/BACK tab switcher.

import { useRef, useCallback, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ProductIllustration } from "@/components/sections/ProductIllustration";
import { TextSticker } from "@/components/ui/TextSticker";
import { useSound } from "@/components/sound/SoundProvider";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/data/pour-001";

gsap.registerPlugin(ScrollTrigger);

// Each "view" is a CSS transform applied to the illustration wrapper,
// creating distinct compositions from the same base SVG.
const VIEWS: Array<{ scaleX: number; scaleY: number; translateY: string; label: string }> = [
  { scaleX: 1,   scaleY: 1,   translateY: "0%",   label: "Full view"    },
  { scaleX: 1.5, scaleY: 1.5, translateY: "-18%", label: "Upper detail" },
  { scaleX: 1.5, scaleY: 1.5, translateY: "18%",  label: "Lower detail" },
];

interface ProductHeroProps {
  product: Product;
}

export function ProductHero({ product }: ProductHeroProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const imgRefs       = useRef<(HTMLDivElement | null)[]>([]);
  const zoomRefs      = useRef<(HTMLDivElement | null)[]>([]);

  const [heroView, setHeroView] = useState<"front" | "back">("front");
  const { play, muted }         = useSound();
  const shouldReduceMotion      = useReducedMotion();
  const flipDur                 = shouldReduceMotion ? 0 : 0.28;

  const primaryColor  = product.colors[0];
  const accentColor   = product.colors[1] ?? "#E4E2DD";

  // Captions drawn from product data
  const CAPTIONS = [
    product.fabric,
    `${product.fit.charAt(0).toUpperCase() + product.fit.slice(1)} fit · ${product.careInstructions[0].toLowerCase()}`,
    `Pour #${product.dropNumber} · ${product.totalUnits} pieces, worldwide.`,
  ];

  // ── Cursor-driven zoom — magnifies toward the pointer on hover ─────────
  const onPanelMove = useCallback((e: React.MouseEvent<HTMLDivElement>, i: number) => {
    const el = zoomRefs.current[i];
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5..0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transform = `scale(1.18) translate(${-x * 14}%, ${-y * 14}%)`;
  }, []);

  const onPanelLeave = useCallback((i: number) => {
    const el = zoomRefs.current[i];
    if (!el) return;
    el.style.transform = "scale(1) translate(0%, 0%)";
  }, []);

  useGSAP(() => {
    imgRefs.current.forEach((el) => {
      if (!el) return;
      gsap.to(el, {
        yPercent: -8,
        ease:     "none",
        scrollTrigger: {
          trigger:          el,
          start:            "top bottom",
          end:              "bottom top",
          scrub:            1.6,
          invalidateOnRefresh: true,
        },
      });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="flex flex-col">
      {VIEWS.map((view, i) => (
        <div key={i}>
          {/* FRONT / BACK tabs — only on the hero panel */}
          {i === 0 && (
            <div className="flex border-b border-(--ink)/10">
              {(["front", "back"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    if (v === heroView) return;
                    setHeroView(v);
                    if (v === "back" && !muted) play("flip");
                  }}
                  className={cn(
                    "font-mono text-[9px] uppercase tracking-[0.14em] px-5 py-2.5 transition-colors duration-150",
                    v !== "front" && "border-l border-(--ink)/10",
                    heroView === v
                      ? "bg-(--ink) text-(--cream)"
                      : "text-(--ink)/40 hover:text-(--ink)/70 bg-transparent"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {/* Illustration panel */}
          <div
            className="relative overflow-hidden"
            onMouseMove={(e) => onPanelMove(e, i)}
            onMouseLeave={() => onPanelLeave(i)}
            style={{
              backgroundColor: i === 0 ? primaryColor : i % 2 === 0 ? "#141518" : "#E4E2DD",
              aspectRatio:     i === 0 ? "4/5" : "5/4",
            }}
          >
            {/* Parallax inner — GSAP moves this element */}
            <div
              ref={(el) => { imgRefs.current[i] = el; }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ padding: "8%" }}
            >
              {/* CSS zoom/shift creates the "detail" illusion */}
              <div
                style={{
                  transform:      `scale(${view.scaleX}, ${view.scaleY}) translateY(${view.translateY})`,
                  width:          "100%",
                  height:         "100%",
                  transformOrigin:"center center",
                }}
              >
                {/* Cursor-zoom layer */}
                <div
                  ref={(el) => { zoomRefs.current[i] = el; }}
                  style={{
                    width:      "100%",
                    height:     "100%",
                    transition: "transform 0.5s cubic-bezier(.2,.9,.3,1)",
                    willChange: "transform",
                    position:   "relative",
                  }}
                >
                  {i === 0 ? (
                    // Hero panel: AnimatePresence crossfade between front/back
                    <AnimatePresence mode="sync" initial={false}>
                      <motion.div
                        key={heroView}
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: flipDur, ease: "easeInOut" }}
                      >
                        <ProductIllustration
                          type={product.type}
                          view={heroView}
                          primaryColor={primaryColor}
                          accentColor={accentColor}
                          className="w-full h-full"
                        />
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <ProductIllustration
                      type={product.type}
                      primaryColor={i % 2 === 0 ? primaryColor : accentColor}
                      accentColor={i % 2 === 0 ? accentColor : primaryColor}
                      className="w-full h-full"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* View label — top left */}
            <div className="absolute top-4 left-4">
              <span className="font-mono text-[8px] uppercase tracking-[0.16em] px-2 py-1 bg-black/30 text-white backdrop-blur-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            {/* Slapped sticker — only on the first (hero) panel */}
            {i === 0 && (
              <TextSticker variant="slap" tone="blue" rotate={-10}
                className="absolute bottom-5 right-5 z-10">
                pour&nbsp;#{String(product.dropNumber).padStart(3, "0")}
              </TextSticker>
            )}
          </div>

          {/* Editorial caption — italic Fraunces, between each image */}
          {i < VIEWS.length - 1 && (
            <div className="px-6 md:px-10 py-8 border-b border-(--ink)/8">
              <p
                className="font-display italic text-(--ink)/60 leading-snug"
                style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.3rem)" }}
              >
                {CAPTIONS[i]}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Final caption after last image */}
      <div className="px-6 md:px-10 py-8">
        <p
          className="font-display italic text-(--ink)/40 leading-snug"
          style={{ fontSize: "clamp(0.9rem, 1.6vw, 1.2rem)" }}
        >
          {CAPTIONS[VIEWS.length - 1]}
        </p>
      </div>
    </div>
  );
}
