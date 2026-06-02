import Link from "next/link";
import { WineGlassMark } from "@/components/glass/WineGlassMark";

const LINKS = {
  pours: [
    { label: "Pour #001 — The First Round", href: "/pour/pour-001" },
    { label: "Pour #002 — Coming soon", href: "#", muted: true },
  ],
  info: [
    { label: "Last Call (newsletter)", href: "/regulars" },
    { label: "Story",                  href: "/story" },
    { label: "Building",               href: "/building" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms",          href: "/legal/terms" },
    { label: "Returns",        href: "/legal/returns" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[--ink] text-[--cream]">
      <div className="container-site py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <WineGlassMark size={20} color="var(--cream)" className="group-hover:opacity-60 transition-opacity" />
            <span className="font-display italic text-lg text-[--cream] group-hover:opacity-60 transition-opacity leading-none">
              Drip Theka
            </span>
          </Link>
          <p className="font-sans text-sm text-[--cream]/40 leading-relaxed max-w-[200px]">
            Streetwear for the ones who get it.
          </p>
        </div>

        {/* Pours */}
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[--cream]/30">
            The Pours
          </p>
          {LINKS.pours.map(({ label, href, muted }) => (
            <Link
              key={href}
              href={href}
              className={`font-sans text-sm ${muted ? "text-[--cream]/20 pointer-events-none" : "text-[--cream]/60 hover:text-[--cream] transition-colors"}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[--cream]/30">
            Info
          </p>
          {LINKS.info.map(({ label, href }) => (
            <Link key={href} href={href} className="font-sans text-sm text-[--cream]/60 hover:text-[--cream] transition-colors">
              {label}
            </Link>
          ))}
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[--cream]/30">
            Legal
          </p>
          {LINKS.legal.map(({ label, href }) => (
            <Link key={href} href={href} className="font-sans text-sm text-[--cream]/60 hover:text-[--cream] transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[--cream]/8">
        <div className="container-site py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/20">
            © 2024 Drip Theka. All rights reserved.
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream]/20">
            Razorpay secured · 30% deposit model
          </p>
        </div>
      </div>
    </footer>
  );
}
