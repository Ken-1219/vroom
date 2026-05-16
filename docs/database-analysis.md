# Database Analysis

## Stack & Configuration

| Property | Value |
|----------|-------|
| **ORM** | Drizzle ORM 0.44.7 (PostgreSQL dialect) |
| **Database** | Neon Serverless Postgres with PostGIS |
| **Drivers** | HTTP (`@neondatabase/serverless`) for reads, WebSocket for transactions |
| **Migrations** | `./drizzle/` output directory |
| **Schema** | `packages/db/src/schema/` (13 files, 16 tables, 20 enums) |
| **Client** | Lazy-initialized singletons via Proxy pattern |

### Connection Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     apps/web/src/lib/db.ts                   │
│                                                              │
│  ┌──────────────────┐        ┌──────────────────────────┐   │
│  │  db (HTTP)        │        │  wsDb (WebSocket)        │   │
│  │  - All reads      │        │  - Available for txns    │   │
│  │  - Simple writes  │        │  - NEVER USED in code    │   │
│  │  - Lazy init      │        │  - Lazy init             │   │
│  └────────┬─────────┘        └──────────┬───────────────┘   │
│           │                              │                   │
│           ▼                              ▼                   │
│  ┌──────────────────┐        ┌──────────────────────────┐   │
│  │  neon() HTTP      │        │  Pool() WebSocket        │   │
│  │  (connection per  │        │  (persistent connection) │   │
│  │   request)        │        │                          │   │
│  └────────┬─────────┘        └──────────┬───────────────┘   │
└───────────┼──────────────────────────────┼───────────────────┘
            │                              │
            ▼                              ▼
     ┌──────────────────────────────────────────┐
     │           Neon Serverless Postgres        │
     │           (with PostGIS extensions)       │
     └──────────────────────────────────────────┘
```

**Critical observation:** `wsDb` (WebSocket transport that supports multi-statement transactions) exists but is **never used by any service**. All database operations use the HTTP transport, which means there are no true multi-statement transactions in the entire codebase.

---

## Enums (20 Total)

| Enum | DB Name | Values |
|------|---------|--------|
| `userRoleEnum` | `user_role` | renter, host, admin |
| `userStatusEnum` | `user_status` | active, suspended, banned |
| `vehicleTypeEnum` | `vehicle_type` | sedan, suv, hatchback, luxury, ev, mpv |
| `fuelTypeEnum` | `fuel_type` | petrol, diesel, electric, hybrid, cng |
| `transmissionEnum` | `transmission` | manual, automatic |
| `vehicleStatusEnum` | `vehicle_status` | draft, listed, delisted |
| `bookingStatusEnum` | `booking_status` | pending, confirmed, active, completed, cancelled |
| `paymentTypeEnum` | `payment_type` | charge, refund |
| `paymentStatusEnum` | `payment_status` | pending, authorized, captured, failed, refunded |
| `paymentMethodEnum` | `payment_method` | upi, card, netbanking, wallet |
| `tripStatusEnum` | `trip_status` | pending, active, completed |
| `reviewTypeEnum` | `review_type` | renter_to_vehicle, renter_to_host, host_to_renter |
| `reviewStatusEnum` | `review_status` | published, hidden, flagged |
| `pricingScopeEnum` | `pricing_scope` | global, country, city, vehicle_type, vehicle |
| `pricingRuleTypeEnum` | `pricing_rule_type` | demand_surge, weekend, seasonal, event, time_decay, duration |
| `notificationChannelEnum` | `notification_channel` | in_app, email, push, sms |
| `geofenceTypeEnum` | `geofence_type` | operating_zone, restricted_zone |
| `vehicleAvailabilityEnum` | `vehicle_availability_type` | available, blocked, maintenance |
| `actorTypeEnum` | `actor_type` | user, system |
| `payoutStatusEnum` | `payout_status` | pending, processing, completed, failed |

---

## Entity-Relationship Diagram

```
                                    ┌───────────────────┐
                                    │      users         │
                                    │───────────────────│
                                    │ id (PK, uuid)      │
                                    │ email (UNIQUE)     │
                                    │ phone (UNIQUE)     │
                                    │ name               │
                                    │ role (enum)        │
                                    │ status (enum)      │
                                    │ trustScore         │
                                    │ documents (jsonb)  │
                                    └───────────────────┘
                                      │    │    │    │
              ┌───────────────────────┘    │    │    └──────────────────┐
              │                            │    │                       │
              ▼                            │    ▼                       ▼
   ┌─────────────────┐                    │  ┌──────────────┐  ┌──────────────┐
   │    vehicles      │                    │  │ notifications│  │   payouts     │
   │─────────────────│                    │  │──────────────│  │──────────────│
   │ id (PK)          │                    │  │ user_id (FK) │  │ host_id (FK) │
   │ host_id (FK)     │                    │  │ type, title  │  │ amount       │
   │ make, model      │                    │  │ channel      │  │ status       │
   │ lat, lng, city   │                    │  │ read         │  │ bookingIds   │
   │ baseDailyRate    │                    │  └──────────────┘  └──────────────┘
   │ ratingAvg ◄──┐   │                    │
   │ tripCount    │   │                    │
   └─────────────────┘                    │
       │           │                       │
       │           │                       │
       ▼           ▼                       ▼
