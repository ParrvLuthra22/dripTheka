"use client";

// Join the Regulars — Last Call email sign-up.
// Blue background, cream type. Zod validation + POST /api/regulars.

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Reveal } from "@/components/motion/Reveal";
import { useSoundStore } from "@/lib/store/sound";

const schema = z.object({
  email: z
    .string()
    .min(1, "Drop your email.")
    .email("That doesn't look like an email."),
});

type Status = "idle" | "loading" | "success" | "error";

export function JoinRegulars() {
  const [email,  setEmail]  = useState("");
  const [error,  setError]  = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const { muted } = useSoundStore();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const result = schema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid email.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/regulars", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
        // Play pour/clink sound if enabled
        if (!muted) {
          import("howler").then(({ Howl }) => {
            const h = new Howl({ src: ["/sounds/clink.mp3"], volume: 0.5 });
            h.play();
          }).catch(() => {});
        }
        // Reset to idle after 4s
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        setStatus("error");
        setError("Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setError("Network error. Try again.");
    }
  }

  return (
    <section
      data-nav-tone="light"
      className="py-20 md:py-32 overflow-hidden"
      style={{ backgroundColor: "#004AAD" }}
      aria-labelledby="regulars-heading"
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center"
        style={{ paddingInline: "var(--pad-x)" }}
      >

        {/* LEFT — headline */}
        <Reveal>
          <div className="space-y-5">
            <h2
              id="regulars-heading"
              className="font-display italic text-[#E4E2DD] leading-[0.9]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
            >
              Pull up<br />a stool.
            </h2>
            <p className="font-sans text-[#E4E2DD]/60 leading-relaxed max-w-[360px]" style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)" }}>
              We send one Last Call email per drop. No spam, no fluff.
              Just the good stuff — 24 hours before anyone else.
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E4E2DD]/30">
              Regulars only &nbsp;·&nbsp; {">"}500 on the list
            </p>
          </div>
        </Reveal>

        {/* RIGHT — form */}
        <Reveal delay={120}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Input */}
            <div>
              <label htmlFor="regulars-email" className="sr-only">
                Your email address
              </label>
              <input
                id="regulars-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading" || status === "success"}
                placeholder="your email · we'll send the Last Call"
                autoComplete="email"
                className={[
                  "w-full bg-transparent",
                  "border-b border-[#E4E2DD]/30 focus:border-[#E4E2DD]",
                  "font-sans text-sm text-[#E4E2DD] placeholder-[#E4E2DD]/30",
                  "py-3 outline-none transition-colors duration-200",
                  "disabled:opacity-40",
                ].join(" ")}
              />
              {error && (
                <p className="mt-2 font-mono text-[9px] text-[#E4E2DD]/50 uppercase tracking-widest">
                  {error}
                </p>
              )}
            </div>

            {/* Submit button — morphs on success */}
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              data-hover-big
              className={[
                "relative w-full py-4 font-mono text-[10px] uppercase tracking-[0.14em]",
                "transition-all duration-500 overflow-hidden",
                status === "success"
                  ? "bg-[#E4E2DD] text-[#004AAD] cursor-default"
                  : "bg-[#E4E2DD]/10 border border-[#E4E2DD]/40 text-[#E4E2DD] hover:bg-[#E4E2DD] hover:text-[#004AAD]",
                "disabled:cursor-default",
              ].join(" ")}
            >
              {status === "loading" && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="block w-4 h-4 border border-current border-t-transparent rounded-full"
                    style={{ animation: "spin 0.7s linear infinite" }}
                  />
                </span>
              )}
              <span className={status === "loading" ? "opacity-0" : "opacity-100"}>
                {status === "success" ? "Welcome, Regular. 🍺" : "Reserve your stool →"}
              </span>
            </button>

            <p className="font-mono text-[9px] text-[#E4E2DD]/20 uppercase tracking-[0.12em]">
              No spam. Unsubscribe any time. We&apos;re not desperate.
            </p>
          </form>
        </Reveal>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
