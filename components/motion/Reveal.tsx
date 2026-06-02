"use client";

// IntersectionObserver reveal — adds "is-in" class when element enters viewport.
// Pairs with .reveal-hidden in globals.css for a CSS-driven transition
// (no JS animation for this layer → stays smooth at any framerate).

import React, { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  once?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

export function Reveal({
  children,
  className,
  delay = 0,
  threshold = 0.15,
  once = true,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

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

  return React.createElement(
    Tag,
    { ref, className: cn("reveal-hidden", className) },
    children
  );
}
