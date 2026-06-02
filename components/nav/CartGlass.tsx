"use client";

import { useCartStore } from "@/lib/store/cart";

// Pint beer glass with foam — fills as items are added.
// This is NOT the wine glass logo. Do not confuse the two.
export function CartGlass() {
  const { totalItems, toggleCart } = useCartStore();
  const count = totalItems();

  // 0 items = 0% full, 8+ items = 100% full
  const fillPercent = Math.min(100, (count / 8) * 100);

  return (
    <button
      onClick={toggleCart}
      aria-label={`What's In Your Glass — ${count} item${count !== 1 ? "s" : ""}`}
      className="relative flex flex-col items-center group"
    >
      <svg
        width="32"
        height="38"
        viewBox="0 0 32 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Foam on top — only visible when items in cart */}
        {count > 0 && (
          <g opacity={Math.min(1, count / 2)}>
            <ellipse cx="16" cy="7" rx="11" ry="4" fill="#E4E2DD" />
            <ellipse cx="10" cy="6" rx="3.5" ry="2.5" fill="#E4E2DD" />
            <ellipse cx="22" cy="6" rx="3" ry="2" fill="#E4E2DD" />
          </g>
        )}

        {/* Glass body outline */}
        <path
          d="M6 10 L4 36 L28 36 L26 10 Z"
          stroke="#141518"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Glass handle */}
        <path
          d="M26 14 Q34 14 34 22 Q34 30 26 30"
          stroke="#141518"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Beer fill — rises from bottom as items increase */}
        {fillPercent > 0 && (
          <clipPath id="glass-clip">
            <path d="M6 10 L4 36 L28 36 L26 10 Z" />
          </clipPath>
        )}
        {fillPercent > 0 && (
          <rect
            x="4"
            y={36 - (26 * fillPercent) / 100}
            width="25"
            height={(26 * fillPercent) / 100}
            fill="#004AAD"
            clipPath="url(#glass-clip)"
            style={{ transition: "y 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        )}
      </svg>

      {/* Item count badge */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 font-mono text-[9px] leading-none bg-[#004AAD] text-[#E4E2DD] rounded-full w-4 h-4 flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
