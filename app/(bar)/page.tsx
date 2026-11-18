// Home — The Wall. Products with wall cutouts hang on acrylic ledges; click one
// and the camera zooms in. /?fit={slug} deep-links straight to a product view.
import type { Metadata } from "next";
import { TheWall } from "@/components/theka/wall/TheWall";
import { POUR_001, hasWall } from "@/data/pour-001";
import { lang } from "@/lib/theka/lang";

export const metadata: Metadata = {
  title:       { absolute: lang.wall.meta.title },
  description: lang.wall.meta.description,
  openGraph:   { title: lang.wall.meta.title, description: lang.wall.meta.description, type: "website" },
};

export default function HomePage() {
  return <TheWall products={POUR_001.products.filter(hasWall)} />;
}
