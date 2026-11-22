# Drip Theka — Backend audit (redesign/v2)

Read-only audit of the backend that came over from the v1 site, and how the v2 frontend uses it.
Audited on `redesign/v2` @ `2c03dd8` (2026-11-22). Nothing was run against a live database, Razorpay, Klaviyo or Resend — everything below is from reading the code, so "what happens in production" is inferred from the code paths, not observed.

**One-paragraph verdict.** The backend is a *deposit-only pre-order capture*: it can take a 30% Razorpay deposit, record it, bump a counter and send one receipt email. It cannot collect the other 70%, react to a payment that didn't come back through the browser, refund, cancel, ship, or enforce stock. Four of the six reservation statuses (`drop_unlocked`, `fulfilled`, `refunded`, `cancelled`) exist only as labels — nothing ever sets them. The v2 Wall/product page is a thin front: it only calls `addItem` on the cart store; money, orders, accounts and the fill counter all still live in the v1 `(site)` pages. There are also two security-relevant bugs in the payment confirm route (§3.4) that should be fixed before taking real money.

Where v2 sits: `app/(bar)/` = v2 (`/` Wall + Entry, `/product/[slug]`, `/story`) — no site chrome. `app/(site)/` = v1 pages wrapped in `SiteShell` (cart, checkout, account, login, regulars, pour, shop, building, khata, legal, try-the-look, 404). The Wall's "Bag (n)" link goes to `/cart`, i.e. straight into v1.

---

## 1. API routes (`app/api/**`)

Auth key: **none** = anyone on the internet; **session** = NextAuth session (matches by session email); **secret** = `?secret=` query param vs `ADMIN_SECRET`; **dev-only** = returns 404 when `NODE_ENV=production`.

"DB-less mode": almost every route checks `dbReady()` (DATABASE_URL set and not `REPLACE_ME`/`placeholder`) and degrades to a stub when false. This is deliberate for local dev but see §8 — several stubs return fake *success* data.

| Route | Method | Auth | What it does | Input → output | Tables |
|---|---|---|---|---|---|
| `/api/reserve` | POST | none | Creates a reservation and a Razorpay order for the **30% deposit**. Prices come from `data/pour-001.ts` (server-side, not the client). Rejects non-pouring (placeholder-art) products with 409 `not_pouring_yet`. | Zod: `email, name, phone (Indian 10-digit), address{line1,line2?,city,state,pincode(6)}, items[{slug,size,qty≤10}] (1–20)` → `{reservationId, razorpayOrderId, depositPaise, keyId}` | writes `reservations` (status `pending`), `reservation_items` |
| `/api/reserve/confirm` | POST | none (HMAC signature is the "auth") | Called from the browser's Razorpay `handler`. Verifies `HMAC-SHA256(orderId\|paymentId)`, marks `deposit_paid`, adds total qty to `pour_progress.reserved`, fires Klaviyo event + Resend email (both fire-and-forget). Idempotent only on `status === deposit_paid`. | `{reservationId, razorpay_payment_id, razorpay_order_id, razorpay_signature}` → `{ok, orderNumber}` | reads `reservations`, `reservation_items`; writes `reservations`, `pour_progress` |
| `/api/reserve/count` | GET | none | Pour-level progress for the fill UI. Auto-seeds `pour_progress` (+ `reserve_count_cache`) on first call. `revalidate = 10`. **Returns a hard-coded `{38, 100}` when the DB isn't configured *or* when the query throws.** | → `{reserved, total, pct}` | `pour_progress` (+ seeds `reserve_count_cache`) |
| `/api/reserve/status/[orderId]` | GET | none | Looks a reservation up by **Razorpay order id**. Intended for the success page; **nothing in the frontend calls it** (dead). | → `{id, orderNumber, status, depositPaise, balancePaise, createdAt}` | `reservations` |
| `/api/reserve/receipt/[orderNumber]` | GET | none (the order number is the "token") | Full receipt for `/checkout/success`. Returns **email + name** with the order. Order number = `DT-YYYY-` + 5 hex chars (~1M values), no rate limit. | → `{order{…email,name,status,*Paise}, items[]}` | `reservations`, `reservation_items` |
| `/api/regulars` | POST | none | Signs someone up to "Last Call"/Regulars: inserts `regulars` row + `referrals` row with a fresh 8-char code, credits the referrer, then subscribes the email to the Klaviyo list. Returning email → returns its existing code. DB failure falls through to a Klaviyo-only path that still says `success: true`. | Zod: `email` (rest optional: `name, city, college, instagram, heard_from, source, referred_by(8 chars)`) → `{success, referralCode, returning?}` | `regulars`, `referrals` |
| `/api/account/orders` | GET | session | Signed-in user's last 20 reservations, **matched by `reservations.email = session email`** (not `user_id`). | → `[{id, orderNumber, status, depositPaise, balancePaise, createdAt}]` (401 if signed out) | `reservations` |
| `/api/account/referrals` | GET | session | The user's referral code, redemption count, and first-name + city of people they referred. | → `{code, redemptions, redeemedBy[]}` | `regulars`, `referrals` |
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth v5 handlers (Google). See §5. | — | `users`, `accounts` (adapter; JWT sessions) |
| `/api/admin/stats` | GET | secret (`?secret=`) | Internal dashboard JSON: reservations by status + deposit totals, last 10 regulars, `pour_progress`, top products by qty/revenue. If `ADMIN_SECRET` is unset it is **open in dev, 403 in prod**. | → aggregate JSON | `reservations`, `reservation_items`, `regulars`, `pour_progress` |
| `/api/admin/db-setup` | GET | dev-only | DB health check; seeds `pour_progress`/`reserve_count_cache` if empty. | → table-existence + counts | `pour_progress`, `regulars`, `reservations`, `reserve_count_cache` |
| `/api/db-test` | GET | dev-only | Dumps `pour_progress`. | → rows | `pour_progress` |
| `/api/razorpay` | POST | none | **Legacy, unused.** Creates a Razorpay order for a *client-supplied* `depositAmount`. Nothing in the app calls it. | `{depositAmount,totalAmount,email,phone?,items[]}` → `{orderId, amount}` | none |
| `/api/og/receipt` | GET | none | Edge-rendered 1200×630 share image for the success page. Takes `orderNumber/deposit/total` from the query string — purely cosmetic, reads no DB. | query → PNG | none |

