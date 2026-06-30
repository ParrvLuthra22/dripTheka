"use client";

// Login page — /login
// Google OAuth sign-in, brand-aligned.
// Cobalt background, cream type, dtlogo centred.

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/account");
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/account" });
    } catch {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#004AAD" }}>
        <div className="w-6 h-6 border-2 border-[#E4E2DD]/30 border-t-[#E4E2DD] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      data-nav-tone="light"
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#004AAD" }}
    >
      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[420px] flex flex-col items-center gap-8 py-12 px-8"
        style={{ paddingInline: "var(--pad-x, 1.5rem)" }}
      >
        {/* Logo */}
        <Link href="/" className="block">
          <Image
            src="/dtlogo-cropped.png"
            alt="Drip Theka"
            width={1412}
            height={564}
            priority
            style={{ height: 40, width: "auto" }}
            className="select-none"
          />
        </Link>

        {/* Headline */}
        <div className="text-center space-y-2">
          <h1
            className="font-display italic text-[#E4E2DD] leading-tight"
            style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
          >
            Who are you?
          </h1>
          <p className="font-sans text-[#E4E2DD]/55 text-sm">
            Sign in to track your pours, manage orders,
            <br className="hidden sm:block" />
            and access your referral code.
          </p>
        </div>

        {/* Google sign-in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          data-hover-big
          className="w-full flex items-center justify-center gap-3 py-4 border border-[#E4E2DD]/30 text-[#E4E2DD] hover:bg-[#E4E2DD] hover:text-[#004AAD] transition-all duration-300 disabled:opacity-50 group"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            /* Google icon */
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M17.64 9.2a10.1 10.1 0 0 0-.16-1.76H9v3.33h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.55Z" fill="#4285F4"/>
              <path d="M9 18a8.6 8.6 0 0 0 5.96-2.18L12.04 13.6A5.43 5.43 0 0 1 9 14.52 5.44 5.44 0 0 1 3.88 10.9H.9v2.34A9 9 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.88 10.9a5.4 5.4 0 0 1 0-3.8V4.76H.9a9 9 0 0 0 0 8.48Z" fill="#FBBC05"/>
              <path d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .9 4.76L3.88 7.1A5.44 5.44 0 0 1 9 3.58Z" fill="#EA4335"/>
            </svg>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
            {loading ? "Opening the door…" : "Continue with Google"}
          </span>
        </button>

        {/* Guest checkout note */}
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#E4E2DD]/50 text-center">
          Or&nbsp;
          <Link href="/checkout" data-hover className="text-[#E4E2DD] underline underline-offset-2 hover:text-[#E4E2DD] transition-colors">
            continue as guest
          </Link>
          &nbsp;— you can always sign in later
        </p>

        {/* Brand note */}
        <p className="font-display italic text-[#E4E2DD]/25 text-center"
          style={{ fontSize: "clamp(0.75rem, 1.2vw, 0.9rem)" }}>
          Signing in makes you a Regular.
        </p>
      </div>
    </div>
  );
}
