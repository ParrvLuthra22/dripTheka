"use client";

// SuccessClient — two phases:
//   Phase 1 (0 – 1.5s): HeroPour replay + single foam bubble (existing)
//   Phase 2 (1.5s+): Receipt slides up from below on cream background
//
// Background transitions from cobalt to cream when Phase 2 starts.

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { HeroPourFallback } from "@/components/glass/HeroPour";
import { Receipt, type ReceiptItem } from "@/components/sections/checkout/Receipt";
import { useSound } from "@/components/sound/SoundProvider";
import { formatPrice } from "@/lib/utils/format";

const HeroPour = dynamic(
  () => import("@/components/glass/HeroPour").then((m) => ({ default: m.HeroPour })),
  { ssr: false, loading: () => <HeroPourFallback /> }
);

interface SuccessClientProps {
  orderNumber: string;
  deposit:     number;   // paise
  total:       number;   // paise
  dropStr:     string;
}

type OrderData = {
  customerName: string;
  createdAt:    string;
  items:        ReceiptItem[];
  subtotalPaise: number;
} | null;

export function SuccessClient({ orderNumber, deposit, total, dropStr }: SuccessClientProps) {
  const { play, muted } = useSound();

  const [phase,        setPhase]        = useState<1 | 2>(1);
  const [bubbleActive, setBubbleActive] = useState(false);
  const [orderData,    setOrderData]    = useState<OrderData>(null);
  const [fetchFailed,  setFetchFailed]  = useState(false);

  const balance = total - deposit;

  // ── Phase 1: fire bubble, then transition ──────────────────────────────
  useEffect(() => {
    const bubbleTimer = setTimeout(() => setBubbleActive(true), 1400);
    const phaseTimer  = setTimeout(() => {
      setPhase(2);
      if (!muted) play("clink");
    }, 1500);

    return () => {
      clearTimeout(bubbleTimer);
      clearTimeout(phaseTimer);
    };
  }, [muted, play]);

  // ── Fetch order data for the receipt ──────────────────────────────────
  useEffect(() => {
    if (!orderNumber || orderNumber.startsWith("DT-DEV") || orderNumber.startsWith("dev-")) {
      // Dev order — show with placeholder items
      setOrderData({
        customerName: "Guest",
        createdAt:    new Date().toISOString(),
        items: [{
          productName: "First Round Tee",
          size:        "M",
          qty:         1,
          lineTotalPaise: total,
        }],
        subtotalPaise: total,
      });
      return;
    }

    fetch(`/api/reserve/receipt/${orderNumber}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        const d = await r.json() as {
          order: { name: string; createdAt: string; subtotalPaise: number };
          items: ReceiptItem[];
        };
        setOrderData({
          customerName:  d.order.name,
          createdAt:     d.order.createdAt,
          items:         d.items,
          subtotalPaise: d.order.subtotalPaise,
        });
      })
      .catch(() => setFetchFailed(true));
  }, [orderNumber, total]);

  // ── Items for receipt (fallback uses total) ───────────────────────────
  const receiptItems: ReceiptItem[] = orderData?.items ?? (total > 0
    ? [{ productName: "Your order", size: "—", qty: 1, lineTotalPaise: total }]
    : []
  );

  const receiptSubtotal = orderData?.subtotalPaise ?? total;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen relative overflow-x-hidden transition-colors duration-700"
      style={{
        backgroundColor: phase === 1 ? "#004AAD" : "#E4E2DD",
        paddingBottom: 48,
      }}
    >
      {/* ── Phase 1: HeroPour + foam bubble ─────────────────────── */}
      <AnimatePresence>
        {phase === 1 && (
          <motion.div
            key="phase1"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="flex flex-col items-center justify-center min-h-screen"
            style={{ paddingInline: "var(--pad-x)" }}
          >
            {/* Foam bubble */}
            {bubbleActive && (
              <motion.div
                className="fixed pointer-events-none z-[100]"
                style={{
                  bottom: 32, left: "50%", x: "-50%",
                  width: 64, height: 64,
                  borderRadius: "50%",
                  backgroundColor: "#E4E2DD",
                  border: "1px solid rgba(228,226,221,0.35)",
                  boxShadow: "inset 0 8px 16px rgba(255,255,255,0.3)",
                }}
                initial={{ y: 0, scale: 1, opacity: 0 }}
                animate={{
                  y:       [0, "-55vh", "-72vh", "-85vh", "-93vh"],
                  scale:   [1, 1.08,    1.25,    2.0,     3.5],
                  opacity: [0, 0.75,    0.65,    0.35,    0],
                }}
                transition={{ duration: 3.2, times: [0, 0.25, 0.55, 0.80, 1.0], ease: "easeOut" }}
              />
            )}

            {/* HeroPour glass */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[300px]"
              style={{ height: "clamp(220px, 40vh, 380px)" }}
            >
              <HeroPour className="w-full h-full" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="font-display italic text-[#E4E2DD] text-center mt-8"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
            >
              Stool reserved.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="font-sans text-[#E4E2DD]/50 text-center max-w-[380px] leading-relaxed mt-4"
              style={{ fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}
            >
              Your receipt is printing…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 2: Receipt on cream ────────────────────────────── */}
      {phase === 2 && (
        <div
          className="flex flex-col items-center pt-10 pb-8"
          style={{ paddingInline: "var(--pad-x)" }}
        >
          {/* "Stool reserved" stays visible above receipt */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-6"
          >
            <h1
              className="font-display italic text-[--ink]"
              style={{ fontSize: "clamp(1.75rem, 5vw, 3.5rem)" }}
            >
              Stool reserved.
            </h1>
            {fetchFailed && (
              <p className="font-mono text-[9px] text-[--ink]/40 uppercase tracking-widest mt-2">
                We couldn&apos;t load your receipt — but your order went through.{" "}
                <a href="mailto:hi@driptheka.com" className="underline hover:text-[--blue]">
                  Contact us
                </a>{" "}
                if you have questions.
              </p>
            )}
          </motion.div>

          {/* The receipt */}
          <Receipt
            orderNumber={orderNumber}
            customerName={orderData?.customerName}
            createdAt={orderData?.createdAt}
            items={receiptItems}
            subtotalPaise={receiptSubtotal}
            depositPaise={deposit}
            balancePaise={balance}
            animate={true}
          />
        </div>
      )}

      {/* Background grain */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none opacity-[0.03] -z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}
