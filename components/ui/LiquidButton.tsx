"use client";

// LiquidButton — submit button where cream/cobalt liquid fills from the
// bottom on hover, fully fills on submit, and a cream foam-bubble pops
// on success.
//
// Used by /regulars page and JoinRegulars section. Replaces plain buttons
// where the "pour" metaphor lands hardest.

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";

type LiquidState = "idle" | "loading" | "success";

export interface LiquidButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  state?:    LiquidState;
  /** Idle label (e.g. "Reserve your stool →") */
  label:     string;
  /** Success label (e.g. "Welcome, Regular. 🍺") */
  doneLabel?: string;
  /** Tint when hovered. Default: cream against cobalt bg. */
  fillColor?: string;
  /** Final text colour after fill. Default: cobalt against cream fill. */
  fillTextColor?: string;
}

export const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  function LiquidButton(
    {
      state = "idle",
      label,
      doneLabel = "Done.",
      fillColor      = "#E4E2DD",
      fillTextColor  = "#004AAD",
      className,
      disabled,
      ...rest
    },
    ref
  ) {
    const isBusy = state === "loading" || state === "success";

    return (
      <button
        ref={ref}
        disabled={disabled || isBusy}
        data-hover-big
        className={cn(
          "relative overflow-hidden group",
          "border border-current text-current",
          "w-full py-4 font-mono text-[10px] uppercase tracking-[0.16em]",
          "transition-colors duration-300",
          "disabled:cursor-default",
          className
        )}
        {...rest}
      >
        {/* Liquid fill — animated by CSS for hover, by Framer for loading/success */}
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          initial={false}
          animate={{
            height:
              state === "success" ? "100%" :
              state === "loading" ? "100%" :
                                    "0%",
          }}
          transition={{
            duration: state === "loading" ? 1.0 : 0.6,
            ease: [0.6, 0.05, 0.2, 1],
          }}
          style={{
            backgroundColor: fillColor,
            // Soft wavy top edge — using mask isn't broadly supported,
            // so we offset a foam-ish gradient
          }}
        >
          {/* Wavy meniscus on the surface */}
          <span
            aria-hidden="true"
            className="absolute top-[-6px] left-0 right-0 h-3 pointer-events-none"
            style={{
              background:
                `radial-gradient(ellipse 14px 6px at 18% 100%, ${fillColor} 60%, transparent 62%),
                 radial-gradient(ellipse 16px 6px at 52% 100%, ${fillColor} 60%, transparent 62%),
                 radial-gradient(ellipse 14px 6px at 84% 100%, ${fillColor} 60%, transparent 62%)`,
            }}
          />
        </motion.span>

        {/* Hover-driven fill (idle state only) — CSS-only for performance */}
        {state === "idle" && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 pointer-events-none transition-[height] duration-500 ease-out"
            style={{
              backgroundColor: fillColor,
              height: 0,
            }}
            data-liquid-hover
          />
        )}

        {/* Label — fades between idle and success */}
        <span
          className="relative z-10 block transition-colors duration-300"
          style={{
            color: state === "success" || state === "loading" ? fillTextColor : undefined,
          }}
        >
          <AnimatePresence mode="wait">
            {state === "success" ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {doneLabel}
              </motion.span>
            ) : state === "loading" ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{    opacity: 0 }}
                className="inline-flex items-center gap-2"
              >
                <span
                  className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full"
                  style={{ animation: "spin 0.7s linear infinite" }}
                />
                Pouring…
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </span>

        {/* Foam bubbles on success — they pop and fade */}
        {state === "success" && (
          <span aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
            {[
              { left: "18%", delay: 0,    size: 14 },
              { left: "42%", delay: 0.12, size: 22 },
              { left: "68%", delay: 0.06, size: 16 },
              { left: "86%", delay: 0.18, size: 12 },
            ].map((b, i) => (
              <motion.span
                key={i}
                className="absolute bottom-0 rounded-full"
                style={{
                  left:  b.left,
                  width:  b.size,
                  height: b.size,
                  backgroundColor: fillTextColor,
                  opacity: 0.4,
                }}
                initial={{ y: 0,    opacity: 0,    scale: 0.4 }}
                animate={{ y: -60,  opacity: 0,    scale: 1.6 }}
                transition={{
                  duration: 0.9,
                  delay:    b.delay,
                  ease:     "easeOut",
                }}
              />
            ))}
          </span>
        )}

        {/* Inline CSS for spinner + hover fill */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          button:not(:disabled):hover [data-liquid-hover] {
            height: 100% !important;
          }
        `}</style>
      </button>
    );
  }
);
