// WallDressing — what hangs on The Wall besides the tees: a lamp + light cone per fit, the neon
// wordmark, the enamel sign, the rate-list board and the Pour #002 teaser. Ported from
// story-wall-reference/wall.html. Server-safe markup only: positions are applied imperatively by
// wallDecorDom.ts (the same way the tees are) from computeDecor(), and the neon is flickered by
// wallNeon.ts. The rate list reads price / GSM / deposit from the product data.

import { formatPrice } from "@/lib/utils/format";
import { lang } from "@/lib/theka/lang";
import { Ledge } from "./Ledge";
import s from "./wall.module.css";

const D = lang.wall.decor;

interface WallDressingProps {
  /** Number of fits (one lamp + cone each). */
  n: number;
  /** Lit ledge (hover/focus) — its cone turns cobalt. −1 = none. */
  hover: number;
  /** Price in paise, GSM and deposit % of the real Pour #001 tee. */
  price: number;
  gsm: number;
  depositPercent: number;
  onTeaser: () => void;
}

export function WallDressing({ n, hover, price, gsm, depositPercent, onTeaser }: WallDressingProps) {
  const idx = Array.from({ length: n }, (_, i) => i);
  return (
    <>
      {idx.map((i) => (
        <div key={`c${i}`} className={s.cone} data-cone={i} data-on={hover === i} aria-hidden="true" />
      ))}
      <div className={s.neonwrap} data-decor="neon" data-on="false" aria-hidden="true">
        <div className={s.neonglow} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.neonlogo} src="/brand/logo_neon.png" alt="" width={1200} height={416} draggable={false} decoding="async" loading="lazy" fetchPriority="low" />
      </div>
      <div className={`${s.deco} ${s.enamel2}`} data-decor="enamel" aria-hidden="true">
        <i style={{ left: 6, top: 6 }} /><i style={{ right: 6, top: 6 }} /><i style={{ left: 6, bottom: 6 }} /><i style={{ right: 6, bottom: 6 }} />
        <div className={s.eh}>{D.enamel.hi}</div>
        <div className={s.et}>{D.enamel.en}</div>
      </div>
      <div className={`${s.deco} ${s.rateboard}`} data-decor="rate">
        <h6>{D.rate.title}</h6>
        <ul>
          <li><span>{D.rate.anyFit}</span><i /><b className={s.p}>{formatPrice(price)}</b></li>
          <li><span>{D.rate.fabric}</span><i /><b>{D.rate.gsm(gsm)}</b></li>
          <li><span>{D.rate.fit}</span><i /><b>{D.rate.fitVal}</b></li>
          <li><span>{D.rate.reserve}</span><i /><b>{D.rate.reserveVal(depositPercent)}</b></li>
        </ul>
      </div>
      {/* Pour #002: a ledge with something under a dark cloth. Not a product — it only toasts. */}
      <button type="button" className={`${s.deco} ${s.teaser}`} data-decor="teaser" aria-label={D.teaser.aria} onClick={onTeaser}>
        <Ledge />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="dt-cloth" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4a4442" /><stop offset=".55" stopColor="#2a2524" /><stop offset="1" stopColor="#1a1615" />
            </linearGradient>
          </defs>
          <path d="M14,100 C12,74 11,50 20,33 C28,19 39,11 50,11 C61,11 72,19 80,33 C89,50 88,74 86,100 Z" fill="url(#dt-cloth)" />
          <path d="M36,22 C33,48 31,72 30,100 M50,13 C51,45 52,72 52,100 M66,23 C69,50 70,74 71,100" stroke="rgba(0,0,0,.35)" strokeWidth="1.6" fill="none" />
          <path d="M38,20 C36,46 35,72 34,100 M62,21 C64,48 66,72 67,100" stroke="rgba(255,255,255,.07)" strokeWidth="2" fill="none" />
        </svg>
        <span className={s.paperLabel}>{D.teaser.tag}<small>{D.teaser.sub}</small></span>
      </button>
      {idx.map((i) => (
        <div key={`l${i}`} className={s.lampfx} data-lamp={i} aria-hidden="true" />
      ))}
    </>
  );
}
