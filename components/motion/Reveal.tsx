"use client";

// IntersectionObserver reveal — adds "is-in" class when element enters viewport.
// Pairs with .reveal-hidden in globals.css for a CSS-driven transition
// (no JS animation for this layer → stays smooth at any framerate).

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the "is-in" class is applied */
  delay?: number;
  /** Fraction of element visible before triggering (0–1) */
  threshold?: number;
  /** Only reveal once (default true) */
  once?: boolean;
  as?: React.ElementType;
}

export function Reveal({
  children,
  className,
  delay = 0,
  threshold = 0.15,
  once = true,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => {
          el.classList.add("is-in");
          if (once) observer.disconnect();
        }, delay);
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold, once]);

  const TagEl = Tag as React.ElementType;
  return (
    <TagEl ref={ref} className={cn("reveal-hidden", className)}>
      {children}
    </TagEl>
  );
}
