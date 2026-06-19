# Drip Theka

> *Serving fits, not drinks.*

Drip Theka is a streetwear brand storefront for Gen Z India. The product is clothing. The actual product is belonging. This is the complete V1 web experience — from an immersive animated frontend to Razorpay-powered deposit checkout.

**Live:** [driptheka.com](https://driptheka.com)

---

## Features

- **Immersive animations** — GSAP ScrollTrigger, Framer Motion page transitions, Three.js WebGL hero, Lenis smooth scroll, custom cursor with contextual states
- **Sound design** — Howler.js audio system (pour, clink, ambient loop) with audio-reactive CSS variables
- **30% deposit checkout** — Razorpay integration with deposit/balance split, HMAC signature verification, live fill bar showing reservation progress
- **Google OAuth** — NextAuth v5 with Drizzle adapter, database-backed sessions, guest checkout support
- **Referral system** — Unique codes for "Regulars" (newsletter subscribers), tracked redemptions
- **Brand language** — Everything speaks theka: cart is "Your Glass," sold out is "Tapped Out," collections are "Pours"
- **Easter eggs** — Type "theka" for a toast, Konami code for Happy Hour mode, scroll-to-bottom founder message

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Framework** | Next.js 16, React 19, TypeScript (strict) |
| **Styling** | Tailwind CSS 4, CSS variables for design tokens |
| **Animation** | GSAP, Framer Motion, React Three Fiber, Lenis |
| **Database** | Neon Postgres (serverless), Drizzle ORM |
| **Auth** | NextAuth v5, Google OAuth, @auth/drizzle-adapter |
| **Payments** | Razorpay (INR, deposit model) |
| **Email** | Klaviyo (lists + event tracking) |
| **Analytics** | PostHog, Google Analytics 4 |
| **Hosting** | Vercel (ISR + Edge) |

## Project Structure

```
app/
  (site)/             Pages: home, product, cart, checkout, story, account, etc.
  api/                Reserve, confirm, regulars, auth, admin endpoints
components/
  ui/                 Button, Cursor, ProductCard, Marquee, etc.
  glass/              Brand marks: WineGlass, PintGlass, MorphingLogo, HeroPour
  sections/           Page sections: Hero, Nav, Footer, product layout
  motion/             Animation primitives: ScrambleText, Reveal, TypeOnScroll
  sound/              Howler provider + toggle
  transitions/        Route transition overlays
  layout/             Easter eggs, loading screen
lib/
  db/                 Drizzle schema (12 tables) + Neon client
  store/              Zustand stores (cart, sound)
  razorpay/           Payment client
  klaviyo/            Email marketing
  analytics/          PostHog + GA4 helpers
data/                 Hardcoded V1 content (products, journal, legal)
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Setup

```bash
git clone https://github.com/ParrvLuthra22/dripTheka.git
cd dripTheka
pnpm install
```

Create a `.env.local` file with the following variables:

```bash
# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...

# Neon Postgres
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require

# Google OAuth + NextAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
AUTH_SECRET=...                          # generate with: npx auth secret

# Klaviyo
KLAVIYO_PRIVATE_KEY=pk_...
KLAVIYO_LIST_ID=...

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Admin
ADMIN_SECRET=...

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Database

```bash
pnpm db:push          # Apply schema to Neon
pnpm db:seed          # Seed initial data
```

### Run

```bash
pnpm dev              # http://localhost:3000 (Turbopack)
```

## Development Commands

```bash
pnpm dev              # Dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Production server
pnpm lint             # ESLint
pnpm tsc              # Type check

pnpm db:push          # Apply Drizzle schema
pnpm db:migrate       # Run pending migrations
pnpm db:studio        # Visual DB browser
pnpm db:seed          # Seed pour_progress + cache
pnpm db:generate      # Generate migration from schema changes
```

## Deployment

Deploy to Vercel with all environment variables configured in the dashboard. For production:

- Switch Razorpay keys from `rzp_test_*` to `rzp_live_*`
- Point `DATABASE_URL` to a production Neon branch
- Set `NEXT_PUBLIC_SITE_URL` to your production domain
- Add the production redirect URI in Google Cloud Console

```bash
# First deploy
pnpm db:push && pnpm db:seed

# Subsequent deploys
pnpm db:migrate
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for boundary maps, data flow diagrams, and import conventions.

---

*Built with cobalt and cream. Made in Delhi.*
