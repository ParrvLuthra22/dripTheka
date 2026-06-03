"use client";

// PreFooterWordmark — huge stroked "drip theka" spanning full width.
// Parallaxes into the footer below.

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function PreFooterWordmark() {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["4%", "-14%"]);

  return (
    <section
      ref={ref}
      data-nav-tone="dark"
      className="bg-[--cream] overflow-hidden"
      aria-hidden="true"
    >
      <motion.p
        style={{
          y,
          fontSize:             "clamp(4rem, 30vw, 28rem)",
          WebkitTextStroke:     "1px rgba(20,21,24,0.18)",
          color:                "transparent",
          fontFamily:           "var(--font-display, serif)",
          fontStyle:            "italic",
          fontWeight:           600,
          lineHeight:           0.85,
          letterSpacing:        "-0.03em",
          whiteSpace:           "nowrap",
          userSelect:           "none",
          willChange:           "transform",
          paddingInline:        "var(--pad-x)",
          paddingBlock:         "clamp(2rem, 4vw, 4rem)",
        }}
      >
        drip theka
      </motion.p>
    </section>
  );
}
