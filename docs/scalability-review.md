# Scalability Review

## Current Capacity Estimate

| Metric | Estimate | Bottleneck |
|--------|----------|-----------|
| **Concurrent users** | ~100-500 | DB connections, no pooling |
| **Requests/second** | ~50-100 | Vercel function concurrency |
| **AI requests/min** | 10 per user | Groq rate limit |
| **Database connections** | ~50-100 simultaneous | Neon serverless limit |
| **Bookings/day** | ~500-1000 | Atomic insert, no queue |

---

## Bottleneck Analysis

### 1. Database Connection Exhaustion

**Current state:** Every request creates a new Neon HTTP connection. No connection pooling.

**File:** `apps/web/src/lib/db.ts`

```
Request → neon(DATABASE_URL) → New HTTP connection → Execute query → Close
```

**At scale:** 100 concurrent Vercel functions × 2-3 queries each = 200-300 concurrent connections. Neon's default connection limit for serverless plans is ~100-300 depending on plan.

**When it breaks:** ~100-300 concurrent users. You'll see `too many connections` errors.

**Fix:**
- Use Neon's built-in connection pooling (`DATABASE_URL` with `-pooler` suffix)
- The WebSocket client (`wsDb`) supports connection reuse but is never used
- Consider PgBouncer or Neon's HTTP proxy with connection multiplexing

### 2. Unbounded List Queries

**Affected endpoints:**

| Method | Service | Returns |
|--------|---------|---------|
| `bookingService.getByRenter(userId)` | BookingService | ALL renter bookings |
| `bookingService.getByHost(userId)` | BookingService | ALL host bookings |
| `tripService.getLocations(tripId)` | TripService | ALL GPS points |
| `payoutService.getByHost(hostId)` | PayoutService | ALL host payouts |
| `notificationService.getByUser()` | NotificationService | Paginated (good) |

**When it breaks:** A frequent renter with 500+ bookings or a host with 100+ vehicles will experience multi-second response times.

**Fix:** Add `LIMIT` and `OFFSET` (or cursor pagination) to all list queries.

### 3. `trip_locations` Table Growth

**Growth rate:**

```
Polling interval: 3 seconds
Active trip duration: ~3 days average
Rows per trip: (3 days × 24h × 60min × 60s) / 3 = 86,400 rows

At scale:
  100 concurrent trips × 86,400 rows = 8.6M rows/month
  1000 concurrent trips × 86,400 rows = 86.4M rows/month
```

**When it breaks:** At ~10M rows without partitioning, `idx_trip_locations(trip_id, recorded_at)` B-tree becomes slow for inserts. At 100M rows, storage costs and backup times become significant.

**Fix:**
- Partition by month: `trip_locations_2026_05`, `trip_locations_2026_06`, etc.
- Archive completed trip locations to cold storage (S3 + Parquet)
- Increase polling interval to 10-15 seconds for non-critical tracking
- Implement downsampling: keep every 3rd point after trip completion

### 4. Notification Polling

**Current:** Every connected user polls `GET /api/notifications?limit=1` every 30 seconds.

**At scale:**

```
1,000 users × 2 req/min = 2,000 req/min (for notifications alone)
10,000 users × 2 req/min = 20,000 req/min
100,000 users × 2 req/min = 200,000 req/min
```

Each poll hits the database (two queries: notifications list + unread count).

**When it breaks:** ~5,000-10,000 concurrent users. Notification polling alone consumes most of the API capacity.

**Fix:**
- Replace with Server-Sent Events (SSE): one long-lived connection per user
- Or WebSocket: bidirectional, supports push notifications
- Or use Vercel's Realtime (if available) or a push service (OneSignal, Firebase Cloud Messaging)

### 5. AI Rate Limiting

**Current:** 10 AI requests/minute per user (shared across all 7 AI features).

**Problem:** A user who uses the chatbot (which may make 1-5 tool calls per message) quickly exhausts their AI budget, blocking NL search, recommendations, and other features.

**At scale:** If 1% of 10,000 users are using AI simultaneously = 100 concurrent AI users × 10 req/min = 1,000 AI requests/min to Groq.

**When it breaks:** Groq has its own rate limits. At ~1000 req/min, you'll need to negotiate a higher tier or implement queuing.

**Fix:**
- Per-feature rate limits instead of one shared limit
- Queue AI requests with priority (chat > search > recommendations)
- Add fallback model (Google Gemini) for overflow
- Implement request coalescing for duplicate NL search queries

### 6. Booking Creation Under Contention

**Current:** Atomic `INSERT ... WHERE NOT EXISTS` prevents double-booking.

**At scale:** If 100 users try to book the same popular vehicle for the same weekend, 99 get "Vehicle unavailable." The query is atomic but serialized at the row level.

**When it breaks:** This is actually well-designed. PostgreSQL's row-level locking handles this correctly. The bottleneck is user experience, not correctness.

**Optimization:** Add a Redis-based "soft lock" that reserves a vehicle for 5 minutes during checkout, reducing the number of users who reach the DB insert only to fail.

### 7. Vehicle Search Query Complexity

**Current:** Dynamic query with 8+ optional filters, 2 `NOT EXISTS` subqueries, optional spatial calculation, and a parallel COUNT query.

**At scale with 100K vehicles:**

```sql
-- This runs on every search request:
SELECT * FROM vehicles
WHERE city ILIKE '%Mumbai%'
AND vehicle_type = 'suv'
AND status = 'listed'
AND NOT EXISTS (overlapping bookings)    -- subquery scan
AND NOT EXISTS (availability blocks)      -- subquery scan
AND earth_box(...) @> ll_to_earth(...)   -- spatial filter
ORDER BY base_daily_rate ASC
LIMIT 20
```

