import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  JetBrains_Mono,
  Kalam,
  Rozha_One,
  Mukta,
} from "next/font/google";
import "../styles/globals.css";
import "../styles/forms.css";

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
  preload:  false, // not needed for first paint (Wall + product page don't use it)
});

// JetBrains Mono — labels, prices, tags, nav, all UI chrome.
const jetbrains = JetBrains_Mono({
  subsets:  ["latin"],
  variable: "--font-jetbrains", // variable file: one request covers 400/500/700 (cart + chrome use medium/bold)
  display:  "swap",
  preload:  true,
});

// Rozha One — loud Devanagari-born display face. Wordmarks, menu, 404.
const rozha = Rozha_One({
  subsets:  ["latin", "devanagari"],
  weight:   "400",
  variable: "--font-rozha",
  display:  "swap",
  preload:  false,
});

// Kalam — the chalk / hand-written face: the Wall's rate-list board and the Story's chalkboard,
// bill note. Not used anywhere else, so it is never preloaded (it only downloads where it paints).
const kalam = Kalam({
  subsets:  ["latin", "devanagari"],
  weight:   ["400", "700"],
  variable: "--font-kalam",
  display:  "swap",
  preload:  false,
});

// Mukta — body copy. Latin + Devanagari so Hinglish/Hindi glosses never fall back.
// Weights in use: 400 (body), 500 (UI/subtitles), 700 (bold), 800 (wordmarks, titles).
// 300 and 600 are unused on Mukta (grep-verified), so they are not shipped.
// preload:false → the browser fetches a weight/subset only when text needs it
// (Devanagari loads on demand via unicode-range).
const mukta = Mukta({
  subsets:  ["latin", "devanagari"],
  weight:   ["400", "500", "700", "800"],
  variable: "--font-mukta",
  display:  "swap",
  preload:  false,
});

// First paint only needs Mukta 800 + 500, latin. next/font preloads every weight
// of a call, so these two files are preloaded through a twin instance (same
// Google files → same hashed URLs as the family above, so nothing downloads
// twice). The twin's variable class is intentionally not applied to <html>.
const muktaFirstPaint = Mukta({
  subsets:  ["latin"],
  weight:   ["500", "800"],
  variable: "--font-mukta-first-paint",
  display:  "swap",
  preload:  true,
});
void muktaFirstPaint;

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
    // suppressHydrationWarning: the home route's pre-paint script adds `dt-skip-entry` to <html>.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${jetbrains.variable} ${rozha.variable} ${kalam.variable} ${mukta.variable}`}
    >
      <body>
        {children}
      </body>
    </html>
  );
}
