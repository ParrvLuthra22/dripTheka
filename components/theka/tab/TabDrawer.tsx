"use client";

// The Tab drawer: the v2 money flow, so a visitor never leaves the Wall to pay.
//   bill → details → balance → deposit (Razorpay Checkout) → receipt
// State lives here; Steps.tsx draws each view; lib/theka/{tabMath,checkout,dtTabs}.ts hold the logic (tested).
// The cart store is the bill (no second cart) and is cleared ONLY after the deposit is confirmed.

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { POUR } from "@/lib/config";
import { useCartStore } from "@/lib/store/cart";
import { useToastStore } from "@/lib/store/toast";
import { lang } from "@/lib/theka/lang";
import { useGlasses } from "@/lib/theka/glasses";
import { usePourClosed } from "@/lib/theka/pour";
import { useSessionUser } from "@/lib/theka/useSessionUser";
import { saveTab } from "@/lib/theka/dtTabs";
import { balanceOptions, fingerprint, linesOfDesign, MAX_QTY } from "@/lib/theka/tabMath";
import {
  buildReserveBody, confirmOutcome, invalidFields, pollUntilPaid, razorpayOptions, reserveOutcome,
  type BalanceMethod, type Details, type FormField, type ReserveData, type StatusBody,
} from "@/lib/theka/checkout";
import { loadRazorpay } from "./razorpay";
import { useBill, type BillItem } from "./useBill";
import { BalanceStep, BillStep, DetailsStep, PayStep, ReceiptStep, type PayPhase, type ReceiptData } from "./Steps";
import s from "./tab.module.css";

const T = lang.tab;
type Step = "bill" | "details" | "balance" | "pay" | "receipt";
const STEP_ORDER: Step[] = ["bill", "details", "balance", "pay", "receipt"];
const EMPTY: Details = { name: "", phone: "", wa: true, email: "", addr: "", pin: "", city: "", state: "" };

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

