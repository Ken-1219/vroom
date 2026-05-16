# Interview Cheatsheet

## "Tell Me About Your Project"

### 2-Minute Version

> "I built Vroom — a peer-to-peer car rental marketplace, similar to Turo or ZoomCar, designed for the Indian market. It's a full-stack Next.js 16 monorepo deployed on Vercel that handles the entire rental lifecycle: vehicle search with geospatial filtering, booking with availability conflict prevention, Razorpay payment integration including host payouts via NEFT, real-time GPS trip tracking, trust scores, and a review system.
>
> What makes it technically interesting is the AI layer — I integrated 7 distinct AI features using Groq-hosted Llama models through the Vercel AI SDK. These include a conversational chatbot with tool-calling that can search vehicles and manage bookings, natural language search that converts plain English into structured database filters, personalized recommendations, and a trip planner. There's also a Model Context Protocol (MCP) server that lets external AI assistants like Claude or Cursor interact with the platform programmatically.
>
> On the data side, I used Neon serverless Postgres with PostGIS for geospatial queries, Drizzle ORM with a transactional outbox pattern for reliable event processing, Upstash Redis for rate limiting and AI response caching, and a class-based service layer with 10 singleton services that encapsulate all business logic."

### 5-Minute Version

Use the 2-minute version, then expand with:

> "Let me walk through some of the more interesting technical decisions.
>
> **Booking integrity** was a core concern. I prevent double-bookings using an atomic `INSERT ... WHERE NOT EXISTS` query in raw SQL — this checks for date-range overlaps in the same database operation as the insert, so there's no race condition window. I also added optimistic concurrency control with a version column to prevent stale-state updates when a host and renter are both acting on a booking simultaneously.
>
> **The payment flow** uses Razorpay's order-based model. The client creates a Razorpay order, completes checkout via their SDK, then I verify the payment signature server-side using HMAC-SHA256 with constant-time comparison to prevent timing attacks. Razorpay also sends a webhook as a parallel confirmation path. For host payouts, I use RazorpayX's fund transfer API to send NEFT payments directly to the host's bank account, with webhook tracking for settlement status.
>
> **The AI system** is architecturally interesting because it serves 7 very different use cases from two Llama models. The main chatbot uses Llama 4 Scout with `streamText()` and has 3 tool definitions — it can search vehicles, get vehicle details, and manage bookings, all through natural conversation. The natural language search uses a different approach: `generateText()` with Llama 3.3-70b to parse user queries into structured filter objects, with Redis caching that gives 10-20ms response times for repeated queries versus 1-3 seconds uncached.
>
> **The event system** uses a transactional outbox pattern — instead of firing side effects directly, services write events to an `outbox_events` table, then process them asynchronously using Next.js 16's `after()` API. If immediate processing fails, a daily cron job retries pending events. This ensures we never lose a notification or email even if the process crashes mid-request.
>
> **The MCP server** is a separate package in the monorepo that exposes 8 tools (search vehicles, get price estimates, manage bookings) via the stdio transport. It authenticates through Bearer JWT tokens issued by a custom auth endpoint. This lets AI coding assistants or chatbots interact with the full booking system programmatically."

### 15-Minute Deep Technical Walkthrough

Use the 5-minute version, then dive into these areas based on the interviewer's interest:

**Architecture depth:**

> "The monorepo is structured with Turborepo and pnpm workspaces. There's one Next.js app and 4 packages: `@vroom/db` (Drizzle schema, 16 tables, 20 enums), `@vroom/events` (typed event definitions for the outbox system), `@vroom/validators` (18 Zod schemas shared between frontend and backend), and `@vroom/mcp-server` (the Model Context Protocol server). The dependency graph is strictly downward — packages never import from the app.
>
> "The service layer has 10 classes — BookingService, VehicleService, PaymentService, PricingService, TripService, ReviewService, NotificationService, AvailabilityService, PayoutService, and TrustScoreService. Each is a module-level singleton with Drizzle as the data access layer. API routes are thin — they validate input with Zod, call the service, and format the response. Business logic lives entirely in services."

**Database depth:**