┌─────────────┐  ┌──────────────────────────────────┐
│ vehicle_    │  │           bookings                │
│ availability│  │──────────────────────────────────│
│─────────────│  │ id (PK, uuid)                     │
│ vehicle_id  │  │ renter_id (FK→users)              │
│ startDate   │  │ vehicle_id (FK→vehicles)          │
│ endDate     │  │ host_id (FK→users)  [denormalized]│
│ type (enum) │  │ status (enum)                     │
└─────────────┘  │ startDate, endDate                │
                 │ totalAmount (paise)               │
                 │ priceBreakdown (jsonb)            │
                 │ version (optimistic lock) ◄───────── Concurrency control
                 └──────────────────────────────────┘
                    │        │        │         │
         ┌──────────┘        │        │         └──────────┐
         │                   │        │                    │
         ▼                   ▼        ▼                    ▼
  ┌──────────────┐  ┌────────────┐ ┌───────────┐  ┌──────────────┐
  │booking_events│  │  payments  │ │   trips   │  │   reviews    │
  │──────────────│  │────────────│ │───────────│  │──────────────│
  │ booking_id   │  │ booking_id │ │booking_id │  │ booking_id   │
  │ eventType    │  │ user_id    │ │ (UNIQUE)  │  │ reviewer_id  │
  │ data (jsonb) │  │ amount     │ │ status    │  │ reviewee_id  │
  │ actorId      │  │ type       │ │ odometer  │  │ vehicle_id   │
  │ actorType    │  │ status     │ │ fuelLevel │  │ rating (1-5) │
  └──────────────┘  │ idempKey   │ │inspection │  │ CHECK(1..5)  │
                    │ (UNIQUE)   │ └───────────┘  └──────────────┘
                    └────────────┘       │
                                         ▼
                                  ┌───────────────┐
                                  │trip_locations  │
                                  │───────────────│
                                  │ trip_id (FK)   │
                                  │ lat, lng       │
                                  │ speed, heading │
                                  │ recordedAt     │
                                  └───────────────┘

    STANDALONE TABLES (no FK relationships):

    ┌──────────────┐  ┌────────────────┐  ┌──────────────┐
    │pricing_rules │  │demand_snapshots│  │outbox_events │
    │──────────────│  │────────────────│  │──────────────│
    │ scope (enum) │  │ h3_index       │  │ eventType    │
    │ ruleType     │  │ vehicleType    │  │ payload      │
    │ conditions   │  │ demandScore    │  │ status       │
    │ multiplier   │  │ supplyCount    │  │ attempts     │
    └──────────────┘  └────────────────┘  └──────────────┘

    ┌──────────────┐  ┌──────────────┐
    │pickup_points │  │  geofences   │
    │──────────────│  │──────────────│
    │ lat, lng     │  │ name, type   │
    │ city, name   │  │ boundary     │
    │ scores       │  │ city, rules  │
    └──────────────┘  └──────────────┘
