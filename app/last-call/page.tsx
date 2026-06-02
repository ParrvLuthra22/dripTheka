"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function LastCallPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/klaviyo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-[#141518] flex items-center justify-center px-6 py-32">
      <div className="max-w-[500px] w-full">
        {/* Wine glass mark */}
        <div className="mb-8 flex justify-center">
          <svg
            width="48"
            height="72"
            viewBox="0 0 48 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 4 Q8 40 24 56 Q40 40 40 4 Z"
              stroke="#004AAD"
              strokeWidth="2"
              fill="rgba(0,74,173,0.1)"
              strokeLinejoin="round"
            />
            <line x1="24" y1="56" x2="24" y2="66" stroke="#004AAD" strokeWidth="2" />
            <line x1="12" y1="68" x2="36" y2="68" stroke="#004AAD" strokeWidth="2" />
            <ellipse cx="24" cy="4" rx="16" ry="3" stroke="#004AAD" strokeWidth="1.5" fill="none" />
          </svg>
        </div>

        <p className="font-mono text-xs uppercase tracking-widest text-[#004AAD] text-center mb-3">
          The Last Call Newsletter
        </p>

        <h1 className="font-display italic text-4xl md:text-5xl text-[#E4E2DD] text-center leading-tight mb-4">
          {status === "done" ? "You&apos;re in." : "Don&apos;t miss the next pour."}
        </h1>

        {status === "done" ? (
          <div className="text-center">
            <p className="font-sans text-[#E4E2DD]/60 mb-8">
              You&apos;re on the Regulars list. First to know when Pour #002 drops.
            </p>
            <p className="font-mono text-xs uppercase tracking-widest text-[#004AAD]">
              See you at the bar.
            </p>
          </div>
        ) : (
          <>
            <p className="font-sans text-[#E4E2DD]/50 text-center mb-10 leading-relaxed">
              Regulars get 24-hour early access to every pour. No spam. No
              newsletters about newsletters. Just the good stuff.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="font-mono text-[10px] uppercase tracking-widest text-[#E4E2DD]/40 mb-2 block"
                >
                  Your email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@wherever.com"
                  className="w-full bg-transparent border border-[#E4E2DD]/20 text-[#E4E2DD] placeholder-[#E4E2DD]/20 font-sans text-sm px-4 py-3 focus:outline-none focus:border-[#004AAD] transition-colors"
                />
              </div>

              {status === "error" && (
                <p className="font-mono text-xs text-red-400">
                  Something went wrong. Try again.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full font-mono text-xs uppercase tracking-widest bg-[#004AAD] text-[#E4E2DD] py-4 hover:bg-[#E4E2DD] hover:text-[#141518] transition-all duration-200 disabled:opacity-50"
              >
                {status === "loading" ? "Pouring..." : "Get on the List"}
              </button>
            </form>

            <p className="font-mono text-[10px] text-center text-[#E4E2DD]/20 mt-6 uppercase tracking-widest">
              No spam. Unsubscribe any time. We&apos;re not desperate.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
