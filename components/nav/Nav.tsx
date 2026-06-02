"use client";

import Link from "next/link";
import { CartGlass } from "./CartGlass";
import { SoundToggle } from "./SoundToggle";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#E4E2DD]/95 backdrop-blur-sm border-b border-[#141518]/10 py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-display italic text-xl md:text-2xl text-[#141518] hover:text-[#004AAD] transition-colors duration-200 tracking-tight"
        >
          Drip Theka
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/pour/pour-001"
            className="font-mono text-xs uppercase tracking-widest text-[#141518] hover:text-[#004AAD] transition-colors duration-200"
          >
            Pour #001
          </Link>
          <Link
            href="/last-call"
            className="font-mono text-xs uppercase tracking-widest text-[#141518] hover:text-[#004AAD] transition-colors duration-200"
          >
            Last Call
          </Link>
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-4 md:gap-6">
          <SoundToggle />
          <CartGlass />
        </div>
      </div>
    </header>
  );
}
