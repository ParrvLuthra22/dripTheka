"use client";

import { forwardRef, useRef, useCallback, type ButtonHTMLAttributes } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "solid" | "outline" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Subtle GSAP mousemove translate — desktop only */
  magnetic?: boolean;
  /** Size: default "md" */
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  solid: [
    "bg-[--blue] text-[--neon]",
    "border-2 border-[--ink]",
    "shadow-[4px_4px_0_0_var(--ink)]",
    "hover:shadow-[0px_0px_0_0_var(--ink)] hover:translate-x-1 hover:translate-y-1",
    "disabled:bg-[--ink]/20 disabled:text-[--ink]/40 disabled:shadow-none",
  ].join(" "),
  outline: [
    "bg-[--cream] text-[--ink]",
    "border-2 border-[--ink]",
    "shadow-[4px_4px_0_0_var(--ink)]",
    "hover:bg-[--neon] hover:shadow-[0px_0px_0_0_var(--ink)] hover:translate-x-1 hover:translate-y-1",
    "disabled:border-[--ink]/20 disabled:text-[--ink]/20 disabled:shadow-none",
  ].join(" "),
  ghost: [
    "text-[--ink] font-bold",
    "hover:text-[--neon] hover:bg-[--ink]",
    "disabled:text-[--ink]/30",
  ].join(" "),
};

const sizeClasses = {
  sm: "px-4 py-2 text-[10px] tracking-[0.12em]",
  md: "px-7 py-3.5 text-[11px] tracking-[0.1em]",
  lg: "px-10 py-4 text-xs tracking-[0.1em]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "solid",
      size = "md",
      magnetic = false,
      className,
      children,
      onMouseMove,
      onMouseLeave,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLButtonElement>(null);

    // Merge refs
    const setRef = useCallback(
      (node: HTMLButtonElement | null) => {
        (internalRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onMouseMove?.(e);
        if (!magnetic || !internalRef.current) return;

        const rect = internalRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.35;
        const dy = (e.clientY - cy) * 0.35;

        gsap.to(internalRef.current, {
          x: dx,
          y: dy,
          duration: 0.4,
          ease: "power2.out",
        });
      },
      [magnetic, onMouseMove]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onMouseLeave?.(e);
        if (!magnetic || !internalRef.current) return;
        gsap.to(internalRef.current, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.5)",
        });
      },
      [magnetic, onMouseLeave]
    );

    return (
      <button
        ref={setRef}
        // data-hover-big activates the large cream cursor dot on desktop
        data-hover-big
        className={cn(
          "relative inline-flex items-center justify-center",
          "font-mono uppercase transition-all duration-200",
          "cursor-pointer select-none whitespace-nowrap",
          "focus-visible:outline-2 focus-visible:outline-[--blue] focus-visible:outline-offset-3",
          "disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