```

---

## Table-by-Table Deep Dive

### 1. `users` — Central Identity Table

**File:** `packages/db/src/schema/users.ts`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | uuid | PK, `gen_random_uuid()` | Stable user identity |
| `email` | varchar(255) | UNIQUE | Login identifier, OAuth mapping |
| `phone` | varchar(20) | UNIQUE | Contact, future SMS verification |
| `name` | varchar(255) | NOT NULL | Display name |
| `avatarUrl` | text | nullable | Profile photo URL |
| `role` | enum(user_role) | NOT NULL, default "renter" | RBAC: renter/host/admin |
| `trustScore` | numeric(3,2) | default "0.50" | Behavioral reputation (0.00-1.00) |
| `status` | enum(user_status) | default "active" | Account state |
| `emailVerified` | boolean | default false | Email verification status |
| `phoneVerified` | boolean | default false | Phone verification status |
| `documents` | jsonb | default [] | KYC documents (unstructured) |
| `createdAt` | timestamptz | `defaultNow()` | Registration timestamp |
| `updatedAt` | timestamptz | `defaultNow()` | Last profile update |

**Indexes:** `idx_users_role_status(role, status)`

**Used by:** Auth, profile, trust scoring, booking (as renter/host), vehicle listing (as host), payouts, notifications, reviews

**Anti-pattern:** `documents` as jsonb — document verification is critical for KYC compliance. A separate `user_documents` table with `type`, `status`, `expiresAt` columns would be more queryable and auditable.

---

### 2. `vehicles` — Core Listing Table

**File:** `packages/db/src/schema/vehicles.ts`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | uuid | PK | Vehicle identity |
| `hostId` | uuid | FK→users, NOT NULL | Owner reference |
| `make` | varchar(100) | NOT NULL | Brand (Toyota, Maruti) |
| `model` | varchar(100) | NOT NULL | Model name |
| `year` | integer | NOT NULL | Manufacturing year |
| `variant` | varchar(100) | nullable | Trim level |
| `vehicleType` | enum | NOT NULL | sedan/suv/hatchback/luxury/ev/mpv |
| `fuelType` | enum | NOT NULL | petrol/diesel/electric/hybrid/cng |
| `transmission` | enum | NOT NULL | manual/automatic |
| `seats` | integer | NOT NULL | Passenger capacity |
| `color` | varchar(50) | nullable | Vehicle color |
| `registrationNumber` | varchar(30) | UNIQUE, NOT NULL | License plate |
| `latitude` | numeric(10,7) | NOT NULL | Pickup location lat |
| `longitude` | numeric(10,7) | NOT NULL | Pickup location lng |
| `address` | text | nullable | Human-readable address |
| `city` | varchar(100) | NOT NULL | City for search/grouping |
| `country` | varchar(2) | default "IN" | ISO country code |
| `currency` | varchar(3) | default "INR" | Pricing currency |
| `timezone` | varchar(50) | default "Asia/Kolkata" | Local timezone |
| `baseDailyRate` | integer | NOT NULL | Price per day in **paise** |
| `weekendRate` | integer | nullable | Fri-Sun rate in paise |
| `weeklyDiscountPct` | integer | default 0 | 7+ day discount (0-80%) |
| `monthlyDiscountPct` | integer | default 0 | 30+ day discount (0-80%) |
| `dynamicPricingEnabled` | boolean | default true | Surge pricing opt-in |
| `minPrice` | integer | nullable | Floor price in paise |
| `photos` | jsonb | default [] | `{url, position, isPrimary}[]` |
| `features` | jsonb | default [] | `string[]` of features |
| `rules` | jsonb | default {} | Host-defined rules |
| `description` | text | nullable | Listing description |
| `ratingAvg` | numeric(2,1) | default "0.0" | **Denormalized** avg rating |
| `tripCount` | integer | default 0 | **Denormalized** completed trips |
| `reviewCount` | integer | default 0 | **Denormalized** review count |
| `status` | enum | default "draft" | draft/listed/delisted |
| `instantBooking` | boolean | default false | Skip host approval |
| `createdAt` | timestamptz | `defaultNow()` | Listing creation |
| `updatedAt` | timestamptz | `defaultNow()` | Last update |

**Indexes:**
- `idx_vehicles_search(city, vehicle_type, status, base_daily_rate)` — Composite for filtered search
- `idx_vehicles_host(host_id)` — Host dashboard queries
- Spatial GiST index on `(latitude, longitude)` via `earthdistance + cube` extensions (referenced in code, requires separate migration)

**Denormalization strategy:** `ratingAvg`, `tripCount`, `reviewCount` are materialized aggregates. Updated on every review create/hide/publish and trip completion. Avoids expensive `AVG()` joins on every listing page.

**Anti-patterns:**
- `photos` as jsonb — Can't query "all primary photos" or build a CDN purge list
- `features` as jsonb array — Can't do efficient "search by feature" with proper indexing
- Currency duplicated across vehicles/bookings/payments — risk of mismatch

---

### 3. `bookings` — Core Transaction Table

**File:** `packages/db/src/schema/bookings.ts`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | uuid | PK | Booking identity |
| `renterId` | uuid | FK→users | Who's renting |
| `vehicleId` | uuid | FK→vehicles | What's being rented |
| `hostId` | uuid | FK→users | Vehicle owner (denormalized) |
| `status` | enum | NOT NULL, default "pending" | Lifecycle state |
| `startDate` | timestamptz | NOT NULL | Rental start |
| `endDate` | timestamptz | NOT NULL | Rental end |
| `pickupLatitude/Longitude` | numeric(10,7) | nullable | Pickup coordinates |
| `pickupAddress` | text | nullable | Pickup address |
| `dropoffLatitude/Longitude` | numeric(10,7) | nullable | Return coordinates |
| `dropoffAddress` | text | nullable | Return address |
| `totalAmount` | integer | NOT NULL | Total in paise |
| `currency` | varchar(3) | default "INR" | Payment currency |
| `priceBreakdown` | jsonb | NOT NULL | Snapshot of price calculation |
| `cancellationReason` | text | nullable | Why cancelled |
| `cancelledBy` | uuid | nullable | Who cancelled (**no FK!**) |
| `cancelledAt` | timestamptz | nullable | When cancelled |
| `pickupOtp` | varchar(6) | nullable | OTP for vehicle pickup |
| `couponCode` | varchar(50) | nullable | Applied promo code |
| `addons` | jsonb | default [] | Additional services |
| `version` | integer | default 1 | **Optimistic concurrency control** |
| `createdAt` | timestamptz | `defaultNow()` | Booking creation |
| `updatedAt` | timestamptz | `defaultNow()` | Last state change |

**Indexes:**
- `idx_bookings_vehicle_dates(vehicle_id, start_date, end_date)` — Double-booking prevention queries
- `idx_bookings_renter(renter_id, status)` — "My bookings" queries
- `idx_bookings_host(host_id, status)` — Host dashboard queries

**Status state machine:**

```
pending ──▶ confirmed ──▶ active ──▶ completed
   │              │
   ├──▶ cancelled ◄──┘
   │
   └──▶ rejected (handled as cancelled with reason)
