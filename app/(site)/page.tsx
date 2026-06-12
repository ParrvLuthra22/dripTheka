import type { Metadata } from "next";
import { Hero }                from "@/components/sections/Hero";
import { HomeMarquee }         from "@/components/sections/HomeMarquee";
import { CurrentlyPouring }    from "@/components/sections/CurrentlyPouring";
import { BartendersPick }      from "@/components/sections/BartendersPick";
import { StoryTeaser }         from "@/components/sections/StoryTeaser";
import { BuildingTeaser }      from "@/components/sections/BuildingTeaser";
import { JoinRegulars }        from "@/components/sections/JoinRegulars";
import { PreFooterWordmark }   from "@/components/sections/PreFooterWordmark";

export const metadata: Metadata = {
  title: "Drip Theka — Pour #001: The First Round",
  description:
    "Streetwear for Gen Z India. Six pieces. One colourway. 200 of each. When it's done, it's Tapped Out.",
  openGraph: {
    title:       "Drip Theka — Pour #001",
    description: "Six pieces. One colourway. 200 of each.",
    type:        "website",
  },
};

// Homepage — all sections are client components with their own Reveal animations.
// The page itself remains a server component for fast TTFB and correct metadata.
export default function HomePage() {
  return (
    <>
      {/* 1. Hero — full viewport, cobalt, HeroPour 3D */}
      <Hero />

      {/* 2. Marquee strip */}
      <HomeMarquee />

      {/* 3. Currently Pouring — asymmetric product grid */}
      <CurrentlyPouring />

      {/* 3.5. Bartender's Pick — one product, hand-picked, weekly */}
      <BartendersPick />

      {/* 4. Story Teaser — manifesto copy */}
      <StoryTeaser />

      {/* 5. Building Theka — pinned horizontal journal */}
      <BuildingTeaser />

      {/* 6. Join the Regulars — email form */}
      <JoinRegulars />

      {/* 7. Pre-footer wordmark */}
      <PreFooterWordmark />
    </>
  );
}
