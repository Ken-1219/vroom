# Redis Analysis

## Overview

Vroom uses **Upstash Redis** (serverless, HTTP-based) for two distinct purposes:
1. **Rate limiting** — Request throttling at the middleware layer
2. **AI response caching** — Caching expensive LLM API call results

Redis is **not** used for: sessions, pub/sub, queues, distributed locks, or real-time features.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Application                       │
│                                                                  │
│  ┌──────────────────────┐     ┌──────────────────────────────┐  │
│  │     Middleware        │     │     AI Route Handlers        │  │
│  │  (rate limiting)      │     │  (response caching)          │  │
│  │                       │     │                              │  │
│  │  @upstash/ratelimit   │     │  @upstash/redis              │  │
│  │  Sliding window       │     │  GET/SET with TTL            │  │
│  └──────────┬───────────┘     └──────────────┬───────────────┘  │
│             │                                │                   │
│             └────────────────┬───────────────┘                   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTP (Upstash REST API)
                               ▼
                    ┌──────────────────────┐
                    │   Upstash Redis      │
                    │   (Serverless)       │
                    └──────────────────────┘
```

**Why Upstash over self-hosted Redis?** Upstash provides an HTTP-based API that works in serverless environments (Vercel Functions) where persistent TCP connections aren't possible. It's pay-per-request, matching the serverless cost model.

---

## Rate Limiting

**File:** `apps/web/src/middleware.ts`

### Implementation

Uses `@upstash/ratelimit` with **sliding window** algorithm.

```typescript
const redis = Redis.fromEnv();  // REDIS_URL env var

const generalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "rl:general",
});

const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "rl:ai",
});