```

**Concurrency control:** The `version` column implements optimistic locking. Every update increments version and includes `WHERE version = currentVersion` to detect concurrent modifications. No retry logic is implemented — concurrent conflicts result in user-visible errors.

**Double-booking prevention:** `bookingService.create()` uses raw SQL:
```sql
INSERT INTO bookings (...)
SELECT ... WHERE NOT EXISTS (
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

This is atomic at the database level — if two concurrent inserts race, only one will succeed.

---

### 4. `booking_events` — Audit Trail

**File:** `packages/db/src/schema/bookings.ts`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | PK |
| `bookingId` | uuid (FK→bookings) | Parent booking |
| `eventType` | varchar(50) | e.g., "created", "confirmed", "cancelled" |
| `data` | jsonb | Event-specific payload |
| `actorId` | uuid (nullable, **no FK**) | Who triggered the event |
| `actorType` | enum(actor_type) | user or system |
| `createdAt` | timestamptz | Event timestamp |

**Index:** `idx_booking_events(booking_id, created_at)`

This is an **event sourcing light** pattern — not used for state reconstruction, but provides a complete audit trail of every booking state transition.

---

### 5. `payments` — Financial Records

**File:** `packages/db/src/schema/payments.ts`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | PK |
| `bookingId` | uuid (FK) | Associated booking |
| `userId` | uuid (FK) | Who paid |
| `amount` | integer | Amount in paise |
| `currency` | varchar(3) | Currency code |
| `type` | enum | charge or refund |
| `status` | enum | pending/authorized/captured/failed/refunded |
| `method` | enum (nullable) | upi/card/netbanking/wallet |
| `gatewayReference` | varchar(255) | Razorpay order/payment ID |
| `idempotencyKey` | varchar(255) | **UNIQUE** — prevents duplicate payments |
| `metadata` | jsonb (nullable) | Gateway-specific data |
| `createdAt` | timestamptz | Payment timestamp |

**Index:** `idx_payments_booking(booking_id)`

**Idempotency:** The `idempotencyKey` (UNIQUE constraint) prevents duplicate charge/refund records. Format: `{bookingId}_charge` or `{bookingId}_refund_{reason}`.

**Missing indexes:**
- `(gateway_reference)` — Razorpay webhooks look up by gateway reference
- `(user_id)` — "My payment history" queries

---

### 6. `trips` — Active Rental Tracking

**File:** `packages/db/src/schema/trips.ts`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | PK |
| `bookingId` | uuid (FK, **UNIQUE**) | 1:1 with booking |
| `status` | enum | pending/active/completed |
| `actualStart/End` | timestamptz | Real timestamps |
| `startOdometer/endOdometer` | integer | Mileage tracking |
| `startFuelLevel/endFuelLevel` | numeric(3,2) | Fuel state (0.00-1.00) |
| `preInspection/postInspection` | jsonb | Condition reports |
| `createdAt` | timestamptz | Trip creation |

**1:1 relationship** enforced via UNIQUE constraint on `bookingId`.

---

### 7. `trip_locations` — GPS Time Series

**File:** `packages/db/src/schema/trips.ts`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | bigserial | PK (auto-increment for performance) |
| `tripId` | uuid (FK→trips) | Parent trip |
| `latitude/longitude` | numeric(10,7) | GPS coordinates |
| `speed` | numeric(5,1) | km/h |
| `heading` | numeric(5,1) | 0-360 degrees |
| `recordedAt` | timestamptz | GPS timestamp |

**Index:** `idx_trip_locations(trip_id, recorded_at)`

**Scaling concern:** This is a time-series table that grows unboundedly. At 3-second polling intervals, a 3-day trip generates ~86,400 rows. With thousands of concurrent trips, this table needs partitioning or archival strategy.

---

### 8. `reviews` — Rating System

**File:** `packages/db/src/schema/reviews.ts`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | PK |
| `bookingId` | uuid (FK) | Associated booking |
| `reviewerId` | uuid (FK→users) | Who wrote it |
| `revieweeId` | uuid (FK→users, nullable) | Who it's about |
| `vehicleId` | uuid (FK→vehicles, nullable) | Which vehicle |
| `type` | enum | renter_to_vehicle/renter_to_host/host_to_renter |
| `rating` | integer | 1-5 with CHECK constraint |
| `subRatings` | jsonb (nullable) | cleanliness/accuracy/communication/value |
| `text` | text (nullable) | Review content |
| `status` | enum | published/hidden/flagged |
| `createdAt` | timestamptz | Review timestamp |

**Index:** `idx_reviews_vehicle(vehicle_id, created_at)`  
**Check:** `rating BETWEEN 1 AND 5`

**Missing indexes:** `(booking_id)` for duplicate review checks, `(reviewer_id)` for "my reviews"

---

### 9. `pricing_rules` — Dynamic Pricing Engine

**File:** `packages/db/src/schema/pricing.ts`

Hierarchical pricing rules with scope-based applicability:

| Scope | Example | Priority |
|-------|---------|----------|
| `global` | Weekend surcharge (1.15x) | Lowest |
| `country` | Diwali surge India (1.35x) | |
| `city` | Bangalore demand (1.20x) | |
| `vehicle_type` | SUV summer surge (1.25x) | |
| `vehicle` | Specific vehicle discount | Highest |

**Missing index:** `(scope, active, priority)` — Every pricing query scans the full table.

---

### 10. `demand_snapshots` — Geospatial Demand Data

**File:** `packages/db/src/schema/pricing.ts`

Uses **H3 hexagonal grid** (resolution 7) for geospatial demand tracking. Each snapshot records:
- `h3Index` — H3 hex identifier
- `demandScore` — Computed demand level (0.00-9.99)
- `supplyCount` / `bookedCount` — Supply vs demand
- `computedAt` — Timestamp

**Index:** `idx_demand_h3(h3_index, computed_at)`

---

### 11. `notifications` — In-App & Multi-Channel

**File:** `packages/db/src/schema/notifications.ts`

Supports 4 channels: `in_app`, `email`, `push`, `sms`. Currently only `in_app` and `email` are implemented.

**Index:** `idx_notifications_user(user_id, read, created_at)` — Optimized for unread-first ordering.

---

### 12. `outbox_events` — Transactional Outbox

**File:** `packages/db/src/schema/outbox.ts`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | PK |
| `eventType` | varchar(100) | Event name (e.g., "booking.created") |
| `payload` | jsonb | Event data |
| `status` | varchar(20) | pending/processed/failed |
| `attempts` | integer | Retry count (max 5) |
| `lastError` | text | Last failure message |
| `processAfter` | timestamptz | Exponential backoff scheduling |
| `createdAt` | timestamptz | Event creation |
| `processedAt` | timestamptz | When successfully processed |

**Index:** `idx_outbox_status_process_after(status, process_after)`

The outbox processor (`lib/outbox-processor.ts`) processes up to 50 pending events per batch with exponential backoff (base 30 seconds, max 5 attempts).

---

### 13-16. Supporting Tables

| Table | Purpose | File |
|-------|---------|------|
| `vehicle_availability` | Host-managed blocking periods | `schema/availability.ts` |
| `pickup_points` | Curated pickup locations by city | `schema/geo.ts` |
| `geofences` | Operating zones and restricted areas | `schema/geo.ts` |
| `payouts` | Host earnings disbursement records | `schema/payouts.ts` |

---

## Relationship Map

| From | Column | To | Cardinality | FK Declared |
|------|--------|----|-------------|-------------|
| vehicles | host_id | users | M:1 | Yes |
| bookings | renter_id | users | M:1 | Yes |
| bookings | vehicle_id | vehicles | M:1 | Yes |
| bookings | host_id | users | M:1 | Yes |
| bookings | cancelled_by | users | M:1 | **NO — missing FK** |
| booking_events | booking_id | bookings | M:1 | Yes |
| booking_events | actor_id | users | M:1 | **NO — missing FK** |
| payments | booking_id | bookings | M:1 | Yes |
| payments | user_id | users | M:1 | Yes |
| trips | booking_id | bookings | 1:1 (UNIQUE) | Yes |
| trip_locations | trip_id | trips | M:1 | Yes |
| reviews | booking_id | bookings | M:1 | Yes |
| reviews | reviewer_id | users | M:1 | Yes |
| reviews | reviewee_id | users | M:1 (nullable) | Yes |
| reviews | vehicle_id | vehicles | M:1 (nullable) | Yes |
| notifications | user_id | users | M:1 | Yes |
| vehicle_availability | vehicle_id | vehicles | M:1 | Yes |
| payouts | host_id | users | M:1 | Yes |
| payouts | booking_ids | bookings | M:M (denorm) | **NO — jsonb array** |

**Critical:** No Drizzle `relations()` definitions exist anywhere. All relationships are column-level `.references()` only. This means Drizzle's relational query API (`db.query.users.findMany({ with: { vehicles: true } })`) will **not work**.

---

## Index Analysis

### Existing Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | `idx_users_role_status` | (role, status) | Admin user listing |
| vehicles | `idx_vehicles_search` | (city, vehicle_type, status, base_daily_rate) | Vehicle search |
| vehicles | `idx_vehicles_host` | (host_id) | Host dashboard |
| bookings | `idx_bookings_vehicle_dates` | (vehicle_id, start_date, end_date) | Double-booking check |
| bookings | `idx_bookings_renter` | (renter_id, status) | Renter's bookings |
| bookings | `idx_bookings_host` | (host_id, status) | Host's bookings |
| booking_events | `idx_booking_events` | (booking_id, created_at) | Event timeline |
| payments | `idx_payments_booking` | (booking_id) | Payment lookup |
| reviews | `idx_reviews_vehicle` | (vehicle_id, created_at) | Vehicle reviews |
| trip_locations | `idx_trip_locations` | (trip_id, recorded_at) | Location timeline |
| demand_snapshots | `idx_demand_h3` | (h3_index, computed_at) | Demand lookup |
| notifications | `idx_notifications_user` | (user_id, read, created_at) | User notifications |
| vehicle_availability | `idx_vehicle_availability_dates` | (vehicle_id, start_date, end_date) | Availability check |
| outbox_events | `idx_outbox_status_process_after` | (status, process_after) | Outbox processing |
| payouts | `idx_payouts_host_status` | (host_id, status) | Host payouts |

### Missing Indexes (Critical)

| Table | Recommended Index | Why |
|-------|-------------------|-----|
| `pricing_rules` | `(scope, active, priority)` | Every pricing calc scans the full table |
| `payments` | `(gateway_reference)` | Webhook lookups by Razorpay ID |
| `payments` | `(user_id)` | Payment history queries |
| `reviews` | `(booking_id)` | Duplicate review checks |
| `reviews` | `(reviewer_id)` | "My reviews" queries |
| `trips` | `(status)` | Active trip monitoring |
| `bookings` | `(status)` standalone | Admin "all pending" queries |
| `pickup_points` | `(city, active)` | City-filtered pickup search |
| `geofences` | `(city, type, active)` | Geofence lookups |
| `vehicles` | GiST spatial index | If PostGIS migration not run |

---

## N+1 Query Risk Areas

| Scenario | Risk | Current Mitigation |
|----------|------|--------------------|
| Booking list → vehicle + host details | **HIGH** | None — separate queries per booking |
| Vehicle search → host info per vehicle | Medium | Not loading host data in search results |
| Vehicle reviews → reviewer info | **HIGH** | None — N separate user lookups |
| Booking detail page | **HIGH** | 6-8 separate queries (booking, vehicle, host, renter, payments, trip, events, review) |
| Host dashboard → bookings for all vehicles | Medium | Single query with host_id filter |
| Payouts → associated bookings | Medium | jsonb array requires `WHERE id = ANY(...)` |
| Notifications → related booking/vehicle data | Low | Data stored inline in jsonb |

**Root cause:** No Drizzle `relations()` defined, so relational queries with eager loading aren't available. All joins must be explicit SQL.

---

## Normalization Analysis

### Intentional Denormalization (Acceptable)

| Field | Why It's Acceptable |
|-------|--------------------|
| `vehicles.ratingAvg/tripCount/reviewCount` | Avoids AVG/COUNT on every listing page. Updated on review/trip events. |
| `bookings.hostId` | Denormalized from vehicles. Enables direct host-based queries without joins. |
| `bookings.priceBreakdown` (jsonb) | Captures price at booking time — audit-trail requirement. |
| `payouts.bookingIds` (jsonb array) | Denormalized M:M. Acceptable for payout reports. |

### Problematic Denormalization

| Field | Issue | Recommendation |
|-------|-------|----------------|
| `users.documents` (jsonb) | Can't query by doc type/status/expiry | Create `user_documents` table |
| `vehicles.photos` (jsonb) | Can't query primary photos globally | Create `vehicle_photos` table |
| `vehicles.features` (jsonb) | Can't search "vehicles with feature X" | Create `vehicle_features` junction table |
| `bookings.couponCode` | No `coupons` table to validate against | Create `coupons` table with rules |
| `geofences.boundary` (jsonb GeoJSON) | Loses PostGIS spatial indexing | Use `geometry` column type |

---

## Seed Data Summary

| Entity | Count | Distribution |
|--------|-------|-------------|
| Users | 26 | 4 demo + 22 city hosts |
| Vehicles | 236 | 24 Indian cities, Bangalore densest |
| Bookings | 53 | Mix of completed/active/cancelled |
| Payments | ~50 | One per non-cancelled booking (UPI) |
| Trips | ~46 | One per completed + active booking |
| Booking Events | ~150 | 2-4 per booking |
| Reviews | 48 | All renter_to_vehicle, ratings 3-5 |
| Pricing Rules | 16 | Global + seasonal + city + duration |
| Demand Snapshots | 12 | H3 hex data for 6 cities |
| Pickup Points | 15 | All Bangalore |
| Geofences | 2 | Bangalore operating + airport restricted |

**UUID conventions:** Fixed prefixes per entity type (e.g., `d0000000-*` for demo users, `e1000000-*` for vehicles).

**All amounts in paise:** `baseDailyRate: 80000` = ₹800.00

---

## Production-Grade Improvements

### Critical

1. **Add database transactions** — Use `wsDb` (WebSocket transport) for multi-statement operations in payment capture, trip start/complete, and booking state transitions
2. **Add Drizzle `relations()`** — Enable relational queries to eliminate N+1 patterns
3. **Add missing FK constraints** — `bookings.cancelledBy`, `booking_events.actorId`

### High Priority

4. **Add missing indexes** — pricing_rules, payments.gateway_reference, reviews.booking_id
5. **Partition `trip_locations`** — Time-based partitioning or archival for GPS data
6. **Add range exclusion constraint** on `vehicle_availability` — Prevent overlapping blocks at the DB level
7. **Implement connection pooling** — Neon's HTTP driver creates a new connection per query; consider pgBouncer for high-throughput

### Medium Priority

8. **Normalize jsonb columns** — photos, features, documents into proper tables
9. **Add `coupons` table** — Currently hardcoded in API route
10. **Add soft-delete** — Currently no tables have soft-delete; important for compliance
11. **Add `updated_at` triggers** — Currently only set on initial insert, not auto-updated

### Interview Talking Points

- **Why Neon over RDS/Supabase?** — Serverless auto-scaling, branching for dev/staging, HTTP driver for edge compatibility
- **Why Drizzle over Prisma?** — Thinner abstraction, SQL-like query builder, better for complex queries (PostGIS, NOT EXISTS)
- **Why optimistic concurrency over pessimistic locks?** — Serverless functions can't hold database locks across requests; version column is the serverless-friendly alternative
- **Why paise as integers?** — Eliminates floating-point precision errors in financial calculations
