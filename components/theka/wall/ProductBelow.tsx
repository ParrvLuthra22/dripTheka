// Below the fold of /product/[slug] (server component): "How it's poured" and
// "Also on the wall". Plain <img> to match the Wall's ledge look at card scale.

import Link from "next/link";
import type { WallProduct } from "@/data/pour-001";
import { formatPrice } from "@/lib/utils/format";
import { lang } from "@/lib/theka/lang";
import { Ledge } from "./Ledge";
import p from "./productPage.module.css";

const H = lang.product.how;
const A = lang.product.also;

export function ProductBelow({ product, related }: { product: WallProduct; related: WallProduct[] }) {
  const cols = [
    { ...H.cols.fabric, title: H.cols.fabric.title(product.gsm ?? 400) },
    H.cols.fit,
    H.cols.print,
  ];
  return (
    <div className={p.below}>
      <section className={p.sec} aria-labelledby="how-poured">
        <div className={p.eb}>{H.eyebrow}</div>
        <h2 id="how-poured" className={p.title}>{H.title}</h2>
        <ul className={p.cols}>
          {cols.map((c) => (
            <li key={c.label} className={p.col}>
              <div className={p.eb}>{c.label}</div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section className={p.sec} aria-labelledby="also-wall">
          <div className={p.eb}>{A.eyebrow}</div>
          <h2 id="also-wall" className={p.title}>{A.title}</h2>
          <ul className={p.cards}>
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/product/${r.slug}`} className={p.card} aria-label={A.aria(r.name, formatPrice(r.price))}>
                  <div className={p.stage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={p.sh} src={r.wall.frontShadow} alt="" loading="lazy" fetchPriority="low" decoding="async" />
                    <Ledge />
                    <div className={p.contact} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={p.fit} src={r.wall.front} alt="" loading="lazy" fetchPriority="low" decoding="async" />
                  </div>
                  <div className={p.meta}>
                    <span className={p.name}>{r.name}</span>
                    <span className={p.price}>{formatPrice(r.price)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={p.foot}>
        <Link href={`/?fit=${product.slug}`}>{lang.product.back}</Link>
        <span>{lang.wall.foot}</span>
      </div>
    </div>
  );
}