> "The schema has 16 tables in Neon Postgres with PostGIS. Key design choices: all monetary values are stored in paise (integer arithmetic, no floating-point rounding issues), timestamps are stored as ISO strings rather than native timestamps (a tradeoff — simpler serialization but loses DB-level temporal operators), and I use an `earthdistance` extension with `ll_to_earth()` for radius-based vehicle search.
>
> "The booking table uses a state machine: `pending_payment → confirmed → trip_started → completed` with branching paths for cancellation and refunds. Each transition is recorded in a `booking_events` table for full audit trail. There's a `version` column for optimistic concurrency — every update increments it, and stale writes are rejected.
>
> "One thing I'd do differently is use `relations()` in Drizzle. Without it, every complex page makes 5-8 separate queries instead of 1-2 joined queries. I also identified 10 missing database indexes during a self-review — columns like `bookings.vehicleId`, `payments.razorpayOrderId`, and `pricing_rules.vehicleId` are queried frequently but not indexed."

**Security depth:**

> "Authentication is dual-mode: NextAuth v5 with JWT sessions for the browser (Google OAuth, GitHub OAuth, and demo credentials), and Bearer JWT tokens for MCP/programmatic access. The middleware layer enforces auth on every non-public route, applies 3-tier rate limiting via Upstash Redis (60/min general, 10/min AI, 10/min auth), and injects security headers including HSTS, X-Frame-Options, and strict Referrer-Policy.
>
> "Payment security uses Razorpay's signature verification with `crypto.timingSafeEqual` — I explicitly use constant-time comparison to prevent timing-based signature extraction. The webhook always returns 200 regardless of processing outcome to prevent information leakage.
>
> "I identified several security issues in my own self-review: demo credentials that should be disabled in production, missing authorization on review moderation endpoints, an unsafe `...(input as any)` spread in vehicle creation that could let users inject unexpected columns, and a prompt injection risk in the AI chatbot's tool-calling system where a crafted message could trick the model into creating or cancelling bookings."

**Performance and scaling depth:**

> "Current architecture handles ~100-500 concurrent users comfortably. The first bottleneck is database connections — Neon's HTTP transport creates a new connection per query, so 100 serverless functions with 2-3 queries each approaches the connection limit. The fix is simple: switch to Neon's pooled connection string.
>
> "The second bottleneck is notification polling — every user sends 2 requests/minute. At 10K users, that's 20K req/min just for notifications. I'd replace this with Server-Sent Events.
>
> "The trip_locations table is the biggest scaling concern. At 3-second GPS polling, each active trip generates 86,400 rows over a 3-day rental. With 1,000 concurrent trips, that's 86.4 million rows per month. I'd partition by month and archive completed trip data to cold storage.
>
> "For the vehicle search query, which combines text filters, categorical filters, geospatial distance, and availability checking in a single SQL query — at 100K vehicles, I'd decompose this into Elasticsearch for text search, a materialized view for availability, and PostGIS geometry indexes for spatial queries."

---

## Common Interview Questions

### Architecture & Design

**Q: Why Next.js instead of a separate frontend and backend?**

> "For a marketplace with heavy SEO requirements (vehicle listings need to be server-rendered for Google), Next.js gives me both SSR and API routes in one deployment unit. The App Router's server components let me query the database directly in page rendering without an intermediate API call, reducing latency by ~50ms per page. The tradeoff is that the backend and frontend can't scale independently — at 100K+ users, I'd separate them. But for a startup MVP, the development velocity gain is worth it."

**Q: Why class-based services instead of plain functions?**

> "Primarily for encapsulation. Each service class groups related operations with shared dependencies (database connection, event emitter). The singleton pattern means one instance per service for the lifetime of a serverless function — no per-request allocation overhead. The tradeoff is that classes don't compose as naturally as functions for cross-cutting concerns, and they make dependency injection harder for testing. If I were starting over, I might use plain functions with a shared context object."

**Q: Why a monorepo?**

> "The shared packages (`@vroom/db`, `@vroom/validators`, `@vroom/events`) are used by both the web app and the MCP server. A monorepo with Turborepo means a single `pnpm install`, shared TypeScript configuration, and atomic commits that update the schema and all consumers simultaneously. The alternative — separate repos with published npm packages — would add significant versioning overhead for a team of one."

**Q: Why Drizzle ORM instead of Prisma?**

