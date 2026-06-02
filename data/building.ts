// Hardcoded founder-journey posts — V1.1: lift into Neon + Drizzle

export type BuildingPost = {
  slug:    string;
  title:   string;
  date:    string; // ISO
  author:  "Ayaan" | "Parrv";
  excerpt: string;
  body:    string; // plain text, paragraph-separated; V1.1 will be MDX
  tags:    string[];
};

export const BUILDING_POSTS: BuildingPost[] = [
  {
    slug:   "first-sample-wrong",
    title:  "The first sample arrived. It was wrong.",
    date:   "2025-12-14",
    author: "Parrv",
    excerpt:
      "The cotton was 30GSM lighter than specced. The colour shifted under Delhi's afternoon light. We sent it back the same day.",
    body: `The courier arrived at 11am on a Tuesday. We'd been waiting three weeks.

The box was smaller than expected — which, in retrospect, should have been the first sign.

We pulled out the tee. The hand-feel was immediately off. Not bad, but not right. We'd specced 400GSM heavyweight cotton. This was closer to 360, maybe 370. You could feel the difference the moment you picked it up — that slight give in the fabric, the way it draped instead of falling clean.

Then we held it up to the window. Delhi's afternoon light does something specific to cobalt. The blue shifted. Not dramatically — but enough. Our reference was a Pantone match. This was running warm. More royal blue than cobalt. The difference matters.

We photographed everything, wrote a seven-paragraph brief, and sent it back the same afternoon.

Here's the thing about that day: it was the first time Drip Theka felt real. Not because we had a product — we didn't, not yet — but because we had a standard. We knew exactly what we didn't want, which meant we knew exactly what we did.

Three weeks of waiting, thirty minutes of evaluation, one box back to the vendor.

The second sample arrived on January 4th. It was right.`,
    tags: ["manufacturing", "quality"],
  },
  {
    slug:   "labels-47000",
    title:  "We spent ₹47,000 on labels. Worth it.",
    date:   "2026-01-08",
    author: "Ayaan",
    excerpt:
      "Printed woven vs woven woven. We went down a three-day rabbit hole on garment labelling. The answer cost more than we expected.",
    body: `Labels are the last thing customers think about and the first thing they notice when they own something.

We spent three days comparing label vendors. There are essentially two options at our scale: heat-transfer (cheap, looks cheap after wash 8), printed woven (middle ground), and jacquard woven (expensive, doesn't fade, doesn't crack, doesn't care about wash 800).

We were going to do printed woven. ₹12 per unit, minimum 1000 units, totally reasonable for a first drop of 200 pieces.

Then Parrv found this YouTube video from a Japanese streetwear archivist. He was pulling apart a Supreme x CDG piece from 2007 and talking about how you could identify bootlegs by the label quality. The authentic version had a jacquard woven label where the thread count created a slight 3D texture. The fake had a printed woven that looked identical at first glance but went flat after a few washes.

We decided on jacquard woven that afternoon. ₹47 per label, minimum 1000 units. ₹47,000 total for the run.

The label has "DRIP THEKA" in a font we commissioned. Below it: "Made in India · Pour 001 · 1 of 200". The thread is cream on cobalt.

When we got the final samples, we spent about twenty minutes just reading the label. We'd made something that lasted. That felt like something.`,
    tags: ["product", "craft"],
  },
  {
    slug:   "wine-glass-mark",
    title:  "How the wine glass became the mark.",
    date:   "2026-01-22",
    author: "Parrv",
    excerpt:
      "Late night, bad Wi-Fi, a notebook, and the question: what does a theka actually look like?",
    body: `We spent two weeks on logos.

Not that unusual. Most brands do. The difference was we kept rejecting everything that felt "streetwear brand" — the bold wordmarks, the geometric shapes, the icons that gestured at something edgy without committing to anything.

The breakthrough came at 2am on a Wednesday. We'd been at it for three hours, the notebook had about forty rejected concepts in it, and Ayaan said: what does a theka actually look like?

Not what does our brand look like. What does a theka — a corner establishment, a place people return to — look like?

We started listing things. A shutter. A stool. The smell of a certain kind of afternoon. The specific light that comes through a clouded window. A glass on a table.

A glass.

We'd been trying to design something that represented streetwear and youth and India and all these big heavy concepts. We'd been designing for the concept instead of the corner.

I drew a wine glass. Not a beer glass, not a chai cup — a wine glass, the kind you'd never actually find in a real theka, which is exactly the point. The incongruity is the joke. The aspirational vessel in the local setting. The cobalt cocktail at the neighbourhood joint.

The next morning I showed Ayaan. He stared at it for thirty seconds and said: that's it.

That's been the mark ever since. The wine glass. The brand mark that doesn't take itself too seriously.`,
    tags: ["design", "brand"],
  },
  {
    slug:   "three-manufacturers-no",
    title:  "Three manufacturers said no. One said yes.",
    date:   "2026-02-03",
    author: "Ayaan",
    excerpt:
      "Finding the right production partner when you're ordering 200 pieces is harder than it sounds. Here's what we learned.",
    body: `The industry minimum at most tier-1 factories is 500 units per style per colourway.

We had six styles, one colourway, and we wanted 200 of each. The math doesn't work for most factories. Too small to optimise, too demanding to ignore.

The first rejection came from a Tirupur factory with an excellent reputation. Polite email, essentially: "We appreciate the interest, please come back when you can do 1000 per style."

The second was a Delhi-NCR operation. They were willing to do 200, but the minimum quality standards were in the description, not the contract. The samples were mediocre in exactly the way you'd expect from a factory doing you a favour.

The third was a recommendation from a friend in the industry. They were doing great work for a mid-size brand. They met with us, seemed interested, and then went quiet. Three weeks of follow-up emails. Nothing.

The fourth was different. A small operation in Gurgaon. Fifteen workers. The owner, a man named Suresh, answered his own phone. He asked us three questions before we'd finished explaining the project:

One: What's your fabric source? Two: What's the label type? Three: What happens if the first batch is wrong?

That third question. Nobody had asked us that.

We signed with Suresh in February. He's making Pour #001. Every piece is quality-checked twice — once off the machine, once after wash. We're on a first-name basis with the floor supervisor.

That's the right manufacturing partner.`,
    tags: ["manufacturing", "india"],
  },
  {
    slug:   "opening-night-scheduled",
    title:  "Opening Night, scheduled.",
    date:   "2026-03-01",
    author: "Parrv",
    excerpt:
      "We set the date. There's something clarifying about that. Everything before was potential. Now it's a countdown.",
    body: `For a long time, Opening Night was a concept. A thing we were building toward, a point on the horizon.

Then we picked a date.

September 1st, 2026. 6pm IST. Pour #001 goes live.

There's something that happens when you set a date. Everything before it becomes load-bearing. Every decision has a deadline. Every delay has a cost. The vagueness goes away and the real work starts.

We've been in the real work phase for about a month now. Pre-launch reservations open sometime in July. The production run is confirmed. Suresh's team starts on the fabric next week. The labels are done, sitting in a box in my apartment.

People ask what Opening Night actually is. Is it a party? A drop? An event?

All three. We're opening the doors on the site, and we're opening actual doors somewhere in Delhi. Details forthcoming. The invite list is building. If you're reading this, you might be on it.

What I want Opening Night to feel like is a first round. Not a launch event. Not a product launch. The first drink at a new place you've found. The moment before you know if it's going to be good — and the moment after, when you know it is.

See you September 1st.`,
    tags: ["milestone", "opening-night"],
  },
];

export function getBuildingPost(slug: string): BuildingPost | undefined {
  return BUILDING_POSTS.find((p) => p.slug === slug);
}

export function getAdjacentPosts(slug: string) {
  const idx  = BUILDING_POSTS.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0                         ? BUILDING_POSTS[idx - 1] : null,
    next: idx < BUILDING_POSTS.length - 1 ? BUILDING_POSTS[idx + 1] : null,
  };
}

export function readingTime(body: string): string {
  const mins = Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 200));
  return `${mins} min read`;
}
