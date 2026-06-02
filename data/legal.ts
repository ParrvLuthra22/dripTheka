// Hardcoded legal documents for V1 — /legal/[doc]
export type LegalDoc = {
  slug: "privacy" | "terms" | "returns";
  title: string;
  lastUpdated: string;
  body: string;
};

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    lastUpdated: "2024-12-01",
    body: `Drip Theka collects your email when you sign up for Last Call, and collects payment details (processed by Razorpay — we never see your card number) when you place a deposit order.

We use your email to send order confirmations, shipping updates, and Last Call newsletter editions (only if you opted in). We don't sell or share your data with third parties. We use PostHog and Google Analytics 4 for anonymous usage analytics.

You can request deletion of your data at any time by emailing us.`,
  },
  {
    slug: "terms",
    title: "Terms of Service",
    lastUpdated: "2024-12-01",
    body: `By placing a deposit order on Drip Theka, you agree to pay the remaining 70% balance when your order is ready to ship. If you fail to pay the balance within 7 days of the shipping notification, your order may be cancelled and your deposit forfeited.

All sales are final once shipped. We don't accept returns for change-of-mind. Defective items are covered — contact us within 7 days of receiving your order.`,
  },
  {
    slug: "returns",
    title: "Returns & Exchanges",
    lastUpdated: "2024-12-01",
    body: `We accept returns for defective or incorrect items within 7 days of delivery. Items must be unworn and unwashed with original tags attached.

Size exchanges are available subject to stock. We don't do refunds on deposits — your deposit locks your order and goes toward production.

To start a return or exchange, email us with your order number and photos of the issue.`,
  },
];

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}
