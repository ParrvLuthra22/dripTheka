// Home — The Entry (first visit) in front of The Wall. Designs hang on acrylic ledges (Ayaan's Pour #001, one per design, colourways inside); click one
// and the camera zooms in. /?fit={design or colourway slug} deep-links straight to a product view.
import type { Metadata } from "next";
import { preload } from "react-dom";
import { Home } from "@/components/theka/entry/Home";
import { ENTRY_SKIP_SCRIPT } from "@/components/theka/entry/entryGate";
import { InlineScript } from "@/components/theka/entry/InlineScript";
import { POUR_001, groupDesigns, hasWall } from "@/data/pour-001";
import { lang } from "@/lib/theka/lang";

export const metadata: Metadata = {
  title:       { absolute: lang.wall.meta.title },
  description: lang.wall.meta.description,
  openGraph:   { title: lang.wall.meta.title, description: lang.wall.meta.description, type: "website" },
};

export default function HomePage() {
  // The only Entry asset worth a preload: the wordmark is the first thing a new visitor sees.
  preload("/brand/logo_word.png", { as: "image" });
  // Runs while the HTML streams in, before the Entry frame can paint: returning visitors and
  // /?fit= deep links get `dt-skip-entry` on <html>, which hides the server-rendered Entry.
  return (
    <>
      <InlineScript html={ENTRY_SKIP_SCRIPT} />
      <Home designs={groupDesigns(POUR_001.products.filter(hasWall))} />
    </>
  );
}
