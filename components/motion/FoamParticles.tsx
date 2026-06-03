"use client";

// FoamParticles — drifting cream bubbles behind the hero.
// Pure DOM (not WebGL) — keeps it cheap and works everywhere.
// 32 ellipses positioned randomly, animated upward with delayed loops.
//
// Falls back to nothing on prefers-reduced-motion.

import { useMemo } from "react";

interface Bubble {
  id:     number;
  left:   number; // % from left
  size:   number; // diameter px
  duration: number; // s
  delay:    number; // s
  opacity:  number;
}

const COUNT = 28;

function generateBubbles(): Bubble[] {
  // Deterministic-ish pattern via seeded random (so SSR/CSR match)
  // Simple LCG for stability
  let seed = 1729;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: COUNT }, (_, id) => ({
    id,
    left:     rand() * 100,
    size:     4 + rand() * 16,    // 4–20px
    duration: 8 + rand() * 10,    // 8–18s
    delay:    rand() * -18,       // negative so they're mid-drift on mount
    opacity:  0.06 + rand() * 0.18, // 0.06–0.24
  }));
}

export function FoamParticles() {
  const bubbles = useMemo(generateBubbles, []);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="absolute rounded-full"
          style={{
            left:        `${b.left}%`,
            bottom:      `-${b.size}px`,
            width:        b.size,
            height:       b.size,
            backgroundColor: "#E4E2DD",
            opacity:      b.opacity,
            animation:   `foam-drift ${b.duration}s linear ${b.delay}s infinite`,
            willChange:  "transform, opacity",
          }}
        />
      ))}
      <style>{`
        @keyframes foam-drift {
          0%   { transform: translateY(0)        translateX(0)    scale(0.6); opacity: 0;    }
          15%  {                                                              opacity: var(--initial-opacity, 0.2); }
          50%  { transform: translateY(-50vh)    translateX(20px) scale(1);    }
          100% { transform: translateY(-110vh)   translateX(-12px) scale(0.4); opacity: 0;    }
        }

        @media (prefers-reduced-motion: reduce) {
          [data-foam-particles] { display: none; }
        }
      `}</style>
    </div>
  );
}
