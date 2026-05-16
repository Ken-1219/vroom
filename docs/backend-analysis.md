# Backend Analysis

## Architecture Overview

The backend follows a **class-based service layer pattern** deployed as Next.js API routes on Vercel. All 10 services are instantiated as module-level singletons. The 18 lib files provide infrastructure: database access, authentication, event emission, email, payments, caching, logging, and error handling.

```
┌─────────────────────────────────────────────────────────────────┐
│                     API ROUTES (45+ endpoints)                   │
│  /api/bookings  /api/vehicles  /api/payments  /api/trips  ...   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ delegates to
┌──────────────────────────▼──────────────────────────────────────┐
│                     SERVICE LAYER (10 classes)                    │
│                                                                  │
│  BookingService    VehicleService    PaymentService              │
│  PricingService    TripService       ReviewService              │
│  NotificationSvc   AvailabilitySvc   PayoutService              │
│  TrustScoreSvc                                                  │
└──────────┬──────────────┬──────────────┬──────────────┬─────────┘
           │              │              │              │
┌──────────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐ ┌────▼─────────┐
│  Drizzle ORM    │ │  Redis   │ │  Razorpay  │ │  Groq AI     │
│  (db from lib)  │ │  (cache) │ │  (gateway) │ │  (Llama)     │
└─────────────────┘ └──────────┘ └────────────┘ └──────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                     EVENT SYSTEM                                 │
│  emitEvent() → outbox_events table → after() → eventBus         │
│  → Handlers: notifications, emails, trust scores, refunds       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Middleware Layer

**File:** `apps/web/src/middleware.ts`

The middleware is the central gatekeeper for all requests.

### Rate Limiting

| Limiter | Window | Max Requests | Applies To |
|---------|--------|-------------|------------|
| `generalLimiter` | 60s sliding | 60 | All `/api/` routes (default) |
| `aiLimiter` | 60s sliding | 10 | `/api/chat`, `/api/nl-search`, `/api/ai/*`, `/api/trip-planner`, `/api/reviews/summary`, `/api/vehicles/[id]/chat` |
| `authLimiter` | 60s sliding | 10 | `/api/mcp/auth`, `/api/auth/*` |

Rate-limit responses return 429 with headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.

Gracefully skipped if Redis is not configured (development mode).

### Authentication Gate

All non-public routes require either:
1. A valid NextAuth session token (cookie-based), or
2. A valid Bearer JWT (verified against `AUTH_SECRET` via `jose.jwtVerify`)

### Public Routes (No Auth Required)

| Category | Routes |
|----------|--------|
| Always public | `/api/auth/*`, `/api/mcp/auth`, `/api/health`, `/api/cities`, `/api/payments/webhook`, `/api/payouts/webhook`, `/api/cron/*` |
| Public GET only | `/api/vehicles/search`, `/api/vehicles/[id]`, `/api/vehicles/[id]/availability`, `/api/geofences`, `/api/pickup-points`, `/api/reviews`, `/api/reviews/summary` |
| Public POST | `/api/pricing/estimate` |

### Security Headers

Applied to every response:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
X-DNS-Prefetch-Control: on
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload (production only)
```

---

## Service Layer Deep Dive

### 1. BookingService

**File:** `apps/web/src/services/booking.ts`

The most complex service — handles the core transaction logic.

**Exported Methods:**

| Method | Signature | Purpose |
|--------|-----------|---------|
| `hasOverlappingBooking` | `(vehicleId, startDate, endDate) → boolean` | Check for date conflicts |
| `create` | `(input, renterId, hostId) → Booking` | Atomic booking creation |
| `getById` | `(id) → Booking \| null` | Fetch single booking |
| `getByRenter` | `(renterId) → Booking[]` | All renter's bookings |
| `getByHost` | `(hostId) → Booking[]` | All host's bookings |
| `cancel` | `(bookingId, cancelledBy, reason) → Booking` | Cancel with refund calc |
| `accept` | `(bookingId, hostId) → Booking` | Host accepts pending booking |
| `reject` | `(bookingId, hostId, reason) → Booking` | Host rejects booking |

**Critical: Double-Booking Prevention**

The `create()` method uses raw SQL via `neon()` (bypasses Drizzle) for an atomic `INSERT ... WHERE NOT EXISTS`:

```sql
INSERT INTO bookings (id, renter_id, vehicle_id, host_id, ...)
SELECT $1, $2, $3, $4, ...
WHERE NOT EXISTS (
  SELECT 1 FROM bookings
  WHERE vehicle_id = $vehicleId
  AND status IN ('pending','confirmed','active')
  AND start_date < $endDate AND end_date > $startDate
) AND NOT EXISTS (
  SELECT 1 FROM vehicle_availability
  WHERE vehicle_id = $vehicleId
  AND type IN ('blocked','maintenance')
  AND start_date < $endDate AND end_date > $startDate
)
RETURNING *
```

**Why raw SQL?** The Neon HTTP driver doesn't support multi-statement transactions. This single-statement approach is atomic at the database level.

**Concurrency Control:**
- `cancel()`, `accept()`, `reject()` use optimistic locking: `WHERE version = currentVersion`
- No retry logic — concurrent conflicts return errors to the user

**Events Emitted:** `booking.created`, `booking.confirmed`, `booking.cancelled`

**Anti-patterns:**
- Auto-cancels stale pending bookings before create (side effect in a creation method)
- `accept()` and payment webhook both set status to `confirmed` — potential race condition with duplicate `booking.confirmed` events

---

### 2. VehicleService

**File:** `apps/web/src/services/vehicle.ts`

**Key Method: `search(params)`**

The search method builds a complex dynamic query with:

1. **Text filtering:** `ilike` on make, model, description, address
2. **Categorical filtering:** city, vehicleType, fuelType, transmission, minSeats, maxPrice, minRating
3. **Spatial filtering:** `earth_box()` / `ll_to_earth()` / `earth_distance()` via PostGIS earthdistance extension
4. **Availability filtering:** `notExists()` subqueries exclude vehicles with overlapping confirmed/active bookings or blocked/maintenance periods
5. **Sorting:** price (asc), rating (desc), distance (asc), relevance (tripCount desc)
6. **Pagination:** `Promise.all([results, countResult])` for parallel data + count queries

Only `listed` vehicles appear in results.

**Other Methods:**

| Method | Purpose |
|--------|---------|
| `getById(id)` | Vehicle detail |
| `getCities()` | Aggregated city list with vehicle counts |
| `getByHost(hostId)` | Host's vehicle list |
| `create(input, hostId)` | New vehicle listing |
| `update(id, hostId, input)` | Update listing (ownership checked) |
| `updateStatus(id, hostId, status)` | List/delist/draft |
| `getHostStats(hostId)` | Aggregated stats with SQL FILTER clauses |

**Anti-pattern:** `create()` uses `...(input as any)` — spreads arbitrary user input into DB insert. Could inject unexpected columns.

---

### 3. PaymentService

**File:** `apps/web/src/services/payment.ts`

Manages the Razorpay payment lifecycle.

**Flow:**

```
createOrder()                     capturePayment()
    │                                 │
    ├── Check idempotency             ├── Verify Razorpay signature
    ├── razorpay.orders.create()      ├── Fetch payment method
    ├── INSERT payment (pending)      ├── UPDATE payment (captured)
    └── Return orderId                └── Return payment
                                      
handleWebhookEvent("payment.captured")
    │
    ├── UPDATE payment (captured)
    ├── UPDATE booking (confirmed, with version check)
    ├── INSERT booking_event
    └── emitEvent("payment.captured")
```

**Business Rules:**
- Idempotent order creation: returns existing pending order if one exists
- Idempotent capture: returns early if already captured with matching paymentId
- Signature verification via HMAC-SHA256 (`crypto.timingSafeEqual`)
- Webhook is the **authoritative path** for booking confirmation
- Refund creates a separate payment record of type `refund`

**Events Emitted:** `payment.captured`, `payment.refunded`

**Anti-pattern:** No database transactions — webhook handler does multiple writes (payment update, booking update, event insert) as separate operations. A crash between them leaves inconsistent state.

---

### 4. PricingService

**File:** `apps/web/src/services/pricing.ts`

**Pure computation** — no database queries.

**Pricing Formula:**

```
weekdayRate = vehicle.baseDailyRate
weekendRate = vehicle.weekendRate || vehicle.baseDailyRate
subtotal = (weekdayCount × weekdayRate) + (weekendCount × weekendRate)

if days >= 30: subtotal *= (1 - monthlyDiscountPct/100)
elif days >= 7: subtotal *= (1 - weeklyDiscountPct/100)

protectionFee = subtotal × protectionRate  (0%/8%/15%)
platformFee = subtotal × 18%
tax = (subtotal + platformFee + protectionFee) × 5%
total = subtotal + protectionFee + platformFee + tax
```

**Cancellation Refund Tiers:**

| Hours Before Start | Refund % |
|--------------------|----------|
| > 48 hours | 100% |
| 24-48 hours | 75% |
| 6-24 hours | 50% |
| < 6 hours | 0% |

---

### 5. TripService

**File:** `apps/web/src/services/trip.ts`

Manages the physical rental lifecycle.

| Method | Flow |
|--------|------|
| `start()` | Verify booking is confirmed → Create trip → Update booking to active |
| `complete()` | Verify trip is active → Update trip with end data → Update booking to completed |
| `addLocation()` | Insert GPS data point |
| `getLocations()` | Fetch all GPS points for a trip |

**Authorization:** Only hosts can start/complete trips. Only one trip per booking (duplicate check).

**Events Emitted:** `trip.started`, `trip.completed`

---

### 6. ReviewService

**File:** `apps/web/src/services/review.ts`

**Auto-Moderation System:**

Reviews are created as `published`, then checked for auto-flagging:

1. **Profanity detection:** Regex word-boundary matching against hardcoded word list
2. **Suspicious pattern:** Short text (<5 chars) with extreme rating (1 or 5)
3. **Low trust reviewer:** Trust score below 0.20

On every create/hide/publish, the vehicle's denormalized `ratingAvg` and `reviewCount` are recalculated and updated.

**Moderation workflow:** published → flagged → hidden (or back to published)

**Anti-patterns:**
- Profanity filter is trivially bypassable (character substitution, leetspeak)
- `flagReview()`, `hideReview()`, `publishReview()` have no authorization checks
- `console.log` used in event handler instead of structured logger

---

### 7. TrustScoreService

**File:** `apps/web/src/services/trust-score.ts`

Behavioral reputation system.

**Score Calculation:**

| Factor | Delta | Cap |
|--------|-------|-----|
| Base | 0.50 | — |
| Completed bookings | +0.02 each | +0.20 |
| Late cancellations (<24h) | -0.10 each | — |
| Regular cancellations | -0.05 each | — |
| 5-star reviews | +0.03 each | — |
| 4-star reviews | +0.01 each | — |
| 2-star reviews | -0.02 each | — |
| 1-star reviews | -0.05 each | — |
| Failed payments | -0.05 each | — |
| Account age | +0.01 per 30 days | +0.10 |

Score clamped to [0.00, 1.00].

**Auto-Moderation Thresholds:**
- Score < 0.05 → Ban user
- Score < 0.15 → Suspend user

---

### 8. NotificationService

**File:** `apps/web/src/services/notification.ts`

| Method | Purpose |
|--------|---------|
| `send()` | Create notification + optional email delivery |
| `getByUser()` | Paginated list with unread count (parallel queries) |
| `markRead()` | Mark single notification as read |
| `markAllRead()` | Mark all user notifications as read |
| `getUnreadCount()` | Count unread notifications |

Channels: `in_app` (default), `email`. Push and SMS defined in enum but not implemented.

---

### 9. PayoutService

**File:** `apps/web/src/services/payout.ts`

Host earnings disbursement via RazorpayX.

**Earnings Calculation:**
```
grossEarnings = sum(captured charges) - sum(refunds) for completed bookings in period
platformFee = grossEarnings × 15%
netEarnings = grossEarnings - platformFee
```

**Note:** Platform fee is 15% for payouts vs 18% in pricing. The 18% is charged to the renter; the 15% is taken from the host. The platform keeps 15% of the host's gross as revenue plus the full 18% platform fee from the renter.

**Payout Flow:**
1. Host requests payout for a period
2. Admin processes payout → RazorpayX NEFT transfer
3. Razorpay webhook updates payout status

**Anti-pattern:** Uses raw `fetch()` to Razorpay API instead of the SDK for payout operations.

---

### 10. AvailabilityService

**File:** `apps/web/src/services/availability.ts`

Manages host-defined blocking periods (maintenance, personal use).

**Anti-pattern:** Date handling inconsistency — `isAvailable()` uses `split("T")[0]` for availability table but raw Date objects for booking table comparison.

---

## Lib Files Analysis

### Authentication Stack

| File | Purpose | Key Detail |
|------|---------|-----------|
| `auth.ts` | NextAuth v5 config | Google, GitHub, demo credentials. JWT sessions (12h). 6 demo accounts with hardcoded UUIDs. |
| `bearer-auth.ts` | JWT bearer verification | `jose.jwtVerify()` against `AUTH_SECRET`. Used for MCP/programmatic access. |
| `resolve-user-id.ts` | OAuth ID stability | Maps session ID → stable DB user by email lookup. Handles OAuth providers generating different session IDs across logins. |

### Event System

| File | Purpose | Key Detail |
|------|---------|-----------|
| `emit-event.ts` | Transactional outbox entry point | Inserts into `outbox_events` first, then processes inline via `after()` with 2 retries and exponential backoff. |
| `outbox-processor.ts` | Batch retry processor | Processes up to 50 events/batch. Max 5 attempts with 30s base exponential backoff. Called by cron. |
| `event-handlers.ts` | Central subscription registry | Idempotent registration. Subscribes to all 10 event types. Handlers trigger notifications, emails, trust scores, refunds. |

### Event Handler Subscriptions

| Event | Handlers |
|-------|----------|
| `booking.created` | Notify host (in-app) |
| `booking.confirmed` | Generate pickup OTP, notify renter (in-app + email via SES + Resend), send confirmation email |
| `booking.cancelled` | Process refund if applicable, notify renter + host (in-app + email), penalize canceller trust score |
| `booking.completed` | Reward renter + host with +0.02 trust score |
| `payment.captured` | Notify renter (in-app + email) |
| `payment.refunded` | Notify renter (in-app + email) |
| `payment.failed` | Log warning, penalize trust score (-0.05) |
| `trip.started` | Notify renter (in-app + email) |
| `trip.completed` | Notify renter (in-app + email) |
| `review.created` | Apply rating-based trust score delta |

### Payment Infrastructure

| File | Purpose |
|------|---------|
| `razorpay.ts` | Server-side SDK singleton, `verifyPaymentSignature()`, `verifyWebhookSignature()` using `crypto.timingSafeEqual` |
| `razorpay-client.ts` | Client-side Razorpay Checkout SDK. Lazy-loads script from CDN. Returns promise resolving on success. |

### Email (Duplicate Module Issue)

| File | Package | From Address |
|------|---------|-------------|
| `email.ts` | Resend | `FROM_EMAIL` env var |
| `ses.ts` | Resend (**not AWS SES despite name**) | `RESEND_FROM_EMAIL` env var |

**Bug:** Both files provide `sendEmail()` using Resend. Event handlers import from both, causing **double email delivery** for `booking.confirmed`, `trip.started`, and `trip.completed` events.

### Other Utilities

| File | Purpose |
|------|---------|
| `db.ts` | Lazy-initialized Neon Postgres clients (HTTP + WebSocket) |
| `api-error.ts` | `ApiError` class + `errorResponse()` handler. Filters DB errors, sends unexpected errors to Sentry. |
| `logger.ts` | Structured JSON logging + Sentry integration. Dev mode adds human-readable output. |
| `format.ts` | `formatPrice()` (paise→display), `formatRating()`, vehicle type/fuel labels, feature icons |
| `email-templates.ts` | 6 HTML email templates (booking confirmed, trip started/completed, cancelled, payment, refund) |
| `ai-cache.ts` | Redis-backed AI response cache. Simple Java-style hash for cache keys. Silent failure on Redis unavailability. |
| `mutation-store.ts` | In-memory pub/sub for client-side mutation invalidation across components |

---

## API Route Analysis

### Complete Route Table

| Route | Methods | Auth | Rate Limit | Caching |
|-------|---------|------|-----------|---------|
| `/api/health` | GET | Public | General | None |
| `/api/cities` | GET | Public | General | None |
| `/api/vehicles/search` | GET | Public | General | None |
| `/api/vehicles/[id]` | GET, PUT, PATCH | GET public; PUT/PATCH session | General | None |
| `/api/vehicles` | POST | Session (host/admin) | General | None |
| `/api/vehicles/[id]/availability` | GET, POST, DELETE | GET public; POST/DELETE session | General | None |
| `/api/vehicles/[id]/chat` | POST | Session | AI (10/60s) | None |
| `/api/bookings` | GET, POST | Session + Bearer | General | None |
| `/api/bookings/[id]` | GET, PATCH | Session + Bearer | General | None |
| `/api/payments/create-order` | POST | Session | General | None |
| `/api/payments/verify` | POST | Session | General | None |
| `/api/payments/webhook` | POST | Webhook sig | General | None |
| `/api/trips` | POST | Session | General | None |
| `/api/trips/[id]` | GET, PATCH | Session | General | None |
| `/api/trips/[id]/latest-location` | GET | Session | General | None |
| `/api/trips/[id]/live` | GET | Session | General | `no-cache, no-transform` |
| `/api/notifications` | GET | Session | General | None |
| `/api/notifications/[id]` | PATCH | Session | General | None |
| `/api/notifications/read-all` | POST | Session | General | None |
| `/api/reviews` | GET, POST | GET public; POST session | General | None |
| `/api/reviews/summary` | GET | Public | AI (10/60s) | None |
| `/api/reviews/[id]/flag` | POST | Session | General | None |
| `/api/chat` | POST | Session | AI (10/60s) | None |
| `/api/nl-search` | POST | Session | AI (10/60s) | Redis (1h) |
| `/api/ai/range-advisor` | POST | Session | AI (10/60s) | Redis (24h) |
| `/api/ai/recommendations` | GET | Session* | AI (10/60s) | Redis (30min) |
| `/api/trip-planner` | POST | Session | AI (10/60s) | None |
| `/api/pricing/estimate` | POST | Public | General | None |
| `/api/pickup-points` | GET | Public | General | None |
| `/api/geofences` | GET | Public | General | None |
| `/api/profile` | GET, PATCH | Session | General | None |
| `/api/promo` | POST | Session | General | None |
| `/api/alerts/price-drop` | GET, POST, DELETE | Session | General | None |
| `/api/payouts` | GET, POST | Session (host/admin) | General | None |
| `/api/payouts/earnings` | GET | Session (host/admin) | General | None |
| `/api/payouts/webhook` | POST | Webhook sig | General | None |
| `/api/payouts/[id]/process` | POST | Session (admin) | General | None |
| `/api/admin/users` | GET, PATCH | Session (admin) | General | None |
| `/api/admin/stats` | GET | Session (admin) | General | None |
| `/api/admin/trust-scores` | GET, POST | Session (admin) | General | None |
| `/api/admin/reviews` | GET | Session (admin) | General | None |
| `/api/admin/reviews/[id]` | PATCH | Session (admin) | General | None |
| `/api/auth/[...nextauth]` | GET, POST | Public | Auth (10/60s) | None |
| `/api/mcp/auth` | POST | Public (validates internally) | Auth (10/60s) | None |
| `/api/cron/process-outbox` | GET | Cron secret | General | None |

*`/api/ai/recommendations` is blocked by middleware for unauthenticated users, but the handler itself supports anonymous access (returns top-rated vehicles). This is a middleware/handler mismatch.

---

## Anti-Patterns & Issues

### Critical

| Issue | Impact | File |
|-------|--------|------|
| **No database transactions** | Multiple writes without atomicity in payment webhook, trip start/complete. Crash = inconsistent data. | `payment.ts`, `trip.ts` |
| **Duplicate email delivery** | `booking.confirmed` sends emails via both `ses.ts` and `email.ts` through different code paths | `event-handlers.ts` |
| **Race condition: accept vs webhook** | Both `booking.accept()` and `payment.captured` webhook set status to `confirmed`. Can emit duplicate `booking.confirmed` events, generate two OTPs. | `booking.ts`, `payment.ts` |

### High

| Issue | Impact | File |
|-------|--------|------|
| **Unsafe spread in vehicle create** | `...(input as any)` could inject unexpected DB columns | `vehicle.ts` |
| **No auth on review moderation** | `flagReview()`, `hideReview()`, `publishReview()` have no authorization checks | `review.ts` |
| **No auth on trip location** | `addLocation()` doesn't verify caller is associated with the trip | `trip.ts` |
| **Platform fee inconsistency** | 18% in pricing (renter-facing) vs 15% in payouts (host-facing) — not documented | `pricing.ts`, `payout.ts` |
| **Trust score RATING_DELTAS duplication** | Defined in both `trust-score.ts` and `event-handlers.ts` — can drift | Both files |

### Medium

| Issue | Impact | File |
|-------|--------|------|
| No pagination on list endpoints | `getByRenter()`, `getByHost()`, `getLocations()` return all records | Multiple services |
| No retry on optimistic concurrency | Version conflicts return errors without retries | `booking.ts` |
| Hardcoded promo codes | 4 promo codes in API route, not in DB | `/api/promo/route.ts` |
| Basic profanity filter | Word-boundary regex, easily bypassable | `review.ts` |
| `ses.ts` misleadingly named | Uses Resend, not AWS SES | `ses.ts` |

---

## Production-Grade Backend Redesign

### Current → Ideal

```
CURRENT:
  Route Handler → Service → db.method() → Return
  (no transactions, no queues, manual event handling)

IDEAL:
  Route Handler → Service → Transaction(wsDb, async (tx) => {
    tx.insert(...)
    tx.update(...)
    tx.insert(outbox)
  }) → Return
  
  Background Worker → Poll outbox → Process events
  → Retry with exponential backoff
  → Dead letter queue for permanent failures
```

### Key Improvements Needed

1. **Use `wsDb` for transactions** — The WebSocket transport already exists but is never used
2. **Implement proper retry on optimistic concurrency failures** — Exponential backoff with max attempts
3. **Deduplicate email module** — Remove `ses.ts`, consolidate on `email.ts`
4. **Add authorization to all mutation endpoints** — Review moderation, trip locations
5. **Extract promo codes to database** — Enable runtime management
6. **Add pagination to all list endpoints** — Prevent unbounded result sets
7. **Implement request-scoped logging** — Correlate all operations within a single request via request ID
