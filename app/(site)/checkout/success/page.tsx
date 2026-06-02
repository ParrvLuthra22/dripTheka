// /checkout/success — cinematic order confirmation.
// The floating foam bubble is the only animation: drifts up, pops at the top. Once.

import type { Metadata } from "next";
import { DROP_DATE } from "@/data/pour-001";
import { SuccessClient } from "./SuccessClient";

export const metadata: Metadata = {
  title: "Stool Reserved — Drip Theka",
};

interface Props {
  searchParams: Promise<{
    orderNumber?: string;
    orderId?:     string; // legacy param kept for safety
    deposit?:     string;
    total?:       string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const params      = await searchParams;
  // Accept both new (orderNumber) and old (orderId) params for resilience
  const orderNumber = params.orderNumber ?? params.orderId ?? "DT-2026-00001";
  const deposit     = Number(params.deposit ?? 0);
  const total       = Number(params.total   ?? 0);
  const balance     = total - deposit;

  const dropStr = DROP_DATE.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <SuccessClient
      orderId={orderNumber}
      deposit={deposit}
      balance={balance}
      dropStr={dropStr}
    />
  );
}
