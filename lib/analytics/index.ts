// Analytics helpers — thin wrappers over PostHog + GA4
// GA4 events go through @next/third-parties/google; PostHog through posthog-js.

export type AnalyticsEvent =
  | { name: "add_to_glass"; product_id: string; product_name: string; size: string; price: number }
  | { name: "begin_checkout"; total: number; items: number }
  | { name: "purchase"; order_id: string; total: number; deposit: number }
  | { name: "subscribe_regulars"; source: string }
  | { name: "hangover_entered" }
  | { name: "hangover_dismissed_yes" }
  | { name: "hangover_dismissed_no" }
  | { name: "hangover_recovered" }
  | { name: "drunk_scroll_triggered" };

/** Fire a typed event to PostHog (client-side). */
export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  const { name, ...props } = event;
  // PostHog
  if ((window as unknown as { posthog?: { capture: (n: string, p: object) => void } }).posthog) {
    (window as unknown as { posthog: { capture: (n: string, p: object) => void } }).posthog.capture(name, props);
  }
  // GA4 via dataLayer
  if ((window as unknown as { dataLayer?: unknown[] }).dataLayer) {
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push({ event: name, ...props });
  }
}
