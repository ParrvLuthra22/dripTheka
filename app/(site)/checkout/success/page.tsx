// /checkout/success — cinematic order confirmation.
// The floating foam bubble is the only animation: drifts up, pops at the top. Once.

import dynamic from "next/dynamic";
import Link from "next/link";
import type { Metadata } from "next";
import { DROP_DATE } from "@/data/pour-001";
import { formatPrice } from "@/lib/utils/format";
import { SuccessClient } from "./SuccessClient";

export const metadata: Metadata = {
  title: "Stool Reserved — Drip Theka",
};

interface Props {
  searchParams: Promise<{
    orderId?: string;
    deposit?: string;
    total?:   string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const params  = await searchParams;
  const orderId = params.orderId ?? "DT-001-000";
  const deposit = Number(params.deposit ?? 0);
  const total   = Number(params.total   ?? 0);
  const balance = total - deposit;

  const dropStr = DROP_DATE.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return <SuccessClient
    orderId={orderId}
    deposit={deposit}
    balance={balance}
    dropStr={dropStr}
  />;
}
