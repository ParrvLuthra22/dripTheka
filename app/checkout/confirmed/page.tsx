import Link from "next/link";

export default function OrderConfirmedPage() {
  return (
    <div className="min-h-screen bg-[#004AAD] flex items-center justify-center px-6 pt-20">
      <div className="text-center max-w-[480px]">
        {/* Wine glass mark */}
        <div className="mb-8 flex justify-center">
          <svg
            width="56"
            height="84"
            viewBox="0 0 56 84"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 6 Q8 46 28 64 Q48 46 48 6 Z"
              stroke="#E4E2DD"
              strokeWidth="2"
              fill="rgba(228,226,221,0.15)"
              strokeLinejoin="round"
            />
            <line x1="28" y1="64" x2="28" y2="76" stroke="#E4E2DD" strokeWidth="2" />
            <line x1="14" y1="80" x2="42" y2="80" stroke="#E4E2DD" strokeWidth="2" />
            <ellipse cx="28" cy="6" rx="20" ry="3.5" stroke="#E4E2DD" strokeWidth="1.5" fill="none" />
            {/* Fill — fully poured */}
            <path
              d="M8 6 Q8 46 28 64 Q48 46 48 6 Z"
              fill="rgba(228,226,221,0.3)"
            />
          </svg>
        </div>

        <p className="font-mono text-xs uppercase tracking-widest text-[#E4E2DD]/60 mb-3">
          Order confirmed
        </p>
        <h1 className="font-display italic text-4xl md:text-5xl text-[#E4E2DD] leading-tight mb-4">
          You&apos;re a Regular now.
        </h1>
        <p className="font-sans text-[#E4E2DD]/70 leading-relaxed mb-8">
          Your deposit is in. We&apos;ve poured your glass.
          <br />
          We&apos;ll email you when your order ships — then you pay the remaining 70%.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pour/pour-001"
            className="font-mono text-xs uppercase tracking-widest border border-[#E4E2DD] text-[#E4E2DD] px-6 py-3 hover:bg-[#E4E2DD] hover:text-[#004AAD] transition-all"
          >
            Back to the Pour
          </Link>
          <Link
            href="/last-call"
            className="font-mono text-xs uppercase tracking-widest bg-[#E4E2DD] text-[#004AAD] px-6 py-3 hover:bg-[#141518] hover:text-[#E4E2DD] transition-all"
          >
            Join Last Call
          </Link>
        </div>
      </div>
    </div>
  );
}
