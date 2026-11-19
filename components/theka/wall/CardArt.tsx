"use client";

// The shadow + fit images of an "Also on the wall" card. They sit far below the hero, so
// they only get a `src` once the card is within ~300px of the viewport. (Native
// loading="lazy" isn't enough: Chrome's lazy margin is >1000px, which on a phone is
// the whole first screen, so ~270KB of neighbours would load before the page settles.)
// The stage has fixed CSS geometry, so there is no layout shift when they arrive.

import { useEffect, useRef, useState } from "react";

interface CardArtProps {
  shadow: string;
  fit: string;
  shadowClass: string;
  fitClass: string;
}

export function CardArt({ shadow, fit, shadowClass, fitClass }: CardArtProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || armed) return;
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setArmed(true), 0); // no IO: just load
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setArmed(true); io.disconnect(); } },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);

  return (
    <>
      <span ref={ref} aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={shadowClass} src={armed ? shadow : undefined} alt="" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={fitClass} src={armed ? fit : undefined} alt="" decoding="async" />
    </>
  );
}
