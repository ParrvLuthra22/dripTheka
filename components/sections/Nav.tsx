"use client";

// Nav — fixed top, full-width.
// Uses a section-tone detection system (data-nav-tone attribute on sections)
// so text/icons swap colors based on whichever section is currently under
// the header. Replaces the previous mix-blend-mode:difference approach.
//
// Hide-on-scroll-down / show-on-scroll-up with hysteresis to avoid jitter.

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";

import { BrandLogo }      from "@/components/glass/BrandLogo";
import { PintGlassNav }   from "@/components/glass/PintGlass";
import { useSoundStore }  from "@/lib/store/sound";
import { useCartStore }   from "@/lib/store/cart";

// ── Links ────────────────────────────────────────────────────────────────

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

type Tone = "light" | "dark"; // light = cream text on dark bg; dark = ink text on light bg

// ── NavLink with hairline-draw hover underline ────────────────────────────

function NavLink({
  href, children,
}: { href: string; children: React.ReactNode }) {
  const lineRef = useRef<HTMLSpanElement>(null);

  const enter = () =>
    gsap.to(lineRef.current, {
      scaleX: 1, duration: 0.28, ease: "power2.out",
      transformOrigin: "left center",
    });
  const leave = () =>
    gsap.to(lineRef.current, {
      scaleX: 0, duration: 0.22, ease: "power2.in",
      transformOrigin: "right center",
    });

  return (
    <Link
      href={href}
      data-hover
      onMouseEnter={enter}
      onMouseLeave={leave}
      className="relative inline-flex flex-col items-start font-mono text-[10px] uppercase tracking-[0.13em]"
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

// ── Tone detector — reads data-nav-tone from sections ─────────────────────

function useNavTone(): Tone {
  const [tone, setTone] = useState<Tone>("dark");
  const pathname = usePathname();

  useEffect(() => {
    // Reset to default when navigating
    setTone("dark");

    // Wait one frame for the new page DOM to mount
    const raf = requestAnimationFrame(() => {
      // Header height in px (matches --header-h in CSS)
      const HEADER_H = 84;
      // Sample point: just below the nav at horizontal middle
      const sampleY = HEADER_H + 4;

      const updateTone = () => {
        const els = document.elementsFromPoint(window.innerWidth / 2, sampleY);
        // Walk outward (innermost → outermost) looking for the closest
        // element with data-nav-tone — that section's tone wins
        for (const el of els) {
          const t = (el as HTMLElement).dataset?.navTone;
          if (t === "light" || t === "dark") {
            setTone(t);
            return;
          }
        }
        setTone("dark");
      };

      updateTone();

      // Update on scroll (throttled with rAF)
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          updateTone();
          ticking = false;
        });
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);

      // Cleanup
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    });

    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return tone;
}

// ── Main Nav ──────────────────────────────────────────────────────────────

export function Nav() {
  const pathname  = usePathname();
  const navRef    = useRef<HTMLElement>(null);
  const { muted, toggle: toggleSound } = useSoundStore();
  const { totalItems } = useCartStore();
  const count = totalItems();

  const tone = useNavTone();

  // Scroll-hide state with hysteresis (must drop > 8px to hide,
  // rise > 4px to reveal — avoids jitter from tiny scroll movements)
  const lastY    = useRef(0);
  const isHidden = useRef(false);
  const [scrolled, setScrolled] = useState(false);

  // Mobile menu
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Scroll-hide / scroll-reveal
  useEffect(() => {
    const onScroll = () => {
      const y     = window.scrollY;
      const delta = y - lastY.current;
      lastY.current = y;

      setScrolled(y > 12);

      if (y < 80) {
        if (isHidden.current) {
          gsap.to(navRef.current, { yPercent: 0, duration: 0.35, ease: "power2.out" });
          isHidden.current = false;
        }
        return;
      }

      if (delta > 8 && !isHidden.current) {
        gsap.to(navRef.current, { yPercent: -100, duration: 0.4, ease: "power2.inOut" });
        isHidden.current = true;
      } else if (delta < -4 && isHidden.current) {
        gsap.to(navRef.current, { yPercent: 0, duration: 0.35, ease: "power2.out" });
        isHidden.current = false;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Body lock while mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Navbar is always #004AAD — the brand blue. Same shade, always.
  const textColor = "#E4E2DD";
  const bgStyle: React.CSSProperties = {
    backgroundColor: "#004AAD",
    borderBottom: scrolled ? "1px solid rgba(228,226,221,0.1)" : "none",
  };

  const CLIP_ORIGIN = "calc(100% - 28px) 42px";

  return (
    <>
      <header
        ref={navRef}
        style={{
          height: "var(--header-h)",
          color: textColor,
          transition: "background-color 0.3s ease, border-color 0.3s ease",
          ...bgStyle,
        }}
        className="fixed inset-x-0 top-0 z-50 pointer-events-none will-change-transform"
        role="banner"
      >
        <div
          className="pointer-events-auto h-full"
        >
          <div
            className="h-full flex items-center justify-between"
            style={{ paddingInline: "var(--pad-x)" }}
          >
            {/* ── LEFT ──────────────────────────────────────────────── */}
            <div className="flex items-center">
              {/* Desktop links */}
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

              {/* Mobile small logo — dt icon monogram */}
              <Link
                href="/"
                data-hover
                className="flex min-[900px]:hidden items-center"
                aria-label="Drip Theka home"
              >
                <BrandLogo size="lg" />
              </Link>
            </div>

            {/* ── CENTER (desktop only) ─────────────────────────────── */}
            <Link
              href="/"
              data-hover
              aria-label="Drip Theka home"
              className="hidden min-[900px]:flex absolute left-1/2 -translate-x-1/2 items-center group hover:opacity-90 transition-opacity duration-200"
            >
              <BrandLogo size="xl" priority />
            </Link>

            {/* ── RIGHT ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-5">
              <button
                onClick={toggleSound}
                aria-pressed={!muted}
                data-hover
                className="hidden min-[900px]:flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] hover:opacity-70 transition-opacity"
              >
                <span
                  aria-hidden="true"
                  className="inline-block w-1.5 h-1.5 rounded-full bg-current"
                  style={{ opacity: muted ? 0.3 : 1 }}
                />
                Sound&nbsp;·&nbsp;{muted ? "Off" : "On"}
              </button>

              <span className="hidden min-[900px]:flex font-mono text-[9px] uppercase tracking-[0.14em]">
                {count > 0 && `${count} item${count !== 1 ? "s" : ""}`}
              </span>

              {/* Mobile pint glass icon */}
              <div className="min-[900px]:hidden">
                <PintGlassNav />
              </div>

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                data-hover
                className="min-[900px]:hidden flex flex-col justify-center gap-[5px] w-7 h-7"
              >
                <span
                  className="block h-px w-full bg-current transition-transform duration-300 origin-center"
                  style={{ transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none" }}
                />
                <span
                  className="block h-px w-full bg-current transition-opacity duration-300"
                  style={{ opacity: menuOpen ? 0 : 1 }}
                />
                <span
                  className="block h-px w-full bg-current transition-transform duration-300 origin-center"
                  style={{ transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none" }}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ─────────────────────────────────────────────── */}
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
            <button
              onClick={closeMenu}
              aria-label="Close menu"
              className="absolute top-7 right-6 w-8 h-8 flex items-center justify-center text-[--cream] opacity-50 hover:opacity-100 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

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