> "Drizzle generates no runtime code — it's a thin SQL builder. Prisma's generated client adds ~2MB to serverless function bundles and requires a binary engine. On Vercel where function size and cold start time matter, Drizzle is significantly lighter. Drizzle also allows raw SQL escape hatches without leaving the ORM (I use this for the atomic booking insert). The tradeoff is a less mature ecosystem and fewer auto-generated features like Prisma Migrate."

**Q: Why the transactional outbox pattern?**

> "The core problem: when a booking is confirmed, I need to send an email, create a notification, update the trust score, and generate a pickup OTP. If I do these inline and the process crashes after the email but before the notification, the system is in an inconsistent state. The outbox pattern writes a single event row atomically with the booking update, then processes side effects asynchronously. If processing fails, the daily cron retries. It's the same pattern that Debezium and Kafka Connect use, just implemented at application level."

**Q: Why Groq over OpenAI or Anthropic for AI?**

> "Cost and speed. Groq's Llama inference is 10-50x cheaper than GPT-4 and delivers ~500 tokens/second, which makes streaming chat feel instantaneous. For a price-sensitive Indian market where AI features are supplementary (not core), spending $0.50-2.00/day on AI is viable. The tradeoff is that Llama models are less capable than GPT-4/Claude at complex reasoning and tool calling — I've seen Llama 4 Scout occasionally misinterpret tool parameters. If quality became critical, I'd add Google Gemini as a fallback."

### Tradeoff Questions

**Q: What's the biggest tradeoff you made?**

> "Using Neon's HTTP transport without transactions. The HTTP driver is simple and works great for reads, but it creates a new connection per query and doesn't support multi-statement transactions. This means my payment webhook handler — which updates the payment status, confirms the booking, inserts an event, and emits notifications — is 4 separate non-transactional operations. If the process crashes between payment capture and booking confirmation, the user has paid but their booking isn't confirmed. Neon provides a WebSocket driver that supports transactions, and I've set it up in the codebase (`wsDb`), but I haven't migrated the critical paths to use it yet. That's the #1 item on my production hardening list."

**Q: What would you do differently if starting over?**

> "Three things. First, I'd define Drizzle `relations()` from day one — without them, I can't use relational queries, so every page with joined data makes 5-8 sequential DB calls instead of 1-2. Second, I'd use transactions from the start for any multi-step write operation. Third, I'd set up Vitest and write service-layer tests before building features — the codebase has zero tests, which means every deployment is a leap of faith. The testing gap is the single biggest production readiness issue."

**Q: Why store timestamps as strings instead of native Postgres timestamps?**

> "This was a pragmatic choice for serialization simplicity — strings survive JSON serialization round-trips without timezone ambiguity. But it was the wrong tradeoff. I lose `BETWEEN` queries, `age()` functions, and timezone-aware comparisons at the database level. If I were starting over, I'd use `timestamp with time zone` and handle serialization in the application layer."

### Concurrency & Consistency

**Q: How do you prevent double bookings?**

> "With a single atomic SQL query:
> ```sql
> INSERT INTO bookings (vehicleId, startDate, endDate, ...)
> SELECT vehicleId, startDate, endDate, ...
> WHERE NOT EXISTS (
>   SELECT 1 FROM bookings
>   WHERE vehicleId = $1
>   AND status NOT IN ('cancelled', 'refunded')
>   AND startDate < $endDate AND endDate > $startDate
> )
> ```
> The `NOT EXISTS` subquery checks for overlapping date ranges in the same transaction as the insert. PostgreSQL's row-level locking serializes concurrent inserts for the same vehicle, so even if 100 users try to book the same weekend simultaneously, exactly one succeeds and 99 get 'Vehicle unavailable.' This is correct but not great UX — a Redis-based soft reservation during checkout would reduce failed attempts."

**Q: How does optimistic concurrency work in your booking system?**

> "The bookings table has a `version` integer column. Every update includes `WHERE version = $currentVersion` and increments the version. If two requests try to update the same booking simultaneously (e.g., host accepting while renter cancels), one succeeds and the other gets zero rows affected, which my service layer converts to a 'Booking has been modified, please refresh' error. This avoids database-level locks while preventing lost updates."

**Q: What happens if Razorpay captures the payment but your webhook handler crashes?**

