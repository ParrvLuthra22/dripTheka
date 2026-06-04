"use client";

// Nav — fixed top, full-width.
// Cobalt #004AAD background, cream type, always.
//
// CENTER: empty placeholder div with data-morph-anchor="nav" — this is
// where MorphingLogo settles when the user scrolls past the hero. There is
// NO logo rendered here directly; the MorphingLogo component owns it.
//
// RIGHT: four functional elements
//   1. SoundToggle compact — animated waveform when ON
//   2. ReservationCounter — live X/100 RESERVED with pulsing dot
//   3. PourIndicator — mini pint glass that fills as cart fills
//   4. WALK IN CTA — scrolls to Currently Pouring (homepage only)

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";

import { useSoundStore } from "@/lib/store/sound";
import { useCartStore }  from "@/lib/store/cart";
import { CountUp }       from "@/components/motion/CountUp";
import { UserMenu }      from "@/components/auth/UserMenu";

// ── Links ────────────────────────────────────────────────────────────────

const LEFT_LINKS = [
  { label: "Pours",     href: "/pour/pour-001" },
  { label: "Story",     href: "/story" },
  { label: "Building",  href: "/building" },
  { label: "Regulars",  href: "/regulars" },
] as const;

const MOBILE_LINKS = [
  { label: "Pours",    href: "/pour/pour-001" },
  { label: "Story",    href: "/story" },
  { label: "Building", href: "/building" },
  { label: "Regulars", href: "/regulars" },
  { label: "Cart",     href: "/cart" },
  { label: "Account",  href: "/account" },
] as const;

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

// ── Compact sound waveform indicator ─────────────────────────────────────

