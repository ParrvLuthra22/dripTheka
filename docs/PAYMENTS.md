# Payments — how the deposit flow works and how to run it safely

Applies to the `(site)` checkout that the v2 Wall hands off to. Companion to `docs/BACKEND_AUDIT.md`.

## The flow

```
POST /api/reserve          validate → price server-side → ONE transaction:
                           lock → capacity check ("tapped_out") → insert reservation
                           (unique order number, retried on collision) → insert items
                           → create Razorpay order (deposit) → store its id
Razorpay Checkout          customer pays in the browser
POST /api/reserve/confirm  browser reports success (fast path)  ┐ both call the same
POST /api/razorpay/webhook Razorpay reports success (reliable)  ┘ settlement code (lib/payments/settle.ts)
```

The webhook is the source of truth: if the customer closes the tab after paying, or `confirm` fails, the webhook still records the payment. `confirm` just makes the success page instant.

### What "paid" requires (identical for confirm and webhook)
1. Signature valid (confirm: HMAC of `order_id|payment_id` with `RAZORPAY_KEY_SECRET`; webhook: HMAC of the **raw body** with `RAZORPAY_WEBHOOK_SECRET`).
2. The Razorpay order id is the one stored on **this** reservation.
3. The order is fetched from Razorpay server-side and must have `amount` = the reservation's `deposit_paise` (and `amount_paid` equal), `currency = INR`, `status = paid`.
4. The reservation is `pending` (or `failed`, because Razorpay lets a customer retry on the same order).

Then `pending|failed → deposit_paid` and `pour_progress.reserved += units` happen in one transaction, via a conditional `UPDATE … WHERE status IN (…)`. Whoever flips the row counts the units, so confirm + webhook + retries can never double-count. Confirming twice is a no-op.

Anything that fails a check is **rejected, logged (`[confirm] REJECTED …` / `[webhook] REJECTED …`) and never marked paid**. A rejected webhook still answers `200` (it's a permanent condition; retrying won't help) and is recorded in `payment_events` with its outcome.

### Webhook events
| Event | Effect |
|---|---|
| `payment.captured`, `order.paid` | same checks as confirm → `deposit_paid` if still `pending`/`failed` |
| `payment.failed` | `pending → failed` (row kept; never downgrades a paid row; a later successful retry still pays it) |
| `refund.processed` | paid → `refunded` and units returned to `pour_progress`, **only for a full refund** (amount ≥ deposit). Partial refunds are recorded and left for a human. |

Each event is processed once: its `X-Razorpay-Event-Id` is stored in `payment_events` in the same transaction as the state change. Transient failures (Razorpay API or DB down) return `5xx` and are **not** recorded, so Razorpay's retry reprocesses them.

## Environment variables

