"use client";

// Checkout — single-page, no multi-step.
// Zod validation → Razorpay order → Razorpay checkout → /checkout/success.

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/format";
import { ProductIllustration } from "@/components/sections/ProductIllustration";
import Link from "next/link";
import { copy } from "@/data/copy";
import { pickRandom } from "@/lib/utils/copy";

// ── Zod schema — error messages from copy.ts ──────────────────────────────────
const schema = z.object({
  email:    z.string().email(copy.forms.errors.badEmail),
  name:     z.string().min(2,  copy.forms.errors.missingField),
  phone:    z.string()
              .regex(/^[6-9]\d{9}$/, copy.forms.errors.badPhone),
  address1: z.string().min(5, copy.forms.errors.missingField),
  address2: z.string().optional(),
  city:     z.string().min(2, copy.forms.errors.missingField),
  state:    z.string().min(2, copy.forms.errors.missingField),
  pincode:  z.string()
              .regex(/^\d{6}$/, copy.forms.errors.badPincode),
});

type FormData = z.infer<typeof schema>;
type Errors   = Partial<Record<keyof FormData, string>>;

// ── Indian states ─────────────────────────────────────────────────────────────
const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  // UTs
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli",
  "Daman & Diu","Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

// ── Razorpay types ────────────────────────────────────────────────────────────
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id:   string;
  razorpay_signature:  string;
}

declare global {
  interface Window {
    Razorpay: new (opts: object) => { open: () => void };
  }
}

