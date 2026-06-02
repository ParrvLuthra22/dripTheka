// Hardcoded journal posts for /building — V1 has no CMS
// V1.1: lift into Neon + Drizzle

export type BuildingPost = {
  slug: string;
  title: string;
  date: string; // ISO
  excerpt: string;
  body: string; // markdown-lite or plain text for V1
  tags: string[];
};

export const BUILDING_POSTS: BuildingPost[] = [
  {
    slug: "why-we-exist",
    title: "Why We Exist",
    date: "2024-11-01",
    excerpt:
      "We made 200 pieces because we could. We started a brand because we were bored of waiting for someone else to.",
    body: `Indian streetwear has been waiting. Waiting for someone to take it seriously without taking themselves too seriously.

We're not that brand that posts "limited drop soon 🔥" for six months and ships a mediocre tee. We're also not a heritage label cosplaying as a startup.

Drip Theka is simpler than that. We like good clothes, good copy, and good parties. This is the intersection of all three.

Pour #001 is six pieces. Cobalt, cream, ink. 200 of each. When it's done, it's Tapped Out. No restocks. No waiting lists. You either got it or you didn't.

That's the whole idea.`,
    tags: ["brand", "philosophy"],
  },
  {
    slug: "the-deposit-model",
    title: "Why We Do 30% Deposits",
    date: "2024-11-15",
    excerpt:
      "We're not taking your full money upfront. Here's why — and why it's better for everyone.",
    body: `Most drops work like this: you pay full price, they collect cash, they start production, you wait. Sometimes six weeks. Sometimes never.

We flipped it.

You pay 30% to lock your piece. We produce exactly what's reserved — no dead stock, no waste, no guessing. When your order ships, you pay the remaining 70%.

It means we're accountable. If we don't ship, we don't get paid. Simple.`,
    tags: ["model", "transparency"],
  },
];

export function getBuildingPost(slug: string): BuildingPost | undefined {
  return BUILDING_POSTS.find((p) => p.slug === slug);
}
