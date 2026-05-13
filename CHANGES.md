# Vroom — Phase 1 & Phase 2 Changes

**77 files changed, ~5,950 lines added, ~400 removed**

---

## Table of Contents

- [Phase 1: Critical Fixes](#phase-1-critical-fixes)
- [Phase 2: Pre-Scale Architecture](#phase-2-pre-scale-architecture)
- [New Environment Variables](#new-environment-variables)
- [Database Migration](#database-migration)
- [How to Test in the UI](#how-to-test-in-the-ui)
- [New API Endpoints](#new-api-endpoints)
- [Files Changed](#files-changed)

---

## Phase 1: Critical Fixes

### 1. Double-Booking Race Condition (P0)

**Problem:** The old booking flow did a `SELECT` to check availability, then a separate `INSERT`. Two users could book the same vehicle at the same time because the check-and-insert wasn't atomic.

**Fix:** Replaced with an atomic `INSERT INTO bookings ... SELECT ... WHERE NOT EXISTS (overlapping booking)` using raw Neon SQL. The database itself now prevents double-bookings in a single statement — no transactions needed.

**Files:** `apps/web/src/services/booking.ts`

### 2. Timing-Unsafe HMAC Verification (P0)

**Problem:** Razorpay payment signature and webhook verification used `===` string comparison, which is vulnerable to timing attacks.

**Fix:** Both `verifyPaymentSignature()` and `verifyWebhookSignature()` now use `crypto.timingSafeEqual()`.

**Files:** `apps/web/src/lib/razorpay.ts`

### 3. Weak OTP Generation (P0)

**Problem:** Pickup OTPs used `Math.random()`, which is not cryptographically secure.

**Fix:** Replaced with `crypto.randomInt(100000, 1000000)`.

**Files:** `apps/web/src/lib/event-handlers.ts`

### 4. Refund Never Executed (P1)

**Problem:** `paymentService.processRefund()` existed but was never called when a booking was cancelled. Cancelled bookings never triggered refunds.

**Fix:** Wired `processRefund()` into the `booking.cancelled` event handler with the correct cancellation-policy refund amount.

**Files:** `apps/web/src/lib/event-handlers.ts`

### 5. Webhook Not Confirming Bookings (P1)

**Problem:** The Razorpay `payment.captured` webhook updated the payment record but didn't confirm the booking. Only the client-side verify route confirmed bookings, meaning if the user closed their browser after payment, the booking stayed "pending" forever.

**Fix:** The webhook handler now also confirms the booking (idempotent — only updates if status is still "pending"). Added a booking event log entry with `source: "webhook"`.

**Files:** `apps/web/src/services/payment.ts`

### 6. Demo Auth in Production (P1)

**Problem:** The credentials provider (demo login with hardcoded accounts) was available in all environments, including production.

**Fix:** Credentials provider is now wrapped in `...(isDev ? [Credentials({...})] : [])`. The MCP demo auth route returns 403 in production. Token expiry reduced from 30 days to 24 hours.

**Files:** `apps/web/src/lib/auth.ts`, `apps/web/src/app/api/mcp/auth/route.ts`

### 7. Missing Input Validation (P1)

**Problem:** Several API routes accepted arbitrary JSON without validation — vehicle updates, profile updates, admin user management.

**Fix:** Added Zod validation schemas for all unvalidated endpoints:
- `updateVehicleSchema` — vehicle PUT
- `vehicleStatusSchema` — vehicle PATCH (status changes)
- `updateProfileSchema` — profile PATCH
- `adminUserUpdateSchema` — admin user PATCH
- `webhookPayloadSchema` — payment webhook

**Files:** `packages/validators/src/index.ts`, `apps/web/src/app/api/vehicles/[id]/route.ts`, `apps/web/src/app/api/profile/route.ts`, `apps/web/src/app/api/admin/users/route.ts`, `apps/web/src/app/api/payments/webhook/route.ts`

### 8. Rate Limiting & Security Headers (P1)

**Problem:** No rate limiting on any endpoint. No security headers.

**Fix:** Added Next.js middleware with:
- **Rate limiting** via Upstash Redis: 60 req/min general, 10 req/min for AI endpoints, 10 req/min for auth
- **Security headers** on all responses: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`
- **HSTS** in production only
- 429 responses with `Retry-After` header

**Files:** `apps/web/src/middleware.ts` (new)

---

## Phase 2: Pre-Scale Architecture

### 9. Typed Database Client — Remove `(db as any)`

**Problem:** ~80 occurrences of `(db as any)` throughout the codebase due to type mismatches between the Proxy-based lazy DB initialization and Drizzle's types.

**Fix:** Rewrote `apps/web/src/lib/db.ts` with proper typed Proxy exports for both HTTP (`db`) and WebSocket (`wsDb`) clients. Removed every `(db as any)` cast. Dynamic query builders use condition arrays instead of reassignment.

**Files:** `apps/web/src/lib/db.ts`, `packages/db/src/client.ts`, + ~20 files with cast removals

### 10. WebSocket Driver for Transaction Support

**Problem:** The Neon HTTP driver doesn't support transactions. All DB operations were single statements.

**Fix:** Added a second Drizzle client (`wsDb`) backed by `@neondatabase/serverless` Pool with WebSocket transport. Services that need transactions can import `wsDb`.

**Files:** `apps/web/src/lib/db.ts`, `packages/db/src/client.ts`

### 11. pgEnum Constraints on All Status/Type Fields

**Problem:** All status and type columns were `varchar(20)` with no database-level validation. You could insert `status: "banana"` and Postgres would accept it.

**Fix:** Created 20 PostgreSQL ENUM types via Drizzle's `pgEnum()`:

| Enum | Values |
|------|--------|
| `user_role` | renter, host, admin |
| `user_status` | active, suspended, banned |
| `vehicle_type` | sedan, suv, hatchback, luxury, ev, mpv |
| `fuel_type` | petrol, diesel, electric, hybrid, cng |
| `transmission` | manual, automatic |
| `vehicle_status` | draft, listed, delisted |
| `booking_status` | pending, confirmed, active, completed, cancelled |
| `payment_type` | charge, refund |
| `payment_status` | pending, authorized, captured, failed, refunded |
| `payment_method` | upi, card, netbanking, wallet |
| `trip_status` | pending, active, completed |
| `review_type` | renter_to_vehicle, renter_to_host, host_to_renter |
| `review_status` | published, hidden, flagged |
| `pricing_scope` | global, country, city, vehicle_type, vehicle |
| `pricing_rule_type` | demand_surge, weekend, seasonal, event, time_decay |
| `notification_channel` | in_app, email, push, sms |
| `geofence_type` | operating_zone, restricted_zone |
| `vehicle_availability_type` | available, blocked, maintenance |
| `payout_status` | pending, processing, completed, failed |
| `actor_type` | user, system |

**Files:** `packages/db/src/schema/enums.ts` (new), all schema files updated

### 12. Drizzle Kit Migrations

**Setup:** `packages/db/drizzle.config.ts` was already configured. Generated the initial migration capturing the full schema:

- `packages/db/drizzle/0000_magical_juggernaut.sql` — 301 lines, creates all 20 enums + 16 tables
- `packages/db/migrations/0001_spatial_index.sql` — enables `cube` + `earthdistance` extensions and creates the GiST spatial index

**Commands:**
```bash
pnpm -F @vroom/db db:generate   # Generate migration from schema changes
pnpm -F @vroom/db db:migrate    # Run migrations against DATABASE_URL
pnpm -F @vroom/db db:push       # Push schema directly (dev shortcut)
```

### 13. Database Outbox Pattern (Replaces In-Memory Event Bus)

**Problem:** The event bus was an in-memory `EventEmitter`. In serverless, the function instance can die between publishing an event and the handler executing. Events were silently lost — refunds, notifications, and booking confirmations could fail without any trace.

**Fix:** Events are now written to an `outbox_events` database table instead of emitted in-memory. A cron endpoint (`/api/cron/process-outbox`) polls for pending events and dispatches them through the existing typed event handlers.

- **Outbox table:** `id`, `eventType`, `payload`, `status` (pending/processed/failed), `attempts`, `lastError`, `processAfter`, `createdAt`, `processedAt`
- **Retry policy:** Exponential backoff (2^attempts * 30 seconds), max 5 attempts
- **Cron endpoint:** `GET /api/cron/process-outbox` — protected by `CRON_SECRET` Bearer token

**Files:** `packages/db/src/schema/outbox.ts` (new), `apps/web/src/lib/outbox-processor.ts` (new), `apps/web/src/app/api/cron/process-outbox/route.ts` (new), `apps/web/src/services/booking.ts`, `apps/web/src/services/payment.ts`, `apps/web/src/services/trip.ts`, `apps/web/src/services/review.ts`

### 14. Host Availability / Calendar System

**Problem:** Hosts had no way to mark their vehicles as unavailable. A vehicle could be booked even when the host was on vacation or the car was in maintenance.

**Fix:** New `vehicle_availability` table and full CRUD API:
- Hosts can block date ranges per vehicle (type: `blocked` or `maintenance`)
- Vehicle search excludes vehicles with overlapping blocked periods
- Booking creation atomically checks both existing bookings AND availability blocks

**API:**
- `GET /api/vehicles/{id}/availability` — list blocked periods (public)
- `GET /api/vehicles/{id}/availability?startDate=...&endDate=...` — check availability for date range
- `POST /api/vehicles/{id}/availability` — block dates (host only)
- `DELETE /api/vehicles/{id}/availability` — remove a block (host only)

**Files:** `packages/db/src/schema/availability.ts` (new), `apps/web/src/services/availability.ts` (new), `apps/web/src/app/api/vehicles/[id]/availability/route.ts`, `apps/web/src/services/booking.ts`, `apps/web/src/services/vehicle.ts`

### 15. Host Payout Foundation

**Problem:** No way to track host earnings or payouts.

**Fix:** New `payouts` table and service with 15% platform commission:
- `calculateHostEarnings(hostId, periodStart, periodEnd)` — sums captured payments minus refunds for completed bookings
- `createPayout(hostId, periodStart, periodEnd)` — creates a pending payout record
- Payout gateway integration (Razorpay payouts) deferred to Phase 3

**API:**
- `GET /api/payouts` — list host's payouts (host only)
- `POST /api/payouts` — request a payout for a date range (host only)
- `GET /api/payouts/earnings?periodStart=...&periodEnd=...` — earnings breakdown (host only)

**Files:** `packages/db/src/schema/payouts.ts` (new), `apps/web/src/services/payout.ts` (new), `apps/web/src/app/api/payouts/route.ts` (new), `apps/web/src/app/api/payouts/earnings/route.ts` (new)

### 16. Spatial Indexing for Vehicle Search

**Problem:** Vehicle search by location used a JavaScript `haversineDistance()` function that calculated distances client-side after fetching all results. No database index — every location search was a full table scan.

**Fix:** Uses PostgreSQL's built-in `earthdistance` + `cube` extensions:
- GiST index on `ll_to_earth(latitude, longitude)` for fast bounding-box pre-filtering
- `earth_distance()` for exact radius checks in SQL
- Distance computed in the query itself (not post-fetch)
- Sort-by-distance now happens in Postgres, making pagination accurate

**Files:** `packages/db/migrations/0001_spatial_index.sql` (new), `apps/web/src/services/vehicle.ts`

### 17. CI/CD with GitHub Actions

New workflow at `.github/workflows/ci.yml`:
- Triggers on push to `main` and all PRs
- pnpm with caching, Node.js 22
- Steps: install, typecheck, lint, build

### 18. Monitoring — Structured Logging, Health Checks

- **Structured logger** (`apps/web/src/lib/logger.ts`): JSON format in production, human-readable in dev. Methods: `info`, `warn`, `error`, `debug`.
- **Health check** (`GET /api/health`): Tests DB connectivity (`SELECT 1`), Redis ping, returns component status with 200/503.

### 19. AI Response Caching

Redis-backed cache for AI endpoints to reduce Groq API costs:
- `GET /api/nl-search` — 1 hour cache
- `GET /api/ai/recommendations` — 30 min cache
- `GET /api/ai/range-advisor` — 24 hour cache
- Graceful degradation when Redis is unavailable

**Files:** `apps/web/src/lib/ai-cache.ts` (new)

### 20. MCP Server Enum Alignment

Fixed vehicle type, fuel type, and transmission enum values in the MCP server to match the backend validators.

**Files:** `packages/mcp-server/src/index.ts`

### 21. Test Suite

- **Pricing service tests:** 20 tests covering daily rates, weekend pricing, weekly/monthly discounts, protection plans, cancellation refunds
- **Validator tests:** 51 tests covering all Zod schemas

**Files:** `apps/web/src/services/__tests__/pricing.test.ts` (new), `packages/validators/src/__tests__/validators.test.ts` (new), `apps/web/vitest.config.ts` (new), `packages/validators/vitest.config.ts` (new)

```bash
pnpm -F web test        # 20 tests
pnpm -F validators test # 51 tests
pnpm turbo test         # All 71 tests
```

---

## New Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `CRON_SECRET` | Yes (production) | Bearer token for the outbox cron endpoint |
| `UPSTASH_REDIS_REST_URL` | Recommended | Redis for rate limiting + AI caching + health check |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Redis auth token |
| `REDIS_URL` | Optional | Alternative Redis URL key used by middleware |
| `REDIS_TOKEN` | Optional | Alternative Redis token key used by middleware |

Existing variables (`DATABASE_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) are unchanged.

---

## Database Migration

After pulling these changes, you need to apply the schema to your database:

```bash
# Option A: Generate and run migration (recommended for production)
cd packages/db
pnpm db:push          # Push schema directly to Neon

# Option B: Use the generated migration file
pnpm db:migrate       # Runs drizzle/0000_magical_juggernaut.sql

# Then apply the spatial index (manual — extensions can't be auto-generated)
# Run this SQL against your Neon database:
psql $DATABASE_URL -f packages/db/migrations/0001_spatial_index.sql
```

**Important:** If you have existing data with varchar status columns, the migration will convert them to enum types. Ensure all existing values match the enum definitions listed above.

---

## How to Test in the UI

### Prerequisites

```bash
pnpm install
pnpm -F @vroom/db db:push        # Apply schema changes
pnpm dev                          # Start dev server
```

### 1. Security Headers & Rate Limiting

Open DevTools > Network tab on any page. Check response headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

To test rate limiting (requires Redis configured):
```bash
# Hit an AI endpoint 11 times rapidly — the 11th should return 429
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/chat; done
```

### 2. Vehicle Search with Location

Go to the vehicle search page and search with a city. If you provide latitude/longitude in the URL or search params, the results are now sorted by distance with the database GiST index. Check the response includes `distanceKm` for each vehicle.

```bash
curl "http://localhost:3000/api/vehicles/search?latitude=12.9716&longitude=77.5946&radiusKm=15&city=Bangalore"
```

### 3. Booking Flow (Double-Booking Prevention)

1. Log in as a renter (demo: `renter@vroom.demo` / `demo123`)
2. Find a vehicle and start a booking
3. Open a second browser/incognito and try to book the same vehicle for overlapping dates
4. The second booking should fail with "This vehicle is unavailable for the selected dates"

### 4. Host Availability Calendar

1. Log in as a host (demo: `host@vroom.demo` / `demo123`)
2. Test via API (no UI yet — this is backend-only):

```bash
# Block dates for a vehicle
curl -X POST http://localhost:3000/api/vehicles/{vehicleId}/availability \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{
    "startDate": "2026-06-01T00:00:00Z",
    "endDate": "2026-06-15T00:00:00Z",
    "type": "blocked",
    "reason": "On vacation"
  }'

# Check availability
curl "http://localhost:3000/api/vehicles/{vehicleId}/availability?startDate=2026-06-01T00:00:00Z&endDate=2026-06-10T00:00:00Z"
# Should return: { "available": false, "blocks": [...] }

# Try booking those dates as a renter — should fail
```

### 5. Host Payouts & Earnings

1. Log in as a host
2. Test via API (no UI yet):

```bash
# Check earnings for the last 30 days
curl http://localhost:3000/api/payouts/earnings \
  -H "Cookie: <your-session-cookie>"

# Returns: { grossAmount, platformFee, netAmount, bookingIds }

# Request a payout
curl -X POST http://localhost:3000/api/payouts \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{
    "periodStart": "2026-04-01T00:00:00Z",
    "periodEnd": "2026-05-01T00:00:00Z"
  }'

# List payouts
curl http://localhost:3000/api/payouts \
  -H "Cookie: <your-session-cookie>"
```

### 6. Payment Flow (Test Mode)

1. Log in as a renter and book a vehicle
2. Complete payment with Razorpay test card: `4111 1111 1111 1111`, any future expiry, any CVV
3. The booking should move to "confirmed" status
4. Cancel the booking — a refund should be triggered automatically

### 7. Admin Dashboard

1. Log in as admin (demo: `admin@vroom.demo` / `demo123`)
2. Go to `/dashboard/admin` — verify stats load (total users, hosts, vehicles, bookings, revenue)
3. Go to `/dashboard/admin/users` — search users, filter by role
4. Go to `/dashboard/admin/bookings` — filter by status
5. Go to `/dashboard/admin/analytics` — revenue by month, bookings by status

### 8. Health Check

```bash
curl http://localhost:3000/api/health
# Returns: { status: "healthy", db: "ok", redis: "ok"|"not_configured", uptime: ... }
```

### 9. Outbox Event Processing

```bash
# Trigger outbox processing (requires CRON_SECRET in .env)
curl http://localhost:3000/api/cron/process-outbox \
  -H "Authorization: Bearer your-cron-secret-here"
# Returns: { success: true, processed: N, failed: N }
```

### 10. Run Tests

```bash
pnpm turbo test
# 71 tests should pass (20 pricing + 51 validators)
```

---

## New API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | None | System health check (DB + Redis) |
| GET | `/api/cron/process-outbox` | CRON_SECRET | Process pending outbox events |
| GET | `/api/vehicles/{id}/availability` | None | List availability blocks |
| POST | `/api/vehicles/{id}/availability` | Host | Block dates |
| DELETE | `/api/vehicles/{id}/availability` | Host | Remove a block |
| GET | `/api/payouts` | Host | List payouts |
| POST | `/api/payouts` | Host | Request a payout |
| GET | `/api/payouts/earnings` | Host | Earnings breakdown |

---

## Files Changed

### New Files (23)

```
.github/workflows/ci.yml                              — CI/CD pipeline
apps/web/src/middleware.ts                             — Rate limiting + security headers
apps/web/src/lib/ai-cache.ts                           — Redis AI response cache
apps/web/src/lib/logger.ts                             — Structured JSON logger
apps/web/src/lib/outbox-processor.ts                   — Outbox event processor with retry
apps/web/src/services/availability.ts                  — Host availability calendar service
apps/web/src/services/payout.ts                        — Host payout service
apps/web/src/services/__tests__/pricing.test.ts        — Pricing service tests
apps/web/src/app/api/cron/process-outbox/route.ts      — Cron outbox endpoint
apps/web/src/app/api/payouts/route.ts                  — Payout list + create API
apps/web/src/app/api/payouts/earnings/route.ts         — Earnings breakdown API
apps/web/vitest.config.ts                              — Web test config
packages/db/src/schema/enums.ts                        — 20 PostgreSQL enum types
packages/db/src/schema/outbox.ts                       — Outbox events table
packages/db/src/schema/availability.ts                 — Vehicle availability table
packages/db/src/schema/payouts.ts                      — Payouts table
packages/db/drizzle/0000_magical_juggernaut.sql        — Initial full-schema migration
packages/db/drizzle/meta/0000_snapshot.json            — Migration snapshot
packages/db/drizzle/meta/_journal.json                 — Migration journal
packages/db/migrations/0001_spatial_index.sql          — Spatial index (manual)
packages/validators/src/__tests__/validators.test.ts   — Validator tests
packages/validators/vitest.config.ts                   — Validators test config
```

### Modified Files (54)

All service files (`booking.ts`, `payment.ts`, `trip.ts`, `review.ts`, `vehicle.ts`, `notification.ts`), all schema files, API routes, dashboard pages, auth, DB client, event handlers, validators, MCP server, package.json files, turbo.json, and pnpm-lock.yaml.
