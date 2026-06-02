import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#141518] flex items-center justify-center px-6 pt-20">
      <div className="text-center max-w-[440px]">
        <p className="font-mono text-[80px] md:text-[120px] font-bold text-[#004AAD] leading-none opacity-20 select-none">
          404
        </p>
        <h1 className="font-display italic text-3xl md:text-4xl text-[#E4E2DD] mt-4 mb-3">
          Wrong Theka.
        </h1>
        <p className="font-sans text-[#E4E2DD]/50 mb-8">
          This isn&apos;t the bar you&apos;re looking for.
          <br />
          Try the door on the left.
        </p>
        <Link
          href="/"
          className="inline-block font-mono text-xs uppercase tracking-widest border border-[#004AAD] text-[#004AAD] px-6 py-3 hover:bg-[#004AAD] hover:text-[#E4E2DD] transition-all duration-200"
        >
          Back to the Theka
        </Link>
      </div>
    </div>
  );
}
