"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WineGlassMark } from "@/components/glass/WineGlassMark";
import { PintGlassNav } from "@/components/glass/PintGlass";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS: Array<{ label: string; href: string; mono?: boolean }> = [
  { label: "Pour #001", href: "/pour/pour-001", mono: true },
  { label: "Story",     href: "/story" },
  { label: "Building",  href: "/building" },
  { label: "Last Call", href: "/regulars", mono: true },
];

export function Nav() {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const onScroll = () => setPinned(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{ height: "var(--header-h)" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex items-center",
        "transition-[background,border-color] duration-300",
        pinned
          ? "bg-[--cream]/95 backdrop-blur-md border-b border-[--ink]/8"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="container-site flex w-full items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="Drip Theka — home"
        >
          <WineGlassMark
            size={22}
            color="var(--blue)"
            className="group-hover:opacity-70 transition-opacity duration-200"
          />
          <span className="font-display italic text-xl tracking-tight text-[--ink] group-hover:text-[--blue] transition-colors duration-200 leading-none">
            Drip Theka
          </span>
        </Link>

        {/* Centre nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href, mono }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-[--ink] hover:text-[--blue] transition-colors duration-200",
                mono
                  ? "font-mono text-[10px] uppercase tracking-[0.12em]"
                  : "font-sans text-sm"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-5 md:gap-6">
          <SoundToggle className="hidden sm:flex" />
          {/* Mobile: nav pint icon. Desktop: floating pint glass handles it */}
          <div className="md:hidden">
            <PintGlassNav />
          </div>
        </div>
      </div>
    </header>
  );
}
