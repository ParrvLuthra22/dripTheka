"use client";

// The five views of the Tab drawer, as dumb components: TabDrawer owns the state and the payment flow.

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { REFERRAL_REWARD_PAISE } from "@/lib/config";
import { formatPaise } from "@/lib/utils/format";
import { lang } from "@/lib/theka/lang";
import { DEPOSIT_PERCENT, pourClosesLabel } from "@/lib/theka/pour";
import { linesOfDesign, MAX_QTY, type BillLine, type BillTotals } from "@/lib/theka/tabMath";
import type { BalanceMethod, Details, FormField } from "@/lib/theka/checkout";
import { RefillForm } from "@/components/theka/wall/RefillForm";
import s from "./tab.module.css";

const T = lang.tab;

const rich = (parts: readonly string[], boldAt: readonly number[]): ReactNode[] =>
  parts.map((p, i) => (boldAt.includes(i) ? <b key={i}>{p}</b> : p));

// ── 1 · the bill ─────────────────────────────────────────────────────────────────────────────────────

export interface BillStepProps {
  lines: readonly (BillLine & { productId: string })[];
  totals: BillTotals;
  closed: boolean;
  /** Designs whose glass is tapped (a 409 said so, or the glasses API did). */
  tapped: ReadonlySet<string>;
  onQty: (line: BillLine & { productId: string }, qty: number) => void;
  onRemoveDesign: (designId: string) => void;
  refillFor: string | null;
  onRefill: (designId: string | null) => void;
  onToast: (text: string) => void;
  referral: { value: string; error: string | null; onChange: (v: string) => void };
  onNext: () => void;
}