> "This is a real gap. Currently, the payment is captured (money deducted from user) but the booking might not be confirmed. However, there's a dual confirmation path — the client-side verify endpoint (`POST /api/payments/verify`) also confirms the booking. If the webhook fails but the user's browser completes the verify call, the booking is still confirmed. If both fail, the payment is captured but the booking stays in `pending_payment` — this requires manual intervention. The fix is wrapping the webhook handler in a database transaction so all 4 operations (payment update, booking update, event insert, notification) succeed or fail atomically."

### Scaling Questions

**Q: How would you scale this to 1 million users?**

> "In three phases.
>
> **Phase 1 (10K users):** Connection pooling via Neon's `-pooler` suffix (1-hour fix), add pagination to all list endpoints, replace notification polling with SSE, add the 10 missing database indexes. Effort: ~1 week.
>
> **Phase 2 (100K users):** Add Neon read replicas for search and listing pages, partition `trip_locations` by month (it grows 86M rows/month at scale), introduce Elasticsearch for vehicle search (the current SQL query with geospatial + availability filters hits a wall at 50K vehicles), add a proper job queue (BullMQ or Inngest) to replace the outbox cron.
>
> **Phase 3 (1M users):** Shard the database by city — bookings are inherently city-local (a car in Bangalore is only booked by users in Bangalore). Separate the API from the frontend for independent scaling. Self-host AI inference to control costs (1M users × AI usage = significant Groq bill). Add a WebSocket gateway for real-time trip tracking instead of SSE polling."

**Q: What breaks first under load?**

> "Database connections. Each Vercel serverless function invocation creates a new Neon HTTP connection, and each request makes 2-3 queries. With 100 concurrent functions, that's 200-300 connections hitting Neon's limit of ~100-300 depending on plan. The fix is literally changing one character in the connection string — adding the `-pooler` suffix to `DATABASE_URL` — which routes through Neon's built-in PgBouncer. After that, notification polling is the next bottleneck: 1,000 users × 2 requests/minute = 2,000 req/min just for unread notification counts."

**Q: What's the hardest thing to scale in this system?**

> "The vehicle search query. It dynamically combines text search (`ILIKE`), categorical filters (vehicle type, fuel, transmission), date-range availability checking (two `NOT EXISTS` subqueries against bookings and availability tables), geospatial distance calculation (`earth_distance`), sorting, and a parallel COUNT query — all in one SQL statement. At 100K vehicles with complex filter combinations, the query planner can't optimize this efficiently. The solution is decomposition: Elasticsearch for text and categorical filters, a materialized view refreshed every 5 minutes for pre-computed availability, and PostGIS geometry indexes replacing the `earthdistance` extension."

### AI-Specific Questions

**Q: How does the natural language search work?**

> "The user types something like 'SUV in Mumbai under 3000 per day.' This goes to `/api/nl-search` which sends the text to Llama 3.3-70b with a system prompt that says 'parse this into JSON with fields: city, vehicleType, maxPrice, fuelType, etc.' The model returns a structured JSON object, which I validate and use to build database filter parameters. The result is sent to `VehicleService.search()` — the same search endpoint the structured filters use. Redis caches the NL→filter mapping for 1 hour, so repeated similar queries are 10-20ms instead of 1-3 seconds. The key insight is that NL search doesn't need a vector database or embeddings — it's just a natural language to structured query translation."

**Q: How do you handle AI hallucination in your system?**

> "Each AI feature has different hallucination risk profiles. For NL search, hallucination means bad filters — the model might infer a city the user didn't mention. This is low-impact because the user sees the search results and can correct. For recommendations, the model ranks real vehicles from the database — it can't hallucinate vehicles that don't exist, only mis-rank them. The highest risk is the chatbot with tool calling: if the model hallucinates a vehicle ID in a `manageBookings` tool call, the service layer rejects it because the vehicle doesn't exist in the database. The real danger is prompt injection — a user could craft a message that tricks the model into calling `manageBookings` with `action: 'cancel'` on the user's real bookings."

**Q: What's the MCP server and why did you build it?**