Other server-side entry points that aren't `app/api`: `middleware.ts` (only sets a "bouncer passed" cookie for known crawlers — no auth), `auth.ts`, `scripts/seed.ts` (`pnpm db:seed`: seeds `pour_progress` 001 target 100 and zeroed `reserve_count_cache` rows), and the `backend/index.ts` / `frontend/index.ts` barrel files (`@backend` alias that just re-exports `lib/*`).

**There is no Razorpay webhook route, no refund route, no balance-payment route, no order-cancel route, and no admin write route.** (`grep -ri webhook app lib` → nothing; `refund` appears only as a status label.)

---

## 2. Database schema (Drizzle → Neon Postgres, `lib/db/schema.ts`)

Driver: `drizzle-orm/neon-http` (stateless HTTP) — **no interactive transactions**, which matters for §3.4.

**Business tables**

| Table | Key columns | Notes |
|---|---|---|
| `reservations` — *this is the "orders" table; there is no `orders` table* | `id uuid PK`, `order_number text UNIQUE` (`DT-YYYY-XXXXX`), `user_id text → users.id (nullable, on delete set null)`, `email, name, phone`, `address jsonb {line1,line2?,city,state,pincode}`, `subtotal_paise`, `deposit_paise` (30%), `balance_paise` (70%), `razorpay_order_id`, `razorpay_payment_id` (null until paid), `status reservation_status`, `created_at, updated_at` | `user_id` is **never written** (guest checkout only), so signed-in users are linked by email string only. `razorpay_order_id` is inserted as `"pending"` then patched (not unique, not indexed). No balance-payment columns (no balance order id / payment id / paid-at), no shipping/tracking fields. |
| `reservation_items` | `reservation_id → reservations (cascade)`, `product_slug, product_name, size, qty, unit_price_paise, line_total_paise` | Snapshot of price/name at reservation time. `size` is free text (not validated against the product's sizes). |
| `pour_progress` | `pour_slug text PK` (`"001"`), `reserved int`, `target int default 100`, `unlocked_at timestamp null` | One row per *pour*, not per design. `unlocked_at` is documented as the "Opening Night trigger" but **nothing ever sets or reads it**. |
| `reserve_count_cache` | `product_slug PK`, `reserved_count`, `updated_at` | Seeded with zeros, **never updated, never read** (confirm only touches `pour_progress`). Dead table. |
| `regulars` | `id uuid PK`, `email UNIQUE`, `name`, `city` (both NOT NULL — the API fills `"Unknown"`), `college?`, `instagram?`, `referral_source?`, `referral_code UNIQUE` (8 chars), `referred_by?` (a code, not an FK), `klaviyo_id?` (**never set**), `created_at` | The Last Call / newsletter list. |
| `referrals` | `id`, `code UNIQUE`, `owner_email → regulars.email (cascade)`, `redemptions int default 0`, `created_at` | A ledger row per regular's code. **Referral does nothing at checkout** — no discount, no credit, no reward is applied anywhere (`grep referral` in checkout → nothing). |
| `products` | full product shape (price, sizes jsonb, `total_units`, …) | "V1.1 migration target" — **unused**; product data is read from `data/pour-001.ts`. |
| `users`, `accounts`, `sessions`, `verification_tokens` | Auth.js adapter shape; `users` also has `referral_code` (unused) | `sessions` is unused (JWT strategy). |

**Enum** `reservation_status`: `pending → deposit_paid → drop_unlocked → fulfilled`, plus `refunded`, `cancelled`. Only `pending` and `deposit_paid` are ever written.

**Migration drift.** `drizzle/0000_silent_turbo.sql` creates only 7 objects: `pour_progress, products, referrals, regulars, reservation_items, reservations, reserve_count_cache` (+ the enum). **The four Auth.js tables are not in the migration.** The repo's workflow is `db:push` (schema-first), so a DB created via `db:migrate` would be missing `users/accounts/…` and Google sign-in would fail on the adapter write. Pick one workflow and regenerate.

**Order-number collisions.** `generateOrderNumber` = last 5 hex chars of the reservation UUID (16⁵ ≈ 1.05M values). `order_number` is UNIQUE, so a collision makes the `/api/reserve` insert throw → 500 to the customer. Birthday-bound: ~50% chance of at least one collision by roughly 1,200 reservations. The comment says "V1.1: replace with a Postgres sequence".

---

## 3. Reservation + payment flow, end to end

### 3.1 What the customer experiences (v2 → v1)

1. **v2 Wall / `/product/[slug]`** — `BuyPanel` picks size/colourway and calls `useCartStore.addItem(product, size, colour)` (cart is client-side, persisted in `localStorage` as `drip-theka-cart`). Nothing touches the server. Out-of-stock sizes are `disabled` in the `<select>` (stock comes from `data/pour-001.ts`).
2. **`/cart`** (v1 page in `SiteShell`) — shows the glass, "30% now · 70% when it ships" style copy and "Balance on Opening Night".
3. **`/checkout`** (v1) — contact + shipping form (Zod, client-side) → `POST /api/reserve`.

### 3.2 `POST /api/reserve` (server)

1. Zod-validate. 2. Resolve each slug in `POUR_001.products` (unknown → 400; `placeholderArt` → 409). 3. `subtotal = Σ price×qty`; `deposit = round(subtotal × 0.3)`; `balance = subtotal − deposit` (all paise, server-side prices). 4. Insert `reservations` (`status=pending`, `razorpay_order_id="pending"`). 5. Insert `reservation_items`. 6. Create Razorpay order for `depositPaise` (`receipt = reservationId`, notes `{email, orderNumber}`). 7. Patch `razorpay_order_id`. 8. Return ids + public key.

Not done: no stock check, no check that `size` exists on the product, no cap relative to `pour_progress.target`/`totalUnits`, no dedupe/idempotency key (double-click ⇒ two reservations + two Razorpay orders), no rate limit, no linking to the signed-in `user_id`, no cleanup of abandoned `pending` rows. If step 6 fails after steps 4–5, a `pending` row with `razorpay_order_id="pending"` is left behind.

### 3.3 Payment + confirm

4. Browser loads `checkout.razorpay.com`, opens Checkout with `order_id`, `amount = depositPaise`, description "Pour #001 — 30% Deposit".
5. On success the **browser** `handler` posts `{reservationId, payment_id, order_id, signature}` to `/api/reserve/confirm`. On a 200 it clears the cart and routes to `/checkout/success?orderNumber=…&deposit=…&total=…` (deposit/total come from the client and are only used for display + the OG image).
6. `/api/reserve/confirm` verifies the signature (`timingSafeEqual`), loads the reservation, returns early if already `deposit_paid`, sets `deposit_paid` + `razorpay_payment_id`, sums `reservation_items.qty` and does `pour_progress.reserved += qty` (SQL `reserved + n`, atomic as a single statement), then fires Klaviyo + Resend without awaiting.
7. `/checkout/success` fetches `/api/reserve/receipt/[orderNumber]` and renders the thermal-receipt UI (`Receipt.tsx`).

### 3.4 Problems in this path (ordered by severity)

1. **Confirm never checks that the paid Razorpay order belongs to this reservation.** It verifies the signature for the *submitted* `(order_id, payment_id)` pair but then updates whichever `reservationId` was submitted, without asserting `razorpay_order_id === reservation.razorpay_order_id`. Exploit shape: create a cheap reservation A, pay its small deposit, take that valid `(orderA, payA, sigA)` and call confirm with `reservationId = B` (a large, unpaid reservation). B becomes `deposit_paid` and inflates `pour_progress`. **Fix:** load by `reservationId`, require `reservation.razorpayOrderId === razorpay_order_id`, and ideally fetch the payment from Razorpay and check `amount === deposit_paise` and `status === captured`.
2. **No webhook ⇒ money can be taken but never recorded.** If the user closes the tab, loses network, or the confirm call 500s after paying, Razorpay has the money and the reservation stays `pending` forever. Nothing reconciles. Razorpay `payment.captured` / `order.paid` / `payment.failed` / `refund.processed` webhooks (with signature check on the raw body) are the standard fix and are completely absent.
3. **Fake-success bypass.** `razorpay_order_id` beginning `order_dev_` skips signature verification *in all environments* and returns `{ok:true, orderNumber:"DT-YYYY-DEV01"}` before touching the DB. It can't mark anything paid, but it makes the success flow "work" for a forged request. Gate on `NODE_ENV !== "production"`.
4. **Not transactional / not race-safe.** neon-http has no interactive transactions. Two concurrent confirms (double-click, retry + webhook later) can both see `pending` and both add to `pour_progress`. A failure between "mark paid" and "increment counter" leaves a paid reservation uncounted, and a retry hits the idempotency early-return so it's never counted. Use a conditional `UPDATE … WHERE status='pending' RETURNING` and only increment when it returned a row (or `db.batch`).
5. **Amounts shown on the success page come from the URL**, not the DB (display/OG only, but trivially spoofable and wrong if someone edits the link).
6. `/api/razorpay` (unused) lets anyone mint Razorpay orders of any amount. Delete it.
7. Email HTML interpolates `customerName` / product names un-escaped (`lib/email/index.ts`) — escape them.

### 3.5 The balance (the other 70%) — **not built**

- The schema carries `balance_paise` and the UI promises "Balance on Opening Night" / "70% when it ships" / account status "Drop Live — Pay Balance" (`app/(site)/account/page.tsx`). That string is just a label for the `drop_unlocked` status.
- **Nothing creates a balance Razorpay order, a payment link, a balance email, a "drop is live" trigger, or any code that moves a reservation to `drop_unlocked`.** There is no table/column to store a second payment, no UI button on the account page (it only displays status text and `deposit paid · balance due`).
- Copy is also inconsistent: the footer says "30% now · 70% **when it ships**", the receipt/email say "balance on **Opening Night**", the wall rate list says "Reserve 30% now". Decide which moment the balance is charged before building it.
- `DROP_DATE` is `2026-09-01T18:00+05:30` — already in the past as of today. `Receipt`, `PourHeroStrip` and the cart still render countdowns/dates from it.

### 3.6 Failure, cancel, refund

- **Payment failure:** Razorpay modal shows its own error; the app only handles `modal.ondismiss` (spinner off) and a non-200 confirm (shows "the tap's jammed. try again."). The `pending` reservation is left as-is; retrying creates a *new* reservation (no reuse).
- **Refund / cancel:** no code. `refunded` and `cancelled` are enum values and account-page labels only. A refund done by hand in the Razorpay dashboard won't update the DB or **decrement `pour_progress`** (nothing ever decrements it).
- **Expiry:** no job expires stale `pending` reservations.
- **Stock:** `sizes[].stock` lives in the data file; the checkout path never reads or decrements it (§8).

---

## 4. Klaviyo and email

Two separate integrations, both silent no-ops when keys are missing/`REPLACE_ME` and both swallow errors.

**Klaviyo** (REST, revision `2024-10-15`, env `KLAVIYO_PRIVATE_KEY`, `KLAVIYO_LIST_ID`):

| Trigger | What fires | Where |
|---|---|---|
| Any `POST /api/regulars` (new or returning email) — from `/regulars` page, `JoinRegulars`, `WaitlistForm` (`source: waitlist:{slug}`), `RefillNotifyForm` | Upsert profile (**email only** — name/city/college/instagram/referral are *not* sent) → add profile to the list via `/lists/{id}/relationships/profiles/` | `app/api/regulars/route.ts` (inline copy) |
| `POST /api/reserve/confirm`, first successful confirm | Event **`reservation_confirmed`** on the profile with `{order_number, deposit_paise, balance_paise}` | inline in `confirm/route.ts` |

Notes: `lib/klaviyo/index.ts → subscribeToList` is an unused duplicate of the regulars logic. `regulars.klaviyo_id` is never populated. The list add uses the relationships endpoint, not Klaviyo's subscribe-profiles endpoint, so email-marketing *consent* is probably not being recorded (confirm in the Klaviyo account — this matters for compliance). There are **no** events for: checkout started / abandoned cart, balance due, drop live, shipped, refunded, referral redeemed, or account sign-up. The repo contains no Klaviyo flow definitions — any welcome email or flow triggered by the list/`reservation_confirmed` is configured in the Klaviyo dashboard and can't be audited from here.

**Resend** (`lib/email/index.ts`, env `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, default `Drip Theka <orders@driptheka.com>`): one email only — **order confirmation** ("Stool reserved · Order DT-…"), sent after a successful confirm. Itemised table, subtotal / deposit paid / "Balance on Opening Night". That's the only transactional email in the system. (Cobalt header with cream text and ink footer — complies with COLOR_RULES.)

**Analytics** (`lib/analytics`, PostHog + GA4 via dataLayer, client-side): typed events `add_to_glass, begin_checkout, purchase, subscribe_regulars, hangover_*`, `drunk_scroll_triggered`. `purchase` is client-fired; there is no server-side conversion event.

---

## 5. Auth

- **NextAuth v5 beta** (`next-auth@5.0.0-beta.31`), `auth.ts`. **One provider: Google OAuth.** The file header mentions a Credentials/"magic link in V1.1" provider — it is not implemented. No email/OTP login, no admin role.
- `session.strategy = "jwt"` always. `DrizzleAdapter` is attached only when the DB is configured, so Google sign-in writes `users` + `accounts` rows but sessions are never read from the DB. Callbacks copy `user.id` into the token and session.
- Custom pages: `/login` (button → `signIn("google", {callbackUrl:"/account"})`), errors redirect to `/login`.
- **What's behind login:** only `/account` (client-side: `useSession`, `router.push("/login")` if unauthenticated — no server-side/middleware protection; it's a fetch-then-hide page) and its two APIs `/api/account/orders` and `/api/account/referrals` (server-checked `auth()`). Everything else — including checkout — is guest.
- `middleware.ts` does no auth; its comment says to compose NextAuth middleware there if it's ever added.
- Gaps: orders are linked to a user **by email string**, not `user_id` (and `reservations.user_id` is never set); an email that is unverified on a future second provider would see someone else's orders. No admin identity — `/api/admin/stats` uses a shared secret in a query string (ends up in logs/history, compared with `!==`). `users.referral_code` is unused. No account deletion/data export.
- Required env (names only; values are in `.env.local` and weren't read): `AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DATABASE_URL, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, NEXT_PUBLIC_RAZORPAY_KEY_ID, KLAVIYO_PRIVATE_KEY, KLAVIYO_LIST_ID, RESEND_API_KEY, RESEND_FROM_EMAIL, ADMIN_SECRET, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_POSTHOG_KEY/HOST, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.

---

## 6. The "glass filling" mechanic

**What `pour_progress` counts.** `reserved` = **total units (tee quantity, summed across line items) in reservations that reached `deposit_paid`**, for the single pour `"001"`, against `target` (default 100). It is *not* a count of people or of reservations, not per design, and it is only ever incremented. It does not go down on refund/cancel, and `unlocked_at` (the "Opening Night" flip when `reserved ≥ target`) is never set. Note the units mismatch: `target = 100` units for a pour whose products each have `totalUnits: 200`.

Two other "fills" share the glass metaphor but are unrelated to `pour_progress`:

| UI | Fill driven by | Where |
|---|---|---|
| **FillBar** — horizontal wine glass on its side, liquid grows left→right, GSAP + ScrollTrigger, polls `/api/reserve/count` every 30 s | `pour_progress` (reserved / target) | `components/sections/pour/FillBar.tsx` → rendered on `/pour/[slug]` only |
| **Nav reservation counter** — `038/100` pill with a pulsing dot + `CountUp`, links to `/pour/pour-001`, only ≥1100px wide | `pour_progress` via `/api/reserve/count` (30 s poll) | `components/theka/Nav.tsx` (`ReservationCounter`) → only on `(site)` routes |
| **PintGlass** — the floating cart indicator; liquid = `cartItems / 10` (capped), foam reacts to adds; flat foam in Hangover mode | **the local cart**, not the server | `components/glass/PintGlass.tsx` (mounted by `SiteShell`) |
| Cart-page `HeroPint`, success-page `HeroPour`, `MorphingLogo`, `Foam`/`SurfaceTracker` | cart count / decorative | cart, success, `SiteShell` |

**Does v2 show it anywhere? No.** The `(bar)` layout deliberately omits the site chrome (no Nav, no PintGlass, no Foam) and nothing under `components/theka/wall`, `entry` or `story` calls `/api/reserve/count`. The Wall's "Collection⁷" is the number of designs, not reservations. A visitor who stays inside v2 never sees any social-proof / scarcity signal; they only meet it if they navigate to a `(site)` page.

Also: `/api/reserve/count` returns a **made-up `38/100`** when the DB isn't configured or the query errors — in production a DB blip would show invented numbers on the counter and FillBar.

---

## 7. The Theka Language and the v1 themed pieces

`lib/theka/lang.ts` is the single source for UI copy (re-exported as `copy` from `data/copy.ts`; helpers in `lib/utils/copy.ts`). "Used now" is judged by import graph, split into **v2 (Wall/Entry/Story/product page)**, **v1 live** (`(site)` pages / `SiteShell` — reachable today, e.g. via Bag → `/cart`), and **orphaned** (nothing imports it).

### 7.1 Themed phrases in `lang.ts`

| Group | Phrases | Used now |
|---|---|---|
| `brand` | Drip Theka · DRIP THEKA · "Est. MMXXVI · Delhi" · "The actual product is belonging." | v1 live (Footer/Nav/metadata) |
| `nav` | links: Pours *maal*, Story *kahaani*, Building *banaate hue*, Regulars *apne log*, Khata *hisaab*; mobile: Cart *glass*, Account *tum*; "The Menu", "Walk In →", Sound On/Off, "Empty glass", "n in glass", "x of y reserved" | v1 live (`Nav`) |
| `shutter` | "DRIP THEKA · *ek aur round*" | v2 (Entry/StreetScene) **and** v1 (`PourTransition`, sound) |
| `wall.*` | "Serving fits, not drinks.", "Pour #001 · currently pouring · अभी निकला है", "lights on", "Pick a size first, regular", "*name · size — poured into your glass*", "Poured ✓", "Ships in 5–7 days", rate list "RATE LIST · रेट लिस्ट" ("Reserve 30% now"), enamel sign "आज नकद, कल उधार / CASH TODAY · CREDIT TOMORROW", teaser "Pour #002 is brewing. Regulars hear first." | **v2** (Wall, WallDressing, BuyPanel, LightsOn) |
| `wall.story` / `story.*` | The Story room, 8 panels: "ATTEMPT #1 … STATUS FLOP … NOT YET", "RATE LIST · रेट लिस्ट" homework, "ठेका" dictionary entry ("A wine shop that sells *clothes*"), "दूध नहीं, beer पीऊंगा" house rule, "Last call · Soon *in your wardrobes*", "Pull up a stool, *regular*." | **v2** (`/story`) |
| `product.*` | "How it's poured", "Keep walking the aisle / Also on the wall" | **v2** (`/product/[slug]`) |
| `tryTheLook` | "This room's still being set up." | v1 route stub, reached from the Wall header |
| `cursor` | Dekho / Daalo / Kheencho / Chalo / Bajao | v1 live (`Cursor`, `data-cursor`); not mounted on `(bar)` |
| `footer.wisdom` | 12 rotating lines: "phir milenge, regular.", "udhaar mangne wale ko maaf kiya jaata hai…", "the theka closes when we say it closes.", "sundays are for the regulars.", "no fights at the theka. take it outside.", "we don't sell water. don't ask.", "six pieces. two hundred each. zero regrets." (…) + "No refills. That's the point.", "30% now · 70% when it ships" | v1 live (`Footer`, `Receipt`) |
| `cart.*` | "Glass is dry. Sad." → "One in. Don't be shy." → "Now we're talking." → "Bro you're not even hiding it." → "Theka management wants a word." → "We're impressed and concerned." → "Stop. Please. The bartender's tired."; add-toasts "Poured. / Foam rising. / Cheers to that. / Added. No refunds. (kidding.)"; cap "**Glass is full. Bartender's cut you off.**" | cart states + add toasts: v1 live (`/cart`, `ProductCard`). **`capReached` is unreferenced anywhere.** |
| `forms.*` | placeholders ("no auntyji's number", "your name, not your rap name", "where you skip class from"), errors ("that's not an email. that's a vibe.", "the tap's jammed. try again.", "can't checkout an empty glass. seek help."), success ("welcome to the regulars. you're one of us now.", "locked in. drop incoming. check your inbox.") | v1 live (checkout, regulars, waitlist forms) |
| `loading.*` | "Pouring…", "Asking the bartender…", "Calling the keg…", "Filing the paperwork…" | partly used: `checkout` set in checkout page via `lib/utils/copy.ts`; `generic`/`fetchingProducts`/`submittingForm` sets have no consumers |
| `cta.*` | "One round, please", "Tap the keg →", "Settle the bill →", "Become a regular →", "Bell me when it's back" … | v1 live (`/cart`, `ProductCard`); v2 uses its own wall CTAs ("Add to bag") |
| `status.*` | "Freshly Poured · abhi nikla hai", "Happy Hour Exclusive", "Tapped Out · khatam", "Last Round · khatam hone wala hai", "Now Pouring", "Opening Night · doors khulne wale hain" | **no direct consumers** — superseded by `language.*` below |
| `language.*` (rendered by `<ThekaLabel k=…>`) | see 7.2 | |
| `upsell` | "before you settle up / One more before last call?" | v1 live (`UpsellModal` in `SiteShell`) |
| `notFound` | "**Wrong Theka.** / galat gully bhai…" | v1 live (`(site)/not-found.tsx`). **v2 `(bar)` has no `not-found.tsx`**; bad `/product/` slugs call `notFound()` and fall to the root default, losing the voice. |

### 7.2 `language.*` glossary keys → where they appear

| Key | Gloss | Used in |
|---|---|---|
| Currently Pouring / *abhi nikla hai* | | orphaned `CurrentlyPouring` section |
| Last Call / *ek aakhri baar* | | **unused as a key** (the word survives only as the Regulars nav/footer name and "Last call" in the Story) |
| Building Theka / *banaate hue* | | `/building` page, orphaned `BuildingTeaser` |
| The Story / *poori kahaani* | | orphaned `StoryTeaser` |
| **Tapped Out / *khatam*** | | `ProductCard` (stamp via `TappedOutStamp`), `ProductSidebar` — i.e. `/shop/[slug]`/`/pour` listings. **Not in v2**: the Wall/`BuyPanel` only disables a sold-out size in the dropdown; a fully sold-out design has no "Tapped Out" treatment on the Wall. |
| Now Pouring / *abhi chal raha hai* | | `PourHeroStrip` (`/pour/[slug]`) |
| Opening Night / *darwaaze khulne wale hain* | | `PourHeroStrip`, `Receipt` |
| Pour #001 / *Pehla Nasha* | | `PourHeroStrip`, `ProductSidebar`, `Receipt` |
| Refilled / *bharwa diya* | | unused |
| **Happy Hour / *do peg waale*** | | `ProductCard`, `ProductSidebar` (label key only; `HappyHour` the easter egg below is separate) |
| Freshly Poured / Last Round | | `ProductCard`, `ProductSidebar` (hard-coded per product id in `ProductSidebar` TAGS) |
| Before You Bounce / *ek aakhri baar* | | `UpsellModal` |
| Size / *kaunsa fit?*, Color / *kaunsa shade?* | | `ProductSidebar` (v1 product UI) |
| Regulars / *permanent customers* | | label key (no direct consumer found; the word is used in nav/footer/forms) |
| **Wrong Theka / *galat gully*** | | **unused as a key** — the 404 hard-wires `lang.notFound` instead |
| Bartender's Pick / *is hafte yeh chal raha hai* | | orphaned `BartendersPick` |
| The Board / Fresh Pour / Most Poured / Recently Viewed | | orphaned `TheBoard`; `ProductSidebar` (recently viewed) |

### 7.3 v1 components & easter eggs (mounted by `SiteShell` → every `(site)` route; **none on `(bar)`/v2**)

| Piece | Behaviour | Status |
|---|---|---|
| **Tapped Out** (`TappedOutStamp`, `isTappedOut`, status label) | Rotated stamp over a card when every size has `stock === 0`; product page shows Tapped Out instead of the add button | v1 live. v2 only uses `isTappedOut` for JSON-LD `OutOfStock` on `/product/[slug]`. |
| **Last Call** | Name of the Regulars newsletter (`/regulars`, footer "Last Call" link, "Last Call / ek aakhri baar" key) | v1 live; **v2 has no Regulars/newsletter signup anywhere** except the Wall's teaser toast linking to `/regulars`. |
| **What's In Your Glass** | The cart metaphor: `PintGlass` indicator ("n in glass", fill = items/10), cart hero pint, add-toasts, cart-state messages. Not a separate component by that name. | v1 live; v2 has only the header "Bag (n)" and the "poured into your glass" toast. |
| **Wrong Theka** | Interactive 404 with a tipped glass and drifting foam blobs (`(site)/not-found.tsx`) | v1 live; not wired to `(bar)`. |
| **Happy Hour** (`layout/HappyHour.tsx`) | Konami code (↑↑↓↓←→←→BA) toggles `html.happy-hour`: toast + cobalt token swaps to warm red `#FF4D33`; session-persisted. Neon `#CCFF00` is defined inline here (the only place COLOR_RULES allows it). | v1 live (`SiteShell`). |
| **Hangover mode** (`motion/HangoverMode.tsx` + `lib/store/hangover.ts`) | After 5 min idle: `body.is-hungover` (cursor wobble), `PintGlass` foam goes flat; after another 5 min a "you good?" toast; any input cancels. Tracked via analytics (`hangover_*`). | v1 live. |
| **Drunk scroll** (`motion/DrunkScroll.tsx`) | >4000 px/s for ≥300 ms → 600 ms wobble + "scrolled too fast. drink water." toast, once per session; disabled under reduced motion. | v1 live. |
| **ThekaEgg** | Type "theka" anywhere → toast + clink sound. | v1 live. |
| **FounderSecret** | Home (`/`) only: at 100% scroll a founders' note fades in. **`SiteShell` is not on `/` any more**, so this can never fire on the v2 Wall. | effectively dead in v2 |
| **LoadingScreen** | Full-screen `loading.mp4` intro once per session. Superseded by the Entry. | v1 live on `(site)` only |
| **Khata** (`/khata`) | The wishlist ("hisaab") store + `ProductCard` heart | v1 live |
| Sound (`SoundProvider`, `SoundToggle`, `AudioReactive`) | Ambient + clink/pour sounds | v1 live; v2 has none |
| **Orphaned v1 home sections** | `Hero, HomeMarquee, JoinRegulars, CurrentlyPouring, TheBoard, BartendersPick, StoryTeaser, BuildingTeaser, PreFooterWordmark` have no importers (the v1 home page was replaced by the Wall) | dead code — candidates to delete or to harvest copy from |

Net: the personality that made v1 (cart as a glass, sound, easter eggs, Tapped Out stamps, Regulars sign-up) lives entirely in `(site)`. v2 ports only the Wall/Entry/Story copy and a few strings. Moving a v1 route "into" v2 means re-hosting it without `SiteShell`, or accepting the shell.

---

## 8. Gaps — what a real store still needs

Ordered roughly by how soon they'll hurt.

**Blocking before taking real money**
1. Fix confirm: bind payment ↔ reservation (`razorpay_order_id` must equal the reservation's), verify captured amount with Razorpay, drop the `order_dev_` bypass in prod, make the state change a conditional update so double-confirms can't double-count (§3.4).
2. **Razorpay webhook** (`payment.captured`/`order.paid`, `payment.failed`, `refund.processed`) with raw-body signature verification — the only way a closed tab doesn't strand paid money as `pending`. Plus a reconciliation script/cron for `pending` rows older than N minutes.
3. **Order numbers**: use a sequence or retry on collision; today ~1.2k reservations ≈ coin-flip on a 500.
4. **Stock & oversell limits**: server-side check of `size` and available stock (and a per-pour cap vs `target`/`totalUnits`) at `/api/reserve`; decrement/reserve stock when a reservation is created or confirmed. Today stock exists only in the static data file and the UI.
5. `/api/reserve/count` must not invent `38/100`; return an error/`null` so the UI hides the counter. Delete `/api/razorpay`.
6. Rate-limit `/api/reserve`, `/api/regulars`, and the receipt endpoint (receipt returns name + email for a guessable 5-hex order number — require the email, a signed token, or session ownership).

**To actually sell the product**
7. **Balance payment (70%)**: decide the trigger (Opening Night vs ship), add columns (`balance_razorpay_order_id`, `balance_payment_id`, `balance_paid_at`, `drop_unlocked_at`), a "pay balance" route + account-page button + payment-link email, webhook handling, and a reminder/expiry policy (what if they don't pay?). Wire `pour_progress.unlocked_at` or drop the concept.
8. **Refunds/cancellations**: an admin-initiated Razorpay refund that sets `refunded`/`cancelled`, decrements `pour_progress`/stock, and emails the customer; a customer-facing policy matching `/legal/returns`.
9. **Fulfilment**: shipping provider integration, AWB/tracking number + courier columns, `fulfilled` transition, tracking email and an order-detail page. Today the account page shows only status text, deposit and balance; there is **no per-order detail page** and `reservation_items` aren't returned by `/api/account/orders`.
10. **Emails**: a transactional set — deposit received (exists), payment failed/abandoned reminder, drop live + pay balance, balance received, shipped (tracking), refund. Add plain-text parts, escape user strings, SPF/DKIM for the sending domain, and move the template out of an inline string.
11. **Klaviyo**: send profile properties (name, city, referral code, source), use the proper subscribe endpoint so consent is recorded, add events (Started Checkout, Placed Order with line items/value, Fulfilled, Refunded), store `klaviyo_id`, and delete the duplicate `lib/klaviyo` helper or make the route use it.
12. **Admin**: there is one read-only JSON endpoint behind a query-string secret. A store needs an authenticated admin (role on `users`) to list/search orders, mark fulfilled, refund, export for the printer, edit stock, set pour target / unlock, and see Regulars. Fix `stats.regulars.total` (it reports `min(10, n)` — it counts the 10-row "recent" list).
13. **Auth/ownership**: set `reservations.user_id` when signed in; link guest orders to an account on first sign-in by verified email; add middleware-level protection for `/account`; consider email magic-link for people without Google.
14. **Referrals**: the ledger exists but earns nothing. Also bugs: crediting a referrer sets `redemptions = $count(referrals where code = X)` (a subquery that is always 1), not `redemptions + 1`; `referred_by` isn't checked to exist; referral-code generation isn't collision-checked (`Math.random`, UNIQUE violation ⇒ falls into the "Klaviyo-only" branch and still replies `success`). Decide the reward (discount code? Razorpay offer?) and apply it at `/api/reserve`.
15. **Products in the DB**: `products` table is unused; price/stock/sizes are a TS file — fine for one pour, but stock changes need a deploy. Move to the table (or a CMS) before Pour #002.
16. **Schema/migrations**: regenerate migrations to include auth tables; add indexes (`reservations.email`, `razorpay_order_id`, `status`), a unique constraint on `razorpay_payment_id`, `NOT NULL` default policy for `regulars.city`, and `updated_at` triggers.
17. **Compliance/ops**: GST invoice numbering and tax breakup (the receipt is not a tax invoice), consent for marketing email, privacy/terms pages exist under `/legal` but no data-deletion path, error monitoring (only `console.error`), structured logs, and tests — there are none for the API layer (the repo's `pnpm test` covers only Wall/Entry geometry).

**v2-specific integration gaps**
18. v2 shows no scarcity/progress signal (§6). Either surface the glass fill on the Wall/product page or accept that it's a v1-only feature.
19. `(bar)` has no `not-found.tsx`, no Tapped Out treatment for a fully sold-out design, no Regulars signup, no sound, no Foam/PintGlass. Decide which v1 behaviours are ported vs retired.
20. Cart → `/cart` → `/checkout` hands the visitor from the dark Wall into the cream v1 pages. The `forms`/`cart` copy there is on-brand but the visual jump is large; a v2-styled bag/checkout is the natural next piece once the backend fixes above are in.
21. `DROP_DATE` is in the past (2026-09-01); every countdown/date built on it needs a new date or a "live now" state.
