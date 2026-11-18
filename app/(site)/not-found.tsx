"use client";

// Wrong Theka — interactive 404.
// Foam blobs at bottom spring away from the cursor.

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { copy } from "@/data/copy";
import { Grain } from "@/components/theka/Grain";
import { Sticker } from "@/components/ui/Sticker";
import { ChalkMark } from "@/components/ui/ChalkMark";
import { HandText } from "@/components/ui/HandText";

interface Blob {
  id: number; homeX: number; homeY: number;
  x: number; y: number; vx: number; vy: number;
  rx: number; ry: number; opacity: number;
}

const BLOB_CONFIG = [
  { id: 0, homeX: 12, homeY: 88, rx: 90,  ry: 36, opacity: 0.75 },
  { id: 1, homeX: 30, homeY: 91, rx: 70,  ry: 28, opacity: 0.60 },
  { id: 2, homeX: 50, homeY: 89, rx: 110, ry: 44, opacity: 0.70 },
  { id: 3, homeX: 68, homeY: 92, rx: 55,  ry: 22, opacity: 0.55 },
  { id: 4, homeX: 84, homeY: 88, rx: 80,  ry: 30, opacity: 0.65 },
  { id: 5, homeX: 44, homeY: 95, rx: 44,  ry: 16, opacity: 0.40 },
];

export default function NotFound() {
  const blobEls = useRef<(SVGEllipseElement | null)[]>([]);
  const blobs   = useRef<Blob[]>([]);
  const cursor  = useRef({ x: -999, y: -999 });
  const rafId   = useRef<number>(0);

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    blobs.current = BLOB_CONFIG.map(cfg => ({
      ...cfg,
      x: (cfg.homeX / 100) * W,
      y: (cfg.homeY / 100) * H,
      vx: 0, vy: 0,
    }));

    blobEls.current.forEach((el, i) => {
      const b = blobs.current[i];
      if (!el || !b) return;
      el.setAttribute("cx", String(b.x));
      el.setAttribute("cy", String(b.y));
      el.setAttribute("rx", String(b.rx));
      el.setAttribute("ry", String(b.ry));
    });

    const onMove = (e: MouseEvent) => { cursor.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove, { passive: true });

    function tick() {
      const W2 = window.innerWidth;
      const H2 = window.innerHeight;
      blobs.current = blobs.current.map((blob, i) => {
        const el = blobEls.current[i];
        const dx = cursor.current.x - blob.x;
        const dy = cursor.current.y - blob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let nvx = blob.vx;
        let nvy = blob.vy;
        if (dist < 160 && dist > 0) {
          const force = ((160 - dist) / 160) ** 2 * 10;
          nvx -= (dx / dist) * force;
          nvy -= (dy / dist) * force;
        }
        nvx += ((blob.homeX / 100) * W2 - blob.x) * 0.04;
        nvy += ((blob.homeY / 100) * H2 - blob.y) * 0.04;
        nvx *= 0.86;
        nvy *= 0.86;
        const nx = blob.x + nvx;
        const ny = blob.y + nvy;
        if (el) { el.setAttribute("cx", String(nx)); el.setAttribute("cy", String(ny)); }
        return { ...blob, x: nx, y: ny, vx: nvx, vy: nvy };
      });
      rafId.current = requestAnimationFrame(tick);
    }
    rafId.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafId.current); window.removeEventListener("mousemove", onMove); };
  }, []);

  return (
    <div data-nav-tone="light" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: "#004AAD" }}>
      <Grain opacity={0.06} />
      <Sticker variant="bottle-cap" rotate={15} size={72}
        className="absolute top-[10%] right-[8vw] max-md:hidden z-10" />

      {/* Tipped pint + foam */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "min(160px, 28vw)", height: "min(200px, 36vw)" }}
        className="mb-10"
      >
        <svg viewBox="0 0 72 96" fill="none" className="w-full h-full" style={{ transform: "rotate(-85deg)" }} aria-hidden="true">
          <ellipse cx="8"  cy="50" rx="14" ry="7" fill="#E4E2DD" opacity="0.5" />
          <ellipse cx="24" cy="48" rx="9"  ry="5" fill="#E4E2DD" opacity="0.4" />
          <ellipse cx="15" cy="56" rx="6"  ry="3" fill="#E4E2DD" opacity="0.3" />
          <path d="M 4 10 A 34 7 0 0 1 68 10 C 68 26 64 50 62 72 C 60 82 60 86 60 90 L 60 92 L 12 92 L 12 90 C 12 86 12 82 10 72 C 8 50 4 26 4 10 Z"
            stroke="#E4E2DD" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(228,226,221,0.06)" />
          <path d="M 8 12 Q 36 20 64 12" stroke="#E4E2DD" strokeWidth="1" fill="none" opacity="0.4" />
          <path d="M 60 34 Q 70 34 70 44 Q 70 54 60 54" stroke="#E4E2DD" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="font-loud uppercase text-[#E4E2DD] text-center"
        style={{ fontSize: "clamp(3rem, 10vw, 8rem)", lineHeight: 0.82 }}
      >
        {copy.notFound.title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="font-sans text-[#E4E2DD]/55 text-center max-w-[420px] mt-5 leading-relaxed px-6"
        style={{ fontSize: "clamp(0.9rem, 1.6vw, 1.1rem)" }}
      >
        {copy.notFound.subtitle}
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.5 }}
        className="flex items-center justify-center gap-3 mt-3 max-sm:hidden"
        aria-hidden="true"
      >
        <ChalkMark variant="scribble" color="#E4E2DD" strokeWidth={1.5} className="w-16 h-8 opacity-25" />
        <HandText size="sm" rotate={4} color="#E4E2DD" className="opacity-35">actually no</HandText>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="mt-8 relative z-10"
      >
        <Link href="/" data-hover
          className="font-mono text-[10px] uppercase tracking-[0.16em] border border-[#E4E2DD]/35 text-[#E4E2DD] px-6 py-3 hover:bg-[#E4E2DD] hover:text-[#004AAD] transition-all duration-200">
          {copy.notFound.cta}
        </Link>
      </motion.div>

      {/* Interactive foam blobs */}
      <svg className="fixed inset-0 pointer-events-none" style={{ width: "100vw", height: "100vh", zIndex: 1 }} aria-hidden="true">
        {BLOB_CONFIG.map((cfg, i) => (
          <ellipse key={cfg.id} ref={el => { blobEls.current[i] = el; }} fill="#E4E2DD" fillOpacity={cfg.opacity} />
        ))}
      </svg>
    </div>
  );
}
