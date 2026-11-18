"use client";

// ScrollProgressDrip — thin cobalt line on the right edge that fills
// as the user scrolls down the page. A "drip" droplet hangs at the
// current fill position. Subtle, brand-on, never in the way.

import { useEffect, useRef } from "react";

export function ScrollProgressDrip() {
  const fillRef    = useRef<HTMLDivElement>(null);
  const droplet    = useRef<HTMLDivElement>(null);
  const rafId      = useRef(0);

  useEffect(() => {
    const update = () => {
      const fill = fillRef.current;
      const drop = droplet.current;
      if (!fill || !drop) return;

      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docH > 0 ? window.scrollY / docH : 0;

      fill.style.height  = `${progress * 100}%`;
      drop.style.top     = `${progress * 100}%`;
      drop.style.opacity = progress > 0.01 && progress < 0.99 ? "1" : "0";

      rafId.current = 0;
    };

    const onScroll = () => {
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(update);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed right-2 top-0 bottom-0 w-[2px] z-30 pointer-events-none"
    >
      {/* Track */}
      <div className="absolute inset-0 bg-(--ink)/8" />

      {/* Fill */}
      <div
        ref={fillRef}
        className="absolute top-0 left-0 right-0 bg-(--blue)"
        style={{
          height: "0%",
          transition: "height 80ms linear",
          willChange: "height",
        }}
      />

      {/* Droplet at current fill position */}
      <div
        ref={droplet}
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: "0%",
          width:  10,
          height: 14,
          opacity: 0,
          transition: "top 80ms linear, opacity 0.2s ease",
          willChange: "top",
        }}
      >
        <svg viewBox="0 0 10 14" fill="none">
          <path
            d="M5 0 C5 0 0 6 0 9.5 C0 12.5 2.25 14 5 14 C7.75 14 10 12.5 10 9.5 C10 6 5 0 5 0 Z"
            fill="var(--blue)"
          />
        </svg>
      </div>
    </div>
  );
}
