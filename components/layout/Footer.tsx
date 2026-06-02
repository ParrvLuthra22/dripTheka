import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#141518] text-[#E4E2DD] py-16">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="font-display italic text-2xl text-[#E4E2DD] mb-3">
              Drip Theka
            </p>
            <p className="font-sans text-sm text-[#E4E2DD]/50 leading-relaxed max-w-[200px]">
              Streetwear for the ones who get it. No explanation needed.
            </p>
          </div>

          {/* Drops */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#E4E2DD]/30 mb-4">
              The Pours
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/pour/pour-001"
                  className="font-sans text-sm text-[#E4E2DD]/70 hover:text-[#E4E2DD] transition-colors"
                >
                  Pour #001 — The First Round
                </Link>
              </li>
              <li>
                <span className="font-sans text-sm text-[#E4E2DD]/20">
                  Pour #002 — Coming Soon
                </span>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#E4E2DD]/30 mb-4">
              The Stuff
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/last-call"
                  className="font-sans text-sm text-[#E4E2DD]/70 hover:text-[#E4E2DD] transition-colors"
                >
                  Last Call (newsletter)
                </Link>
              </li>
              <li>
                <span className="font-sans text-sm text-[#E4E2DD]/70">
                  Returns & Exchanges
                </span>
              </li>
              <li>
                <span className="font-sans text-sm text-[#E4E2DD]/70">
                  Shipping & FAQs
                </span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#E4E2DD]/30 mb-4">
              Find Us
            </p>
            <ul className="space-y-2">
              <li>
                <span className="font-sans text-sm text-[#E4E2DD]/70">
                  @driptheka
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-t border-[#E4E2DD]/10 pt-8 gap-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#E4E2DD]/20">
            © 2024 Drip Theka. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#E4E2DD]/20">Razorpay Secured</span>
            <span className="font-mono text-[10px] text-[#E4E2DD]/20">·</span>
            <span className="font-mono text-[10px] text-[#E4E2DD]/20">30% deposit model</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
