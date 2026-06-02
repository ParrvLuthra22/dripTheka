"use client";

// Nav — fixed top, full-width, height var(--header-h).
//
// The inner content wrapper uses mix-blend-mode: difference with white text
// so it adapts automatically to cream, cobalt, and ink section backgrounds.
//
// MOBILE (<= 900px):
//   Left: WineGlassMark + wordmark
//   Right: pint count + hamburger
//   Hamburger opens a full-screen ink takeover via clip-path circle expansion.
//
// DESKTOP (> 900px):
//   Left:   POURS / STORY / BUILDING / REGULARS
//   Center: WineGlassMark + DRIP THEKA (absolutely centred)
//   Right:  SOUND label + pint count

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";

import { WineGlassMark } from "@/components/glass/WineGlassMark";
import { PintGlassNav } from "@/components/glass/PintGlass";
import { useSoundStore } from "@/lib/store/sound";
import { useCartStore } from "@/lib/store/cart";

// ── Link data ─────────────────────────────────────────────────────────────

const LEFT_LINKS = [
  { label: "Pours",     href: "/pour/pour-001" },
  { label: "Story",     href: "/story" },
  { label: "Building",  href: "/building" },
  { label: "Regulars",  href: "/regulars" },
] as const;

const MOBILE_LINKS = [
  { label: "Pours",     href: "/pour/pour-001" },
  { label: "Story",     href: "/story" },
  { label: "Building",  href: "/building" },
  { label: "Regulars",  href: "/regulars" },
  { label: "Cart",      href: "/cart" },
] as const;

// ── NavLink with draw-underline on hover ──────────────────────────────────

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const lineRef = useRef<HTMLSpanElement>(null);

  const enter = () =>
    gsap.to(lineRef.current, {
      scaleX: 1,
      duration: 0.28,
      ease: "power2.out",
      transformOrigin: "left center",
    });

  const leave = () =>
    gsap.to(lineRef.current, {
      scaleX: 0,
      duration: 0.22,
      ease: "power2.in",
      transformOrigin: "right center",
    });

  return (
    <Link
      href={href}
      data-hover
      onMouseEnter={enter}
      onMouseLeave={leave}
      className="relative inline-flex flex-col items-start font-mono text-[10px] uppercase tracking-[0.13em] text-current"
    >
      {children}
      <span
        ref={lineRef}
        aria-hidden="true"
        className="absolute -bottom-px left-0 h-px w-full bg-current scale-x-0 origin-left"
      />
    </Link>
  );
}

// ── Main Nav component ────────────────────────────────────────────────────