> "MCP (Model Context Protocol) is Anthropic's standard for connecting AI assistants to external tools. My MCP server exposes 8 tools — search vehicles, get vehicle details, get price estimates, get cities, get/create/cancel bookings — via the stdio transport. It authenticates using Bearer JWT tokens issued by `/api/mcp/auth`. This means a user can open Claude Desktop or Cursor, connect the Vroom MCP server, and say 'Find me an SUV in Bangalore for next weekend under ₹3000/day and book it.' The AI assistant calls the tools, presents options, and completes the booking — all through natural conversation. It's a thin proxy: each tool makes an HTTP call to the corresponding Next.js API route."

### Production Readiness

**Q: What would you fix before going to production?**

> "Five things, in priority order:
> 1. **Remove demo credentials** — there are 6 hardcoded accounts including `admin@vroom.demo/admin123` that give full admin access.
> 2. **Add database transactions** to payment and booking flows — currently 4 separate non-transactional writes.
> 3. **Write tests** — the codebase has zero tests of any kind. I'd start with service-layer unit tests for BookingService, PaymentService, and PricingService.
> 4. **Fix the duplicate email issue** — there are two email modules (`ses.ts` and `email.ts`) that both fire on the same events, sending users duplicate notifications.
> 5. **Add authorization** to review moderation and trip location endpoints — currently any authenticated user can moderate any review or inject GPS data into any trip."

**Q: How do you handle errors and monitoring?**

> "Sentry is integrated on both client and server with 10% trace sampling in production. There's a structured JSON logger, and a health check endpoint that pings both the database and Redis. API errors go through a centralized `errorResponse()` function that strips internal details and returns safe error messages. What's missing is significant: no request tracing (can't follow a request across services), no metrics (latency percentiles, error rates), no alerting (nothing pages on-call), no business metrics dashboards. Observability scored 3/10 in my self-review."

### Event System

**Q: Explain the transactional outbox pattern you implemented.**

> "When a booking is confirmed, I need to trigger 4-5 side effects: send a confirmation email, create a notification, generate a pickup OTP, update the trust score, and potentially trigger a host payout. Instead of doing these inline (which risks partial execution on crash), the service calls `emitEvent({ type: 'booking.confirmed', payload })` which inserts a row into the `outbox_events` table with status `pending`.
>
> After the HTTP response is sent, Next.js 16's `after()` API kicks in — it runs code after the response without blocking the user. The `after()` handler reads pending outbox events, dispatches them to the in-process event bus (which routes to handler functions for notifications, emails, trust scores, etc.), and marks them as `processed`.
>
> If `after()` fails or the process crashes before processing, the event stays `pending` in the database. A daily Vercel cron job queries for stale pending events and retries them. This gives at-least-once delivery semantics — an event might be processed twice (in the rare crash-and-retry case), but it's never lost."

### Data Modeling

**Q: Walk me through your pricing model.**

> "Pricing has three layers. First, every vehicle has a `base_daily_rate` set by the host, stored in paise (integer, no floating-point issues). Second, there's a `pricing_rules` table where hosts can set custom rates for specific date ranges — holiday pricing, weekend premiums, etc. Third, there's a `PricingService` that calculates the total: for each day of the booking, it checks if a pricing rule exists for that date, falls back to the base rate, then applies the platform fee (18% added to the renter's total). There's also a promo code system — currently 4 hardcoded promo codes that apply percentage or fixed discounts.
>
> One inconsistency I identified: the platform fee is 18% on the renter side but host payouts deduct 15%. The 3% difference is undocumented — it might be intentional margin or a bug."

**Q: How does the trust score system work?**

> "Every user has a `trustScore` (0-100, default 50). Events increment or decrement it: completing a trip adds +3, getting a 5-star review adds +5, cancelling a booking subtracts -5, having a review flagged subtracts -10. The `TrustScoreService` processes these deltas through event handlers.
>
> There's a `recalculate()` method that can rebuild a user's score from scratch by replaying all their booking history. There's a subtle bug: the delta values are defined in two places (`trust-score.ts` and `event-handlers.ts`). If someone changes one but not the other, incremental updates diverge from full recalculations."

---

## Deep-Dive Technical Questions

### System Design Angles

**Q: Design the booking system from scratch.**

Key points to hit:
1. **State machine**: `pending_payment → confirmed → trip_started → completed` with `cancelled/refunded` branches
2. **Atomic creation**: Single SQL insert with availability check to prevent double-booking
3. **Optimistic concurrency**: Version column prevents stale-state overwrites
4. **Dual confirmation**: Client-side verify + server-side webhook for payment reliability
5. **Event sourcing lite**: `booking_events` table records every state transition with actor, timestamp, and metadata
6. **Idempotency**: Payment webhook uses idempotency keys to prevent duplicate processing

