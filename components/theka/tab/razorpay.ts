// Razorpay Standard Checkout, loaded only when a visitor reaches the deposit step (nothing on first paint).

interface RazorpayCtor { new (options: Record<string, unknown>): { open(): void; on(event: string, fn: (r: unknown) => void): void } }
const sdk = (): RazorpayCtor | undefined => (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;

let loading: Promise<RazorpayCtor> | null = null;

export function loadRazorpay(): Promise<RazorpayCtor> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const have = sdk();
  if (have) return Promise.resolve(have);
  loading ??= new Promise<RazorpayCtor>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "https://checkout.razorpay.com/v1/checkout.js";
    el.async = true;
    el.onload = () => { const c = sdk(); if (c) resolve(c); else reject(new Error("Razorpay missing")); };
    el.onerror = () => { loading = null; el.remove(); reject(new Error("Failed to load Razorpay SDK")); };
    document.body.appendChild(el);
  });
  return loading;
}