export function Nav() {
  const pathname  = usePathname();
  const navRef    = useRef<HTMLElement>(null);
  const { muted, toggle: toggleSound } = useSoundStore();
  const { totalItems } = useCartStore();
  const count = totalItems();

  // Scroll-hide state
  const lastY    = useRef(0);
  const isHidden = useRef(false);

  // Mobile menu
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Close menu on route change ──────────────────────────────────────────
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // ── Scroll-hide behaviour ───────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const y     = window.scrollY;
      const delta = y - lastY.current;
      lastY.current = y;

      if (y < 60) {
        // Near top — always show
        if (isHidden.current) {
          gsap.to(navRef.current, { yPercent: 0, duration: 0.4, ease: "power2.out" });
          isHidden.current = false;
        }
        return;
      }

      if (delta > 6 && !isHidden.current) {
        // Scrolling down → hide
        gsap.to(navRef.current, { yPercent: -100, duration: 0.45, ease: "power2.inOut" });
        isHidden.current = true;
      } else if (delta < -4 && isHidden.current) {
        // Scrolling up → reveal
        gsap.to(navRef.current, { yPercent: 0, duration: 0.4, ease: "power2.out" });
        isHidden.current = false;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Lock body scroll while menu is open ────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // ── Hamburger position for clip-path origin ─────────────────────────────
  // Right edge of screen minus ~24px, vertically centred in the 84px header
  const CLIP_ORIGIN = "calc(100% - 28px) 42px";

  return (
    <>
      {/* ── Fixed header ─────────────────────────────────────────────── */}
      <header
        ref={navRef}
        style={{ height: "var(--header-h)" }}
        className="fixed inset-x-0 top-0 z-50 pointer-events-none will-change-transform"
        role="banner"
      >
        {/*
          Inner wrapper: mix-blend-mode difference + white text.
          White − cream ≈ dark  ✓
          White − ink  ≈ light  ✓
          White − cobalt ≈ gold  (intentional brand moment)
        */}
        <div
          className="pointer-events-auto h-full text-white [mix-blend-mode:difference] [isolation:isolate]"
        >
          <div
            className="h-full flex items-center justify-between"
            style={{ paddingInline: "var(--pad-x)" }}
          >
            {/* ── LEFT: desktop links / mobile logo ────────────────── */}
            <div className="flex items-center">
              {/* Desktop left links */}
              <nav
                className="hidden min-[900px]:flex items-center gap-8"
                aria-label="Primary navigation"
              >
                {LEFT_LINKS.map(({ label, href }) => (
                  <NavLink key={href} href={href}>
                    {label}
                  </NavLink>
                ))}
              </nav>

              {/* Mobile logo (visible < 900px) */}
              <Link
                href="/"
                data-hover
                className="flex min-[900px]:hidden items-center gap-2"
                aria-label="Drip Theka home"
              >
                <WineGlassMark size={20} className="text-current" />
                <span className="font-display italic text-lg leading-none font-semibold tracking-tight">
                  Drip Theka
                </span>
              </Link>
            </div>

            {/* ── CENTER: logo lockup (desktop, absolutely centred) ─── */}
            <Link
              href="/"
              data-hover
              aria-label="Drip Theka home"
              className="hidden min-[900px]:flex absolute left-1/2 -translate-x-1/2 items-center gap-2.5 group"
            >
              <WineGlassMark
                size={22}
                className="text-current group-hover:opacity-70 transition-opacity duration-200"
              />
              <span className="font-display italic text-xl font-semibold tracking-tight leading-none">
                Drip Theka
              </span>
            </Link>

            {/* ── RIGHT: controls ──────────────────────────────────── */}
            <div className="flex items-center gap-5">
              {/* Sound toggle label (desktop) */}
              <button
                onClick={toggleSound}
                aria-pressed={!muted}
                data-hover
                className="hidden min-[900px]:flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-current hover:opacity-70 transition-opacity"
              >
                <span
                  aria-hidden="true"
                  className="inline-block w-1.5 h-1.5 rounded-full bg-current"
                  style={{ opacity: muted ? 0.3 : 1 }}
                />
                Sound&nbsp;·&nbsp;{muted ? "Off" : "On"}
              </button>

              {/* Pint count (desktop: number only — the floating glass is the visual) */}
              <span className="hidden min-[900px]:flex font-mono text-[9px] uppercase tracking-[0.14em] text-current">
                {count > 0 && `${count} item${count !== 1 ? "s" : ""}`}
              </span>

              {/* Mobile: PintGlassNav icon (< 900px) */}
              <div className="min-[900px]:hidden [mix-blend-mode:normal] [color:var(--ink)]">
                <PintGlassNav />
              </div>

              {/* Hamburger (mobile) */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                data-hover
                className="min-[900px]:hidden flex flex-col justify-center gap-[5px] w-7 h-7"
              >
                <span
                  className="block h-px w-full bg-current transition-transform duration-300 origin-center"
                  style={{
                    transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none",
                  }}
                />
                <span
                  className="block h-px w-full bg-current transition-opacity duration-300"
                  style={{ opacity: menuOpen ? 0 : 1 }}
                />
                <span
                  className="block h-px w-full bg-current transition-transform duration-300 origin-center"
                  style={{
                    transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none",
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen menu ─────────────────────────────────────
           Rendered OUTSIDE the blend-mode wrapper so its ink background
           is not colour-inverted. Uses clip-path circle from hamburger. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ clipPath: `circle(0px at ${CLIP_ORIGIN})` }}
            animate={{ clipPath: `circle(200vmax at ${CLIP_ORIGIN})` }}
            exit={{   clipPath: `circle(0px at ${CLIP_ORIGIN})` }}
            transition={{ duration: 0.55, ease: [0.6, 0.05, 0.2, 1] }}
            className="fixed inset-0 z-40 bg-[--ink] flex flex-col justify-center min-[900px]:hidden"
            style={{ paddingInline: "var(--pad-x)" }}
          >
            {/* Close button (top-right) */}
            <button
              onClick={closeMenu}
              aria-label="Close menu"
              className="absolute top-7 right-6 w-8 h-8 flex items-center justify-center text-[--cream] opacity-50 hover:opacity-100 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Links */}
            <nav aria-label="Mobile navigation">
              <ul className="flex flex-col gap-2">
                {MOBILE_LINKS.map(({ label, href }, i) => (
                  <motion.li
                    key={href}
                    initial={{ opacity: 0, x: -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{   opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.06 + 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={href}
                      onClick={closeMenu}
                      className="block font-display italic text-[--cream] hover:text-[--blue] transition-colors duration-200 leading-none"
                      style={{ fontSize: "clamp(2.5rem, 10vw, 5rem)" }}
                    >
                      {label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* Bottom bar in mobile menu */}
            <div className="absolute bottom-8 left-0 right-0 px-6 flex items-center justify-between">
              <button
                onClick={toggleSound}
                className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/40 hover:text-[--cream]/80 transition-colors"
              >
                Sound&nbsp;·&nbsp;{muted ? "Off" : "On"}
              </button>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/20">
                Pour #001
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
