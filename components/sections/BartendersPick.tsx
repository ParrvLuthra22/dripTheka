"use client";

// BartendersPick — homepage section, between CurrentlyPouring and StoryTeaser.
// One product hand-picked by a founder each week, with a personal note.

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ThekaLabel } from "@/components/ui/ThekaLabel";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/Button";
import { WineGlassMark } from "@/components/glass/WineGlassMark";
import { TypeOnScroll } from "@/components/motion/TypeOnScroll";
import { ChalkMark } from "@/components/ui/ChalkMark";
import { HandText } from "@/components/ui/HandText";
import { POUR_001, BARTENDERS_PICK } from "@/data/pour-001";
import { copy } from "@/data/copy";

const FOUNDER_ROLES: Record<"Ayaan" | "Parrv", string> = {
  Ayaan: "CoFounder",
  Parrv: "CoFounder",
};

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  return `${Math.floor(days / 7)} weeks ago`;
}

export function BartendersPick() {
  const router  = useRouter();
  const product = POUR_001.products.find((p) => p.slug === BARTENDERS_PICK.productSlug);
  if (!product) return null;

  const { pickedBy, quote, date } = BARTENDERS_PICK;

  return (
    <section data-nav-tone="dark" className="bg-[--cream] py-20 md:py-28">
      <div style={{ paddingInline: "var(--pad-x)" }}>
        <div className="mb-12 md:mb-16">
          <span className="relative inline-block p-1">
            <ThekaLabel k="bartendersPick" color="ink" />
            <ChalkMark variant="circle" color="var(--blue)" className="absolute inset-0 w-full h-full" />
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* ── LEFT — founder note ─────────────────────────────────── */}
          <div className="flex flex-col items-start gap-5 max-w-[420px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-[200px] h-[200px] shrink-0"
            >
              <Image
                src={`/founders/${pickedBy.toLowerCase()}.jpg`}
                alt={pickedBy}
                fill
                sizes="200px"
                className="rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full bg-(--ink) border-2 border-(--cream) flex items-center justify-center">
                <WineGlassMark size={20} color="var(--cream)" />
              </div>
            </motion.div>

            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink]/50">
              {pickedBy} · {FOUNDER_ROLES[pickedBy]}
            </p>

            <TypeOnScroll
              text={quote}
              speed={60}
              as="blockquote"
              className="bp-quote font-display italic text-[--ink] leading-snug"
              style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)", maxWidth: 380 }}
            />
            <HandText size="sm" rotate={-4} color="var(--ink)" className="opacity-40 max-sm:hidden mt-1">
              this one's good, trust
            </HandText>

            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/30">
              picked {relativeDate(date)} · vol. 04
            </p>

            <Button
              variant="ghost"
              size="sm"
              magnetic
              onClick={() => router.push(`/product/${product.slug}`)}
            >
              {copy.cta.seeWhy}
            </Button>
          </div>

          {/* ── RIGHT — the pick ─────────────────────────────────────── */}
          <div className="md:scale-[1.15] md:origin-center">
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{ filter: "drop-shadow(0 24px 64px rgba(0,74,173,0.35))" }}
            >
              <ProductCard product={product} aspectRatio="aspect-[4/5]" />
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .bp-quote {
          position: relative;
        }
        .bp-quote::before {
          content: "\\201C";
          position: absolute;
          top: -0.5em;
          left: -0.6em;
          font-size: 2.4em;
          line-height: 1;
          color: var(--blue);
          opacity: 0.3;
          font-style: normal;
        }
        .bp-quote::after {
          content: "\\201D";
          font-size: 2.4em;
          line-height: 0;
          color: var(--blue);
          opacity: 0.3;
          font-style: normal;
          vertical-align: -0.45em;
          margin-left: 0.15em;
          display: inline-block;
        }
      `}</style>
    </section>
  );
}
