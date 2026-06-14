"use client";

// WaitlistForm — collapsed text-link that expands into an email-capture form.
// Posts to /api/regulars with source `waitlist:{slug}`, separate from the
// Khata wishlist and from RefillNotifyForm (which is tapped-out-only).

import { useState, type FormEvent } from "react";
import { copy } from "@/data/copy";
import { useToastStore } from "@/lib/store/toast";

interface WaitlistFormProps {
  slug: string;
  productName: string;
}

export function WaitlistForm({ slug, productName }: WaitlistFormProps) {
  const [open,   setOpen]   = useState(false);
  const [email,  setEmail]  = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const pushToast = useToastStore((s) => s.push);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/regulars", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, source: `waitlist:${slug}` }),
      });
      if (res.ok) {
        setStatus("done");
        pushToast(`On the list · ${productName}`, "blue");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--blue] text-center">
        {copy.forms.success.waitlist}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        data-hover
        className="w-full font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/70 border border-dashed border-[--ink]/40 py-2.5 hover:border-solid hover:border-[--blue] hover:text-[--blue] transition-colors text-center"
      >
        {copy.cta.joinWaitlist}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.forms.placeholders.email}
          className="flex-1 min-w-0 border border-[--ink]/20 bg-transparent px-3 py-2.5 font-mono text-[11px] text-[--ink] placeholder:text-[--ink]/30 focus:outline-none focus:border-[--blue] transition-colors"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          data-hover
          className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] px-4 py-2.5 bg-[--ink] text-[--cream] hover:bg-[--blue] transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "…" : copy.cta.submitGeneric}
        </button>
      </div>
      {status === "error" && (
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-red-500 text-center">
          {copy.forms.errors.genericError}
        </p>
      )}
    </form>
  );
}