export default function TabDrawer() {
  const open = useCartStore((st) => st.isOpen);
  const closeCart = useCartStore((st) => st.closeCart);
  const updateQuantity = useCartStore((st) => st.updateQuantity);
  const removeItem = useCartStore((st) => st.removeItem);
  const clearCart = useCartStore((st) => st.clearCart);
  const push = useToastStore((st) => st.push);
  const { lines, totals } = useBill();
  const glasses = useGlasses({ live: false });
  const closedClock = usePourClosed();
  const me = useSessionUser();

  const [step, setStep] = useState<Step>("bill");
  const [details, setDetails] = useState<Details>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [method, setMethod] = useState<BalanceMethod | null>(() => balanceOptions()[0] ?? null);
  const [refCode, setRefCode] = useState("");
  const [refError, setRefError] = useState<string | null>(null);
  const [tappedByServer, setTappedByServer] = useState<string[]>([]);
  const [refillFor, setRefillFor] = useState<string | null>(null);
  const [phase, setPhase] = useState<PayPhase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [closedByServer, setClosedByServer] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Prefill name + email once from the session (never overwrites what was typed).
  const [prefilled, setPrefilled] = useState(false);
  if (me && !prefilled) {
    setPrefilled(true);
    setDetails((d) => ({ ...d, name: d.name || me.name || "", email: d.email || me.email || "" }));
  }

  const closed = closedClock || closedByServer;
  const tapped = new Set<string>(tappedByServer);
  if (glasses) for (const l of lines) if (glasses.get(l.designId)?.state === "tapped") tapped.add(l.designId);

  // ── open / close, focus ──
  const panelRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const payingRef = useRef(false);
  const reservation = useRef<{ fp: string; data: ReserveData } | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  useEffect(() => {
    if (open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const id = requestAnimationFrame(() => titleRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    returnTo.current?.focus?.();
    returnTo.current = null;
  }, [open]);

  // Move the screen-reader cursor to the new title when the step changes.
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    titleRef.current?.focus();
    panelRef.current?.querySelector<HTMLElement>("[data-body]")?.scrollTo({ top: 0 });
  }, [step]);

  const close = useCallback(() => {
    closeCart();
    if (step === "receipt") window.setTimeout(() => { if (alive.current) { setStep("bill"); setReceipt(null); setPhase("idle"); } }, 700);
  }, [closeCart, step]);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      if (phase === "busy" || phase === "open") return;       // Razorpay's own window owns Esc while it's up
      e.stopPropagation(); close(); return;
    }
    if (e.key !== "Tab") return;
    const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((n) => n.offsetParent !== null || n === document.activeElement);
    if (!nodes.length) { e.preventDefault(); return; }
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  // Esc anywhere (focus can be on the page behind a freshly opened drawer)
  useEffect(() => {
    if (!open) return;
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape" && phase !== "busy" && phase !== "open" && !panelRef.current?.contains(document.activeElement)) close(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, close, phase]);

  // ── bill actions ──
  const onQty = (l: BillItem, qty: number) => (qty <= 0 ? removeItem(l.productId, l.size as never) : updateQuantity(l.productId, l.size as never, Math.min(qty, MAX_QTY)));
  const removeDesign = (designId: string) => { for (const l of linesOfDesign(lines, designId)) removeItem(l.productId, l.size as never); setTappedByServer((t) => t.filter((d) => d !== designId)); };

  // ── details ──
  const goDetails = () => { setPhase("idle"); setMessage(null); setStep("details"); };
  const goBalance = () => {
    const bad = invalidFields(details);
    const D = T.details.err;
    setErrors(Object.fromEntries(bad.map((f) => [f, f === "referral" ? "" : D[f as keyof typeof D]])));
    if (bad.length) { push(T.details.missing); return; }
    setStep(balanceOptions().length ? "balance" : "pay");
  };

  // ── pay ──
  useEffect(() => { if (step === "pay") loadRazorpay().catch(() => { /* surfaced on click */ }); }, [step]);

  const finish = useCallback((orderNumber: string, token: string | null, depositPaise: number, balancePaise: number) => {
    if (token) saveTab(typeof localStorage === "undefined" ? null : localStorage, { orderNumber, token });
    setReceipt({ orderNumber, token, firstName: details.name.trim().split(/\s+/)[0] ?? "", lines: lines.map((l) => ({ ...l })), depositPaise, balancePaise, method });
    clearCart();                                                           // only now: the deposit is confirmed
    reservation.current = null;
    setPhase("idle"); setMessage(null); setStep("receipt");
  }, [clearCart, details.name, lines, method]);

  const backToBill = (tappedDesign?: string | null) => {
    reservation.current = null;
    setPhase("idle"); setMessage(null);
    if (tappedDesign) setTappedByServer((t) => (t.includes(tappedDesign) ? t : [...t, tappedDesign]));
    setStep("bill");
  };

  const pay = async () => {
    if (payingRef.current) return;
    payingRef.current = true;
    setMessage(null); setPhase("busy");
    try {
      const wireLines = lines.map((l) => ({ slug: l.slug, size: l.size, qty: l.qty }));
      const fp = fingerprint({ wireLines, details, method, refCode });
      let data = reservation.current && reservation.current.fp === fp && Date.parse(reservation.current.data.holdExpiresAt) > Date.now() ? reservation.current.data : null;
      if (!data) {
        let status = 0; let body: unknown = null;
        try {
          const res = await fetch("/api/reserve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(buildReserveBody({ lines: wireLines, details, balanceMethod: method, referralCode: refCode })) });
          status = res.status; body = await res.json().catch(() => null);
        } catch { setPhase("failed"); setMessage(T.pay.network); return; }
        const out = reserveOutcome(status, body);
        if (out.kind === "tapped") { backToBill(out.designId ?? lines.find((l) => l.slug === out.slug)?.designId ?? null); return; }
        if (out.kind === "closed") { setClosedByServer(true); setPhase("closed"); setMessage(T.pay.closed); return; }
        if (out.kind === "not_pouring") { setPhase("failed"); setMessage(T.pay.notPouring); return; }
        if (out.kind === "unavailable") { setPhase("failed"); setMessage(T.pay.unavailable); return; }
        if (out.kind === "field") {
          setPhase("idle");
          if (out.field === "referral") { setRefError(out.message || T.bill.friend.hint); setStep("bill"); return; }
          const D = T.details.err;
          setErrors({ [out.field]: D[out.field as keyof typeof D] ?? out.message });
          setStep("details"); return;
        }
        if (out.kind !== "ok") { setPhase("failed"); setMessage(out.message || T.pay.generic); return; }
        data = out.data;
        reservation.current = { fp, data };
      }

      let Razorpay;
      try { Razorpay = await loadRazorpay(); } catch { setPhase("failed"); setMessage(T.pay.sdk); return; }
      const reserved = data;
      const settle = async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        setPhase("confirming");
        let status: number | null = null; let body: unknown = null;
        try {
          const ctl = new AbortController(); const t = window.setTimeout(() => ctl.abort(), 15_000);
          const res = await fetch("/api/reserve/confirm", { method: "POST", headers: { "content-type": "application/json" }, signal: ctl.signal,
            body: JSON.stringify({ reservationId: reserved.reservationId, ...r }) });
          window.clearTimeout(t); status = res.status; body = await res.json().catch(() => null);
        } catch { /* timeout / offline: the webhook will settle it — poll below */ }
        const c = confirmOutcome(status, body);
        if (c.kind === "paid") { finish(c.data.orderNumber, c.data.receiptToken ?? null, c.data.depositPaise || reserved.depositPaise, c.data.balancePaise || reserved.balancePaise); return; }
        if (c.kind === "rejected") { setPhase("failed"); setMessage(T.pay.failed); return; }
        const paid = await pollUntilPaid(async () => {
          try {
            const res = await fetch(`/api/reserve/status/${encodeURIComponent(reserved.razorpayOrderId)}?r=${encodeURIComponent(reserved.reservationId)}`, { cache: "no-store" });
            return res.ok ? ((await res.json()) as StatusBody) : null;
          } catch { return null; }
        }, { cancelled: () => !alive.current });
        if (paid) finish(paid.orderNumber ?? reserved.orderNumber, paid.receiptToken ?? null, paid.depositPaise ?? reserved.depositPaise, paid.balancePaise ?? reserved.balancePaise);
      };
      const rz = new Razorpay(razorpayOptions({
        keyId: reserved.keyId, orderId: reserved.razorpayOrderId, amountPaise: reserved.depositPaise, orderNumber: reserved.orderNumber, pct: Math.round(POUR.depositPct * 100),
        prefill: { name: details.name.trim(), email: details.email.trim(), contact: details.phone.replace(/\D/g, "").slice(-10) },
        onPaid: (r) => { void settle(r); },
        onDismiss: () => { setPhase((p) => (p === "open" ? "dismissed" : p)); payingRef.current = false; },
      }));
      setPhase("open");
      rz.open();
      return;                                                              // payingRef stays set until the modal is dismissed / settled
    } catch {
      setPhase("failed"); setMessage(T.pay.generic);
    }
    payingRef.current = false;
  };
  // A settled / failed flow lets the visitor press pay again.
  useEffect(() => { if (phase === "failed" || phase === "idle" || phase === "closed") payingRef.current = false; }, [phase]);

  // ── chrome ──
  const k = STEP_ORDER.indexOf(step);
  const title = step === "receipt" ? T.drawer.titles.receipt : step === "bill" ? T.drawer.titles.bill : T.drawer.titles.settle;
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

  return (
    <div className={s.wrap} data-open={open ? "true" : "false"} aria-hidden={open ? undefined : true}>
      <div className={s.dim} onClick={close} />
      <aside ref={panelRef} className={s.panel} role="dialog" aria-modal="true" aria-labelledby="dt-tab-title" onKeyDown={onKeyDown}>
        <div className={s.head}>
          <div>
            <div className={`${s.mono} ${s.eb}`}>{T.drawer.eyebrow}</div>
            <h2 className={s.tt} id="dt-tab-title" ref={titleRef} tabIndex={-1} style={{ outline: "none" }}>{title}</h2>
          </div>
          <button type="button" className={s.x} aria-label={T.drawer.close} onClick={close}>✕</button>
        </div>
        {step !== "receipt" && (
          <ol className={`${s.steps} ${s.mono}`} aria-label={T.drawer.stepsAria}>
            {T.drawer.steps.map((name, n) => (
              <li key={name} data-on={n <= k ? "true" : "false"} aria-current={n === k ? "step" : undefined} aria-label={T.drawer.stepOf(n + 1, name)}>{name}</li>
            ))}
          </ol>
        )}
        <div className={s.body} data-body>
          {step === "bill" && (
            <BillStep lines={lines} totals={totals} closed={closed} tapped={tapped} onQty={onQty} onRemoveDesign={removeDesign}
              refillFor={refillFor} onRefill={setRefillFor} onToast={push}
              referral={{ value: refCode, error: refError, onChange: (v) => { setRefCode(v); setRefError(null); } }} onNext={goDetails} />
          )}
          {step === "details" && <DetailsStep details={details} errors={errors} onChange={(p) => { setDetails((d) => ({ ...d, ...p })); setErrors({}); }} onNext={goBalance} />}
          {step === "balance" && <BalanceStep options={balanceOptions()} value={method} onChange={setMethod} totals={totals} onNext={() => { setPhase("idle"); setMessage(null); setStep("pay"); }} />}
          {step === "pay" && <PayStep totals={totals} phase={phase} message={message} holdMinutes={POUR.holdMinutes} testMode={keyId.startsWith("rzp_test")} onPay={pay} onBack={() => setStep(balanceOptions().length ? "balance" : "details")} />}
          {step === "receipt" && receipt && <ReceiptStep r={receipt} onBack={close} onTab={close} />}
        </div>
      </aside>
    </div>
  );
}