export function BillStep(p: BillStepProps) {
  const [friendOpen, setFriendOpen] = useState(!!p.referral.value || !!p.referral.error);
  const blocked = p.lines.some((l) => p.tapped.has(l.designId));
  const empty = p.lines.length === 0;
  const seen = new Set<string>();
  return (
    <>
      <div className={s.bill}>
        <h4>{T.bill.title}</h4>
        <div className={s.c}>{T.bill.sub}</div>
        <hr />
        {empty ? (
          <div className={s.empty}>{T.bill.empty[0]}<br />{T.bill.empty[1]}</div>
        ) : (
          <>
            {p.lines.map((l) => {
              const isTapped = p.tapped.has(l.designId);
              const first = !seen.has(l.designId);
              seen.add(l.designId);
              return (
                <div key={`${l.slug}-${l.size}`}>
                  <div className={s.ln}><span>{l.name}</span><i /><span>{formatPaise(l.unitPaise * l.qty)}</span></div>
                  <div className={s.ln}>
                    <small>{l.colourway} · {l.size}</small><i style={{ opacity: 0 }} />
                    <span className={s.q}>
                      <button type="button" aria-label={`${T.bill.less}: ${l.name}, ${l.colourway}, ${l.size}`} onClick={() => p.onQty(l, l.qty - 1)}>−</button>
                      <span aria-live="polite">{l.qty}</span>
                      <button type="button" aria-label={`${T.bill.more}: ${l.name}, ${l.colourway}, ${l.size}`} disabled={l.qty >= MAX_QTY} onClick={() => p.onQty(l, l.qty + 1)}>+</button>
                    </span>
                  </div>
                  {isTapped && first && (
                    <div className={s.lineTapped} role="alert">
                      {T.bill.tappedLine}
                      <div className={s.acts}>
                        <button type="button" onClick={() => p.onRemoveDesign(l.designId)}>{T.bill.tappedRemove}</button>
                        <button type="button" aria-expanded={p.refillFor === l.designId} onClick={() => p.onRefill(p.refillFor === l.designId ? null : l.designId)}>{T.bill.tappedRefill}</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <hr />
            <div className={s.ln}><span>{T.bill.total}</span><i /><span>{formatPaise(p.totals.subtotalPaise)}</span></div>
            <div className={`${s.ln} ${s.big}`}><b>{T.bill.payNow(DEPOSIT_PERCENT)}</b><i /><b>{formatPaise(p.totals.depositPaise)}</b></div>
            <div className={s.ln}><span>{T.bill.balance}</span><i /><span>{formatPaise(p.totals.balancePaise)}</span></div>
            <div className={s.ln}><small>{T.bill.shipping}</small><i /><small>{T.bill.shippingVal}</small></div>
          </>
        )}
      </div>

      {p.refillFor && (() => {
        const l = linesOfDesign(p.lines, p.refillFor)[0];
        return l ? (
          <RefillForm key={p.refillFor} design={p.refillFor} name={l.name} onToast={p.onToast}
            onDone={() => { p.onRemoveDesign(p.refillFor!); p.onRefill(null); }} onCancel={() => p.onRefill(null)} />
        ) : null;
      })()}

      {!empty && !p.closed && (
        <details className={s.friend} open={friendOpen} onToggle={(e) => setFriendOpen(e.currentTarget.open)}>
          <summary>{T.bill.friend.toggle}</summary>
          <label className={s.f} data-bad={p.referral.error ? "true" : undefined}>
            <span>{T.bill.friend.label}</span>
            <input value={p.referral.value} onChange={(e) => p.referral.onChange(e.target.value.toUpperCase())} maxLength={12} autoCapitalize="characters"
              autoComplete="off" spellCheck={false} placeholder={T.bill.friend.placeholder} aria-invalid={!!p.referral.error} aria-describedby="dt-ref-hint" />
            {p.referral.error ? <em role="alert">{p.referral.error}</em> : null}
          </label>
          <div className={s.fhint} id="dt-ref-hint">{T.bill.friend.hint}</div>
        </details>
      )}

      <div className={s.howto}>
        <b>{T.bill.howTitle}</b>
        <ol>{T.bill.how(DEPOSIT_PERCENT, pourClosesLabel()).map((li, i) => <li key={i}>{li[0]}{li[1] ? <b>{li[1]}</b> : null}{li[2]}</li>)}</ol>
      </div>

      {p.closed && <div className={s.note} role="status">{T.bill.closedNote}</div>}
      {blocked && !p.closed && <div className={s.note} data-tone="warn" role="status">{T.bill.glassFull}</div>}
      <button type="button" className={s.cta} disabled={empty || p.closed || blocked} onClick={p.onNext}>
        {p.closed ? T.bill.ctaClosed : T.bill.cta} <span aria-hidden="true">→</span>
      </button>
    </>
  );
}

// ── 2 · details ──────────────────────────────────────────────────────────────────────────────────────

export interface DetailsStepProps {
  details: Details;
  errors: Partial<Record<FormField, string>>;
  onChange: (patch: Partial<Details>) => void;
  onNext: () => void;
}

export function DetailsStep({ details: d, errors, onChange, onNext }: DetailsStepProps) {
  const D = T.details;
  const f = (k: FormField, label: string, input: ReactNode) => (
    <label className={s.f} data-bad={errors[k] ? "true" : undefined}>
      <span>{label}</span>{input}{errors[k] ? <em role="alert">{errors[k]}</em> : null}
    </label>
  );
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); onNext(); }}>
      {f("name", D.name.label, <input value={d.name} onChange={(e) => onChange({ name: e.target.value })} autoComplete="name" placeholder={D.name.ph} aria-invalid={!!errors.name} />)}
      {f("phone", D.phone.label, <input value={d.phone} onChange={(e) => onChange({ phone: e.target.value })} inputMode="tel" autoComplete="tel" placeholder={D.phone.ph} aria-invalid={!!errors.phone} />)}
      <label className={s.chk}>
        <input type="checkbox" checked={d.wa} onChange={(e) => onChange({ wa: e.target.checked })} />
        <span>{D.wa[0]}<b>{D.wa[1]}</b></span>
      </label>
      {f("email", D.email.label, <input value={d.email} onChange={(e) => onChange({ email: e.target.value })} type="email" autoComplete="email" placeholder={D.email.ph} aria-invalid={!!errors.email} />)}
      {f("addr", D.addr.label, <textarea value={d.addr} onChange={(e) => onChange({ addr: e.target.value })} rows={2} autoComplete="street-address" placeholder={D.addr.ph} aria-invalid={!!errors.addr} />)}
      <div className={s.row2}>
        {f("pin", D.pin.label, <input value={d.pin} onChange={(e) => onChange({ pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder={D.pin.ph} aria-invalid={!!errors.pin} />)}
        {f("city", D.city.label, <input value={d.city} onChange={(e) => onChange({ city: e.target.value })} autoComplete="address-level2" placeholder={D.city.ph} aria-invalid={!!errors.city} />)}
      </div>
      {f("state", D.state.label, <input value={d.state} onChange={(e) => onChange({ state: e.target.value })} autoComplete="address-level1" placeholder={D.state.ph} aria-invalid={!!errors.state} />)}
      <button type="submit" className={s.cta}>{D.cta} <span aria-hidden="true">→</span></button>
    </form>
  );
}

// ── 3 · balance ──────────────────────────────────────────────────────────────────────────────────────

export interface BalanceStepProps {
  options: BalanceMethod[];
  value: BalanceMethod | null;
  onChange: (m: BalanceMethod) => void;
  totals: BillTotals;
  onNext: () => void;
}

export function BalanceStep({ options, value, onChange, totals, onNext }: BalanceStepProps) {
  const B = T.balance;
  const lede = B.lede(formatPaise(totals.depositPaise), formatPaise(totals.balancePaise));
  return (
    <>
      <p className={s.lede}>{rich(lede, [1, 3])}</p>
      <fieldset className={s.opts}>
        <legend>{B.groupAria}</legend>
        {options.map((m) => (
          <label className={s.opt} key={m}>
            <input type="radio" name="dt-balance" value={m} checked={value === m} onChange={() => onChange(m)} />
            <div><b>{B[m].title}</b><span>{B[m].body}</span></div>
          </label>
        ))}
      </fieldset>
      <button type="button" className={s.cta} onClick={onNext}>{B.cta} <span aria-hidden="true">→</span></button>
    </>
  );
}

// ── 4 · deposit ──────────────────────────────────────────────────────────────────────────────────────

export type PayPhase = "idle" | "busy" | "open" | "dismissed" | "confirming" | "failed" | "closed";

export interface PayStepProps {
  totals: BillTotals;
  phase: PayPhase;
  /** Error / status copy shown under the summary. */
  message: string | null;
  holdMinutes: number;
  testMode: boolean;
  onPay: () => void;
  onBack: () => void;
}

export function PayStep({ totals, phase, message, holdMinutes, testMode, onPay, onBack }: PayStepProps) {
  const P = T.pay;
  const [busyIdx, setBusyIdx] = useState(0);
  const busy = phase === "busy" || phase === "open";
  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(() => setBusyIdx((i) => (i + 1) % P.busy.length), 1800);
    return () => window.clearInterval(id);
  }, [busy, P.busy.length]);
  const dep = formatPaise(totals.depositPaise);
  const cta = P.cta(dep);
  const locked = phase === "busy" || phase === "open" || phase === "confirming" || phase === "closed";
  return (
    <>
      <div className={s.paysum}><span>{P.deposit(DEPOSIT_PERCENT)}</span><b>{dep}</b></div>
      <div className={`${s.mono} ${s.eb}`} style={{ margin: "16px 0 8px" }}>{P.upiHead}</div>
      <div className={s.upiHint} role="note" aria-label={P.upiHintAria}>{P.upiHint.map((h) => <span key={h}>{h}</span>)}</div>
      <details className={s.more}><summary>{P.more}</summary><p>{P.moreBody}</p></details>

      <div aria-live="polite">
        {phase === "dismissed" && (
          <div className={s.note} data-tone="warn">{P.dismissed}<small>{P.held(holdMinutes)}</small></div>
        )}
        {phase === "confirming" && (
          <div className={s.note} role="status">{P.confirming}<small>{P.confirmingSub}</small></div>
        )}
        {(phase === "failed" || phase === "closed") && message && (
          <div className={s.note} data-tone="bad" role="alert">{message}</div>
        )}
      </div>

      <button type="button" className={s.cta} disabled={locked} aria-busy={busy} onClick={onPay}>
        {busy ? <span>{P.busy[busyIdx]}</span> : <span>{cta[0]}<span>{cta[1]}</span> {cta[2]}</span>}
        <span aria-hidden="true">→</span>
      </button>
      <button type="button" className={s.back} onClick={onBack} disabled={locked}>← {P.back}</button>
      <div className={`${s.fine} ${s.mono}`}>{testMode ? P.fineTest : P.fine}</div>
    </>
  );
}

// ── 5 · receipt ──────────────────────────────────────────────────────────────────────────────────────

export interface ReceiptData {
  orderNumber: string;
  token: string | null;
  firstName: string;
  lines: BillLine[];
  depositPaise: number;
  balancePaise: number;
  method: BalanceMethod | null;
}

export function ReceiptStep({ r, onBack, onTab }: { r: ReceiptData; onBack: () => void; onTab: () => void }) {
  const R = T.receipt;
  const [friend, setFriend] = useState<string | null>(null);
  useEffect(() => {
    if (!r.token) return;
    let live = true;
    fetch(`/api/reserve/receipt/${encodeURIComponent(r.orderNumber)}?t=${encodeURIComponent(r.token)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((b: { order?: { friendCode?: string | null } } | null) => { if (live && b?.order?.friendCode) setFriend(b.order.friendCode); })
      .catch(() => { /* no friend code is fine */ });
    return () => { live = false; };
  }, [r.orderNumber, r.token]);
  const stamp = R.stamp(DEPOSIT_PERCENT);
  const reward = formatPaise(REFERRAL_REWARD_PAISE);
  return (
    <>
      <div className={s.rcpt} data-fresh="true" data-noref={friend ? undefined : "true"}>
        <h4>{R.title}</h4>
        <div className={s.c}>{R.sub}</div>
        <hr />
        <div className={s.ln}><span>{R.order}</span><i /><b>{r.orderNumber}</b></div>
        <div className={s.ln}><span>{R.regular}</span><i /><span>{r.firstName}</span></div>
        <hr />
        {r.lines.map((l) => <div className={s.ln} key={`${l.slug}-${l.size}`}><span>{l.name} · {l.colourway} · {l.size} ×{l.qty}</span></div>)}
        <hr />
        <div className={s.ln}><span>{R.depositPaid}</span><i /><b>{formatPaise(r.depositPaise)}</b></div>
        <div className={s.ln}><span>{R.balance}</span><i /><span>{formatPaise(r.balancePaise)}{r.method ? ` · ${r.method === "cod" ? R.balanceCod : R.balanceOnline}` : ""}</span></div>
        <div className={s.tl}>
          <div data-d="true">{R.timeline.reserved}</div>
          <div>{R.timeline.closes(pourClosesLabel())}</div>
          <div>{R.timeline.pour}</div>
          <div>{r.method === "cod" ? R.timeline.shipCod : R.timeline.shipOnline}</div>
        </div>
        {friend && <div className={s.ref}>{R.friend.lead}<b>{friend}</b><small>{R.friend.sub(reward)}</small></div>}
        <div className={s.stampR} aria-hidden="true">{stamp[0]}<br />{stamp[1]}</div>
      </div>
      <Link className={`${s.cta} ${s.ghost}`} href="/tab" onClick={onTab}>{R.openTab} <span aria-hidden="true">→</span></Link>
      <button type="button" className={`${s.cta} ${s.ghost}`} onClick={onBack}>{R.backToWall} <span aria-hidden="true">→</span></button>
    </>
  );
}