async function loadRazorpaySDK(): Promise<void> {
  if (typeof window === "undefined" || window.Razorpay) return;
  return new Promise((resolve, reject) => {
    const script  = document.createElement("script");
    script.src    = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror= () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label, name, error, children,
}: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/45"
      >
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-mono text-[9px] text-red-500 uppercase tracking-widest"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const INPUT_BASE =
  "w-full bg-transparent border border-[--ink]/20 focus:border-[--ink] " +
  "font-sans text-sm text-[--ink] placeholder-[--ink]/25 " +
  "px-3 py-2.5 outline-none transition-colors duration-200";

// ── 3D tilt on hover — "Your Glass" panel (gentle, large surface) ──────────
function onPanelMove(e: React.MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width  - 0.5;
  const y = (e.clientY - rect.top)  / rect.height - 0.5;
  el.style.transform = `perspective(1400px) rotateX(${-y * 3}deg) rotateY(${x * 4}deg)`;
}
function onPanelLeave(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = "perspective(1400px) rotateX(0deg) rotateY(0deg)";
}

const SECTION_VARIANTS = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalFull, totalDeposit, clearCart } = useCartStore();

  const [form, setForm] = useState<FormData>({
    email: "", name: "", phone: "",
    address1: "", address2: "", city: "", state: "", pincode: "",
  });
  const [errors,  setErrors]  = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [payErr,  setPayErr]  = useState("");

  // If cart empty — redirect to cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[--cream] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-display italic text-3xl text-[--ink]/30">{copy.cart.empty}</p>
          <Link href="/cart"
            className="font-mono text-[10px] uppercase tracking-widest border border-[--blue] text-[--blue] px-5 py-2 hover:bg-[--blue] hover:text-[--cream] transition-all">
            {copy.cta.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  // ── Field handler ─────────────────────────────────────────────────────────
  function handle(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((er) => { const n = { ...er }; delete n[name as keyof FormData]; return n; });
    }
  }

  // ── Submit → Razorpay ────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPayErr("");

    // Validate
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: Errors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormData;
        if (!errs[key]) errs[key] = issue.message;
      });
      setErrors(errs);
      // Scroll to first error
      const firstField = document.querySelector("[data-error]") as HTMLElement | null;
      firstField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);

    try {
      // 1. Create reservation + Razorpay order in one call
      const reserveRes = await fetch("/api/reserve", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email: form.email,
          name:  form.name,
          phone: form.phone,
          address: {
            line1:   form.address1,
            line2:   form.address2 || undefined,
            city:    form.city,
            state:   form.state,
            pincode: form.pincode,
          },
          items: items.map((i) => ({
            slug: i.product.slug,
            size: i.size,
            qty:  i.quantity,
          })),
        }),
      });

      if (!reserveRes.ok) {
        const { error } = await reserveRes.json() as { error: string };
        throw new Error(error ?? copy.forms.errors.networkError);
      }

      const { reservationId, razorpayOrderId, depositPaise, keyId } =
        await reserveRes.json() as {
          reservationId:   string;
          razorpayOrderId: string;
          depositPaise:    number;
          keyId:           string;
        };

      // 2. Load Razorpay SDK
      await loadRazorpaySDK();

      // 3. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key:         keyId,
        amount:      depositPaise,
        currency:    "INR",
        name:        "Drip Theka",
        description: "Pour #001 — 30% Deposit",
        order_id:    razorpayOrderId,
        prefill: {
          name:    form.name,
          email:   form.email,
          contact: form.phone,
        },
        notes: {
          city:    form.city,
          pincode: form.pincode,
        },
        theme: { color: "#004AAD" },

        handler: async (response: RazorpayResponse) => {
          // 4. Confirm payment — verifies signature + updates DB
          const confirmRes = await fetch("/api/reserve/confirm", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              reservationId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          });

          if (confirmRes.ok) {
            const { orderNumber } = await confirmRes.json() as { orderNumber: string };
            clearCart();
            router.push(
              `/checkout/success?orderNumber=${orderNumber}` +
              `&deposit=${depositPaise}` +
              `&total=${totalFull()}`
            );
          } else {
            setPayErr(copy.forms.errors.paymentFailed);
            setLoading(false);
          }
        },

        modal: { ondismiss: () => setLoading(false) },
      });

      rzp.open();

    } catch (err) {
      setPayErr(err instanceof Error ? err.message : copy.forms.errors.genericError);
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div data-nav-tone="dark" className="bg-[--cream] min-h-screen py-12 md:py-20" style={{ paddingInline: "var(--pad-x)" }}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-20">

        {/* LEFT — form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-12">
          <motion.div
            initial={SECTION_VARIANTS.initial}
            animate={SECTION_VARIANTS.animate}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/30 mb-2">
              Checkout
            </p>
            <h1 className="font-display italic text-[--ink]"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              Pour it out.
            </h1>
          </motion.div>

          {/* ── Section 1: Contact ──────────────────────────────────── */}
          <motion.section
            initial={SECTION_VARIANTS.initial}
            whileInView={SECTION_VARIANTS.animate}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--ink] border-b border-[--ink]/10 pb-2">
              01 · Contact
            </p>
            <Field label="Email *" name="email" error={errors.email}>
              <input
                id="email" name="email" type="email" required
                value={form.email} onChange={handle}
                placeholder={copy.forms.placeholders.email}
                autoComplete="email"
                data-error={errors.email ? true : undefined}
                className={INPUT_BASE}
              />
            </Field>
          </motion.section>

          {/* ── Section 2: Shipping ─────────────────────────────────── */}
          <motion.section
            initial={SECTION_VARIANTS.initial}
            whileInView={SECTION_VARIANTS.animate}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--ink] border-b border-[--ink]/10 pb-2">
              02 · Shipping
            </p>

            <Field label="Full name *" name="name" error={errors.name}>
              <input id="name" name="name" type="text" required
                value={form.name} onChange={handle}
                placeholder={copy.forms.placeholders.name}
                autoComplete="name"
                className={INPUT_BASE} />
            </Field>

            <Field label="Phone (10-digit Indian mobile) *" name="phone" error={errors.phone}>
              <input id="phone" name="phone" type="tel" required
                value={form.phone} onChange={handle}
                placeholder={copy.forms.placeholders.phone}
                autoComplete="tel"
                inputMode="numeric"
                className={INPUT_BASE} />
            </Field>

            <Field label="Address line 1 *" name="address1" error={errors.address1}>
              <input id="address1" name="address1" type="text" required
                value={form.address1} onChange={handle}
                placeholder={copy.forms.placeholders.addressLine1}
                autoComplete="address-line1"
                className={INPUT_BASE} />
            </Field>

            <Field label="Address line 2 (optional)" name="address2" error={errors.address2}>
              <input id="address2" name="address2" type="text"
                value={form.address2 ?? ""} onChange={handle}
                placeholder="Locality / Area (optional)"
                autoComplete="address-line2"
                className={INPUT_BASE} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="City *" name="city" error={errors.city}>
                <input id="city" name="city" type="text" required
                  value={form.city} onChange={handle}
                  placeholder={copy.forms.placeholders.city}
                  autoComplete="address-level2"
                  className={INPUT_BASE} />
              </Field>

              <Field label="Pincode *" name="pincode" error={errors.pincode}>
                <input id="pincode" name="pincode" type="text" required
                  value={form.pincode} onChange={handle}
                  placeholder={copy.forms.placeholders.pincode}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={6}
                  className={INPUT_BASE} />
              </Field>
            </div>

            <Field label="State *" name="state" error={errors.state}>
              <select id="state" name="state" required
                value={form.state} onChange={handle}
                className={INPUT_BASE + " cursor-pointer"}
              >
                <option value="" disabled>Select state / UT</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </motion.section>

          {/* Payment error */}
          {payErr && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-red-300 bg-red-50 p-4"
            >
              <p className="font-mono text-[9px] text-red-600 uppercase tracking-widest">{payErr}</p>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            data-hover-big
            className="w-full py-5 font-mono text-xs uppercase tracking-[0.18em] bg-[#CCFF00] text-[#141518] border-2 border-[#141518] shadow-[5px_5px_0_0_#141518] hover:shadow-[2px_2px_0_0_#141518] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[5px] active:translate-y-[5px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
          >
            {loading
              ? pickRandom(copy.loading.checkout)
              : `Pay ${formatPrice(totalDeposit())} now → Razorpay`}
          </button>

          <p className="font-mono text-[9px] text-[--ink]/25 text-center uppercase tracking-[0.1em]">
            Secured by Razorpay · India&apos;s most trusted payment gateway
          </p>
        </form>

        {/* RIGHT — Your Glass (sticky order summary, gentle 3D tilt on hover) */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:h-fit"
        >
          <div
            onMouseMove={onPanelMove}
            onMouseLeave={onPanelLeave}
            className="bg-[--ink] p-6 space-y-5"
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 0.4s cubic-bezier(.2,.9,.3,1)",
              willChange: "transform",
            }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--cream]/30">
              Your Glass
            </p>

            {/* Items */}
            <div className="space-y-4">
              {items.map((item) => {
                const primary = item.product.colors[0];
                const accent  = item.product.colors[1] ?? "#E4E2DD";
                return (
                  <div key={`${item.product.id}-${item.size}`}
                    className="flex items-center gap-3 pb-4 border-b border-[--cream]/8">
                    <div className="w-10 h-12 shrink-0 overflow-hidden"
                      style={{ backgroundColor: primary }}>
                      <ProductIllustration
                        type={item.product.type}
                        primaryColor={primary}
                        accentColor={accent}
                        className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display italic text-[--cream] text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="font-mono text-[8px] uppercase tracking-widest text-[--cream]/35 mt-0.5">
                        {item.size} · qty {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-[--cream] tabular-nums">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                      <p className="font-mono text-[8px] text-[--blue] tabular-nums">
                        {formatPrice(item.depositAmount * item.quantity)} now
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[--cream]/40">
                  Full order
                </span>
                <span className="font-mono text-xs text-[--cream]/60 tabular-nums">
                  {formatPrice(totalFull())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[--blue]">
                  Deposit (30%)
                </span>
                <span className="font-mono text-sm font-bold text-[--blue] tabular-nums">
                  {formatPrice(totalDeposit())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[--cream]/25">
                  Balance due
                </span>
                <span className="font-mono text-xs text-[--cream]/30 tabular-nums">
                  {formatPrice(totalFull() - totalDeposit())}
                </span>
              </div>
            </div>

            <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[--cream]/20 leading-relaxed">
              Remaining balance collected on Opening Night · No charges now beyond the deposit
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
