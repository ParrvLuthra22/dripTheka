// Home — The Entry (first visit) in front of The Wall. Products with wall cutouts hang on acrylic ledges; click one
// and the camera zooms in. /?fit={slug} deep-links straight to a product view.
import type { Metadata } from "next";
import { preload } from "react-dom";
import { Home } from "@/components/theka/entry/Home";
import { POUR_001, hasWall } from "@/data/pour-001";
import { lang } from "@/lib/theka/lang";

export const metadata: Metadata = {
  title:       { absolute: lang.wall.meta.title },
  description: lang.wall.meta.description,
  openGraph:   { title: lang.wall.meta.title, description: lang.wall.meta.description, type: "website" },
};

export default function HomePage() {
  // The only Entry asset worth a preload: the wordmark is the first thing a new visitor sees.
  preload("/brand/logo_word.png", { as: "image" });
  return <Home products={POUR_001.products.filter(hasWall)} />;
}
