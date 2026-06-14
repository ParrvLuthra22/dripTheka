"use client";

// Account page — /account
// Shows user profile, their reservations/orders, and referral code.
// Requires sign-in — redirects to /login if not authenticated.

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils/format";
import { getBadge, getBadgeProgress } from "@/lib/utils/copy";
import { WineGlassMark } from "@/components/glass/WineGlassMark";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  depositPaise: number;
  balancePaise: number;
  createdAt: string;
};

type ReferralData = {
  code: string | null;
  redemptions: number;
  redeemedBy: { firstName: string; city: string }[];
};

const CONFIRMED_STATUSES = new Set(["deposit_paid", "fulfilled"]);

const STATUS_LABEL: Record<string, string> = {
  pending:       "Pending",
  deposit_paid:  "Deposit Paid ✓",
  drop_unlocked: "Drop Live — Pay Balance",
  fulfilled:     "Shipped",
  refunded:      "Refunded",
  cancelled:     "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  pending:       "text-[--cream]/40",
  deposit_paid:  "text-[--blue]",
  drop_unlocked: "text-[#CCFF00]",
  fulfilled:     "text-[--cream]/60",
  refunded:      "text-[--cream]/30",
  cancelled:     "text-[--cream]/20",
};

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders]       = useState<OrderRow[]>([]);
  const [referral, setReferral]   = useState<ReferralData>({ code: null, redemptions: 0, redeemedBy: [] });
  const [copied, setCopied]       = useState(false);
  const [signOutPending, setSOP]  = useState(false);
  const [showRedeemed, setShowRedeemed] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch user's orders (if DB connected)
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/account/orders`)
      .then(r => r.json())
      .then((data: OrderRow[]) => setOrders(data))
      .catch(() => {});
  }, [session?.user?.email]);

  // Fetch referral code + redemptions
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/account/referrals`)
      .then(r => r.json())
      .then((data: ReferralData) => setReferral(data))
      .catch(() => {});
  }, [session?.user?.email]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--cream]">
        <div className="w-6 h-6 border-2 border-[--ink]/20 border-t-[--ink] rounded-full animate-spin" />
      </div>
    );
  }

  const user = session?.user;
  // Derive initials from name
  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  // Regular Status — based on confirmed orders only
  const confirmedOrderCount = orders.filter(o => CONFIRMED_STATUSES.has(o.status)).length;
  const badge       = getBadge(confirmedOrderCount);
  const progress    = getBadgeProgress(confirmedOrderCount);
  const tierPercent = progress ? progress.percent : 100;
  const referralCode = referral.code ?? "DRIPXXXX";

  return (
    <div data-nav-tone="dark" className="bg-[--cream] min-h-screen">
      <div style={{ paddingInline: "var(--pad-x)" }} className="py-16 md:py-24 max-w-[1000px] mx-auto space-y-12">

        {/* ── Profile header ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-start justify-between gap-6 pb-10 border-b border-[--ink]/10"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={64}
                height={64}
                className="rounded-full border-2 border-[--ink]/10"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full bg-[--blue] flex items-center justify-center text-[--cream] font-display italic font-bold text-2xl"
              >
                {initials}
              </div>
            )}

            <div>
              <h1 className="font-display italic text-[--ink] leading-tight"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}>
                {user?.name?.split(" ")[0] ?? "Regular"}.
              </h1>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/40 mt-1">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={async () => { setSOP(true); await signOut({ callbackUrl: "/" }); }}
            disabled={signOutPending}
            data-hover
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/30 hover:text-[--ink] transition-colors"
          >
            {signOutPending ? "Leaving…" : "Sign out"}
          </button>
        </motion.div>

        {/* ── Regular Status badge ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="bg-(--ink) text-(--cream) p-6 md:p-8"
        >
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-(--cream)/30">
                Regular Status
              </p>
              <p
                className="font-tanker uppercase text-(--cream) leading-none"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
              >
                {badge.label}
              </p>
              {badge.perk && (
                <p
                  className="font-display italic text-(--cream)/60"
                  style={{ fontSize: "clamp(0.9rem, 1.6vw, 1.1rem)" }}
                >
                  {badge.perk}
                </p>
              )}
            </div>
            <WineGlassMark
              size={48}
              liquid={tierPercent}
              liquidColor="var(--blue)"
              color="var(--cream)"
              className="shrink-0"
            />
          </div>

          {/* Progress toward next tier */}
          <div className="mt-6 space-y-2">
            <div className="h-1.5 bg-(--cream)/10 overflow-hidden">
              <div
                className="h-full bg-(--blue) transition-[width] duration-700 ease-out"
                style={{ width: `${tierPercent}%` }}
              />
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-(--cream)/40">
              {progress
                ? `${progress.current} of ${progress.target} orders to ${progress.nextLabel}`
                : "you've made it. cheers."}
            </p>
          </div>

          {/* Referral count */}
          <div className="mt-6 pt-6 border-t border-(--cream)/10">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--cream)/50">
              you&apos;ve brought {referral.redemptions} regular{referral.redemptions === 1 ? "" : "s"} to the theka
              {" · "}
              {referral.redemptions > 0 ? "cheers." : "time to spread the word."}
            </p>

            {referral.redeemedBy.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowRedeemed((v) => !v)}
                  data-hover
                  className="font-mono text-[9px] uppercase tracking-[0.14em] text-(--blue) hover:text-(--cream) transition-colors"
                >
                  {showRedeemed ? "hide ↑" : "you brought these regulars in →"}
                </button>
                <AnimatePresence initial={false}>
                  {showRedeemed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-3 space-y-1.5">
                        {referral.redeemedBy.map((r, i) => (
                          <li key={i} className="font-mono text-[10px] text-(--cream)/50">
                            {r.firstName} · {r.city}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Referral code card ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[--ink] text-[--cream] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
        >
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--cream]/30 mb-2">
              Your referral code
            </p>
            <p className="font-mono text-2xl tracking-[0.2em] text-[--cream]">
              {referralCode}
            </p>
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[--cream]/25 mt-1.5">
              Share for a Happy Hour
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(referralCode, setCopied)}
            data-hover
            className="font-mono text-[9px] uppercase tracking-[0.14em] border border-[--cream]/25 text-[--cream] px-4 py-2 hover:bg-[--cream] hover:text-[--ink] transition-all duration-200 whitespace-nowrap"
          >
            {copied ? "Copied ✓" : "Copy Code"}
          </button>
        </motion.div>

        {/* ── Orders ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--ink]/30 mb-6">
            Your Pours
          </p>

          {orders.length === 0 ? (
            <div className="py-12 text-center border border-[--ink]/8">
              <p className="font-display italic text-[--ink]/30"
                style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}>
                Empty glass.
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[--ink]/20 mt-2">
                No reservations yet.
              </p>
              <Link
                href="/pour/pour-001"
                data-hover
                className="inline-block mt-5 font-mono text-[9px] uppercase tracking-[0.14em] border border-[--blue] text-[--blue] px-4 py-2 hover:bg-[--blue] hover:text-[--cream] transition-all"
              >
                Browse Pour #001 →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[--ink]/8">
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="py-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-mono text-sm text-[--ink] tabular-nums">
                      {order.orderNumber}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[--ink]/30 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`font-mono text-[9px] uppercase tracking-widest ${STATUS_COLOR[order.status] ?? "text-[--ink]/40"}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </p>
                    <p className="font-mono text-xs text-[--ink]/50 tabular-nums mt-0.5">
                      {formatPrice(order.depositPaise)} paid · {formatPrice(order.balancePaise)} due
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Quick links ──────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-[--ink]/8">
          {[
            { label: "Browse Pour #001", href: "/pour/pour-001" },
            { label: "My Regulars Code", href: "/regulars" },
            { label: "Contact Us",       href: "mailto:hi@driptheka.com" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              data-hover
              className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/40 hover:text-[--blue] transition-colors"
            >
              {label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
