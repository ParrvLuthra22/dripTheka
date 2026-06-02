import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-site flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <p className="font-mono text-[9rem] leading-none text-[--blue] opacity-10 select-none">404</p>
      <h1 className="type-display-md text-[--ink] -mt-8">Wrong Theka.</h1>
      <p className="type-body-md text-[--ink]/50">This isn&apos;t the bar you&apos;re looking for.</p>
      <Link href="/" className="font-mono text-xs uppercase tracking-widest border border-[--blue] text-[--blue] px-6 py-3 hover:bg-[--blue] hover:text-[--cream] transition-all">
        Back to the Theka
      </Link>
    </div>
  );
}
