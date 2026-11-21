// /story — the back wall. Chrome-free like the Wall (the (bar) shell), with its own header.
// Replaces the old editorial page; the URL is unchanged. All copy lives in lib/theka/lang.ts (story.*).
import type { Metadata } from "next";
import { Story } from "@/components/theka/story/Story";
import { lang } from "@/lib/theka/lang";

export const metadata: Metadata = {
  title:       lang.story.meta.title,       // → "Our story — Drip Theka" via the root title template
  description: lang.story.meta.description,
  alternates:  { canonical: "/story" },
  openGraph:   { title: `${lang.story.meta.title} — Drip Theka`, description: lang.story.meta.description, type: "article" },
};

export default function StoryPage() {
  return <Story />;
}
