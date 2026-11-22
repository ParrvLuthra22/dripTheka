"use client";

// The inline refill form in the panel (a tapped-out design): email (required), phone (optional, Indian mobile),
// a WhatsApp tickbox. POST /api/pour/refill. A duplicate signup is a success; a rate limit is a friendly toast.

import { useId, useState, type FormEvent } from "react";
import { lang } from "@/lib/theka/lang";
import { normalisePhone, refillOutcome, validEmail, validPhone } from "@/lib/theka/forms";
import { useSessionUser } from "@/lib/theka/useSessionUser";
import s from "./wall.module.css";

const R = lang.glass.refill;

interface RefillFormProps {
  /** Design slug (the glass key) and its display name. */
  design: string;
  name: string;
  onDone: () => void;
  onCancel: () => void;
  onToast: (text: string) => void;
}

export function RefillForm({ design, name, onDone, onCancel, onToast }: RefillFormProps) {
  const uid = useId();
  const me = useSessionUser();
  const [typed, setTyped] = useState<string | null>(null);
  const email = typed ?? me?.email ?? "";
  const [phone, setPhone] = useState("");
  const [wa, setWa] = useState(false);
  const [errs, setErrs] = useState<{ email?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const next: typeof errs = {};
    if (!validEmail(email)) next.email = R.badEmail;
    if (phone.trim() && !validPhone(phone)) next.phone = R.badPhone;
    else if (wa && !phone.trim()) next.phone = R.waNeedsPhone;
    setErrs(next);
    if (next.email || next.phone) return;

    setBusy(true);
    try {
      const res = await fetch("/api/pour/refill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          design, email: email.trim(),
          ...(phone.trim() ? { phone: normalisePhone(phone) } : {}),
          waOptIn: wa && !!phone.trim(),
        }),
      });
      const out = refillOutcome(res.status, await res.json().catch(() => null));
      if (out.kind === "joined") { onToast(R.joined(name)); onDone(); }
      else if (out.kind === "rate_limited") onToast(R.rateLimited);
      else if (out.kind === "invalid") setErrs(/mobile|whatsapp/i.test(out.message) ? { phone: R.badPhone } : { email: R.badEmail });
      else onToast(R.closedRefill);
    } catch {
      onToast(R.closedRefill);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={s.refill} onSubmit={submit} noValidate aria-label={R.title}>
      <label className={s.rf} data-bad={!!errs.email}>
        <span>{R.email}</span>
        <input type="email" inputMode="email" autoComplete="email" required value={email} placeholder={R.emailPh}
          aria-invalid={!!errs.email} aria-describedby={errs.email ? `${uid}-e` : undefined}
          onChange={(e) => { setTyped(e.target.value); setErrs((x) => ({ ...x, email: undefined })); }} />
        {errs.email && <em id={`${uid}-e`}>{errs.email}</em>}
      </label>
      <label className={s.rf} data-bad={!!errs.phone}>
        <span>{R.phone}</span>
        <input type="tel" inputMode="tel" autoComplete="tel" value={phone} placeholder={R.phonePh}
          aria-invalid={!!errs.phone} aria-describedby={errs.phone ? `${uid}-p` : undefined}
          onChange={(e) => { setPhone(e.target.value); setErrs((x) => ({ ...x, phone: undefined })); }} />
        {errs.phone && <em id={`${uid}-p`}>{errs.phone}</em>}
      </label>
      <label className={s.rfChk}>
        <input type="checkbox" checked={wa} onChange={(e) => setWa(e.target.checked)} />
        <span>{R.wa}</span>
      </label>
      <div className={s.rfRow}>
        <button type="submit" className={s.rfGo} disabled={busy}>{busy ? R.sending : R.submit}</button>
        <button type="button" className={s.rfNo} onClick={onCancel}>{R.cancel}</button>
      </div>
    </form>
  );
}
