"use client";

// /tab — ported from tab-reference/tab.html. Orders come from the account (signed in) and from this device's
// dt_tabs (guest receipts, each read through the token-protected receipt route); merged and de-duplicated.
// Each item's glass bar is the LIVE glass from the glasses API: with no data there is no bar and no number.

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { POUR_001 } from "@/data/pour-001";
import { REFERRAL_REWARD_PAISE } from "@/lib/config";
import { formatPaise } from "@/lib/utils/format";
import { lang } from "@/lib/theka/lang";
import { useGlasses } from "@/lib/theka/glasses";
import { DEPOSIT_PERCENT, pourClosesLabel, usePourClosed } from "@/lib/theka/pour";
import { readTabs } from "@/lib/theka/dtTabs";
import { useSessionUser } from "@/lib/theka/useSessionUser";
import { firstName, glassBar, mergeOrders, parseReceipt, pillOf, timelineStates, type TabOrder } from "@/lib/theka/tabOrders";
import s from "./tabpage.module.css";

const T = lang.tab.page;
const H = lang.tab;

type Load = { kind: "loading" } | { kind: "ready"; orders: TabOrder[]; signedIn: boolean } | { kind: "failed" };

async function fetchReceipt(orderNumber: string, token?: string): Promise<{ order: TabOrder | null; failed: boolean }> {
  try {
    const res = await fetch(`/api/reserve/receipt/${encodeURIComponent(orderNumber)}${token ? `?t=${encodeURIComponent(token)}` : ""}`, { cache: "no-store" });
    if (res.status === 404) return { order: null, failed: false };           // stale token / not ours: just not on this tab
    if (!res.ok) return { order: null, failed: true };
    return { order: parseReceipt(await res.json()), failed: false };
  } catch { return { order: null, failed: true }; }
}

async function loadOrders(): Promise<Load> {
  let failures = 0, asked = 0;
  // 1 · signed in? /api/auth/session answers 200 either way (a guest gets null), so a guest's console stays clean.
  let signedIn = false; let numbers: string[] = [];
  try {
    const who = await fetch("/api/auth/session", { cache: "no-store" });
    const body = who.ok ? ((await who.json()) as { user?: unknown } | null) : null;
    asked++;
    if (!who.ok) failures++;
    if (body?.user) {
      const res = await fetch("/api/account/orders", { cache: "no-store" });
      asked++;
      if (res.ok) { signedIn = true; numbers = ((await res.json()) as { orderNumber?: string }[]).flatMap((o) => (o.orderNumber ? [o.orderNumber] : [])); }
      else failures++;
    }
  } catch { failures++; asked++; }
  // 2 · each order through the receipt route (session-owned, or by token for guest orders on this device)
  const mine = await Promise.all(numbers.map((n) => fetchReceipt(n)));
  const refs = readTabs(typeof localStorage === "undefined" ? null : localStorage);
  const guest = await Promise.all(refs.map((r) => fetchReceipt(r.orderNumber, r.token)));
  for (const r of [...mine, ...guest]) { asked++; if (r.failed) failures++; }
  const orders = mergeOrders(mine.flatMap((r) => (r.order ? [r.order] : [])), guest.flatMap((r) => (r.order ? [r.order] : [])));
  if (!orders.length && failures > 0 && failures === asked) return { kind: "failed" };
  return { kind: "ready", orders, signedIn };
}

