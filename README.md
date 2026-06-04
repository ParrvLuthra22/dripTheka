# 🍷 Drip Theka — V1

> *"Serving fits, not drinks."*

Drip Theka is a streetwear brand for Gen Z India. The product is clothing. The actual product is belonging. This repository is the complete V1 web storefront — from design system to payment processing.

---

## Table of Contents

1. [Brand Design System](#-brand-design-system)
2. [Tech Stack](#-tech-stack)
3. [Project Structure](#-project-structure)
4. [Pages & Routes](#-pages--routes)
5. [API Endpoints](#-api-endpoints)
6. [Animation System](#-animation-system)
7. [Component Library](#-component-library)
8. [Database Schema](#-database-schema)
9. [Authentication](#-authentication)
10. [Payment Flow](#-payment-flow)
11. [Easter Eggs](#-easter-eggs)
12. [Setup Guide](#-setup-guide)
13. [Environment Variables](#-environment-variables)
14. [Development Commands](#-development-commands)
15. [Deployment](#-deployment)

---

## 🎨 Brand Design System

### Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--blue` | `#004AAD` | Primary — cobalt blue, all CTAs, hero, nav, accents |
| `--blue-deep` | `#002F70` | Deep cobalt — footer hover, active states |
| `--cream` | `#E4E2DD` | Background — all cream-bg sections, body text on dark |
| `--cream-warm` | `#EFEAD8` | Hover tint — row hovers on building page |
| `--ink` | `#141518` | Primary text — headings, body on cream, footer bg |
| `--ink-soft` | `#2A2B2F` | Soft ink — secondary text, dividers |
| `--neon` | `#CCFF00` | Accent — product card CTA buttons |

**Thematic invariants:**
- Never use off-palette colours
- Happy Hour easter egg swaps `--blue` → `#FF4D33` (warm red) globally via CSS class

### Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display | Anton | 400 | Headings, hero text, massive editorial type |
| Mono | JetBrains Mono | 400 | Labels, prices, tags, all caps UI text |
| Body | Geist Sans | 400 | Paragraphs, form inputs, descriptions |

**Type scale classes:**
```css
.type-display-xl  → font-display, clamp(3.5rem, 8vw, 7rem)
.type-display-lg  → font-display, clamp(2.5rem, 5vw, 4.5rem)
.type-display-md  → font-display, clamp(1.75rem, 3vw, 2.75rem)
.type-mono-sm     → font-mono, 11px, 0.1em tracking, uppercase
.type-body-lg     → font-sans,  clamp(1rem, 1.2vw, 1.125rem)
```

### Design Tokens (CSS Variables)

```css
--ease-pour:      cubic-bezier(.6,.05,.2,1)   /* brand easing — feels like liquid */
--ease-out-expo:  cubic-bezier(.16,1,.3,1)    /* fast enter, slow settle */
--container:      1440px
--pad-x:          clamp(20px, 4vw, 72px)      /* responsive horizontal padding */
--header-h:       84px                         /* nav height */
--audio-level:    0 → 1                        /* driven by AudioReactive when sound ON */
```

### Logo & Brand Mark

The brand has two distinct glass elements — **never confuse them:**

| Element | File | Usage |
|---------|------|-------|
| **Official lockup** | `/public/dtlogo.png` (+ cropped variant) | Nav, footer, hero, login — THE brand mark |
| **Wine glass mark** | `WineGlassMark.tsx` | Editorial decoration, story page anchors |
| **Pint glass** | `PintGlass.tsx` | Cart indicator — fills as items are added |

### Theka Language (Copy Guidelines)

| Standard English | Drip Theka |
|-----------------|------------|
| Sold Out | Tapped Out |
| Newsletter | Last Call |
| Cart | What's In Your Glass |
| VIP customers | Regulars |
| Launch | Opening Night |
| 404 page | Wrong Theka |
| Add to Cart | Add to Glass / Pour into Glass |
| Restock | Refill |
| Collections | Pours |
| Subscribe | Pull up a stool |

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.7 | App Router, RSC, ISR, API Routes |
| React | 19.2.4 | UI rendering |
| TypeScript | 5.x (strict) | Full type safety |
| Tailwind CSS | 4.x | Utility styling via CSS variables |

### Animations
| Technology | Version | Purpose |
|-----------|---------|---------|
| GSAP | 3.x | ScrollTrigger, SplitText, magnetic buttons |
| Framer Motion | 12.x | Page transitions, AnimatePresence, layoutId |
| Lenis | 1.x | Smooth scroll (integrated with GSAP ticker) |
| React Three Fiber | 9.x | WebGL hero glass pour |
| Three.js | 0.184 | LatheGeometry wine glass, liquid shaders |

### Sound
| Technology | Version | Purpose |
|-----------|---------|---------|
| Howler.js | 2.x | Centralized audio (pour, clink, ambient loop) |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Neon Postgres | Serverless | Primary database (connection pooling) |
| Drizzle ORM | 0.45 | Type-safe queries, migrations |
| NextAuth.js | 5 beta | Google OAuth + session management |
| @auth/drizzle-adapter | 1.x | Persists auth sessions to Neon |
| Razorpay | 2.x | INR payments — 30% deposit model |
| Klaviyo | API v2024 | Email lists + event tracking |
| Zod | 4.x | API request validation |

### Analytics & Monitoring
| Technology | Purpose |
|-----------|---------|
| PostHog | Product analytics, user behaviour |
| Google Analytics 4 | Web analytics |

---

## 📁 Project Structure

```
drip-theka/
│
├── frontend/               ← @frontend barrel (client-side re-exports)
│   └── index.ts
│
├── backend/                ← @backend barrel (server-side re-exports)
│   └── index.ts
│
├── app/                    ← Next.js App Router
│   ├── layout.tsx          ← Root layout (fonts, SessionProvider)
│   ├── (site)/             ← Public-facing routes
│   │   ├── layout.tsx      ← Site layout (Nav, Footer, overlays)
│   │   ├── page.tsx        ← Homepage (7 sections)
│   │   ├── login/          ← Google OAuth sign-in
│   │   ├── account/        ← User profile + orders
│   │   ├── pour/[slug]/    ← Collection page (Pour #001)
│   │   ├── product/[slug]/ ← Product detail (split-screen)
│   │   ├── cart/           ← Cart with layoutId pint morph
│   │   ├── checkout/       ← Single-page Razorpay checkout
│   │   ├── checkout/success/ ← Order confirmed + foam bubble
│   │   ├── story/          ← Brand editorial (magazine layout)
│   │   ├── building/       ← Founder journal index
│   │   ├── building/[slug]/ ← Individual journal post
│   │   ├── regulars/       ← Last Call sign-up + referral codes
│   │   ├── legal/[doc]/    ← Privacy / Terms / Returns / Shipping
│   │   └── not-found.tsx   ← Wrong Theka 404 (interactive foam)
│   │
│   └── api/                ← Backend API routes
│       ├── auth/[...nextauth]/ ← NextAuth v5 handlers
│       ├── reserve/        ← Create reservation + Razorpay order
│       ├── reserve/confirm/ ← Verify payment + update DB
│       ├── reserve/count/  ← Live fill bar data (10s ISR)
│       ├── reserve/status/ ← Poll order status
│       ├── regulars/       ← Newsletter sign-up + referral codes
│       ├── razorpay/       ← Razorpay order creation
│       ├── account/orders/ ← Auth-gated user orders
│       └── admin/          ← stats, db-setup (protected)
│
├── components/
│   ├── ui/                 ← Reusable primitives
│   │   ├── Button.tsx      ← 3 variants + GSAP magnetic
│   │   ├── LiquidButton.tsx ← Cobalt liquid fill CTA
│   │   ├── Cursor.tsx      ← Custom cursor (dot + ring + label pill)
│   │   ├── Eyebrow.tsx     ← Mono uppercase label with hairline
│   │   ├── Marquee.tsx     ← Pure-CSS infinite scroll
│   │   └── ProductCard.tsx ← Shared card (3D tilt + cursor states)
│   │
│   ├── glass/              ← Brand glass components
│   │   ├── WineGlassMark.tsx ← SVG wine glass (editorial use)
│   │   ├── BrandLogo.tsx   ← Official dtlogo lockup (next/image)
│   │   ├── MorphingLogo.tsx ← Fixed-pos logo that flies to nav on scroll
│   │   ├── PintGlass.tsx   ← Cart indicator (fills with items)
│   │   ├── TappedOutStamp.tsx ← Typographic sold-out stamp
│   │   └── HeroPour.tsx    ← Three.js WebGL hero glass
│   │
│   ├── sections/           ← Page sections
│   │   ├── Hero.tsx        ← Cobalt hero + scramble + foam particles
│   │   ├── Nav.tsx         ← Fixed nav with 4 right-side elements
│   │   ├── Footer.tsx      ← Video footer + 4-col grid
│   │   ├── HomeMarquee.tsx ← Tilted marquee strip
│   │   ├── CurrentlyPouring.tsx ← Asymmetric product grid
│   │   ├── StoryTeaser.tsx ← Typewriter manifesto
│   │   ├── BuildingTeaser.tsx ← Horizontal journal scroll
│   │   ├── JoinRegulars.tsx ← Email sign-up with liquid button
│   │   ├── PreFooterWordmark.tsx ← Parallax wordmark
│   │   ├── ProductIllustration.tsx ← Per-type SVG garment art
│   │   ├── pour/           ← Pour page sections
│   │   │   ├── PourHeroStrip.tsx
│   │   │   ├── FillBar.tsx ← Horizontal glass + polling
│   │   │   └── PourProductGrid.tsx
│   │   └── product/        ← Product page sections
│   │       ├── ProductHero.tsx
│   │       ├── ProductSidebar.tsx
│   │       ├── HowItPours.tsx
│   │       ├── AlsoPouring.tsx
│   │       └── RefillNotifyForm.tsx
│   │
│   ├── motion/             ← Animation primitives
│   │   ├── SmoothScroll.tsx ← Lenis + GSAP shared ticker
│   │   ├── Reveal.tsx      ← IntersectionObserver fade-up
│   │   ├── SplitReveal.tsx ← Manual char split + GSAP
│   │   ├── ScrambleText.tsx ← Devanagari × Latin scramble
│   │   ├── TypeOnScroll.tsx ← 60ms/char typewriter on scroll
│   │   ├── CountUp.tsx     ← rAF number tween
│   │   ├── FoamParticles.tsx ← Cream bubble drift (CSS only)
│   │   ├── ScrollProgressDrip.tsx ← Right-edge fill line
│   │   └── AudioReactive.tsx ← --audio-level CSS var driver
│   │
│   ├── transitions/
│   │   └── PourTransition.tsx ← Path-aware route transitions
│   │
│   ├── layout/             ← Fixed-position chrome
│   │   ├── LoadingScreen.tsx ← Fullscreen video intro
│   │   ├── ThekaEgg.tsx    ← "theka" keyboard easter egg
│   │   ├── HappyHour.tsx   ← Konami code easter egg
│   │   └── FounderSecret.tsx ← Scroll-to-bottom secret
│   │
│   ├── auth/
│   │   └── UserMenu.tsx    ← Sign-in link / avatar in nav
│   │
│   ├── providers/
│   │   └── SessionProvider.tsx ← NextAuth client wrapper
│   │
│   └── sound/
│       ├── SoundProvider.tsx ← Centralized Howler instances
│       └── SoundToggle.tsx ← Fixed bottom-left waveform toggle
│
├── lib/
│   ├── db/
│   │   ├── schema.ts       ← Complete Drizzle schema (12 tables)
│   │   └── client.ts       ← Neon HTTP + Drizzle client
│   ├── store/
│   │   ├── cart.ts         ← Zustand cart (persisted)
│   │   └── sound.ts        ← Zustand sound mute state (persisted)
│   ├── razorpay/
│   │   └── client.ts       ← createRazorpayOrder, verifySignature
│   ├── klaviyo/
│   │   └── index.ts        ← subscribeToList
│   ├── analytics/
│   │   └── index.ts        ← track() wrapper (PostHog + GA4)
│   └── utils/
│       ├── cn.ts           ← clsx + tailwind-merge
│       └── format.ts       ← formatPrice, formatDeposit
│
├── data/                   ← Hardcoded V1 content
│   ├── pour-001.ts         ← 6 products + DROP_DATE
│   ├── building.ts         ← 5 founder journal posts
│   └── legal.ts            ← Privacy / Terms / Returns / Shipping
│
├── styles/
│   └── globals.css         ← Design tokens, type scale, animations
│
├── public/
│   ├── dtlogo.png          ← Official brand lockup (2000×2000)
│   ├── dtlogo-cropped.png  ← Content-bounded variant (1412×564)
│   ├── wineglass.png       ← Wine glass brand mark
│   ├── sounds/             ← Howler audio assets
│   │   ├── pour.mp3
│   │   ├── clink.mp3
│   │   └── ambient.mp3
│   └── videos/
│       ├── loading.mp4     ← Fullscreen intro experience
│       └── follow.mp4      ← Footer cinematic / social video
│
├── scripts/
│   └── seed.ts             ← DB seed (pour_progress + cache)
│
├── types/
│   ├── index.ts            ← Shared TS types (Paise, Slug)
│   └── next-auth.d.ts      ← Session type augmentation
│
├── auth.ts                 ← NextAuth v5 config
├── drizzle.config.ts       ← Drizzle Kit config
├── ARCHITECTURE.md         ← Boundary map + data flow diagrams
└── README.md               ← This file
```

---

## 📄 Pages & Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Homepage — 7 sections: Hero, Marquee, Currently Pouring, Story, Building, Regulars, Pre-footer |
| `/pour/pour-001` | SSG | Collection page — hero strip, fill bar (live API), product grid with filter/sort |
| `/product/[slug]` | SSG | Product detail — split-screen (sticky sidebar + parallax illustrations) |
| `/cart` | Static | Cart — hero pint morph from floating indicator, item list, order summary |
| `/checkout` | Static | Checkout — Zod-validated form + Razorpay deposit flow |
| `/checkout/success` | Dynamic | Order confirmed — HeroPour replay + single foam bubble |
| `/login` | Static | Google OAuth sign-in — cobalt, branded |
| `/account` | Static | User profile + order history + referral code |
| `/story` | Static | Brand editorial — 4 distinct section layouts, magazine feel |
| `/building` | Static | Founder journal index — hover row animations |
| `/building/[slug]` | SSG | Individual journal post — typewriter + prev/next nav |
| `/regulars` | Static | Last Call sign-up — referral code generation |
| `/legal/[doc]` | SSG | Privacy / Terms / Returns / Shipping |
| `/not-found` | Client | Wrong Theka 404 — interactive foam blobs follow cursor |

---

## 🔌 API Endpoints

### Reservation & Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/reserve` | None | Create reservation + Razorpay deposit order. Validates with Zod, computes 30%/70% split, inserts to DB, returns `{ reservationId, razorpayOrderId, depositPaise, keyId }` |
| `POST` | `/api/reserve/confirm` | None | Verify Razorpay HMAC signature → update status to `deposit_paid` → atomically increment `pour_progress.reserved` → Klaviyo event (non-blocking) |
| `GET`  | `/api/reserve/count` | None | Returns `{ reserved, total, pct }` from `pour_progress`. 10s ISR cache. Auto-seeds on first request. |
| `GET`  | `/api/reserve/status/[orderId]` | None | Poll reservation status by Razorpay order ID |
| `POST` | `/api/razorpay` | None | Alternative Razorpay order creation endpoint |

### Users & Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET/POST` | `/api/auth/[...nextauth]` | — | NextAuth v5 Google OAuth handlers |
| `POST` | `/api/regulars` | None | Subscribe to Last Call. Upserts `regulars` + `referrals` tables. Returns `{ referralCode }`. Klaviyo subscribe non-blocking. |
| `GET`  | `/api/account/orders` | Session | Returns signed-in user's reservations (last 20, ordered by date) |

### Admin (dev/internal)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/stats?secret=X` | `ADMIN_SECRET` env | Dashboard metrics: total reservations by status, deposits collected, recent regulars, top products |
| `GET` | `/api/admin/db-setup` | Dev only | DB health check + auto-seed. Returns step-by-step setup guide if `DATABASE_URL` not configured. |
| `GET` | `/api/db-test` | Dev only | Connectivity probe for `pour_progress` table |

---

## 🎭 Animation System

### Signature Moment — Logo Morph

The site has **one logo element** (positioned fixed). On the homepage:
1. Hero shows a Devanagari × Latin scramble (`DRIP THEKA`) for 1.3s
2. Logo cross-fades in at the hero anchor (`data-morph-anchor="hero"`)
3. As user scrolls, `MorphingLogo` interpolates the logo from hero-size to nav-size via `requestAnimationFrame`
4. On other pages, the logo snaps directly to the nav anchor

### Animation Primitives

| Component | Method | Effect |
|-----------|--------|--------|
| `ScrambleText` | Interval-driven | Cycles Devanagari + Latin chars before settling |
| `TypeOnScroll` | IntersectionObserver | 60ms/char typewriter when element enters viewport |
| `Reveal` | IntersectionObserver | Adds `.is-in` → CSS fade + translate |
| `SplitReveal` | GSAP + ScrollTrigger | Manual word/char split, stagger animate |
| `CountUp` | rAF + easeOutCubic | Number tweens smoothly to target |
| `FoamParticles` | CSS `@keyframes` | 28 cream bubbles drift upward (no WebGL) |
| `ScrollProgressDrip` | scroll listener | Cobalt line fills right edge + droplet hangs |
| `AudioReactive` | Web Audio AnalyserNode | Drives `--audio-level` (0–1) for CSS glow |
| `PourTransition` | Framer AnimatePresence | Path-aware transitions (cobalt/cream/horizontal/scale) |

### Cursor States

| State trigger | Visual |
|--------------|--------|
| Default | 8px white dot + 40px ring (`mix-blend-mode: difference`) |
| `[data-hover]` | 24px dot, ring fades |
| `[data-hover-big]` | 64px cream circle |
| `[data-cursor="view"]` | "VIEW" pill at cursor |
| `[data-cursor="add"]` | "ADD" pill at cursor |

### Route Transition Flavours

| Route pattern | Overlay | Direction |
|--------------|---------|-----------|
| `/product/*` | Cream | Down from top |
| `/pour/*`, `/regulars` | Cobalt | Up from bottom |
| `/story` | Cream | Left sweep |
| `/cart` | Cream | Scale + fade |
| All others | Cream | Down from top + logo at peak |

### Sound System

Three persistent Howler instances (never recreated):

| Sound | File | Trigger |
|-------|------|---------|
| `pour` | `/sounds/pour.mp3` | Hero entrance on first load |
| `clink` | `/sounds/clink.mp3` | Add to glass, sign-up success |
| Ambient loop | `/sounds/ambient.mp3` | Plays when sound toggle is ON |

---

## 🧩 Component Library

### `Button`
```tsx
<Button variant="solid" size="md" magnetic>Label</Button>
// variants: solid | outline | ghost
// sizes: sm | md | lg
// magnetic: GSAP mouse-follow translate on desktop
```

### `LiquidButton`
```tsx
<LiquidButton
  state="idle" | "loading" | "success"
  label="Reserve your stool →"
  doneLabel="Welcome, Regular. 🍺"
  fillColor="#E4E2DD"
  fillTextColor="#004AAD"
/>
// Cobalt liquid fills from bottom on hover
// Foam bubbles pop on success state
```

### `WineGlassMark`
```tsx
<WineGlassMark
  size={48}        // px, or "sm" | "md" | "lg"
  liquid={60}      // 0–100 fill percentage
  tilt={-75}       // degrees (−75 = "Tapped Out" tipped state)
  liquidColor="var(--blue)"
/>
```

### `ScrambleText`
```tsx
<ScrambleText
  text="DRIP THEKA"
  duration={1300}   // total ms
  stagger={60}      // ms between char resolve
  speed={40}        // ms between random char changes
  onComplete={fn}
/>
```

### `TypeOnScroll`
```tsx
<TypeOnScroll
  segments={[
    "Plain string typed char-by-char",
    { node: <em>highlighted node</em>, chars: 5 }  // revealed atomically
  ]}
  speed={60}        // ms per character
  threshold={0.25}  // IntersectionObserver threshold
  as="p"
/>
```

### `Eyebrow`
```tsx
<Eyebrow color="blue" | "ink" | "cream" as="p">
  [02 / Currently Pouring]
</Eyebrow>
// Mono uppercase label with a leading 24px hairline
```

---

## 🗄 Database Schema

12 tables across 3 concerns:

### Auth (NextAuth v5)
```
users               id, name, email, image, referralCode, createdAt
accounts            userId FK, provider, providerAccountId, tokens
sessions            sessionToken, userId FK, expires
verification_tokens identifier, token, expires
```

### Business
```
regulars            id, email, name, city, college, instagram,
                    referralCode, referredBy, klaviyoId, createdAt

reservations        id, orderNumber, userId FK (nullable),
                    email, name, phone, address (jsonb),
                    subtotalPaise, depositPaise, balancePaise,
                    razorpayOrderId, razorpayPaymentId,
                    status (enum: pending→deposit_paid→drop_unlocked→fulfilled),
                    createdAt, updatedAt

reservation_items   id, reservationId FK, productSlug, productName,
                    size, qty, unitPricePaise, lineTotalPaise

referrals           id, code, ownerEmail FK, redemptions, createdAt

reserve_count_cache productSlug PK, reservedCount, updatedAt

pour_progress       pourSlug PK ("001"), reserved, target (100), unlockedAt
```

### Product (V1.1 target — currently hardcoded in `/data/pour-001.ts`)
```
products            id, slug, collectionSlug, name, tagline, type, fit,
                    price, depositPercent, colors, sizes, fabric, ...
```

---

## 🔐 Authentication

**Provider:** Google OAuth via NextAuth v5

**Session strategy:**
- With `DATABASE_URL`: database sessions persisted via `@auth/drizzle-adapter`
- Without `DATABASE_URL`: JWT sessions (works fully, just not persisted to Neon)

**Protected routes:**
- `/account` — redirects to `/login` if unauthenticated
- `/api/account/orders` — returns 401 if no session

**Guest checkout is fully supported** — `reservations.userId` is nullable.

---

## 💳 Payment Flow

Drip Theka uses a **30% deposit / 70% on drop** model:

```
1. Customer fills checkout form (Zod validated)
2. POST /api/reserve
   → Compute deposit = Math.round(subtotal × 0.3)
   → INSERT reservations (status: pending)
   → INSERT reservation_items
   → Razorpay createOrder(depositPaise)
   → PATCH razorpay_order_id
   ← { reservationId, razorpayOrderId, depositPaise }

3. Razorpay hosted checkout opens
   Customer pays the 30% deposit

4. POST /api/reserve/confirm
   → verifyPaymentSignature (HMAC-SHA256)
   → UPDATE status = deposit_paid
   → UPDATE pour_progress.reserved += totalQty  (atomic SQL)
   → Klaviyo reservation_confirmed event
   ← { ok: true, orderNumber }

5. Redirect → /checkout/success
```

**Razorpay test card:** `4111 1111 1111 1111` / any CVV / any future date

---

## 🥚 Easter Eggs

| Trigger | Effect |
|---------|--------|
| Type **"theka"** anywhere (outside form fields) | Toast: "Welcome to the theka. One round on the house." + clink sound |
| **↑ ↑ ↓ ↓ ← → ← → B A** (Konami code) | Happy Hour mode: `--blue` swaps to warm red `#FF4D33` globally. Toggle again to revert. |
| **Scroll to the absolute bottom** of the homepage | "The bar never really closes. — Ayaan & Parrv" fades in from below. Once per session. |

---

## 🚀 Setup Guide

### 1. Clone & Install

```bash
git clone <repo-url>
cd drip-theka
pnpm install
```

### 2. Environment Variables

Copy `.env.local` and fill in all values:

```bash
cp .env.local .env.local.bak
# Then edit .env.local — see section below for all variables
```

### 3. Database (Neon Postgres)

```bash
# Create free database at https://neon.tech
# Add connection string to .env.local as DATABASE_URL

# Apply schema (creates all 12 tables)
pnpm db:push

# Seed initial data (pour_progress + reserve_count_cache)
pnpm db:seed

# Verify everything is wired
open http://localhost:3000/api/admin/db-setup
```

### 4. Google OAuth

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create **OAuth 2.0 Client ID** → Web Application
3. Add Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google    # dev
   https://yourdomain.com/api/auth/callback/google   # prod
   ```
4. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `AUTH_SECRET` in `.env.local`

### 5. Razorpay

1. Create account at [razorpay.com](https://razorpay.com)
2. Get test keys from Dashboard → Settings → API Keys
3. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`

### 6. Klaviyo

1. Get API key from [Klaviyo → Account → API Keys](https://www.klaviyo.com/account#api-keys-tab)
2. Create a "Regulars" list and copy the List ID
3. Set `KLAVIYO_PRIVATE_KEY`, `KLAVIYO_LIST_ID`

### 7. Run

```bash
pnpm dev
# → http://localhost:3000
```

---

## 🔧 Environment Variables

```bash
# ── Razorpay ─────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...

# ── Klaviyo ──────────────────────────────────────────────────────────────
KLAVIYO_PRIVATE_KEY=pk_...
KLAVIYO_LIST_ID=XXXXXX

# ── Neon Postgres ────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require

# ── Google OAuth + NextAuth ──────────────────────────────────────────────
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
AUTH_SECRET=...    # generate with: npx auth secret

# ── Site ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # https://driptheka.com in prod

# ── Admin ────────────────────────────────────────────────────────────────
ADMIN_SECRET=...   # protects /api/admin/stats

# ── Analytics (optional) ─────────────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...  # V1.1 only
```

---

## 💻 Development Commands

```bash
pnpm dev           # Start dev server (Turbopack)
pnpm build         # Production build
pnpm start         # Start production server
pnpm lint          # ESLint
pnpm tsc           # TypeScript check (noEmit)

pnpm db:push       # Apply Drizzle schema to Neon
pnpm db:migrate    # Run pending migrations
pnpm db:studio     # Open Drizzle Studio (visual DB browser)
pnpm db:seed       # Seed pour_progress + reserve_count_cache
pnpm db:generate   # Generate new migration from schema changes
```

---

## 🚢 Deployment

### Vercel (recommended)

```bash
vercel deploy
```

Set all env vars in Vercel Dashboard → Settings → Environment Variables.

**Required for production:**
- All env vars above with prod values
- `DATABASE_URL` pointing to a production Neon branch
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` → switch from `rzp_test_*` to `rzp_live_*`
- `NEXT_PUBLIC_SITE_URL` → your production domain
- Google Cloud Console → add prod redirect URI

### Database migration strategy

```bash
# On prod deploy (run in CI or Vercel build hook):
pnpm db:migrate    # applies pending migrations from /drizzle/*.sql

# First-ever deploy:
pnpm db:push && pnpm db:seed
```

---

## V1.1 Roadmap

- [ ] Replace `/data/pour-001.ts` hardcoded products with Neon `products` table
- [ ] Add Pour #002 collection support
- [ ] India shipping zones + GST calculation
- [ ] COD option via Razorpay
- [ ] Cloudinary for product photography
- [ ] Email magic link auth (passwordless)
- [ ] Admin dashboard UI (currently API-only)
- [ ] SMS notifications via Twilio India

---

*Built with cobalt and cream. Made in Delhi.*
