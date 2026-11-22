import type { Metadata } from "next";
import { DROP_DATE } from "@/lib/config";
import { SuccessClient } from "./SuccessClient";

interface Props {
  searchParams: Promise<{
    orderNumber?: string;
    orderId?:     string;
    deposit?:     string;
    total?:       string;
  }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params      = await searchParams;
  const orderNumber = params.orderNumber ?? params.orderId ?? "DT-2026-XXXXX";
  const deposit     = params.deposit ?? "0";
  const total       = params.total   ?? "0";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://driptheka.com";
  const ogUrl   = `${siteUrl}/api/og/receipt?orderNumber=${orderNumber}&deposit=${deposit}&total=${total}`;

  return {
    title: `Order ${orderNumber} — Drip Theka`,
    description:
      "Your reservation is locked. 30% deposit confirmed. The bar will call when Opening Night drops.",
    openGraph: {
      title:       `I just copped from Drip Theka 🍷`,
      description: `Order ${orderNumber} — stool reserved. See the full receipt.`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `Drip Theka receipt for ${orderNumber}` }],
      type: "website",
    },
    twitter: {
      card:        "summary_large_image",
      title:       `I just copped from Drip Theka 🍷`,
      description: `Order ${orderNumber} — stool reserved.`,
      images:      [ogUrl],
    },
  };
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const params      = await searchParams;
  const orderNumber = params.orderNumber ?? params.orderId ?? "DT-2026-00001";
  const deposit     = Number(params.deposit ?? 0);
  const total       = Number(params.total   ?? 0);

  const dropStr = DROP_DATE.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <SuccessClient
      orderNumber={orderNumber}
      deposit={deposit}
      total={total}
      dropStr={dropStr}
    />
  );
}