export function TabPage() {
  const [state, setState] = useState<Load>({ kind: "loading" });
  const glasses = useGlasses();
  const closed = usePourClosed();
  const me = useSessionUser();
  const [copied, setCopied] = useState(false);

  const run = useCallback(() => { setState({ kind: "loading" }); void loadOrders().then(setState); }, []);
  useEffect(() => { let live = true; void loadOrders().then((r) => { if (live) setState(r); }); return () => { live = false; }; }, []);

  const orders = state.kind === "ready" ? state.orders : [];
  const who = firstName(me?.name) || firstName(orders[0]?.name) || T.fallbackName;
  const title = T.title(who);
  const code = orders.find((o) => o.friendCode)?.friendCode ?? null;
  const wa = orders.some((o) => o.waOptIn);
  const reward = formatPaise(REFERRAL_REWARD_PAISE);

  return (
    <div className={s.page}>
      <header className={s.head}>
        <Link className={s.logo} href="/" prefetch={false}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo_glass.png" alt="" width={11} height={20} />{lang.brand.wordmark}
        </Link>
        <nav className={s.nav} aria-label={T.navAria}>
          <Link href="/" prefetch={false}>{T.wall}</Link>
          <Link href="/story" prefetch={false}>{T.story}</Link>
          <Link href="/tab" aria-current="page">{T.tab}</Link>
        </nav>
        <span />
      </header>
      <main className={s.main}>
        <section className={s.hi}>
          <div className={`${s.eb} ${s.mono}`}>{T.eyebrow}</div>
          <h1>{title[0]}<span>{title[1]}{title[2]}</span></h1>
          <p>{T.lede}</p>
        </section>
        <div className={s.grid}>
          <div aria-live="polite" aria-busy={state.kind === "loading"}>
            {state.kind === "loading" && <div className={s.empty} role="status">{T.loading}</div>}
            {state.kind === "failed" && (
              <div className={s.empty} role="alert">{T.loadFailed}<button type="button" className={s.cta} onClick={run}>{T.retry}</button></div>
            )}
            {state.kind === "ready" && orders.length === 0 && (
              <div className={`${s.card} ${s.empty}`}>
                <div className={s.title}>{T.empty.title}</div>
                <Link href="/" prefetch={false} className={s.cta}>{T.empty.cta}</Link>
                {!state.signedIn && <button type="button" className={s.signin} onClick={() => void signIn("google", { callbackUrl: "/tab" })}>{T.empty.signIn}</button>}
              </div>
            )}
            {orders.map((o) => <OrderCard key={o.orderNumber} o={o} glasses={glasses} closed={closed} />)}
          </div>
          <div className={s.side}>
            {code && (
              <div className={`${s.card} ${s.ref}`}>
                <div className={s.mono} style={{ fontSize: 9, color: "var(--mut)" }}>{T.side.friendTitle}</div>
                <b>{code}</b>
                <p>{T.side.friendBody(reward)}</p>
                <button type="button" className={s.copy} onClick={() => { try { void navigator.clipboard.writeText(code); } catch { /* no clipboard */ } setCopied(true); }}>
                  {copied ? T.side.copied : T.side.copy}
                </button>
              </div>
            )}
            {wa && (
              <div className={s.card}>
                <div className={s.wa}><i aria-hidden="true" />{T.side.waOn}</div>
                <p>{T.side.waBody}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function OrderCard({ o, glasses, closed }: { o: TabOrder; glasses: ReturnType<typeof useGlasses>; closed: boolean }) {
  const cod = o.balanceMethod === "cod";
  const steps = timelineStates(o.status, closed);
  const L = T.timeline;
  const rows = [
    { t: L.reserved.t, d: L.reserved.d(DEPOSIT_PERCENT) },
    { t: L.closes.t(pourClosesLabel()), d: L.closes.d },
    { t: L.pour.t, d: L.pour.d },
    cod ? L.ready : L.balanceOnline,
    L.done,
  ];
  const pill = pillOf(o.status);
  return (
    <article className={s.card} aria-label={o.orderNumber}>
      <div className={s.oh}>
        <b>{o.orderNumber}</b>
        <span className={`${s.st} ${s.mono}`}>{pill === "reserved" ? T.pill(DEPOSIT_PERCENT) : pill === "balance" ? T.pillBalance : pill === "shipped" ? T.pillShipped : T.pillRefunded}</span>
      </div>
      <div className={s.items}>
        {o.items.map((i) => {
          const p = POUR_001.products.find((x) => x.slug === i.productSlug);
          const bar = glassBar(glasses, i.designId);
          const label = bar ? (bar.tapped ? T.glass.tapped : bar.last ? T.glass.last(bar.left) : T.glass.open(bar.poured, bar.cap)) : null;
          return (
            <div className={s.it} key={`${i.productSlug}-${i.size}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p?.wall ? <img src={p.wall.back} alt="" width={58} height={58} loading="lazy" /> : <span />}
              <div>
                <div className={s.n}>{i.productName}</div>
                <div className={s.s}>{T.line(p?.colourway ?? "", i.size, i.qty)}</div>
                {bar && (
                  <>
                    <div className={s.bar} data-last={bar.last ? "true" : undefined} role="img" aria-label={label ?? undefined}><i style={{ width: `${bar.pct}%` }} /></div>
                    <div className={s.g}>{label}</div>
                  </>
                )}
              </div>
              <b>{formatPaise(i.lineTotalPaise)}</b>
            </div>
          );
        })}
      </div>
      <div className={s.money}>
        <div><small>{T.money.deposit}</small><b>{formatPaise(o.depositPaise)}</b></div>
        <div><small>{cod ? T.money.balanceCod : T.money.balanceOnline}</small><b>{formatPaise(o.balancePaise)}</b></div>
      </div>
      <ol className={s.tl} aria-label={H.drawer.stepsAria}>
        {rows.map((r, n) => (
          <li className={s.step} data-s={steps[n]} key={n} aria-current={steps[n] === "now" ? "step" : undefined}>
            <div className={s.dot} aria-hidden="true">{steps[n] === "done" ? "✓" : ""}</div>
            <div><b>{r.t}</b><span>{r.d}</span></div>
          </li>
        ))}
      </ol>
      {cod ? <div className={s.note}>{T.codNote}</div> : (
        <>
          <button type="button" className={s.pay} disabled>{T.pay(formatPaise(o.balancePaise))} <span aria-hidden="true">→</span></button>
          <div className={s.note}>{T.payNote}</div>
        </>
      )}
    </article>
  );
}
