# System Architecture

## Overview

Vroom is a **peer-to-peer car rental marketplace** (ZoomCar/Turo clone) built as a Next.js 16 monorepo deployed on Vercel. It connects car owners (hosts) with renters, supporting the full rental lifecycle: search → book → pay → trip → review → payout.

**Tech Stack:**

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.2.5 (App Router) + React 19 |
| **Language** | TypeScript (strict) |
| **Database** | Neon Serverless Postgres (PostGIS) + Drizzle ORM |
| **Cache** | Upstash Redis (rate limiting + AI cache) |
| **Payments** | Razorpay (charges) + RazorpayX (host payouts) |
| **AI** | Groq (Llama 3.3/4) via Vercel AI SDK 6.x |
| **Auth** | NextAuth v5 (Google, GitHub, demo credentials) |
| **Maps** | Mapbox GL (display) + Google Places (autocomplete) |
| **Email** | Resend (transactional email) |
| **Monitoring** | Sentry (errors + performance traces) |
| **Monorepo** | Turborepo + pnpm workspaces |
| **CI/CD** | GitHub Actions → Vercel (auto-deploy) |
| **MCP** | Custom MCP server for AI assistant integration |

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                        │
│                                                                         │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │  Browser  │   │  AI Assistant │   │ Razorpay     │   │ Vercel Cron │ │
│  │  (React)  │   │  (via MCP)   │   │ Webhooks     │   │ (daily)     │ │
│  └─────┬─────┘   └──────┬───────┘   └──────┬───────┘   └──────┬──────┘ │
└────────┼────────────────┼────────────────────┼────────────────┼─────────┘
         │                │                    │                │
         │ HTTPS          │ stdio→HTTP         │ HTTPS          │ HTTPS
         │                │                    │                │