**Q: Design the real-time trip tracking system.**

Key points to hit:
1. **GPS ingestion**: Client POSTs location every 3 seconds to `/api/trips/[id]/location`
2. **Storage**: `trip_locations` table with `(trip_id, lat, lng, speed, heading, accuracy, recorded_at)`
3. **Delivery**: Host views trip via SSE endpoint `/api/trips/[id]/locations/stream` (polls DB every 3 seconds)
4. **Geofencing**: `geofences` table with center point + radius, checked against current location
5. **Scaling concern**: 86,400 rows per 3-day trip; at 1K concurrent trips = 86.4M rows/month
6. **Production design**: Replace polling with WebSocket, partition `trip_locations` by month, downsample after trip completion

**Q: Design the payment and payout system.**

Key points to hit:
1. **Collection**: Razorpay order → Checkout SDK → server-side signature verification
2. **Verification**: HMAC-SHA256 with `crypto.timingSafeEqual` (constant-time comparison)
3. **Dual path**: Client verify (`POST /api/payments/verify`) + Razorpay webhook (parallel reliability)
4. **Idempotency**: `idempotencyKey` column prevents duplicate payment records
5. **Host payout**: RazorpayX fund transfer API → NEFT to host's bank account
6. **Payout tracking**: Webhook at `/api/payouts/webhook` tracks `processing → processed → reversed`
7. **Gap**: No database transaction wrapping the 4-step webhook handler

### Code-Level Questions

**Q: Show me the most interesting piece of code in the project.**

The atomic booking insert (`apps/web/src/services/booking.ts`):
```sql
INSERT INTO bookings (id, vehicleId, renterId, startDate, endDate, ...)
SELECT $id, $vehicleId, $renterId, $startDate, $endDate, ...
WHERE NOT EXISTS (
  SELECT 1 FROM bookings
  WHERE vehicle_id = $vehicleId
  AND status NOT IN ('cancelled', 'refunded')
  AND start_date < $endDate
  AND end_date > $startDate
)
AND NOT EXISTS (
  SELECT 1 FROM availability
  WHERE vehicle_id = $vehicleId
  AND type = 'blocked'
  AND start_date < $endDate
  AND end_date > $startDate
)
RETURNING *
```

Why it's interesting: single atomic operation that checks two tables for conflicts, performs the insert, and returns the result — no race condition window, no explicit locks needed, PostgreSQL handles serialization.

**Q: What's the most complex query in the system?**

Vehicle search (`apps/web/src/services/vehicle.ts`) — dynamically builds a query with 8+ optional filters:
- Text filter: `ILIKE` on city/make/model
- Categorical: vehicle_type, fuel_type, transmission
- Price range: `BETWEEN` on base_daily_rate
- Date availability: `NOT EXISTS` against bookings + availability tables
- Geospatial: `earth_distance(ll_to_earth(lat,lng), ll_to_earth($lat,$lng)) < $radius`
- Sorting: price, distance, or rating
- Pagination: `LIMIT/OFFSET`
- Parallel COUNT query for total results

---

## "What's Your Biggest Achievement Here?" Answers

### For Backend/Systems Roles

> "The end-to-end payment and payout system. It handles the full money flow: renter pays via Razorpay Checkout, payment is verified server-side with HMAC signature verification and constant-time comparison, a dual confirmation path (client verify + webhook) ensures reliability, the platform takes its fee, and the host receives an automated NEFT payout via RazorpayX. The booking system underneath uses atomic inserts to prevent double-booking and optimistic concurrency to handle concurrent modifications. The transactional outbox ensures no side effect (email, notification, trust score update) is ever lost."

### For Frontend/Full-Stack Roles

> "The AI integration layer. I built 7 distinct AI features — each with different interaction patterns — on top of two Llama models using the Vercel AI SDK. The main chatbot uses streaming with tool calling so it can search vehicles, check availability, and manage bookings through natural conversation. The natural language search converts plain English to structured database queries with Redis caching for sub-20ms repeated lookups. The architecture uses Server Components for initial page loads with Client Component islands for interactive features like the AI chat widget, the Cmd+K command palette, and the Mapbox-powered vehicle map."

