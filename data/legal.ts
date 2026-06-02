// Hardcoded legal documents for V1 — /legal/[doc]

export type LegalDocSlug = "privacy" | "terms" | "returns" | "shipping";

export type LegalSection = {
  num:   string;
  head:  string;
  body:  string;
};

export type LegalDoc = {
  slug:        LegalDocSlug;
  title:       string;
  lastUpdated: string;
  intro:       string;
  sections:    LegalSection[];
};

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug:        "privacy",
    title:       "Privacy Policy",
    lastUpdated: "2026-01-01",
    intro:       "What we collect, why we collect it, and what we do with it.",
    sections: [
      {
        num:  "1.1",
        head: "What we collect",
        body: "We collect your email address when you sign up for Last Call or place a deposit order. We collect your name, phone number, and shipping address when you check out. We never see your card number — payments are handled entirely by Razorpay.",
      },
      {
        num:  "1.2",
        head: "How we use it",
        body: "Your email is used to send order confirmations, shipping updates, and Last Call newsletters (only if you opted in). Your shipping details are used solely to fulfil your order. We do not sell, rent, or trade your personal data.",
      },
      {
        num:  "1.3",
        head: "Analytics",
        body: "We use PostHog and Google Analytics 4 for anonymous usage analytics. These tools collect aggregate data about page visits and interactions. No personally identifiable information is shared with these services beyond what is standard for web analytics.",
      },
      {
        num:  "1.4",
        head: "Your rights",
        body: "You can request access to, correction of, or deletion of your data at any time by emailing us. We will respond within 30 days. If you subscribed to Last Call, every email includes an unsubscribe link.",
      },
    ],
  },
  {
    slug:        "terms",
    title:       "Terms of Service",
    lastUpdated: "2026-01-01",
    intro:       "By using Drip Theka and placing an order, you agree to the following.",
    sections: [
      {
        num:  "2.1",
        head: "The deposit model",
        body: "When you place an order, you pay 30% of the item price as a deposit. This deposit locks your order and initiates production. The remaining 70% is collected when your order is ready to ship. By paying the deposit, you commit to paying the balance.",
      },
      {
        num:  "2.2",
        head: "Balance payment",
        body: "We will notify you by email when your order is ready to ship. You will have 7 days from that notification to pay the balance. If payment is not received within 7 days, your order may be cancelled and your deposit forfeited.",
      },
      {
        num:  "2.3",
        head: "Final sales",
        body: "All sales are final once the order has shipped. We do not accept returns for change of mind. If you receive a defective or incorrect item, please contact us within 7 days of delivery — we will make it right.",
      },
      {
        num:  "2.4",
        head: "Limited runs",
        body: "All Drip Theka products are limited edition. We do not restock sold-out items. Quantities stated on product pages are final.",
      },
    ],
  },
  {
    slug:        "returns",
    title:       "Returns & Exchanges",
    lastUpdated: "2026-01-01",
    intro:       "We stand behind what we make. Here's how returns and exchanges work.",
    sections: [
      {
        num:  "3.1",
        head: "Eligible returns",
        body: "We accept returns for defective items, items with manufacturing defects, or items that were incorrectly fulfilled (wrong size, wrong colour). Items must be unworn, unwashed, and have original tags attached. Contact us within 7 days of receiving your order.",
      },
      {
        num:  "3.2",
        head: "Size exchanges",
        body: "Size exchanges are available subject to stock availability. Because our runs are limited, we cannot guarantee your preferred size will be available for exchange. If your size is unavailable, we will issue a credit.",
      },
      {
        num:  "3.3",
        head: "Deposits are non-refundable",
        body: "Your 30% deposit locks your order and goes directly toward production. Deposits are non-refundable except in the event that we are unable to fulfil your order.",
      },
      {
        num:  "3.4",
        head: "How to start a return",
        body: "Email us with your order number, a description of the issue, and photographs. We respond within 48 hours. Do not ship items back without confirmation from us first.",
      },
    ],
  },
  {
    slug:        "shipping",
    title:       "Shipping Policy",
    lastUpdated: "2026-01-01",
    intro:       "V1 ships within India only. International shipping is on the roadmap for Pour #002.",
    sections: [
      {
        num:  "4.1",
        head: "How shipping works",
        body: "We ship via a tracked courier service. Shipping charges are calculated based on your pincode and order weight, and will be confirmed when your order is ready to ship. You pay shipping alongside the 70% balance — not at checkout.",
      },
      {
        num:  "4.2",
        head: "Delivery timeline",
        body: "Orders ship within 5 business days of Opening Night, once the balance is paid. Delivery typically takes 2–5 business days after dispatch, depending on your location. A tracking link will be emailed to you when your order ships.",
      },
      {
        num:  "4.3",
        head: "India only (V1)",
        body: "Pour #001 ships within India only. We cover all major pincodes. If your pincode is not serviceable, we will notify you before you pay the balance and issue a full refund of your deposit.",
      },
      {
        num:  "4.4",
        head: "International",
        body: "International shipping is planned for Pour #002. Join the Regulars list to be notified when it opens.",
      },
    ],
  },
];

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}
