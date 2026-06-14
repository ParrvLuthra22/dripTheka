"use client";

// ProductHero — left scrollable column.
// Hero illustration + 3 detail views, each with GSAP parallax (-8 yPercent on scroll).
// Editorial captions in italic Fraunces between images.

import { useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProductIllustration } from "@/components/sections/ProductIllustration";
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
                {/* Cursor-zoom layer — independent of the GSAP/static transforms above */}
                <div
                  ref={(el) => { zoomRefs.current[i] = el; }}
                  style={{
                    width:      "100%",
                    height:     "100%",
                    transition: "transform 0.5s cubic-bezier(.2,.9,.3,1)",
                    willChange: "transform",
                  }}
                >
                  <ProductIllustration
                    type={product.type}
                    primaryColor={
                      // Invert colors on dark backgrounds for contrast
                      i % 2 === 0 ? primaryColor : accentColor
                    }
                    accentColor={
                      i % 2 === 0 ? accentColor : primaryColor
                    }
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>

            {/* View label — top left */}
            <div className="absolute top-4 left-4">
              <span className="font-mono text-[8px] uppercase tracking-[0.16em] px-2 py-1 bg-black/30 text-white backdrop-blur-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Editorial caption — italic Fraunces, between each image */}
          {i < VIEWS.length - 1 && (
            <div className="px-6 md:px-10 py-8 border-b border-[--ink]/8">
              <p
                className="font-display italic text-[--ink]/60 leading-snug"
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
          className="font-display italic text-[--ink]/40 leading-snug"
          style={{ fontSize: "clamp(0.9rem, 1.6vw, 1.2rem)" }}
        >
          {CAPTIONS[VIEWS.length - 1]}
        </p>
      </div>
    </div>
  );
}