| Var | Needed for | Notes |
|---|---|---|
| `DATABASE_URL` | everything | Neon **pooled** URL (host has `-pooler`) in prod. One node-postgres `Pool` per instance, registered with `attachDatabasePool` on Vercel (Neon's current Fluid-compute guidance). |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` | orders, confirm, order fetch | `rzp_test_*` while testing, `rzp_live_*` in prod. |
| **`RAZORPAY_WEBHOOK_SECRET`** | webhook | **New.** The secret you type into the Razorpay dashboard webhook form (below). Not the API key secret. Without it the webhook answers `503`. |
| **`RECEIPT_TOKEN_SECRET`** | signed receipt links | **New.** Any long random string (`openssl rand -base64 32`). Falls back to `AUTH_SECRET`. Rotating it invalidates old receipt links (logged-in owners can still see their orders). |
| `RAZORPAY_API_BASE` | tests only | Honoured only if it points at `localhost`/`127.0.0.1`. Used to run end-to-end tests against a local Razorpay stub. Leave unset. |
| `TEST_DATABASE_URL` | `pnpm test:payments` | Local/branch DB only — see Tests. |

There is **no stub / bypass mode** in any environment: missing Razorpay keys are an error, `confirm` always verifies the signature, and with no `DATABASE_URL` reserve/confirm answer `503` — the app never takes money without a record of it.

## Razorpay dashboard setup (do this in Test mode first, then Live)

1. Dashboard → **Account & Settings → Webhooks → Add New Webhook**.
2. **Webhook URL:** `https://<your-domain>/api/razorpay/webhook`
3. **Secret:** generate a long random string, paste it here **and** into `RAZORPAY_WEBHOOK_SECRET` in your host's env (Vercel → Project → Settings → Environment Variables), then redeploy.
4. **Active events:** `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`. (Others are accepted and ignored.)
5. Save. Use **Send test webhook** / make a test payment and check the function logs for the outcome.
6. Settings → **Payment capture:** keep **automatic capture** on. With manual capture the order stays `attempted` and every payment is rejected as `not_paid`.
7. Test and Live modes have separate webhooks, keys and secrets — set all three for each environment.

Razorpay can't reach `localhost`. To test webhooks locally use a tunnel (`ngrok`, Cloudflare Tunnel) or sign a payload yourself with the secret (see `lib/payments/settle.test.ts`).

## Deploying this change
1. Set `RAZORPAY_WEBHOOK_SECRET` and `RECEIPT_TOKEN_SECRET`.
2. Run the migration **before** the new code serves traffic: `pnpm db:migrate` (`drizzle/0001_payments_hardening.sql`). It is idempotent, so it's safe on a database created with `db:push`. It: adds the NextAuth tables, `reservations.user_id` (+ backfill by email), the `failed` status, `payment_events`, unique indexes on `razorpay_order_id` / `razorpay_payment_id`, and rewrites old `'pending'` placeholder order ids so the unique index can be built.
3. Add the dashboard webhook.

## Stock / capacity
- Capacity is **per colourway** (each colourway is its own product slug): `capacity` on the product in `data/pour-001.ts`, default `DEFAULT_COLOURWAY_CAPACITY = 100` in `lib/config.ts`. **Placeholder — set real numbers per product.**
- A unit counts when its reservation is `deposit_paid` / `drop_unlocked` / `fulfilled`, or `pending` and younger than `PENDING_HOLD_MINUTES` (30). Older pending rows stop holding a slot automatically (nothing needs to clean them up).
- `/api/reserve` answers `409 {"error":"tapped_out","slug":…}` when the request would exceed capacity. Checks run under a Postgres advisory lock in the same transaction as the insert, so two people racing for the last unit can't both get it.
- Known edge: a customer who pays *after* their 30-minute hold expired is still recorded as paid (we never discard money). If that pushes a colourway over capacity, you'll need to refund one by hand — watch for it in the logs of busy drops.
- Per-size `stock` in the product data is still static (only `0` blocks a size). Per-size inventory is not tracked.

## Config
`lib/config.ts` is the one place for `DROP_DATE`, `DEPOSIT_PERCENT` (30), `depositPaiseFor()`, `DEFAULT_COLOURWAY_CAPACITY`, `PENDING_HOLD_MINUTES`. `DROP_DATE` is currently `2026-09-01` — already in the past; set the real date there.

## Receipts
The success redirect carries `?t=<token>`, an HMAC of the order number + email (`lib/orders/receiptToken.ts`). `GET /api/reserve/receipt/:orderNumber` returns the order only with a valid token **or** a signed-in owner (same `user_id` or email). Otherwise it answers `404`, same as a nonexistent order.

## Tests
`pnpm test:payments` runs the payment unit + database tests (`lib/**/*.test.ts`) with `tsx`. They **drop and recreate the `public` schema** of `TEST_DATABASE_URL` and apply the real migrations, so `lib/test/setupDb.ts` refuses to run unless the database name contains `test` and the host is local (or `ALLOW_REMOTE_TEST_DB=1`, for a throwaway Neon branch). They never read `DATABASE_URL`.

```bash
# Docker
docker run -d --name dt-pg -e POSTGRES_PASSWORD=postgres -p 54329:5432 postgres:17
docker exec dt-pg createdb -U postgres drip_test
# …or Homebrew: initdb a scratch cluster and `createdb drip_test`
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54329/drip_test pnpm test:payments
```

Covered: referral self-checks (email/phone/user) and one redemption per reservation, admin auth (Bearer only; db-setup/db-test 404 in production), no `order_dev_` bypass, amount / order-id mismatch (including "pay a cheap order, confirm an expensive one"), idempotent and concurrent confirm, replayed and concurrently-delivered webhooks, closed-tab recovery, failed/refund events, capacity race for the last slot, pending-hold expiry, order-number collision retry, signed receipt tokens.