**When it breaks:** ~50,000+ vehicles with complex filter combinations. The `NOT EXISTS` subqueries may not use indexes efficiently.

**Fix:**
- Materialized view for "available vehicles" updated every 5 minutes
- Elasticsearch/Meilisearch for text search
- Pre-computed availability calendar per vehicle
- Consider PostGIS geometry index instead of earthdistance extension

---

## Scaling Strategy: 10K → 100K → 1M Users

### Phase 1: 10K Users (3 months)

| Change | Impact | Effort |
|--------|--------|--------|
| Add connection pooling (Neon `-pooler`) | 5x connection capacity | 1 hour |
| Add pagination to all list endpoints | Prevents OOM on heavy users | 4 hours |
| Replace notification polling with SSE | 100x fewer notification requests | 8 hours |
| Add missing database indexes | 2-5x faster queries on key paths | 2 hours |
| Reduce outbox cron to 5 minutes | 288x faster event retry | 30 min |
| Add Drizzle relations() | Reduce queries per page from 5-8 to 1-2 | 8 hours |

### Phase 2: 100K Users (6-12 months)

| Change | Impact | Effort |
|--------|--------|--------|
| Add read replicas | Scale reads independently | 1 week |
| Partition `trip_locations` by month | Handle billions of GPS rows | 1 week |
| Add Elasticsearch for vehicle search | Sub-50ms search with complex filters | 2 weeks |
| Add Redis queue for event processing | Replace DB outbox, lower latency | 1 week |
| Add CDN caching for vehicle images | Reduce origin load | 2 days |
| Multi-region deployment | Lower latency for users outside India | 2 weeks |
| Add background job system (BullMQ/Inngest) | Async email, AI, webhooks | 1 week |

### Phase 3: 1M Users (12-24 months)

| Change | Impact | Effort |
|--------|--------|--------|
| Database sharding (by city/region) | Horizontal DB scaling | 1 month |
| Separate API service from frontend | Scale backend independently | 2 weeks |
| Event-driven microservices | Decouple booking, payment, notification | 2 months |
| AI inference self-hosting | Eliminate Groq dependency, reduce cost | 1 month |
| Real-time infrastructure (WebSocket gateway) | Live trip tracking, instant notifications | 2 weeks |
| Global edge caching | <50ms worldwide for reads | 1 week |
| Automated scaling policies | Auto-scale on demand patterns | 1 week |

---

## Database Scaling Path

### Current: Single Neon Postgres

```
All reads + writes → Single Neon instance
```

### Phase 1: Read Replicas

```
Writes → Primary Neon
Reads → Read replica (SSR pages, search, lists)
```

Neon supports read replicas natively. Route read-heavy queries to replica.

### Phase 2: Functional Partitioning

```
Booking/Payment data → Primary DB (OLTP)
Analytics/Reporting → Separate DB (OLAP)
GPS/Location data → TimescaleDB
Search index → Elasticsearch
```

### Phase 3: Horizontal Sharding

```
City: Bangalore → Shard 1
City: Mumbai → Shard 2
City: Delhi → Shard 3
Global tables (users, pricing) → Shared shard
```

Shard by city since bookings are city-local (a vehicle in Bangalore is only booked by users in Bangalore).

---

## Cost Scaling Estimates

### At 1K Users/Day

| Service | Estimated Cost/Month |
|---------|---------------------|
| Vercel (Pro) | $20 |
| Neon (Scale) | $19 |
| Upstash Redis | $10 |
| Groq AI | $15 |
| Resend Email | $20 |
| Razorpay | Per-transaction (2% + ₹2) |
| **Total infrastructure** | **~$84/month** |

### At 10K Users/Day

| Service | Estimated Cost/Month |
|---------|---------------------|
| Vercel (Pro/Team) | $100-200 |
| Neon (Scale+) | $100-200 |
| Upstash Redis (Pro) | $50-100 |
| Groq AI | $150-300 |
| Resend Email | $100-200 |
| **Total infrastructure** | **~$500-1,000/month** |

### At 100K Users/Day

| Service | Estimated Cost/Month |
|---------|---------------------|
| Vercel (Enterprise) | $2,000-5,000 |
| Neon (Business+) | $500-1,000 |
| Elasticsearch | $500-1,000 |
| Redis (Dedicated) | $200-500 |
| AI (self-hosted or tiered) | $1,000-3,000 |
| Email (SendGrid/SES) | $500-1,000 |
| **Total infrastructure** | **~$5,000-12,000/month** |

---

## Interview Talking Points

### "How would you scale this to 1M users?"

> "The architecture scales in three phases. First, we address low-hanging fruit: connection pooling, pagination, replacing polling with SSE, and adding missing indexes — this gets us to 10K users. Second, we add read replicas, partition the GPS tracking table, introduce Elasticsearch for search, and add a proper job queue — this handles 100K users. Third, for 1M users, we shard the database by city since bookings are inherently city-local, separate the API from the frontend for independent scaling, and self-host AI inference to control costs."

### "What's the first thing that breaks?"

> "Database connections. We're using Neon's HTTP transport which creates a new connection per query. With 100 concurrent serverless functions each making 2-3 queries, we'd hit connection limits almost immediately. The fix is simple: switch to Neon's pooled connection string. After that, notification polling is the next bottleneck — each connected user generates 2 requests/minute just for unread counts."

### "What's the hardest thing to scale?"

> "The vehicle search query. It combines text search, categorical filters, geospatial distance, availability checking (which requires scanning bookings and availability tables), and sorting — all in a single SQL query. At 100K vehicles, this becomes a complex query optimization problem. The solution is to decompose it: use Elasticsearch for text/filter search, pre-compute availability in a materialized view, and use PostGIS geometry indexes for spatial queries."
