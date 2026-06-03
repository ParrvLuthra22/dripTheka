"use client";

// PintGlass — persistent animated cart indicator.
// Fixed bottom-right on desktop. Hidden on mobile (nav badge takes over).
//
// IMPORTANT: This is the PINT BEER GLASS (cart indicator).
// The wine glass (brand mark) lives in WineGlassMark.tsx. Do not confuse.
//
// Behaviour spec:
//   - Liquid fills to (items / 10) × 100%, capped at 100%
//   - On add: liquid rises (ease-pour), foam jiggles, ripple sweeps, sound plays
//   - On remove: liquid drops slowly, no foam
//   - Hover: scale 1.06, label appears
//   - Click: navigate to /cart (layoutId="cart-glass" for Framer morph)
//   - Sound: plays only when global sound toggle is ON

import {
  useRef,
  useEffect,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { useCartStore } from "@/lib/store/cart";
import { useSound } from "@/components/sound/SoundProvider";
import { cn } from "@/lib/utils/cn";

// ── viewBox constants (0 0 72 96) ───────────────────────────────────────────
//
// Pint glass profile:
//   Rim:  y 8,  x 4–68  (width 64)   ← wider at top
//   Body: y 84, x 12–60 (width 48)   ← narrower at bottom
//   Base: y 84–92                     ← flat foot
//
// Outer silhouette paths are defined below inline.

const BOWL_TOP_Y  = 14;  // where liquid starts at full (just below rim inner)
const BOWL_BOT_Y  = 84;  // where liquid hits the base
const BOWL_H      = BOWL_BOT_Y - BOWL_TOP_Y; // 70

// Foam bubble data (relative to SVG coordinate space)
const FOAM = [
  { cx: 36, rx: 14, ry: 4.5 },   // main dome
  { cx: 19, rx:  7, ry:  3  },   // left cluster
  { cx: 53, rx:  7, ry:  3  },   // right cluster
  { cx: 27, rx:  5, ry: 2.5 },   // inner left
  { cx: 46, rx:  5, ry: 2.5 },   // inner right
  { cx: 36, rx:  3, ry:  2  },   // top cap
];

interface PintGlassProps {
  className?: string;
}

export function PintGlass({ className }: PintGlassProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { items, totalItems } = useCartStore();
  const { muted, play } = useSound();

  // On /cart the hero pint takes over the layoutId — this element unmounts
  // so Framer Motion can animate the shared layout transition
  if (pathname === "/cart") return null;

  const count    = totalItems();
  const prevCount = useRef(count);
  const fillLevel = Math.min(1, count / 10); // 0–1

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const svgRef      = useRef<SVGSVGElement>(null);
  const liquidRef   = useRef<SVGRectElement>(null);
  const foamRef     = useRef<SVGGElement>(null);
  const rippleRef   = useRef<SVGRectElement>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  // Current animated fill Y — kept in ref to avoid re-renders
  const animY = useRef(BOWL_BOT_Y);

  // Pour sound is owned by SoundProvider — no local Howl instance here

  // ── Liquid fill calculation ───────────────────────────────────────────────
  const targetY = BOWL_BOT_Y - fillLevel * BOWL_H;
  const targetH = BOWL_BOT_Y - targetY;

  // ── Sync initial state (no animation on first render) ────────────────────
  useEffect(() => {
    if (!liquidRef.current || !foamRef.current) return;
    const initY = BOWL_BOT_Y - (Math.min(1, prevCount.current / 10)) * BOWL_H;
    gsap.set(liquidRef.current, { attr: { y: initY, height: BOWL_BOT_Y - initY } });
    gsap.set(foamRef.current,   { y: 0, scaleY: 1, opacity: prevCount.current > 0 ? 1 : 0 });
    animY.current = initY;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // once only

  // ── React to cart changes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!liquidRef.current || !foamRef.current || !rippleRef.current) return;

    const prev = prevCount.current;
    prevCount.current = count;
    if (prev === count) return;

    const newY = BOWL_BOT_Y - Math.min(1, count / 10) * BOWL_H;
    const newH = BOWL_BOT_Y - newY;
    const adding = count > prev;

    // Liquid level
    gsap.to(liquidRef.current, {
      attr: { y: newY, height: newH },
      duration: adding ? 0.6 : 0.9,
      ease: adding ? "cubic-bezier(.6,.05,.2,1)" : "power2.in",
      onUpdate() { animY.current = parseFloat(gsap.getProperty(liquidRef.current!, "y") as string); },
    });

    if (adding) {
      // Foam jiggle
      gsap.fromTo(
        foamRef.current,
        { scaleY: 0.5, transformOrigin: `36px ${BOWL_BOT_Y}px` },
        {
          scaleY: 1,
          duration: 0.55,
          ease: "elastic.out(1.1, 0.45)",
          transformOrigin: `36px ${BOWL_BOT_Y}px`,
        }
      );

      // Ripple sweep (only if reduced-motion is off)
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.fromTo(
          rippleRef.current,
          { attr: { x: 8 }, opacity: 0.35 },
          { attr: { x: 64 }, opacity: 0, duration: 0.55, ease: "power1.out" }
        );
      }

      // Sound
      if (!muted) play("pour");
    }

    // Foam visibility
    gsap.to(foamRef.current, {
      opacity: count > 0 ? 1 : 0,
      duration: 0.3,
    });
  }, [count, muted, play]);

  // ── Hover ─────────────────────────────────────────────────────────────────
  const onEnter = useCallback((_e: ReactPointerEvent<HTMLDivElement>) => {
    if (!svgRef.current) return;
    gsap.to(svgRef.current, { scale: 1.06, duration: 0.3, ease: "power2.out" });
  }, []);

  const onLeave = useCallback((_e: ReactPointerEvent<HTMLDivElement>) => {
    if (!svgRef.current) return;
    gsap.to(svgRef.current, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.6)" });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      layoutId="cart-glass"
      ref={wrapperRef}
      className={cn(
        // Fixed bottom-right, hidden on mobile (nav badge takes over)
        "fixed bottom-20 right-20 z-40",
        "hidden md:flex flex-col items-center gap-2",
        "cursor-pointer select-none",
        className
      )}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onClick={() => router.push("/cart")}
    >
      {/* Label on hover */}
      <AnimatePresence>
        {count > 0 && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink] whitespace-nowrap pointer-events-none"
          >
            What&apos;s In Your Glass · {count}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Pint glass SVG */}
      <svg
        ref={svgRef}
        width={72}
        height={96}
        viewBox="0 0 72 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Cart, ${count} item${count !== 1 ? "s" : ""}`}
        role="img"
      >
        <defs>
          {/* Glass interior clip — tapered trapezoid + curved rim */}
          <clipPath id="pint-bowl">
            <path d={[
              "M 8 14",
              "C 8 30 10 52 12 72",          // left inner wall
              "C 14 82 14 86 14 88",
              "L 58 88",                       // base
              "C 58 86 58 82 60 72",          // right inner wall
              "C 62 52 64 30 64 14",
              "Q 36 22 8 14",                  // front rim arc (curves down = depth)
              "Z",
            ].join(" ")} />
          </clipPath>
        </defs>

        {/* ── Liquid fill (clipped to interior) ──────────────────────── */}
        <rect
          ref={liquidRef}
          x="7"
          y={BOWL_BOT_Y}
          width="58"
          height="0"
          fill="var(--blue, #004AAD)"
          clipPath="url(#pint-bowl)"
        />

        {/* ── Foam group (positioned at liquid surface) ───────────────── */}
        <g
          ref={foamRef}
          opacity="0"
          style={{ transformOrigin: "36px 84px" }}
        >
          {FOAM.map((b, i) => (
            <ellipse
              key={i}
              cx={b.cx}
              cy={-b.ry / 2} // placed just above liquid surface; parent group is translated
              rx={b.rx}
              ry={b.ry}
              fill="var(--cream, #E4E2DD)"
              opacity={0.88 - i * 0.06}
            />
          ))}
        </g>

        {/* ── Wave ripple sweep ──────────────────────────────────────── */}
        <rect
          ref={rippleRef}
          x="64"
          y={BOWL_BOT_Y}
          width="2"
          height="2"
          fill="rgba(255,255,255,0.3)"
          clipPath="url(#pint-bowl)"
          opacity="0"
        />

        {/* ── Glass outer silhouette ─────────────────────────────────── */}
        <path
          d={[
            "M 4 10",
            "A 34 7 0 0 1 68 10",            // back of rim arc (over the top)
            "C 68 26 64 50 62 72",            // right outer — taper
            "C 60 82 60 86 60 90",
            "L 60 92",
            "L 12 92",                         // base
            "L 12 90",
            "C 12 86 12 82 10 72",            // left outer
            "C 8 50 4 26 4 10",
            "Z",
          ].join(" ")}
          stroke="var(--ink, #141518)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* ── Rim front arc — glass opening depth ───────────────────── */}
        <path
          d="M 8 12 Q 36 20 64 12"
          stroke="var(--ink, #141518)"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />

        {/* ── Handle (pint glass nub on right side) ─────────────────── */}
        <path
          d="M 60 38 Q 70 38 70 46 Q 70 54 60 54"
          stroke="var(--ink, #141518)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

// ── Mobile nav version ────────────────────────────────────────────────────
// A static mini pint icon for the nav header on ≤768px.
// No fixed positioning. No animations (except a small bounce on add).

interface PintGlassNavProps {
  className?: string;
}

export function PintGlassNav({ className }: PintGlassNavProps) {
  const router = useRouter();
  const { totalItems } = useCartStore();
  const count = totalItems();
  const iconRef = useRef<SVGSVGElement>(null);
  const prevCount = useRef(count);

  useEffect(() => {
    if (!iconRef.current) return;
    const prev = prevCount.current;
    prevCount.current = count;
    if (count <= prev) return;
    // Bounce on add
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      iconRef.current,
      { y: -4 },
      { y: 0, duration: 0.4, ease: "elastic.out(1, 0.5)" }
    );
  }, [count]);

  return (
    <button
      onClick={() => router.push("/cart")}
      aria-label={`Cart, ${count} item${count !== 1 ? "s" : ""}`}
      className={cn("relative cursor-pointer", className)}
    >
      <svg
        ref={iconRef}
        width={26}
        height={34}
        viewBox="0 0 72 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Mini pint fill indicator */}
        {count > 0 && (
          <rect
            x="8"
            y={BOWL_BOT_Y - Math.min(1, count / 10) * BOWL_H}
            width="56"
            height={Math.min(1, count / 10) * BOWL_H}
            fill="var(--blue, #004AAD)"
            clipPath="url(#pint-bowl-nav)"
          />
        )}
        <defs>
          <clipPath id="pint-bowl-nav">
            <path d="M 8 14 C 8 30 10 52 12 72 C 14 82 14 86 14 88 L 58 88 C 58 86 58 82 60 72 C 62 52 64 30 64 14 Q 36 22 8 14 Z" />
          </clipPath>
        </defs>
        <path
          d="M 4 10 A 34 7 0 0 1 68 10 C 68 26 64 50 62 72 C 60 82 60 86 60 90 L 60 92 L 12 92 L 12 90 C 12 86 12 82 10 72 C 8 50 4 26 4 10 Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M 8 12 Q 36 20 64 12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
        <path d="M 60 34 Q 70 34 70 44 Q 70 54 60 54" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>

      {/* Badge */}
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-[--blue] text-[--cream] font-mono text-[8px] leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