### For Platform/Infrastructure Roles

> "The event-driven architecture built on a transactional outbox. Events are persisted atomically to the database, processed asynchronously via Next.js `after()`, and retried by a cron job if processing fails. The middleware layer enforces three-tier rate limiting via Upstash Redis, dual authentication (session cookies + Bearer JWT), and security headers — all in a single middleware chain. The MCP server adds a programmatic integration layer that lets external AI assistants interact with the platform through a standardized protocol."

---

## Rapid-Fire Q&A

| Question | One-liner |
|----------|-----------|
| What's your tech stack? | Next.js 16, Neon Postgres, Drizzle ORM, Upstash Redis, Razorpay, Groq AI, Vercel |
| How many tables? | 16 tables, 20 enums, PostGIS for geospatial |
| How many API endpoints? | 45+ REST endpoints across 15 route groups |
| How many services? | 10 singleton service classes |
| How do you handle auth? | NextAuth v5 (Google/GitHub OAuth + JWT sessions, 12h expiry) + Bearer JWT for MCP |
| How do you handle payments? | Razorpay orders → client checkout → server-side HMAC verification + webhook |
| How do you prevent double booking? | Atomic INSERT...WHERE NOT EXISTS with date-range overlap check |
| How do you handle real-time? | SSE for trip GPS tracking (3s poll), 30s poll for notifications |
| What AI models? | Llama 4 Scout (chatbot), Llama 3.3-70b (everything else), via Groq |
| What's your test coverage? | Zero. No tests exist. That's the biggest gap. |
| What's your deploy process? | Push to main → GitHub Actions (lint, typecheck, build) → Vercel auto-deploy |
| What's your error tracking? | Sentry with 10% sampling in production |
| How do you cache? | Upstash Redis for rate limiting + AI response caching (1h NL search, 30min recommendations) |
| How do you handle email? | Resend API with React Email templates for transactional notifications |
| What's MCP? | Model Context Protocol — lets AI assistants call my APIs via 8 registered tools |

---

## Anticipating Follow-Up Questions

### After "Tell me about your project"

| Likely follow-up | What they're probing | Key point to hit |
|-----------------|---------------------|-----------------|
| "What was the hardest part?" | Problem-solving ability | Double-booking prevention or payment webhook reliability |
| "How do you handle failures?" | Reliability thinking | Outbox pattern, idempotency keys, dual confirmation path |
| "What would you change?" | Self-awareness, growth | Transactions, tests, Drizzle relations — be specific |
| "How does the AI work?" | Depth of understanding | Two models, 7 features, tool calling vs structured output |
| "Walk me through a booking" | End-to-end thinking | Search → book → pay → verify → confirm → trip → complete → payout |
| "How do you handle security?" | Security mindset | Rate limiting, signature verification, auth middleware, input validation |

### After Scaling Discussion

| Likely follow-up | What they're probing | Key point to hit |
|-----------------|---------------------|-----------------|
| "What about read replicas?" | Database knowledge | Neon supports native replicas; route search/listing reads to replica |
| "How would you shard?" | Distributed systems | By city — bookings are inherently city-local |
| "What about caching?" | Performance thinking | Redis for AI responses already; add CDN for vehicle images, API response caching |
| "What about message queues?" | Async processing | Currently outbox + cron; would add BullMQ/Inngest for background jobs |
| "How do you monitor at scale?" | Operational maturity | Admit the gap (3/10); describe adding structured logging, APM, business metrics |

### After Security Discussion

| Likely follow-up | What they're probing | Key point to hit |
|-----------------|---------------------|-----------------|
| "How do you prevent SQL injection?" | Basic security | Drizzle ORM parameterizes all queries; raw SQL also uses parameterized queries |
| "How do you handle CSRF?" | Web security depth | NextAuth handles auth routes; other POST routes rely on same-origin policy |
| "What about rate limiting?" | Abuse prevention | 3-tier Upstash sliding window; but fails open if Redis is down |
| "How do you secure the AI?" | AI safety awareness | Tool call limit (5/response), but prompt injection is a real risk |
| "What about data encryption?" | Data protection | TLS in transit (Vercel HSTS); at rest via Neon's encryption; no app-level encryption |

