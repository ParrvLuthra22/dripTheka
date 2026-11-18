import type { Metadata } from "next";
import { TheBar } from "@/components/theka/TheBar";
import { POUR_001 } from "@/data/pour-001";
import { lang } from "@/lib/theka/lang";

export const metadata: Metadata = {
  title:       { absolute: lang.bar.meta.title },
  description: lang.bar.meta.description,
  openGraph:   { title: lang.bar.meta.title, description: lang.bar.meta.description, type: "website" },
};

// Home — The Bar. Gate → shelf → pour are client-side states inside <TheBar>.
// Fits come from the product data layer (Pour #001 order), not the prototype.
export default function HomePage() {
  return <TheBar products={POUR_001.products} plate="/bar/bar.jpg" />;
}
