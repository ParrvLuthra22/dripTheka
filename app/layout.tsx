import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  JetBrains_Mono,
  Rozha_One,
  Mukta,
} from "next/font/google";
import "../styles/globals.css";
import "../styles/forms.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

/* ─── Fonts ──────────────────────────────────────────────────────────────────
   Exactly four families. Each exposes a CSS variable on <html>; the Tailwind
   theme in styles/tokens.css maps them to font-display / font-mono /
   font-loud / font-sans.                                                     */

// Fraunces — editorial serif (opsz/SOFT/WONK axes). Italic is the brand voice.
const fraunces = Fraunces({
  subsets:  ["latin"],
  variable: "--font-fraunces",
  weight:   "variable",
  style:    ["normal", "italic"],
  axes:     ["SOFT", "WONK", "opsz"],
  display:  "swap",
  preload:  true,
});

// JetBrains Mono — labels, prices, tags, nav, all UI chrome.
const jetbrains = JetBrains_Mono({
  subsets:  ["latin"],
  variable: "--font-jetbrains",
  display:  "swap",
  preload:  true,
});

// Rozha One — loud Devanagari-born display face. Wordmarks, menu, 404.
const rozha = Rozha_One({
  subsets:  ["latin", "devanagari"],
  weight:   "400",
  variable: "--font-rozha",
  display:  "swap",
  preload:  true,
});

// Mukta — body copy. Latin + Devanagari so Hinglish/Hindi glosses never fall back.
const mukta = Mukta({
  subsets:  ["latin", "devanagari"],
  weight:   ["300", "400", "500", "600", "700", "800"],
  variable: "--font-mukta",
  display:  "swap",
  preload:  true,
});

/* ─── Metadata ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://driptheka.com"
  ),
  title: {
    template: "%s — Drip Theka",
    default:  "Drip Theka — Pour #001: The First Round",
  },
  description:
    "Streetwear for Gen Z India. Six pieces. One colourway. 200 of each. When it's done, it's Tapped Out.",
  openGraph: {
    type:     "website",
    siteName: "Drip Theka",
    locale:   "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor:   "#E4E2DD",
  width:        "device-width",
  initialScale: 1,
};

/* ─── Root Layout ────────────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrains.variable} ${rozha.variable} ${mukta.variable}`}
    >
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
