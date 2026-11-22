// /tab — "Your tab": every order, how full each glass is, and what's left to pay. Ported from the approved
// reference (docs/reference/tab/tab.html). Personal, so it is noindex; the data loads client-side (signed-in
// orders, plus any guest orders saved on this device in localStorage["dt_tabs"]).
import type { Metadata } from "next";
import { TabPage } from "@/components/theka/tab/TabPage";
import { lang } from "@/lib/theka/lang";

export const metadata: Metadata = {
  title:       { absolute: lang.tab.meta.title },   // already "Your tab — Drip Theka": skip the root template
  description: lang.tab.meta.description,
  robots:      { index: false, follow: false },
};

export default function YourTabPage() {
  return <TabPage />;
}
