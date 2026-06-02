"use client";

import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export default function CheckoutPage() {
  const { items, totalDeposit, totalFull, clearCart } = useCartStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#E4E2DD] flex items-center justify-center pt-20">
        <div className="text-center">
          <p className="font-display italic text-3xl text-[#141518]/30 mb-4">
            Your glass is empty.
          </p>
          <a
            href="/pour/pour-001"
            className="font-mono text-xs uppercase tracking-widest text-[#004AAD] border border-[#004AAD] px-6 py-2 hover:bg-[#004AAD] hover:text-[#E4E2DD] transition-all"
          >
            Fill it up
          </a>
        </div>
      </div>
    );
  }

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Load Razorpay SDK
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.head.appendChild(script);
        });
      }

      // Create order on server
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          email,
          phone,
          depositAmount: totalDeposit(),
          totalAmount: totalFull(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create order");

      const { orderId, amount } = await res.json() as { orderId: string; amount: number };

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount,
        currency: "INR",
        name: "Drip Theka",
        description: "Pour #001 — The First Round (30% Deposit)",
        order_id: orderId,
        prefill: { email, contact: phone },
        theme: { color: "#004AAD" },
        handler: async (response) => {
          // Verify payment on server
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          if (verifyRes.ok) {
            clearCart();
            router.push(`/checkout/confirmed?order=${orderId}`);
          } else {
            setError("Payment verification failed. Contact us.");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#E4E2DD] pt-28 pb-16 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left — form */}
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#004AAD] mb-2">
            Checkout
          </p>
          <h1 className="font-display italic text-4xl text-[#141518] mb-8">
            Pour It Out
          </h1>

          <form onSubmit={handleCheckout} className="space-y-5">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#141518]/50 mb-1.5 block">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@wherever.com"
                className="w-full bg-transparent border border-[#141518]/20 text-[#141518] placeholder-[#141518]/30 font-sans text-sm px-4 py-3 focus:outline-none focus:border-[#004AAD] transition-colors"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#141518]/50 mb-1.5 block">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-transparent border border-[#141518]/20 text-[#141518] placeholder-[#141518]/30 font-sans text-sm px-4 py-3 focus:outline-none focus:border-[#004AAD] transition-colors"
              />
            </div>

            <div className="pt-2 space-y-2 border-t border-[#141518]/10">
              <div className="flex justify-between">
                <span className="font-mono text-xs text-[#141518]/50 uppercase tracking-widest">
                  Full order value
                </span>
                <span className="font-mono text-sm text-[#141518]">
                  {formatPrice(totalFull())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-[#004AAD] uppercase tracking-widest">
                  Paying now (30%)
                </span>
                <span className="font-mono text-base font-bold text-[#004AAD]">
                  {formatPrice(totalDeposit())}
                </span>
              </div>
              <p className="font-mono text-[10px] text-[#141518]/30 leading-relaxed">
                Remaining 70% ({formatPrice(totalFull() - totalDeposit())}) collected when your drop ships.
              </p>
            </div>

            {error && (
              <p className="font-mono text-xs text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-mono text-xs uppercase tracking-widest bg-[#004AAD] text-[#E4E2DD] py-4 hover:bg-[#141518] transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? "Opening the bar..." : `Pay ${formatPrice(totalDeposit())} Now`}
            </button>

            <p className="font-mono text-[10px] text-[#141518]/30 text-center leading-relaxed">
              Secured by Razorpay. Your deposit locks your order.
            </p>
          </form>
        </div>

        {/* Right — order summary */}
        <div className="bg-[#141518] p-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#E4E2DD]/30 mb-6">
            What&apos;s In Your Glass
          </p>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${item.size}`}
                className="flex justify-between gap-4 pb-4 border-b border-[#E4E2DD]/10"
              >
                <div>
                  <p className="font-display italic text-[#E4E2DD]">
                    {item.product.name}
                  </p>
                  <p className="font-mono text-xs text-[#E4E2DD]/40 mt-0.5">
                    {item.size} · {item.colorName} · qty {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-[#E4E2DD]">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                  <p className="font-mono text-xs text-[#004AAD]">
                    {formatPrice(item.depositAmount * item.quantity)} now
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
