"use client";

// Regulars — extended sign-up with referral code generation.
// Blue background, cream type.

import { useState, type FormEvent, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Reveal } from "@/components/motion/Reveal";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { TextSticker } from "@/components/ui/TextSticker";
import { ChalkMark } from "@/components/ui/ChalkMark";
import { HandText } from "@/components/ui/HandText";
import { copy } from "@/data/copy";

const schema = z.object({
  email:      z.string().email(copy.forms.errors.badEmail),
  name:       z.string().min(2, copy.forms.errors.missingField),
  city:       z.string().min(2, copy.forms.errors.missingField),
  college:    z.string().optional(),
  instagram:  z.string().optional(),
  heard_from: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Errors   = Partial<Record<keyof FormData, string>>;

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(): string {
  return Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
}

const INPUT = "w-full bg-transparent border-b border-[#E4E2DD]/20 focus:border-[#E4E2DD]/70 font-sans text-sm text-[#E4E2DD] placeholder-[#E4E2DD]/25 py-2.5 outline-none transition-colors duration-200";

function Err({ msg }: { msg?: string }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="font-mono text-[9px] text-[#FFB3B3] uppercase tracking-widest mt-1"
        >
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export default function RegularsPage() {
  const [form, setForm]       = useState<FormData>({ email:"", name:"", city:"", college:"", instagram:"", heard_from:"" });
  const [errors, setErrors]   = useState<Errors>({});
  const [status, setStatus]   = useState<"idle"|"loading"|"done"|"error">("idle");
  const [refCode, setRefCode] = useState("");
  const [copied, setCopied]   = useState(false);

  function handle(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors(er => { const n = { ...er }; delete n[name as keyof FormData]; return n; });
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: Errors = {};
      result.error.issues.forEach(i => { const k = i.path[0] as keyof FormData; if (!errs[k]) errs[k] = i.message; });
      setErrors(errs);
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/regulars", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, source: "regulars-page" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { referralCode?: string };
      // Use server-generated code (from DB); fall back to client-generated if DB not connected
      setRefCode(data.referralCode ?? genCode());
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div data-nav-tone="light" data-surface="blue" className="min-h-screen flex flex-col" style={{ backgroundColor: "#004AAD" }}>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <header className="relative py-20 md:py-28" style={{ paddingInline: "var(--pad-x)" }}>
        {/* Sticker chaos — desktop only */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block" aria-hidden="true">
          <TextSticker variant="slap" tone="blue" rotate={9} className="absolute right-[8vw] top-[30%]">
            certified regular
          </TextSticker>
          <TextSticker variant="stamp" tone="blue" rotate={-10} className="absolute right-[18vw] top-[58%]">
            members<br />only
          </TextSticker>
        </div>
        <Reveal className="mb-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#E4E2DD]/40">
            The Regulars
          </p>
        </Reveal>
        <Reveal delay={60}>
          <h1
            className="font-display italic text-[#E4E2DD] leading-[0.88] mb-6"
            style={{ fontSize: "clamp(3rem, 9vw, 7rem)" }}
          >
            Become a<br />Regular.
          </h1>
        </Reveal>
        <Reveal delay={140}>
          <p
            className="font-display italic text-[#E4E2DD]/55 max-w-[520px] leading-snug"
            style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)" }}
          >
            We open a private channel for the people who show up. First dibs on every pour. Last Call before anyone else.
          </p>
        </Reveal>
      </header>

      {/* ── Form / Success ───────────────────────────────────────── */}
      <div className="flex-1 border-t border-[#E4E2DD]/10 py-16 md:py-20" style={{ paddingInline: "var(--pad-x)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-14 lg:gap-24">

          {/* LEFT — form or success */}
          <AnimatePresence mode="wait">
            {status === "done" ? (
              <motion.div key="success"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-3">
                  <ChalkMark variant="tick" color="#E4E2DD" strokeWidth={2.5} className="w-10 h-8 shrink-0" />
                  <HandText size="lg" rotate={-2} color="#E4E2DD" className="opacity-80">
                    you&apos;re in
                  </HandText>
                </div>
                <h2 className="font-display italic text-[#E4E2DD] leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
                  {copy.forms.success.regulars}
                </h2>
                <p className="font-display italic text-[#E4E2DD]/60 max-w-[460px]" style={{ fontSize: "clamp(1rem, 1.8vw, 1.3rem)" }}>
                  You&apos;re on the list. This is your referral code. Share it.
                </p>

                {/* Referral card */}
                <div className="border border-[#E4E2DD]/20 p-6 space-y-4 max-w-[360px]">
                  <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#E4E2DD]/30">
                    Your code
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-2xl tracking-[0.2em] text-[#E4E2DD]">
                      {refCode}
                    </span>
                    <button
                      onClick={copyCode}
                      data-hover
                      className="font-mono text-[9px] uppercase tracking-widest border border-[#E4E2DD] text-[#E4E2DD] px-3 py-1.5 hover:bg-[#E4E2DD] hover:text-[#004AAD] transition-colors"
                    >
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <p className="font-mono text-[8px] text-[#E4E2DD]/25 uppercase tracking-widest leading-relaxed">
                    Share this code. Every Regular it brings in earns you both a Happy Hour.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form"
                onSubmit={handleSubmit} noValidate
                className="space-y-7"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                  <div>
                    <label className="block font-mono text-[8px] uppercase tracking-[0.16em] text-[#E4E2DD]/35 mb-2" htmlFor="email">Email *</label>
                    <input id="email" name="email" type="email" required value={form.email} onChange={handle} placeholder={copy.forms.placeholders.email} className={INPUT} />
                    <Err msg={errors.email} />
                  </div>
                  <div>
                    <label className="block font-mono text-[8px] uppercase tracking-[0.16em] text-[#E4E2DD]/35 mb-2" htmlFor="name">Name *</label>
                    <input id="name" name="name" type="text" required value={form.name} onChange={handle} placeholder={copy.forms.placeholders.name} className={INPUT} />
                    <Err msg={errors.name} />
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-[0.16em] text-[#E4E2DD]/35 mb-2" htmlFor="city">City *</label>
                  <input id="city" name="city" type="text" required value={form.city} onChange={handle} placeholder={copy.forms.placeholders.city} className={INPUT} />
                  <Err msg={errors.city} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                  <div>
                    <label className="block font-mono text-[8px] uppercase tracking-[0.16em] text-[#E4E2DD]/35 mb-2" htmlFor="college">College / University</label>
                    <input id="college" name="college" type="text" value={form.college} onChange={handle} placeholder={copy.forms.placeholders.college} className={INPUT} />
                  </div>
                  <div>
                    <label className="block font-mono text-[8px] uppercase tracking-[0.16em] text-[#E4E2DD]/35 mb-2" htmlFor="instagram">Instagram handle</label>
                    <input id="instagram" name="instagram" type="text" value={form.instagram} onChange={handle} placeholder={copy.forms.placeholders.instagram} className={INPUT} />
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-[0.16em] text-[#E4E2DD]/35 mb-2" htmlFor="heard_from">How did you hear about us?</label>
                  <textarea id="heard_from" name="heard_from" value={form.heard_from} onChange={handle} placeholder={copy.forms.placeholders.referralSource} rows={2} className={INPUT + " resize-none"} />
                </div>

                {status === "error" && (
                  <p className="font-mono text-[9px] text-[#FFB3B3] uppercase tracking-widest">
                    {copy.forms.errors.genericError}
                  </p>
                )}

                <LiquidButton
                  type="submit"
                  state={status === "idle" || status === "error" ? "idle" : status}
                  label={copy.cta.signUpRegular}
                  doneLabel={copy.forms.success.regulars}
                  fillColor="#E4E2DD"
                  fillTextColor="#004AAD"
                  className="border-[#E4E2DD]/40 text-[#E4E2DD]"
                />
              </motion.form>
            )}
          </AnimatePresence>

          {/* RIGHT — how the code works */}
          <div className="space-y-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#E4E2DD]/30">
              How the code works
            </p>
            {[
              { n: "01", head: "Get your code", body: "Sign up and you'll receive a unique 8-character referral code instantly." },
              { n: "02", head: "Share it", body: "Send it to anyone you think belongs here. They use your code when they sign up." },
              { n: "03", head: "Happy Hour", body: "For every Regular you bring in, you both get a Happy Hour — early access, discounts, and invites to things we don't announce publicly." },
            ].map(({ n, head, body }) => (
              <div key={n} className="flex gap-4">
                <span className="font-mono text-[9px] text-[#E4E2DD]/20 shrink-0 mt-0.5">{n}</span>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E4E2DD]/60 mb-1">{head}</p>
                  <p className="font-sans text-sm text-[#E4E2DD]/40 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
