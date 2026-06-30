"use client";

// Join the Regulars — Last Call email sign-up.
// Blue background, cream type. Zod validation + POST /api/regulars.

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Reveal } from "@/components/motion/Reveal";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { useSound } from "@/components/sound/SoundProvider";
import { copy } from "@/data/copy";
import { Sticker } from "@/components/ui/Sticker";
import { ChalkMark } from "@/components/ui/ChalkMark";
import { HandText } from "@/components/ui/HandText";

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
  const { muted, play } = useSound();

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
        // Play clink — guarded inside play()
        if (!muted) play("clink");
        // Reset to idle after 4s
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        setStatus("error");
        setError(copy.forms.errors.networkError);
      }
    } catch {
      setStatus("error");
      setError("Network error. Try again.");
    }
  }

  return (
    <section
      data-nav-tone="light"
      className="relative py-20 md:py-32 overflow-hidden"
      style={{ backgroundColor: "#004AAD" }}
      aria-labelledby="regulars-heading"
    >
      <Sticker variant="regulars-only" rotate={-6} size={72}
        className="absolute top-[18%] right-[4vw] max-md:hidden z-10" />
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
              <div className="flex items-center gap-2 mb-3 max-sm:hidden" aria-hidden="true">
                <ChalkMark variant="arrow" direction="down" color="#E4E2DD" strokeWidth={1.5} className="w-5 h-8 opacity-45" />
                <HandText size="sm" rotate={3} color="#E4E2DD" className="opacity-45">yes, you</HandText>
              </div>
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
                placeholder={copy.forms.placeholders.email}
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

            {/* Liquid-fill submit button */}
            <LiquidButton
              type="submit"
              state={status === "idle" || status === "error" ? "idle" : status}
              label={copy.cta.signUpRegular}
              doneLabel={copy.forms.success.regulars}
              fillColor="#E4E2DD"
              fillTextColor="#004AAD"
              className="border-[#E4E2DD]/40 text-[#E4E2DD]"
            />

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