function SoundIndicator({ muted, onClick }: { muted: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={!muted}
      data-hover
      className="hidden min-[900px]:flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] hover:opacity-70 transition-opacity"
    >
      <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
        {[4, 9, 6, 11, 5].map((h, i) => (
          <span
            key={i}
            className="w-[2px] rounded-full bg-current"
            style={
              muted
                ? { height: 2 }
                : {
                    height: h,
                    animation: `wave-bar 600ms ${i * 70}ms ease-in-out infinite alternate`,
                  }
            }
          />
        ))}
      </span>
      <span>Sound&nbsp;·&nbsp;{muted ? "Off" : "On"}</span>
      <style>{`
        @keyframes wave-bar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </button>
  );
}

// ── Live reservation counter ─────────────────────────────────────────────

function ReservationCounter() {
  const [data, setData] = useState<{ reserved: number; total: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/reserve/count", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { reserved: number; total: number };
        if (!cancelled) setData(json);
      } catch { /* silent */ }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (!data) return null;

  return (
    <Link
      href="/pour/pour-001"
      data-hover
      className="hidden min-[1100px]:flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] hover:opacity-70 transition-opacity"
      aria-label={`${data.reserved} of ${data.total} reserved`}
    >
      <span
        aria-hidden="true"
        className="block w-1.5 h-1.5 rounded-full bg-current"
        style={{ animation: "reservation-pulse 1.8s ease-in-out infinite" }}
      />
      <CountUp
        value={data.reserved}
        duration={1100}
        format={(n) => `${String(Math.round(n)).padStart(3, "0")}/${String(data.total).padStart(3, "0")}`}
        className="tabular-nums"
      />
      <span className="opacity-60">Reserved</span>
      <style>{`
        @keyframes reservation-pulse {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%      { opacity: 0.3; transform: scale(0.7); }
        }
      `}</style>
    </Link>
  );
}

// ── Mini pour indicator — pint glass that fills with cart items ──────────

function PourIndicator({ count }: { count: number }) {
  const fill = Math.min(1, count / 10);
  return (
    <Link
      href="/cart"
      data-hover
      aria-label={`Cart, ${count} item${count !== 1 ? "s" : ""}`}
      className="hidden min-[900px]:flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <svg width="18" height="22" viewBox="0 0 72 96" fill="none" aria-hidden="true">
        <defs>
          <clipPath id="nav-pour-clip">
            <path d="M 8 14 C 8 30 10 52 12 72 C 14 82 14 86 14 88 L 58 88 C 58 86 58 82 60 72 C 62 52 64 30 64 14 Q 36 22 8 14 Z" />
          </clipPath>
        </defs>
        {fill > 0 && (
          <rect
            x="7"
            y={84 - fill * 70}
            width="58"
            height={fill * 70}
            fill="currentColor"
            clipPath="url(#nav-pour-clip)"
            style={{ transition: "y 0.55s var(--ease-pour, cubic-bezier(.6,.05,.2,1)), height 0.55s var(--ease-pour)" }}
          />
        )}
        <path
          d="M 4 10 A 34 7 0 0 1 68 10 C 68 26 64 50 62 72 C 60 82 60 86 60 90 L 60 92 L 12 92 L 12 90 C 12 86 12 82 10 72 C 8 50 4 26 4 10 Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M 8 12 Q 36 20 64 12" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M 60 34 Q 70 34 70 44 Q 70 54 60 54" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] tabular-nums">
        {count > 0 ? `${count}` : "—"}
      </span>
    </Link>
  );
}

// ── WALK IN CTA — scrolls to Currently Pouring on homepage ───────────────

function WalkInCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-hover-big
      className="hidden min-[900px]:flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] border border-[#E4E2DD]/40 text-[#E4E2DD] px-3 py-1.5 hover:bg-[#E4E2DD] hover:text-[#004AAD] transition-all duration-200"
    >
      Walk In&nbsp;→
    </button>
  );
}

// ── Main Nav ──────────────────────────────────────────────────────────────

export function Nav() {
  const pathname  = usePathname();
  const navRef    = useRef<HTMLElement>(null);
  const { muted, toggle: toggleSound } = useSoundStore();
  const { totalItems } = useCartStore();
  const count = totalItems();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lastY    = useRef(0);
  const isHidden = useRef(false);
  const [scrolled, setScrolled] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Walk In CTA action — scrolls to Currently Pouring on home, navigates from other pages
  const handleWalkIn = useCallback(() => {
    if (pathname === "/") {
      const target = document.querySelector('[data-section="currently-pouring"]');
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Navigate to home, then scroll target catches via hash
      window.location.href = "/#currently-pouring";
    }
  }, [pathname]);

  return (
    <>
      <header
        ref={navRef}
        style={{
          height: "var(--header-h)",
          color:  "#E4E2DD",
          backgroundColor: "#004AAD",
          borderBottom: scrolled ? "1px solid rgba(228,226,221,0.1)" : "1px solid transparent",
          transition: "border-color 0.3s ease",
        }}
        className="fixed inset-x-0 top-0 z-50 pointer-events-none will-change-transform"
        role="banner"
      >
        <div className="pointer-events-auto h-full">
          <div
            className="h-full flex items-center justify-between gap-4"
            style={{ paddingInline: "var(--pad-x)" }}
          >
            {/* ── LEFT — nav links (desktop) / blank (mobile) ─────── */}
            <div className="flex items-center min-w-0">
              <nav
                className="hidden min-[900px]:flex items-center gap-7"
                aria-label="Primary navigation"
              >
                {LEFT_LINKS.map(({ label, href }) => (
                  <NavLink key={href} href={href}>
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/*
              ── CENTER — morph anchor (desktop) ──────────────────────
              Empty placeholder div. MorphingLogo reads its bounding rect
              and animates the actual logo into this position on scroll.
              Width sized to match nav target logo size.
            */}
            <div
              data-morph-anchor="nav"
              className="hidden min-[900px]:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                width:  120,
                height: 36,
                // height matches BrandLogo "md" size — used as final size of morph
              }}
              aria-hidden="true"
            />

            {/* ── RIGHT — controls ──────────────────────────────────── */}
            <div className="flex items-center gap-4 min-w-0">
              <SoundIndicator muted={!mounted || muted} onClick={toggleSound} />
              <ReservationCounter />
              <PourIndicator count={mounted ? count : 0} />
              <WalkInCTA onClick={handleWalkIn} />
              <UserMenu />

              {/* Hamburger — mobile only */}
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

      {/* ── Mobile menu — full-page typographic takeover ──────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-between min-[900px]:hidden overflow-hidden"
            style={{
              backgroundColor: "#004AAD",
              paddingInline:   "var(--pad-x)",
              paddingTop:      "calc(var(--header-h) + 1.5rem)",
              paddingBottom:   "2.5rem",
            }}
          >
            {/* Top eyebrow */}
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#E4E2DD]/40">
                The Menu
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#E4E2DD]/40">
                Pour&nbsp;#001
              </p>
            </div>

            {/* Big italic links */}
            <nav aria-label="Mobile navigation" className="flex-1 flex flex-col justify-center py-8">
              <ul className="flex flex-col gap-1">
                {MOBILE_LINKS.map(({ label, href }, i) => (
                  <motion.li
                    key={href}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{   opacity: 0, y: 20 }}
                    transition={{
                      delay: i * 0.08 + 0.2,
                      duration: 0.5,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <Link
                      href={href}
                      onClick={closeMenu}
                      className="flex items-baseline gap-3 group leading-none"
                    >
                      <span
                        aria-hidden="true"
                        className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#E4E2DD]/30 group-hover:text-[#E4E2DD] transition-colors"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="font-tanker uppercase text-[#E4E2DD] group-hover:translate-x-2 transition-transform duration-300"
                        style={{ fontSize: "clamp(2.75rem, 14vw, 7rem)" }}
                      >
                        {label}.
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* Bottom row */}
            <div className="flex items-end justify-between gap-4">
              <button
                onClick={toggleSound}
                className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#E4E2DD]/40 hover:text-[#E4E2DD] transition-colors"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" style={{ opacity: muted ? 0.3 : 1 }} />
                Sound&nbsp;·&nbsp;{mounted && !muted ? "On" : "Off"}
              </button>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#E4E2DD]/20 text-right">
                {count > 0 ? `${count} in glass` : "Empty glass"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
