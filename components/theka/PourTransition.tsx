"use client";

// PourTransition — cobalt shutter wipe between routes.
//
//   click internal link
//     → shutter rises from the bottom (solid #004AAD, --ease-shutter)
//     → fully covered: wordmark peaks, router.push(), scroll reset to top
//     → new pathname commits → short hold → shutter exits upward
//
// The slab is flat, PURE cobalt via the immutable `--cobalt` token — no
// gradient, no grain, no blend, and unaffected by the Happy Hour theme swap.
//
// Navigations we didn't start (back/forward, programmatic router.push) snap
// the shutter closed and wipe it away, so every route change looks the same.
//
// prefers-reduced-motion → no movement: the cobalt slab cross-fades in and
// out (opacity only), wordmark still shown.
//
// Programmatic use:  const { pourTo } = usePour();  pourTo("/story");

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { animate } from "framer-motion";
import { lang } from "@/lib/theka/lang";
import { resetScroll } from "./SmoothScroll";

type Phase = "idle" | "covering" | "covered" | "uncovering";

const SHUTTER_EASE = [0.76, 0, 0.24, 1] as const;   // --ease-shutter
const COVER_S   = 0.52;                              // --dur-shutter
const UNCOVER_S = 0.6;
const HOLD_MS   = 220;    // wordmark "peak" before the wipe out
const FADE_S    = 0.22;   // reduced-motion leg
const STUCK_MS  = 4000;   // if the route never commits, lift the shutter anyway

interface PourApi { pourTo: (href: string) => void }
const PourContext = createContext<PourApi>({ pourTo: () => {} });
export const usePour = () => useContext(PourContext);

function isPlainLeftClick(e: MouseEvent) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/** Resolve an <a> to an internal pathname we should pour to, or null. */
function internalTarget(a: HTMLAnchorElement): string | null {
  if (a.target && a.target !== "_self") return null;
  if (a.hasAttribute("download") || a.dataset.noPour !== undefined) return null;
  const raw = a.getAttribute("href");
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return null;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname) return null; // hash/query-only
  return url.pathname + url.search + url.hash;
}

export function PourTransition({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const slabRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  const phase      = useRef<Phase>("idle");
  const coverDone  = useRef<Promise<void>>(Promise.resolve());
  const prevPath   = useRef(pathname);
  const stuckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const show = (on: boolean) => {
    const slab = slabRef.current;
    if (!slab) return;
    slab.style.visibility    = on ? "visible" : "hidden";
    slab.style.pointerEvents = on ? "auto" : "none";
  };

  // ── Legs ───────────────────────────────────────────────────────────────

  const cover = useCallback(async (instant = false) => {
    const slab = slabRef.current, mark = markRef.current;
    if (!slab || !mark) return;
    phase.current = "covering";
    show(true);

    // All transform/opacity writes go through framer's animate() (duration 0
    // for instant sets) so its stored y never fights a manual style write.
    if (instant) {
      animate(slab, { y: "0%", opacity: 1 }, { duration: 0 });
      animate(mark, { y: 0, opacity: 1 }, { duration: 0 });
    } else if (reduced()) {
      // No movement: slab is placed, then cross-faded in.
      animate(slab, { y: "0%", opacity: 0 }, { duration: 0 });
      animate(mark, { y: 0, opacity: 1 }, { duration: 0 });
      await animate(slab, { opacity: [0, 1] }, { duration: FADE_S, ease: "linear" });
    } else {
      animate(slab, { opacity: 1 }, { duration: 0 });
      animate(mark, { opacity: [0, 1], y: [24, 0] },
        { duration: COVER_S * 0.8, delay: COVER_S * 0.45, ease: [0.16, 1, 0.3, 1] });
      await animate(slab, { y: ["100%", "0%"] }, { duration: COVER_S, ease: SHUTTER_EASE });
    }
    phase.current = "covered";
  }, []);

  const uncover = useCallback(async () => {
    const slab = slabRef.current, mark = markRef.current;
    if (!slab || !mark || phase.current === "uncovering") return;
    if (stuckTimer.current) clearTimeout(stuckTimer.current);

    try {
      await coverDone.current.catch(() => {});
      resetScroll();                       // new page opens at the top, unseen
      await new Promise((r) => setTimeout(r, HOLD_MS));
      phase.current = "uncovering";

      if (reduced()) {
        await animate(slab, { opacity: [1, 0] }, { duration: FADE_S, ease: "linear" });
      } else {
        animate(mark, { opacity: [1, 0], y: [0, -16] }, { duration: UNCOVER_S * 0.5, ease: "easeIn" });
        await animate(slab, { y: ["0%", "-100%"] }, { duration: UNCOVER_S, ease: SHUTTER_EASE });
      }
    } catch {
      /* never leave the shutter stuck — fall through and hide it */
    }

    show(false);
    animate(slab, { y: "100%", opacity: 1 }, { duration: 0 });   // park below
    phase.current = "idle";
  }, []);

  // ── Start a pour ───────────────────────────────────────────────────────

  const pourTo = useCallback((href: string) => {
    if (phase.current !== "idle") return;
    router.prefetch(href);
    // Navigate even if the cover leg fails — the shutter is cosmetic.
    coverDone.current = cover()
      .catch(() => {})
      .then(() => router.push(href, { scroll: false }));
    stuckTimer.current = setTimeout(() => { void uncover(); }, STUCK_MS);
  }, [cover, uncover, router]);

  // Intercept internal link clicks (capture phase → runs before next/link,
  // which bails out on defaultPrevented).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || !isPlainLeftClick(e)) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = internalTarget(a);
      if (!href) return;
      e.preventDefault();
      pourTo(href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pourTo]);

  // Route committed → lift the shutter. Unannounced navigations snap closed first.
  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    if (phase.current === "idle") {
      coverDone.current = cover(true);
    }
    void uncover();
  }, [pathname, cover, uncover]);

  const api = useMemo(() => ({ pourTo }), [pourTo]);

  return (
    <PourContext.Provider value={api}>
      {children}
      <div
        ref={slabRef}
        aria-hidden="true"
        className="fixed inset-0 flex flex-col items-center justify-center gap-4 will-change-transform"
        style={{
          zIndex: "var(--z-shutter)",
          backgroundColor: "var(--cobalt)",
          color: "var(--cream)",
          transform: "translate3d(0,100%,0)",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <div ref={markRef} className="flex flex-col items-center gap-3 select-none" style={{ opacity: 0 }}>
          <span className="type-loud-lg">{lang.shutter.wordmark}</span>
          <span className="font-display italic text-sm opacity-70">{lang.shutter.gloss}</span>
        </div>
      </div>
    </PourContext.Provider>
  );
}
