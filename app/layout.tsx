import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  JetBrains_Mono,
  Geist,
} from "next/font/google";
import "../styles/globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

/* ─── Fonts ──────────────────────────────────────────────────────────────── */

// Fraunces — editorial serif with optical size, soft, and wonk axes.
// Used for: section headlines, product names, pull quotes, body editorial.
// Italic is the brand expression — Fraunces italic feels designed, not accidental.
const fraunces = Fraunces({
  subsets:  ["latin"],
  variable: "--font-fraunces",
  weight:   "variable",
  style:    ["normal", "italic"],
  axes:     ["SOFT", "WONK", "opsz"],
  display:  "swap",
  preload:  true,
});

// Tanker is self-hosted — see /public/fonts/tanker/README.md
// CSS @font-face in globals.css loads it; fallback is Impact + Arial Black.
// No next/font for Tanker since it's not on Google Fonts.

const jetbrains = JetBrains_Mono({
  subsets:  ["latin"],
  variable: "--font-jetbrains",
  display:  "swap",
  preload:  false,
});

const geist = Geist({
  subsets:  ["latin"],
  variable: "--font-geist",
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
      className={`${fraunces.variable} ${jetbrains.variable} ${geist.variable}`}
    >
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
