"use client";

// Receipt — thermal printer-style order confirmation.
// People photograph these. This is a brand moment.
//
// Layout: perforation edge (SVG) → paper content → perforation edge
// Font: JetBrains Mono throughout (the "printed" feel)
// Dot-leaders animate left → right with stagger (printer finishing)

import {
  useRef, useEffect, useState, useCallback,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { formatPrice } from "@/lib/utils/format";
import { DROP_DATE } from "@/data/pour-001";
import { copy } from "@/data/copy";
import { getSessionWisdom } from "@/lib/utils/copy";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ReceiptItem {
  productName:    string;
  size:           string;
  qty:            number;
  lineTotalPaise: number;
}

export interface ReceiptProps {
  orderNumber:    string;
  customerName?:  string;
  createdAt?:     string; // ISO or display string
  items:          ReceiptItem[];
  subtotalPaise:  number;
  depositPaise:   number;
  balancePaise:   number;
  animate?:       boolean;
  id?:            string;  // for print CSS targeting
}

// ── Paper colours ──────────────────────────────────────────────────────────

const PAPER  = "#FAFAF7";  // off-white receipt paper
const CREAM  = "#E4E2DD";  // page background (shows through perforations)
const INK    = "#141518";  // print ink

// ── Perforation edge ───────────────────────────────────────────────────────
// Triangle-wave that creates the torn-paper / perforated effect.
// fill=PAPER draws the paper shape; CREAM shows through the notches.

function Perf({ flip = false }: { flip?: boolean }) {
  const H    = 10;   // strip height
  const STEP = 14;   // one "tooth" width
  const W    = 500;  // wider than max receipt, gets clipped
  const teeth = Math.ceil(W / STEP) + 2;

  let d = `M0,${flip ? H : 0}`;
  for (let i = 0; i < teeth; i++) {
    const x1 = i * STEP;
    const xm = x1 + STEP / 2;
    const x2 = x1 + STEP;
    if (flip) {
      // Peaks point UP into the paper from the bottom
      d += ` L${xm},0 L${x2},${H}`;
    } else {
      // Peaks point DOWN into the paper from the top
      d += ` L${xm},${H} L${x2},0`;
    }
  }
  d += ` L${W},${flip ? H : 0} Z`;

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="block"
      style={{ display: "block" }}
    >
      <path d={d} fill={PAPER} />
    </svg>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      className="w-full my-2 font-mono text-[9px] select-none overflow-hidden whitespace-nowrap"
      style={{ color: `${INK}55` }}
      aria-hidden="true"
    >
      {"─".repeat(60)}
    </div>
  );
}

// ── Dot-leader row ────────────────────────────────────────────────────────

interface LeaderRowProps {
  label: string;
  value: string;
  delay?: number;
  bold?: boolean;
}

