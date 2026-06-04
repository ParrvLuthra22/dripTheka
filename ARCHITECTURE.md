# Drip Theka — Architecture

## Boundary Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (client)                         │
│                                                                 │
│  components/ui/          → Reusable UI (Button, Cursor, etc.)  │
│  components/glass/       → Brand mark + glass animations        │
│  components/sections/    → Page sections (Hero, Nav, Footer…)   │
│  components/motion/      → Animation primitives                 │
│  components/sound/       → Howler.js sound system              │
│  components/transitions/ → Route transition overlays            │
│  components/auth/        → NextAuth client components           │
│  components/layout/      → Fixed-position chrome (easter eggs)  │
│  lib/store/              → Zustand stores (cart, sound)         │
│  styles/globals.css      → Design tokens + CSS variables        │
│                                                                 │
│  @frontend alias → frontend/index.ts barrel                     │
└─────────────────────────────────────────────────────────────────┘
             ↕  HTTP / RSC streaming / API fetch
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER (Node.js / Edge)                  │
│                                                                 │
│  app/api/                → Next.js API route handlers           │
│    /api/reserve          → Create Razorpay deposit order        │
│    /api/reserve/confirm  → Verify payment + update DB           │
│    /api/reserve/count    → Live pour_progress counter           │
│    /api/reserve/status/  → Poll order status                    │
│    /api/regulars         → Newsletter sign-up + referral codes  │
│    /api/razorpay         → Razorpay order creation              │
│    /api/auth/[nextauth]  → Google OAuth endpoints               │
│    /api/account/orders   → Signed-in user's reservations        │
│    /api/admin/stats      → Dashboard metrics (protected)        │
│    /api/admin/db-setup   → DB health check + auto-seed          │
│                                                                 │
│  lib/db/                 → Neon Postgres via Drizzle ORM        │
│  lib/razorpay/           → Razorpay payment client              │
│  lib/klaviyo/            → Klaviyo email marketing              │
│  lib/analytics/          → PostHog + GA4 helpers                │
│  auth.ts                 → NextAuth v5 config (Google OAuth)    │
│  data/                   → Hardcoded product/content data       │
│                                                                 │
│  @backend alias → backend/index.ts barrel                       │
└─────────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                           │
│                                                                 │
│  Neon Postgres     → All persistence (users, orders, progress)  │
│  Razorpay          → Indian payment processing (INR)            │
│  Klaviyo           → Email lists + event tracking               │
│  Google OAuth      → Authentication provider                    │
│  Vercel            → Hosting + ISR + Edge network               │
│  PostHog           → Product analytics                          │
│  GA4               → Web analytics                              │
└─────────────────────────────────────────────────────────────────┘
```

## Import Convention

| Alias | Points to | Use for |
|-------|-----------|---------|
| `@/*` | `./*` | Anything (catch-all, legacy) |
| `@frontend/*` | `./frontend/*` | New client-only imports |
| `@backend/*` | `./backend/*` | New server-only imports |
| `@ui/*` | `./components/ui/*` | UI primitives |
| `@glass/*` | `./components/glass/*` | Brand glass marks |
| `@sections/*` | `./components/sections/*` | Page sections |
| `@motion/*` | `./components/motion/*` | Animation components |
| `@db/*` | `./lib/db/*` | Database (server only) |
| `@store/*` | `./lib/store/*` | Zustand stores |
| `@data/*` | `./data/*` | Static content |

## Data Flow — Deposit Checkout

```
User selects size + qty
       ↓
ProductSidebar.addItem()        → Zustand cart store
       ↓
Cart page → "Walk to the counter"
       ↓
Checkout form validation (Zod)
       ↓
POST /api/reserve               → Insert reservations + items
                                → POST Razorpay createOrder
                                ← { reservationId, razorpayOrderId }
       ↓
window.Razorpay.open()          → Razorpay hosted checkout UI
       ↓ (on payment success)
POST /api/reserve/confirm       → verifyPaymentSignature (HMAC)
                                → UPDATE reservations SET status=deposit_paid
                                → UPDATE pour_progress.reserved += totalQty
                                → Klaviyo reservation_confirmed event
                                ← { ok: true, orderNumber }
       ↓
router.push(/checkout/success)  → HeroPour replay + foam bubble
```

## Session Flow — Auth

```
User clicks "Sign in"
       ↓
/login page → Google sign-in button
       ↓
signIn("google") → /api/auth/signin/google → Google OAuth
       ↓ (callback)
/api/auth/callback/google
       ↓
@auth/drizzle-adapter writes to users + accounts tables
       ↓
session.user.id populated in NextAuth callback
       ↓
Redirect to /account
       ↓
/api/account/orders → SELECT reservations WHERE email = session.user.email
```
