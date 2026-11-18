// HowItPours — three-column editorial section below the fold.
// Pulls copy from the product data. Server component — no interactivity.

import { Reveal } from "@/components/motion/Reveal";
import type { Product } from "@/data/pour-001";

// ── Custom SVG icons ────────────────────────────────────────────────────────

function IdeaIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Wine glass with a spark */}
      <path d="M5 2 Q5 16 14 20 Q23 16 23 2 Z" stroke="#004AAD" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="14" y1="20" x2="14" y2="26" stroke="#004AAD" strokeWidth="1.5" />
      <line x1="9" y1="27" x2="19" y2="27" stroke="#004AAD" strokeWidth="1.5" />
      {/* Sparks */}
      <line x1="24" y1="3" x2="27" y2="1" stroke="#004AAD" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25" y1="7" x2="28" y2="7" stroke="#004AAD" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="23" y1="11" x2="25" y2="13" stroke="#004AAD" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FabricIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Weave / thread pattern */}
      <line x1="2" y1="7" x2="26" y2="7" stroke="#004AAD" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="14" x2="26" y2="14" stroke="#004AAD" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="21" x2="26" y2="21" stroke="#004AAD" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="2" x2="7" y2="26" stroke="#004AAD" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="2" x2="14" y2="26" stroke="#004AAD" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="2" x2="21" y2="26" stroke="#004AAD" strokeWidth="1.5" strokeLinecap="round" />
      {/* White squares at intersections to create weave illusion */}
      <rect x="5"  y="5"  width="4" height="4" fill="#E4E2DD" />
      <rect x="12" y="12" width="4" height="4" fill="#E4E2DD" />
      <rect x="19" y="5"  width="4" height="4" fill="#E4E2DD" />
      <rect x="5"  y="19" width="4" height="4" fill="#E4E2DD" />
      <rect x="19" y="19" width="4" height="4" fill="#E4E2DD" />
      <rect x="12" y="5"  width="4" height="4" fill="#E4E2DD" />
      <rect x="5"  y="12" width="4" height="4" fill="#E4E2DD" />
      <rect x="19" y="12" width="4" height="4" fill="#E4E2DD" />
      <rect x="12" y="19" width="4" height="4" fill="#E4E2DD" />
    </svg>
  );
}

function DropIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Liquid drop */}
      <path
        d="M14 3 C14 3 4 13 4 18.5 C4 23.5 8.5 27 14 27 C19.5 27 24 23.5 24 18.5 C24 13 14 3 14 3Z"
        stroke="#004AAD"
        strokeWidth="1.5"
        fill="rgba(0,74,173,0.12)"
        strokeLinejoin="round"
      />
      {/* Meniscus highlight */}
      <path d="M9 20 Q14 17 19 20" stroke="#004AAD" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Column data builder ─────────────────────────────────────────────────────

function buildColumns(product: Product) {
  return [
    {
      icon:    <IdeaIcon />,
      heading: "The Idea",
      copy:    `${product.tagline} That's where this piece starts — and ends.`,
    },
    {
      icon:    <FabricIcon />,
      heading: "The Fabric",
      copy:    `${product.fabric}. ${product.careInstructions[0]}. Built for repeated wear, not the hanger.`,
    },
    {
      icon:    <DropIcon />,
      heading: "The Drop",
      copy:    `${product.totalUnits} units worldwide. ${product.isLimited ? "No restocks." : ""} 30% deposit today, 70% on Opening Night. That's the deal.`,
    },
  ];
}

interface HowItPoursProps {
  product: Product;
}

export function HowItPours({ product }: HowItPoursProps) {
  const columns = buildColumns(product);

  return (
    <section
      className="bg-(--cream) py-20 md:py-28 border-t border-(--ink)/8"
      aria-label="Product story"
    >
      <div style={{ paddingInline: "var(--pad-x)" }}>
        {/* Section label */}
        <Reveal className="mb-12">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-(--ink)/30">
            How It Pours
          </p>
        </Reveal>

        {/* Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          {columns.map(({ icon, heading, copy }, i) => (
            <Reveal key={heading} delay={i * 80}>
              <div className="flex flex-col gap-4">
                {/* Icon */}
                <div className="w-10 h-10 flex items-center justify-center border border-(--blue)/20 rounded-sm">
                  {icon}
                </div>

                {/* Heading */}
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-(--ink)">
                  {heading}
                </p>

                {/* Copy */}
                <p
                  className="font-display italic text-(--ink)/65 leading-snug"
                  style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.2rem)" }}
                >
                  {copy}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