---

## Red Flags to Address Proactively

Don't wait for the interviewer to discover these — mention them as things you've identified and have plans to fix:

1. **"We have zero tests"** — Frame as: "I prioritized feature breadth for the MVP. My first production hardening step is Vitest for service-layer tests, with Playwright for critical path e2e."

2. **"No database transactions on payment flows"** — Frame as: "I identified this in my production readiness review. The WebSocket driver is already configured (`wsDb`); the migration is straightforward — wrap the 4-step webhook handler in a transaction."

3. **"Demo credentials in production"** — Frame as: "These exist for demo purposes. Production deployment would use an environment variable to disable the credentials provider entirely."

4. **"No observability beyond Sentry"** — Frame as: "Sentry catches errors, but I don't have APM, metrics, or alerting. For production, I'd add Vercel Analytics for web vitals, structured logging with correlation IDs, and business metrics for booking conversion rates."

5. **"Rate limiting fails open"** — Frame as: "By design for local development, but in production `REDIS_URL` must be a required variable. I'd add an in-memory fallback as defense in depth."

---

## Numbers to Know

| Metric | Value | Source |
|--------|-------|--------|
| Tables | 16 | `packages/db/src/schema/` |
| Enums | 20 | `packages/db/src/schema/enums.ts` |
| API endpoints | 45+ | `apps/web/src/app/api/` |
| Service classes | 10 | `apps/web/src/services/` |
| Lib modules | 18 | `apps/web/src/lib/` |
| React components | 40+ | `apps/web/src/components/` |
| Zod validators | 18 | `packages/validators/src/` |
| MCP tools | 8 | `packages/mcp-server/src/` |
| AI features | 7 | Across 7 API routes |
| Seed vehicles | 236 | Across 24 Indian cities |
| Rate limit (general) | 60 req/min | Middleware |
| Rate limit (AI) | 10 req/min | Middleware |
| JWT session expiry | 12 hours | NextAuth config |
| MCP token expiry | 30 days | `/api/mcp/auth` |
| Platform fee (renter) | 18% | PricingService |
| Platform fee (host) | 15% deduction | PayoutService |
| GPS polling interval | 3 seconds | Trip tracking client |
| Notification polling | 30 seconds | Client-side |
| Sentry sample rate (prod) | 10% | `sentry.server.config.ts` |
| Estimated infra cost (1K users) | ~$84/month | Vercel + Neon + Upstash + Groq + Resend |
| Concurrent user capacity | ~100-500 | Before connection exhaustion |

---

## System Design Interview Mapping

If asked to "design a car rental system" in a system design interview, map Vroom's architecture:

| System Design Component | Vroom Implementation |
|------------------------|---------------------|
| API Gateway | Next.js middleware (rate limiting + auth + headers) |
| Application Server | Vercel Functions (Fluid Compute) |
| Business Logic | 10 service classes (singleton pattern) |
| Primary Database | Neon Postgres (16 tables, PostGIS) |
| Cache Layer | Upstash Redis (rate limits + AI cache) |
| Payment Processing | Razorpay (collection) + RazorpayX (payouts) |
| Search Engine | SQL with dynamic filters (would add Elasticsearch at scale) |
| Geospatial | PostGIS `earthdistance` extension |
| Event System | Transactional outbox + in-process event bus |
| Async Processing | Next.js `after()` + daily cron fallback |
| Real-time | SSE for GPS tracking, polling for notifications |
| AI/ML | Groq Llama models via Vercel AI SDK |
| Monitoring | Sentry (errors), health check endpoint |
| CDN | Vercel Edge Network (static assets) |
| Email | Resend (transactional) |
| Auth | NextAuth v5 (OAuth + JWT) |
| CI/CD | GitHub Actions → Vercel auto-deploy |

---

## Closing Statement Template

> "Vroom demonstrates that I can build a production-grade full-stack application with real-world complexity — payments, real-time tracking, AI integration, geospatial search, and a multi-role authorization system. More importantly, I can critically evaluate my own work: I've identified 30 issues across 4 severity levels, scored the system honestly across 10 dimensions, and have a specific 6-week hardening roadmap. I know exactly what's ready for production and what isn't."
