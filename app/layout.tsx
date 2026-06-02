import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav/Nav";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { Toaster } from "react-hot-toast";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Drip Theka — Pour #001: The First Round",
  description:
    "Streetwear for Gen Z India. Six pieces. One colourway. 200 of each. When it's done, it's Tapped Out.",
  openGraph: {
    title: "Drip Theka — Pour #001",
    description: "Six pieces. One colourway. 200 of each.",
    siteName: "Drip Theka",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrainsMono.variable} ${geistSans.variable} antialiased`}
      style={
        {
          "--font-display": "var(--font-fraunces), Georgia, serif",
          "--font-mono": "var(--font-jetbrains-mono), 'Courier New', monospace",
          "--font-sans": "var(--font-geist-sans), system-ui, sans-serif",
        } as React.CSSProperties
      }
    >
      <body className="bg-[#E4E2DD] text-[#141518] min-h-screen flex flex-col">
        <LenisProvider>
          <Nav />
          <CartDrawer />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#141518",
                color: "#E4E2DD",
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "12px",
                letterSpacing: "0.05em",
              },
            }}
          />
        </LenisProvider>
      </body>
    </html>
  );
}
