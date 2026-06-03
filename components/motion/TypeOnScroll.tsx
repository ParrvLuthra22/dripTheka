"use client";

// TypeOnScroll — typewriter effect triggered by IntersectionObserver.
//
// When the element enters the viewport, characters reveal one-by-one
// at a configurable speed. Once complete, the text stays put (no re-trigger).
//
// Supports rich content: pass an array of segments. Each segment is either
// a plain string OR a React node — nodes are revealed atomically (no typing
// inside them), preserving inline italic/blue highlights.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type Segment = string | { node: ReactNode; chars?: number };

interface TypeOnScrollProps {
  /** Plain text or array of segments (strings + ReactNodes) */
  text?:     string;
  segments?: Segment[];
  /** Speed in ms per character. Default 60 = slow & editorial. */
  speed?:    number;
  /** Optional className for the wrapper */
  className?: string;
  /** Inline style for the wrapper */
  style?:    React.CSSProperties;
  /** Wrapper element — default 'p' */
  as?:       "p" | "h2" | "h3" | "blockquote" | "div";
  /** Start at top% of viewport — default "top 80%" */
  threshold?: number;
}

export function TypeOnScroll({
  text,
  segments,
  speed = 60,
  className,
  style,
  as = "p",
  threshold = 0.2,
}: TypeOnScrollProps) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(0); // count of characters revealed so far
  const [done,     setDone]     = useState(false);
  const triggered = useRef(false);

  // Flatten segments into a list of "tokens" where each token is either
  // a single char to reveal, or a complete ReactNode chunk (counted as `chars` chars).
  const tokens = useRef<Array<{ kind: "char"; ch: string } | { kind: "node"; node: ReactNode }>>([]);
  if (tokens.current.length === 0) {
    if (segments) {
      for (const seg of segments) {
        if (typeof seg === "string") {
          for (const ch of seg) tokens.current.push({ kind: "char", ch });
        } else {
          // Atomic node — treat as a single "reveal" with weight `chars`
          for (let i = 0; i < (seg.chars ?? 1); i++) {
            tokens.current.push(i === 0
              ? { kind: "node", node: seg.node }
              : { kind: "char", ch: "" } // padding so the node fits the total char count
            );
          }
        }
      }
    } else if (text) {
      for (const ch of text) tokens.current.push({ kind: "char", ch });
    }
  }

  const totalChars = tokens.current.length;

  // IntersectionObserver — trigger typewriter
  useEffect(() => {
    const el = ref.current;
    if (!el || triggered.current) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          obs.disconnect();
          startTyping();
        }
      },
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold]);

  // Reduced motion → reveal everything immediately
  function startTyping() {
    if (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(totalChars);
      setDone(true);
      return;
    }

    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setRevealed(n);
      if (n >= totalChars) {
        window.clearInterval(id);
        setDone(true);
      }
    }, speed);
  }

  // Render: walk tokens, including only the first N
  const renderedNodes: ReactNode[] = [];
  let charBuffer = "";
  let count      = 0;

  const flush = () => {
    if (charBuffer) {
      renderedNodes.push(charBuffer);
      charBuffer = "";
    }
  };

  for (const tok of tokens.current) {
    if (count >= revealed) break;
    if (tok.kind === "char") {
      charBuffer += tok.ch;
    } else {
      flush();
      renderedNodes.push(tok.node);
    }
    count += 1;
  }
  flush();

  // Cursor (blinking)
  const showCursor = !done && triggered.current;

  // Conditionally choose the wrapper element type
  const Tag = as as "p" | "h2" | "h3" | "blockquote" | "div";

  return (
    <Tag
      // @ts-expect-error ref typing
      ref={ref}
      className={cn(className)}
      style={style}
    >
      {renderedNodes}
      {showCursor && (
        <span
          aria-hidden="true"
          className="inline-block w-[0.06em] h-[0.9em] align-baseline ml-[0.05em] bg-current"
          style={{
            animation: "type-caret 0.7s steps(1) infinite",
            transform: "translateY(0.08em)",
          }}
        />
      )}
      <style>{`
        @keyframes type-caret {
          0%, 50%   { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </Tag>
  );
}
