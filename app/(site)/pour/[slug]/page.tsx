import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { POUR_001 } from "@/data/pour-001";
import { PourHeroStrip }   from "@/components/sections/pour/PourHeroStrip";
import { FillBar }         from "@/components/sections/pour/FillBar";
import { PourProductGrid } from "@/components/sections/pour/PourProductGrid";

const VALID_SLUGS = new Set(["pour-001"]);

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [{ slug: "pour-001" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!VALID_SLUGS.has(slug)) return { title: "Not Found" };
  return {
    title:       `Pour #${POUR_001.number}: ${POUR_001.title}`,
    description: POUR_001.description,
    openGraph: {
      title:       `Pour #${POUR_001.number} — Drip Theka`,
      description: POUR_001.subtitle,
    },
  };
}

export default async function PourPage({ params }: Props) {
  const { slug } = await params;
  if (!VALID_SLUGS.has(slug)) notFound();

  return (
    <>
      {/* 1. Hero strip — animated title + countdown */}
      <PourHeroStrip />

      {/* 2. Fill bar — FOMO mechanism, polls live count */}
      <FillBar />

      {/* 3. Product grid — filter, sort, editorial break, footer CTA */}
      <PourProductGrid />
    </>
  );
}