function LeaderRow({ label, value, delay = 0, bold = false }: LeaderRowProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="flex items-baseline w-full min-w-0">
      <span
        className="shrink-0 font-mono text-[10px] uppercase tracking-tight"
        style={{
          color:      INK,
          fontWeight: bold ? 700 : 400,
          maxWidth:   "55%",
          overflow:   "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Animated dot-leader — scaleX: 0 → 1 from left */}
      <motion.span
        className="mx-1 mb-[2px] flex-1 shrink"
        style={{
          display:       "block",
          minWidth:      8,
          transformOrigin: "left center",
          borderBottom:  `1px dotted ${INK}44`,
        }}
        initial={prefersReduced ? {} : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={
          prefersReduced
            ? {}
            : { delay: delay + 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }
        }
      />

      <span
        className="shrink-0 font-mono text-[10px] tabular-nums"
        style={{ color: INK, fontWeight: bold ? 700 : 400 }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Centre label (section headers) ────────────────────────────────────────

function CentreLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full text-center font-mono text-[9px] uppercase tracking-[0.12em]"
      style={{ color: `${INK}99` }}
    >
      {children}
    </div>
  );
}

// ── Main Receipt ──────────────────────────────────────────────────────────

export function Receipt({
  orderNumber,
  customerName,
  createdAt,
  items,
  subtotalPaise,
  depositPaise,
  balancePaise,
  animate = true,
  id = "receipt-print-target",
}: ReceiptProps) {
  const prefersReduced = useReducedMotion();
  const receiptRef     = useRef<HTMLDivElement>(null);
  const [qrSvg, setQrSvg] = useState<string>("");
  const wisdom = getSessionWisdom();

  // ── QR code (client-side, lazy-loaded) ────────────────────────────────
  useEffect(() => {
    const url = `${
      typeof window !== "undefined" ? window.location.origin : "https://driptheka.com"
    }/account?order=${orderNumber}`;

    import("qrcode").then(({ default: QRCode }) => {
      QRCode.toString(url, {
        type:   "svg",
        width:  120,
        margin: 2,
        color:  { dark: INK, light: PAPER },
      }).then(setQrSvg);
    }).catch(() => {});
  }, [orderNumber]);

  // ── Formatted date ─────────────────────────────────────────────────────
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      }).toUpperCase()
    : new Date().toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      }).toUpperCase();

  const dropDateStr = DROP_DATE.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  }).toUpperCase();

  // ── Capture to canvas (for download + share) ───────────────────────────
  const capture = useCallback(async (): Promise<HTMLCanvasElement> => {
    const h2c = (await import("html2canvas")).default;
    const el  = receiptRef.current!;
    return h2c(el, {
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: PAPER,
      scale:           2,
      logging:         false,
    });
  }, []);

  const handleDownload = useCallback(async () => {
    try {
      const canvas = await capture();
      const link   = document.createElement("a");
      link.download = `drip-theka-${orderNumber}.png`;
      link.href     = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      window.print();
    }
  }, [capture, orderNumber]);

  const handleShare = useCallback(async () => {
    try {
      const canvas = await capture();
      const blob   = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), "image/png")
      );
      const file = new File([blob], `drip-theka-${orderNumber}.png`, {
        type: "image/png",
      });

      if (typeof navigator.share !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Drip Theka Order ${orderNumber}`,
          text:  "My order from @driptheka 🍷",
        });
      } else if (typeof navigator.clipboard?.write !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        // Could show a toast here; for now fall through
        alert("Receipt copied to clipboard — paste into your story!");
      } else {
        window.print();
      }
    } catch {
      // User cancelled or API not available — silent
    }
  }, [capture, orderNumber]);

  // ── Slide-up entrance ─────────────────────────────────────────────────

  // Spread onto motion.div — ease must be a string or function, not a number[]
  const slideProps = animate && !prefersReduced
    ? {
        initial:    { y: "100%", opacity: 0 } as const,
        animate:    { y: 0, opacity: 1 } as const,
        transition: { delay: 1.5, duration: 0.7, ease: "easeOut" as const },
      }
    : animate
    ? {
        initial:    { opacity: 0 } as const,
        animate:    { opacity: 1 } as const,
        transition: { delay: 1.5, duration: 0.5 },
      }
    : ({} as Record<string, never>);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center w-full">
      <motion.div {...slideProps} className="w-full max-w-[480px]">

        {/* Top perforation + receipt paper + bottom perforation */}
        <div
          style={{ backgroundColor: CREAM }}
          className="rounded-none overflow-hidden"
        >
          <Perf flip={false} />

          {/* ── Receipt paper ─────────────────────────────────────── */}
          <div
            ref={receiptRef}
            id={id}
            style={{
              backgroundColor: PAPER,
              color:           INK,
              padding:         "24px 28px",
              // Subtle paper grain
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")",
              backgroundBlendMode: "multiply",
              boxShadow: "0 4px 32px rgba(20,21,24,0.12), 0 1px 4px rgba(20,21,24,0.08)",
            }}
          >
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="text-center space-y-1 mb-2">
              <div
                className="font-tanker uppercase tracking-tight"
                style={{ fontSize: "clamp(1.8rem, 6vw, 2.5rem)", color: INK, lineHeight: 0.9 }}
              >
                DRIP THEKA
              </div>
              <div
                className="font-mono italic"
                style={{ fontSize: 9, color: `${INK}80`, letterSpacing: "0.06em" }}
              >
                &ldquo;serving fits, not drinks&rdquo;
              </div>
            </div>

            <Divider />

            {/* ── Pour info ────────────────────────────────────────── */}
            <div className="space-y-0.5 mb-1">
              <CentreLabel>
                {copy.language.pour001.en} · {copy.language.pour001.hi}
              </CentreLabel>
              <CentreLabel>
                {copy.language.openingNight.en} · {dropDateStr}
              </CentreLabel>
            </div>

            <Divider />

            {/* ── Order meta ───────────────────────────────────────── */}
            <div
              className="space-y-0.5 mb-1 font-mono"
              style={{ fontSize: 10, color: INK }}
            >
              <div className="font-bold uppercase">ORDER #{orderNumber}</div>
              <div style={{ color: `${INK}80` }}>{dateStr}</div>
              {customerName && (
                <div className="uppercase font-bold">{customerName}</div>
              )}
            </div>

            <Divider />

            {/* ── Line items ───────────────────────────────────────── */}
            <div className="space-y-2 mb-1">
              {items.map((item, i) => (
                <div key={i} className="space-y-0.5">
                  <div
                    className="font-mono uppercase font-bold"
                    style={{ fontSize: 9.5, color: INK }}
                  >
                    {item.qty}x {item.productName}
                  </div>
                  <div
                    className="font-mono uppercase"
                    style={{ fontSize: 9, color: `${INK}80` }}
                  >
                    SIZE: {item.size}
                  </div>
                  <LeaderRow
                    label=""
                    value={formatPrice(item.lineTotalPaise)}
                    delay={i * 0.08}
                  />
                </div>
              ))}
            </div>

            <Divider />

            {/* ── Totals ───────────────────────────────────────────── */}
            <div className="space-y-1.5 mb-1">
              <LeaderRow
                label="SUBTOTAL"
                value={formatPrice(subtotalPaise)}
                delay={items.length * 0.08}
              />
              <LeaderRow
                label="DEPOSIT (30%)"
                value={formatPrice(depositPaise)}
                delay={items.length * 0.08 + 0.08}
              />
              <LeaderRow
                label="BALANCE (70%)"
                value={formatPrice(balancePaise)}
                delay={items.length * 0.08 + 0.16}
              />
              <LeaderRow
                label="PAID TODAY"
                value={formatPrice(depositPaise)}
                delay={items.length * 0.08 + 0.24}
                bold
              />
            </div>

            <Divider />

            {/* ── Thank you + QR ───────────────────────────────────── */}
            <div className="text-center space-y-2 my-3">
              <div
                className="font-mono uppercase font-bold"
                style={{ fontSize: 11, color: INK }}
              >
                THANK YOU, REGULAR.
              </div>
              <div
                className="font-mono italic"
                style={{ fontSize: 9, color: `${INK}70`, lineHeight: 1.5 }}
              >
                the bar will call you when doors open.
              </div>

              {/* QR code */}
              <div className="flex justify-center my-3">
                {qrSvg ? (
                  <div
                    style={{ width: 120, height: 120 }}
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                    aria-label={`QR code for order ${orderNumber}`}
                  />
                ) : (
                  <div
                    style={{
                      width: 120, height: 120,
                      backgroundColor: `${INK}10`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <span
                      className="font-mono"
                      style={{ fontSize: 8, color: `${INK}40` }}
                    >
                      QR...
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Divider />

            {/* ── Wisdom ───────────────────────────────────────────── */}
            <div className="text-center my-2">
              <div
                className="font-mono italic"
                style={{ fontSize: 9, color: `${INK}60`, lineHeight: 1.6 }}
              >
                {wisdom}
              </div>
            </div>

            <Divider />

            {/* ── Footer ───────────────────────────────────────────── */}
            <div
              className="text-center font-mono"
              style={{ fontSize: 8, color: `${INK}50`, letterSpacing: "0.08em" }}
            >
              SCAN TO TRACK ORDER · driptheka.com
            </div>
          </div>

          <Perf flip={true} />
        </div>
      </motion.div>

      {/* ── Action buttons (outside receipt) ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-center justify-center gap-3 mt-6 w-full max-w-[480px]"
      >
        <button
          onClick={handleShare}
          data-hover
          className="font-mono text-[9px] uppercase tracking-[0.14em] border border-[--ink]/40 text-[--ink] px-4 py-2.5 hover:border-[--blue] hover:text-[--blue] transition-all duration-200 flex items-center gap-2"
        >
          <span aria-hidden="true">📸</span> Share to Story
        </button>
        <button
          onClick={handleDownload}
          data-hover
          className="font-mono text-[9px] uppercase tracking-[0.14em] border border-[--ink]/40 text-[--ink] px-4 py-2.5 hover:border-[--blue] hover:text-[--blue] transition-all duration-200 flex items-center gap-2"
        >
          <span aria-hidden="true">📥</span> Download
        </button>
        <a
          href="/"
          data-hover
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/50 hover:text-[--ink] transition-colors px-4 py-2.5"
        >
          {copy.cta.backToHome}
        </a>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.6, duration: 0.4 }}
        className="font-mono text-[8px] uppercase tracking-[0.12em] text-[--ink]/30 text-center mt-3 max-w-[360px]"
      >
        we&apos;ll email you a copy too · check spam in case
      </motion.p>
    </div>
  );
}