const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "rl:auth",
});
```

### Rate Limit Tiers

| Limiter | Prefix | Window | Max Requests | Applied Routes |
|---------|--------|--------|-------------|----------------|
| General | `rl:general` | 60s sliding | 60 | All `/api/*` routes (default) |
| AI | `rl:ai` | 60s sliding | 10 | `/api/chat`, `/api/nl-search`, `/api/ai/*`, `/api/trip-planner`, `/api/reviews/summary`, `/api/vehicles/[id]/chat` |
| Auth | `rl:auth` | 60s sliding | 10 | `/api/mcp/auth`, `/api/auth/*` |

### Key Structure

| Key Pattern | Example | TTL |
|-------------|---------|-----|
| `rl:general:{identifier}` | `rl:general:192.168.1.1` | 60s (auto-managed by library) |
| `rl:ai:{identifier}` | `rl:ai:user@email.com` | 60s |
| `rl:auth:{identifier}` | `rl:auth:192.168.1.1` | 60s |

**Identifier strategy:** Uses authenticated user's email if available, otherwise falls back to `x-forwarded-for` IP or `"anonymous"`.

### Response Headers

On rate limit, the middleware returns HTTP 429 with:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1716000000
Retry-After: 45
```

### Graceful Degradation

```typescript
if (!process.env.REDIS_URL) {
  // Skip rate limiting entirely in development
  return NextResponse.next();
}
```

Rate limiting is entirely skipped if `REDIS_URL` is not configured. This is intentional for local development but means a misconfigured production deployment would have **no rate limiting**.

---

## AI Response Caching

**File:** `apps/web/src/lib/ai-cache.ts`

### Implementation

```typescript
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!redis && process.env.REDIS_URL) {
    redis = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
  }
  return redis;
}
```

**Lazy initialization** — Redis client created on first use. Returns null if env vars not set.

### Exported Functions

| Function | Signature | Purpose |
|----------|-----------|---------|
| `getCachedAiResponse<T>` | `(key: string) → T \| null` | Retrieve cached AI response |
| `setCachedAiResponse<T>` | `(key: string, value: T, ttlSeconds: number) → void` | Cache AI response with TTL |
| `makeCacheKey` | `(prefix: string, params: Record<string, unknown>) → string` | Generate deterministic cache key |

### Cache Key Generation

```typescript
function makeCacheKey(prefix: string, params: Record<string, unknown>): string {
  const normalized = JSON.stringify(params, Object.keys(params).sort());
  const hash = simpleHash(normalized);  // Java-style 32-bit hash
  return `${prefix}:${hash}`;
}
```

**Hash function:** Simple Java-style 32-bit integer hash. Collision-prone but acceptable for caching (a collision just means a cache miss or stale data for a different query).

### Cache Usage by Route

| Route | Cache Prefix | TTL | Key Parameters | Purpose |
|-------|-------------|-----|----------------|---------|
| `POST /api/nl-search` | `nl-search` | **1 hour** | `{ query: normalized_lowercase }` | Cache NL→structured filter parsing |
| `POST /api/ai/range-advisor` | `range-advisor` | **24 hours** | `{ from, to, vehicleName, fuelType }` | Cache route/range advice |
| `GET /api/ai/recommendations` | `recommendations` | **30 minutes** | `{ vehicleIds: sorted_candidate_ids }` | Cache AI ranking of vehicle recommendations |

### What's NOT Cached

| Route | Why No Cache |
|-------|-------------|
| `POST /api/chat` | Conversational — every message depends on history |
| `POST /api/trip-planner` | Uses streaming; caching partial streams is complex |
| `POST /api/vehicles/[id]/chat` | Conversational with vehicle context |
| `GET /api/reviews/summary` | Could benefit from caching but currently not cached |

### Error Handling

All Redis operations are wrapped in try/catch with silent failure:

```typescript
async function getCachedAiResponse<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    return await redis.get<T>(key);
  } catch {
    return null;  // Silent failure — fall through to AI call
  }
}
```

**Design principle:** Redis is a performance optimization, not a correctness requirement. If Redis is down, the application functions normally with higher latency and cost (direct AI calls).

---

## Key-Value Structure Summary

```
Redis Keyspace:

rl:general:{ip_or_email}    → Sliding window counter (auto TTL: 60s)
rl:ai:{ip_or_email}         → Sliding window counter (auto TTL: 60s)
rl:auth:{ip_or_email}       → Sliding window counter (auto TTL: 60s)
nl-search:{hash}            → JSON object (TTL: 3600s / 1 hour)
range-advisor:{hash}        → JSON object (TTL: 86400s / 24 hours)
recommendations:{hash}      → JSON object (TTL: 1800s / 30 minutes)
```

---

## Production Concerns

### Cache Stampede Risk

**Scenario:** When a popular cache key expires, many concurrent requests all miss the cache simultaneously and call the AI API in parallel.

**Current mitigation:** None.

**Impact:** AI rate limits could be exhausted. Groq may throttle or return errors.

**Fix:** Implement cache stampede protection:
- **Lock-based:** First request acquires a lock, others wait
- **Stale-while-revalidate:** Serve stale data while refreshing in background
- **Probabilistic early expiry:** Randomly refresh before TTL expires

### Stale Cache Risk

**Scenario:** Cached AI recommendations include a vehicle that has been delisted or fully booked since caching.

**Current mitigation:** None — cached results are served as-is for the full TTL.

**Impact:** Users may see unavailable vehicles in recommendations.

**Fix:** Add cache invalidation on vehicle status changes, or add a freshness check layer that validates cached vehicle IDs are still available.

### Race Conditions

**Scenario:** Concurrent requests generate the same cache key, both miss, both call the AI, and both write to cache. The last write wins.

**Impact:** Low — worst case is wasted AI API calls. No data corruption.

### Memory Growth Risk

**Scenario:** With many unique search queries, the `nl-search` cache could grow unboundedly.

**Current mitigation:** TTLs ensure keys expire. 1-hour TTL for NL search, 30-min for recommendations.

**Impact:** Low — Upstash Redis has built-in memory limits. Eviction policy handles overflow.

### Missing Redis Usage Patterns

| Pattern | Status | Recommendation |
|---------|--------|----------------|
| **Session storage** | Not used (JWT-based auth) | Fine — JWT sessions don't need server-side storage |
| **Pub/Sub** | Not used | Could enable real-time notifications instead of 30s polling |
| **Queue** | Not used | Could replace the DB-based outbox for event processing |
| **Distributed locks** | Not used | Could protect against concurrent booking modifications |
| **Leaderboard/sorted sets** | Not used | Could optimize "top rated vehicles" queries |

---

## Performance Analysis

### Current Redis Operations per Request

| Request Type | Redis Ops | Details |
|-------------|-----------|---------|
| Any API request | 1 | Rate limit check (sliding window) |
| AI request (cached) | 2 | Rate limit + cache GET (hit) |
| AI request (uncached) | 3 | Rate limit + cache GET (miss) + cache SET |
| Non-API request | 0 | Middleware skips rate limiting for non-API routes |

### Latency Impact

Upstash Redis operates over HTTP with typical latencies of 1-5ms for simple operations. Since all Redis operations are on the critical path (rate limiting in middleware, cache check before AI call), they add ~2-10ms to every API request.

**In context:** This is negligible compared to database queries (20-100ms) and AI API calls (500-3000ms).

---

## Docker Compose (Local Development)

**File:** `docker-compose.yml`

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
  volumes:
    - redisdata:/data
```

Local development uses a standard Redis 7 instance on port 6379. The application connects via `REDIS_URL=redis://localhost:6379` (or the Upstash URL in production).

---

## Interview Talking Points

### Why Upstash Over Self-Hosted Redis?

> "We use Upstash because it provides an HTTP-based API that works in Vercel's serverless environment. Traditional Redis requires persistent TCP connections, which don't work well with ephemeral serverless functions. Upstash is also pay-per-request, matching our cost model — we don't pay for idle Redis capacity."

### Why Not Use Redis for More?

> "We could use Redis for sessions, real-time pub/sub, and queues, but we made deliberate tradeoffs: JWT sessions avoid server-side state, the DB outbox pattern provides durability guarantees that Redis pub/sub doesn't (Redis pub/sub is fire-and-forget — if no subscriber is listening, the message is lost), and our current scale doesn't justify the complexity of a Redis queue. As we scale, we'd add Redis pub/sub for real-time notifications and potentially Redis Streams for event processing."

### Cache Invalidation Strategy?

> "Currently we use simple TTL-based expiration. AI recommendations expire after 30 minutes, NL search after 1 hour, and range advice after 24 hours. We don't do active invalidation — when vehicle data changes, cached recommendations may include stale vehicles. At our current scale, the TTLs are short enough that this is acceptable. At scale, we'd add event-driven cache invalidation: when a vehicle is delisted, we'd invalidate all recommendation cache keys that include that vehicle ID."

---

## Production-Grade Improvements

| Priority | Improvement | Impact |
|----------|-------------|--------|
| **High** | Add cache stampede protection (locking or probabilistic early refresh) | Prevents AI API abuse on popular cache expiry |
| **High** | Add Redis pub/sub for real-time notifications | Replaces 30-second polling, reduces server load |
| **Medium** | Cache vehicle search results (short TTL, invalidate on listing changes) | Reduces DB load for popular searches |
| **Medium** | Cache review summaries (they're AI-generated and expensive) | Currently not cached despite being AI-powered |
| **Medium** | Add cache warming for popular cities on deployment | Prevents cold-start cache misses |
| **Low** | Use Redis Streams for event processing | More reliable than DB outbox, lower latency |
| **Low** | Add Redis-based distributed locks for booking operations | Stronger concurrency guarantees than optimistic locking |
