"use client";

// RefillNotifyForm — shown when a product is Tapped Out.
// Collects email and adds to Klaviyo restock flow.

import { useState, type FormEvent } from "react";

interface RefillNotifyFormProps {
  productId: string;
  productName: string;
}

export function RefillNotifyForm({ productId, productName }: RefillNotifyFormProps) {
  const [email,  setEmail]  = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setStatus("loading");

    try {
      // V1: uses the same regulars endpoint with a product tag
      const res = await fetch("/api/regulars", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, source: `refill:${productId}` }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="border border-[--ink]/15 p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--blue] mb-1">
          You&apos;re on the list.
        </p>
        <p className="font-sans text-sm text-[--ink]/50">
          We&apos;ll ping you if {productName} gets a refill. Don&apos;t hold your breath — but hey, stranger things have happened.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/40">
        Tell me on Refill
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 bg-transparent border-b border-[--ink]/20 focus:border-[--ink] font-sans text-sm text-[--ink] placeholder-[--ink]/25 py-2 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="font-mono text-[9px] uppercase tracking-[0.14em] border border-[--ink]/20 px-3 py-2 hover:border-[--ink] transition-colors disabled:opacity-40"
        >
          {status === "loading" ? "…" : "Notify"}
        </button>
      </div>
      {status === "error" && (
        <p className="font-mono text-[9px] text-red-500">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
