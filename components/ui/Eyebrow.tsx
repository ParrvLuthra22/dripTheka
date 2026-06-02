// Eyebrow — uppercase mono label with a leading 24px hairline

import React from "react";
import { cn } from "@/lib/utils/cn";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  color?: "blue" | "ink" | "cream";
  as?: keyof React.JSX.IntrinsicElements;
}

const colorMap = {
  blue:  "text-[--blue]",
  ink:   "text-[--ink]/50",
  cream: "text-[--cream]/60",
};

export function Eyebrow({
  children,
  className,
  color = "blue",
  as: Tag = "p",
}: EyebrowProps) {
  return React.createElement(
    Tag,
    {
      className: cn(
        "inline-flex items-center gap-3",
        "font-mono text-[10px] uppercase tracking-[0.14em]",
        colorMap[color],
        className
      ),
    },
    React.createElement("span", {
      "aria-hidden": "true",
      className: "block w-px h-6 bg-current opacity-40 shrink-0",
    }),
    children
  );
}