┌────────▼────────────────▼────────────────────▼────────────────▼─────────┐
│                     NEXT.JS APPLICATION (Vercel)                        │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     MIDDLEWARE LAYER                              │   │
│  │  Rate Limiting (Upstash) │ Auth Gate │ Security Headers         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌───────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │
│  │  SERVER COMPONENTS │  │  API ROUTES     │  │  SERVER ACTIONS     │   │
│  │  (SSR pages)       │  │  (/api/*)       │  │  (login)            │   │
│  └────────┬──────────┘  └────────┬────────┘  └─────────┬───────────┘   │
│           │                      │                      │               │
│  ┌────────▼──────────────────────▼──────────────────────▼───────────┐   │
│  │                     SERVICE LAYER                                │   │
│  │                                                                  │   │
│  │  BookingService │ VehicleService │ PaymentService │ TripService  │   │
│  │  PricingService │ ReviewService  │ NotificationSvc│ PayoutSvc   │   │
│  │  AvailabilitySvc│ TrustScoreSvc  │                              │   │
│  └────────┬────────────┬────────────┬──────────────────┬───────────┘   │
│           │            │            │                  │               │
│  ┌────────▼──────┐ ┌──▼──────┐ ┌──▼──────────┐ ┌────▼──────────┐   │
│  │  Drizzle ORM  │ │  Redis  │ │  Razorpay   │ │  Groq AI      │   │
│  │  (HTTP + WS)  │ │  Cache  │ │  Gateway    │ │  (Llama 3/4)  │   │
│  └────────┬──────┘ └──┬──────┘ └──┬──────────┘ └────┬──────────┘   │
│           │            │            │                  │               │
│  ┌────────▼──────┐ ┌──▼──────┐     │                  │               │
│  │  Event Bus    │ │  Email  │     │                  │               │
│  │  + Outbox     │ │ (Resend)│     │                  │               │
│  └───────────────┘ └─────────┘     │                  │               │
└─────────────┬──────────────────────┼──────────────────┼───────────────┘
              │                      │                  │
              ▼                      ▼                  ▼
    ┌──────────────┐        ┌──────────────┐    ┌──────────────┐
    │ Neon Postgres │        │   Razorpay   │    │   Groq API   │
    │  (PostGIS)    │        │   Gateway    │    │              │
    └──────────────┘        └──────────────┘    └──────────────┘
```

---

## Monorepo Structure

```
vroom/
├── apps/
│   └── web/                    # Next.js 16 application
│       ├── src/
│       │   ├── app/            # App Router pages + API routes
│       │   │   ├── api/        # 45+ REST API endpoints
│       │   │   ├── bookings/   # Booking pages
│       │   │   ├── vehicles/   # Vehicle browsing
│       │   │   ├── dashboard/  # Host + Admin dashboards
│       │   │   ├── trips/      # Trip tracking
│       │   │   ├── login/      # Auth pages
│       │   │   └── simulator/  # Testing simulators
│       │   ├── components/     # 40+ React components
│       │   ├── services/       # 10 service classes
│       │   └── lib/            # 18 utility modules
│       ├── public/             # Static assets
│       └── scripts/            # Build scripts
│
├── packages/
│   ├── db/                     # Drizzle schemas + migrations
│   │   ├── src/schema/         # 13 schema files, 16 tables
│   │   ├── src/seed/           # Seed data (236 vehicles, 26 users)
│   │   └── src/client.ts       # Neon HTTP + WebSocket clients
│   ├── events/                 # Typed event bus (19 events)
│   ├── validators/             # Zod schemas (18 validators)
│   └── mcp-server/             # MCP server (8 tools)
│
├── docker-compose.yml          # Local PostgreSQL + Redis
├── turbo.json                  # Turborepo task config
└── pnpm-workspace.yaml         # Workspace config
```

### Package Dependency Graph

```
apps/web
  ├── @vroom/db          (schema + client)
  ├── @vroom/events      (event bus)
  ├── @vroom/validators  (Zod schemas)
  └── [external deps]

@vroom/mcp-server        (standalone, HTTP-only)
  └── calls apps/web API routes via HTTP

@vroom/db
  ├── drizzle-orm
  └── @neondatabase/serverless

@vroom/events
  └── (zero dependencies)

@vroom/validators
  └── zod
```

---

## Core Architectural Decisions & Tradeoffs

### 1. Next.js as Full-Stack Framework

**Decision:** Single Next.js app handles both frontend rendering and backend API routes.

**Why:** Simplifies deployment (single Vercel project), enables Server Components for data fetching, shares TypeScript types between frontend and backend, and avoids CORS complexity.

**Tradeoff:** Backend and frontend scale together. Can't independently scale API servers under heavy API load without splitting the app.

### 2. Neon Serverless Postgres (Not a Traditional Postgres)

**Decision:** Use Neon's HTTP driver for reads and WebSocket driver for transactions.

**Why:** Neon auto-scales, supports branching for dev/staging, works in serverless (no persistent connection pool needed), and the HTTP driver has near-zero cold-start overhead.

**Tradeoff:** HTTP driver doesn't support multi-statement transactions. The codebase works around this by using raw SQL `INSERT ... WHERE NOT EXISTS` for atomicity (booking creation) and optimistic concurrency via version columns.

### 3. Class-Based Service Layer

**Decision:** 10 service classes with singleton exports (e.g., `export const bookingService = new BookingService()`).

**Why:** Organizes business logic by domain, keeps API routes thin, enables reuse across routes.

**Tradeoff:** Services aren't dependency-injected, making unit testing harder. Module-level singletons make mocking difficult.

### 4. Transactional Outbox for Events

**Decision:** Events are first persisted to an `outbox_events` database table, then processed inline via `next/server`'s `after()` API, with a daily cron as fallback.

**Why:** Guarantees event delivery even if the process crashes. The outbox pattern is a production-standard approach for reliable messaging without a dedicated message broker.

**Tradeoff:** Daily cron means failed events may wait up to 24 hours for retry. Real-time guarantees depend on the inline `after()` processing succeeding.

### 5. Groq (Llama) for AI Instead of OpenAI/Anthropic

**Decision:** All AI features use Groq's hosted Llama models (3.3-70b and 4-scout).

**Why:** Significantly cheaper than GPT-4/Claude for a startup. Groq's inference speed is excellent for streaming use cases.

**Tradeoff:** Llama models are less capable at complex reasoning than frontier models. The system compensates with detailed prompts and tool-calling patterns.

### 6. Razorpay for India-First Payments

**Decision:** Razorpay for charge collection + RazorpayX for host payouts (NEFT transfers).

**Why:** Dominant payment gateway in India. Supports UPI, cards, netbanking, wallets. RazorpayX enables automated bank transfers to hosts.

**Tradeoff:** Locked into Indian market. Multi-currency support would require adding Stripe or another gateway.

### 7. Paise-Based Monetary Representation

**Decision:** All monetary amounts stored as integers in paise (1/100 INR).

**Why:** Avoids floating-point precision issues. Standard practice for financial systems.

**Tradeoff:** Every display layer must divide by 100. The `formatPrice()` and MCP's `paise()` helpers handle this, but it's a potential source of off-by-100x bugs.

---

## Communication Patterns

### Frontend → Backend

```
Server Components ──(direct import)──▶ Service Layer ──▶ Database
Client Components ──(fetch/POST)──▶ API Routes ──▶ Service Layer ──▶ Database
```

- **Server Components** call services directly (no HTTP overhead)
- **Client Components** use `fetch()` to API routes
- **No tRPC or GraphQL** — pure REST with JSON

### Backend → External Services

| Service | Protocol | Purpose |
|---------|----------|---------|
| Neon Postgres | HTTP / WebSocket | Data persistence |
| Upstash Redis | HTTP | Rate limiting, AI response caching |
| Razorpay | HTTPS REST | Payment orders, captures, refunds |
| RazorpayX | HTTPS REST | Host payouts (NEFT) |
| Groq | HTTPS REST | AI inference (Llama models) |
| Resend | HTTPS REST | Transactional email |
| Sentry | HTTPS | Error reporting, performance traces |

### Event-Driven Communication

```
Service Method
    │
    ├── emitEvent("booking.created", payload)
    │       │
    │       ├── 1. INSERT INTO outbox_events (persist first)
    │       │
    │       └── 2. after() callback (async, non-blocking)
    │               │
    │               └── eventBus.publish("booking.created", payload)
    │                       │
    │                       ├── Handler: Notify host (in-app)
    │                       ├── Handler: Send email (Resend)
    │                       └── Handler: Update trust scores
    │
    └── Return response to client immediately
```

---

## Authentication Architecture

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Browser    │────▶│ NextAuth v5         │────▶│ Google OAuth  │
│   (Cookie)   │     │ JWT Strategy        │     │ GitHub OAuth  │
└──────────────┘     │ 12-hour sessions    │     │ Demo Creds    │
                     └────────┬────────────┘     └──────────────┘
                              │
                              ▼
┌──────────────┐     ┌─────────────────────┐
│   MCP Server │────▶│ Bearer JWT          │
│   (API Key)  │     │ /api/mcp/auth       │
└──────────────┘     │ 30-day tokens       │
                     └─────────────────────┘
```

**Two auth paths:**
1. **Session auth** (browser): NextAuth cookie → middleware validates → `auth()` in route handlers
2. **Bearer auth** (MCP/programmatic): JWT in `Authorization` header → `bearerAuth()` validates via `jose`

**User ID resolution:** OAuth providers may generate different session IDs across logins. `resolveUserId()` maps by email to the stable database user ID.

**Role-based access:**
- `renter` — browse, book, pay, review
- `host` — list vehicles, manage bookings, start/complete trips, request payouts
- `admin` — all host abilities + user management, review moderation, analytics

---

## Data Flow: Complete Booking Lifecycle

```
1. SEARCH
   Browser → GET /api/vehicles/search → vehicleService.search()
   → PostGIS earthdistance query + availability check → Results

2. BOOK
   Browser → POST /api/bookings → bookingService.create()
   → Atomic INSERT...WHERE NOT EXISTS (prevents double-booking)
   → emitEvent("booking.created") → Notify host

3. PAY
   Browser → POST /api/payments/create-order → Razorpay order
   → Client-side Razorpay Checkout UI
   → POST /api/payments/verify → Signature verification
   → Webhook /api/payments/webhook → booking.confirmed event
   → OTP generated, renter notified via email + in-app

4. TRIP
   Host → POST /api/trips → Pre-inspection + start
   → GPS tracking via /api/trips/[id]/latest-location
   → SSE stream via /api/trips/[id]/live
   → PATCH /api/trips/[id] → Post-inspection + complete

5. REVIEW
   Renter → POST /api/reviews → Auto-moderation (profanity + trust score)
   → Vehicle rating recalculation → Trust score update

6. PAYOUT
   Host → POST /api/payouts → Calculate earnings (gross - 15% fee)
   → Admin → POST /api/payouts/[id]/process → RazorpayX NEFT transfer
   → Webhook /api/payouts/webhook → Status update
```

---

## Key Performance Characteristics

| Metric | Current State |
|--------|---------------|
| **Cold start** | ~200-500ms (Vercel Fluid Compute) |
| **DB queries/request** | 1-4 typical, up to 8 for complex pages |
| **AI latency** | 500ms-3s (Groq streaming) |
| **Payment flow** | ~2-5s (Razorpay round-trip) |
| **SSE polling** | 3-second intervals for trip tracking |
| **Rate limits** | 60 req/min general, 10 req/min AI |
| **Cache TTLs** | 30min (recommendations), 1h (NL search), 24h (range advisor) |

---

## What This Architecture Does Well

1. **Full-stack type safety** — TypeScript from DB schema to React components
2. **Atomic booking creation** — Raw SQL prevents double-bookings without distributed locks
3. **Event-driven side effects** — Outbox pattern ensures reliable event delivery
4. **India-first payments** — Razorpay + RazorpayX covers the full money flow
5. **AI-first features** — Chat, NL search, recommendations, range advisor, trip planner
6. **MCP integration** — AI assistants can interact with the platform programmatically
7. **Geospatial queries** — PostGIS earthdistance for location-based vehicle search

## What Needs Production Hardening

1. **No database transactions** — Multiple writes in payment/trip flows lack atomicity
2. **Single-region** — No multi-region deployment or read replicas
3. **No test suite** — CI runs lint + typecheck + build, but zero tests
4. **In-process event bus** — Events lost if process crashes before `after()` completes
5. **No WebSocket infrastructure** — Trip tracking uses SSE polling (3s intervals)
6. **No queue system** — Email, AI calls, webhooks all processed synchronously
7. **Duplicate email module** — `email.ts` and `ses.ts` cause double email delivery
