# Codebase Map

## Repository Structure

```
vroom/                              # Monorepo root
├── apps/
│   └── web/                        # Next.js 16 application
│       ├── src/
│       │   ├── app/                # App Router (pages + API routes)
│       │   ├── components/         # React components (40+)
│       │   ├── services/           # Business logic layer (10 services)
│       │   └── lib/                # Utilities & infrastructure (18 modules)
│       ├── public/                 # Static assets
│       ├── scripts/                # Build scripts (env checker)
│       ├── next.config.ts          # Sentry + image config
│       ├── vercel.json             # Cron jobs
│       └── package.json            # Dependencies
│
├── packages/
│   ├── db/                         # Database package
│   │   ├── src/schema/             # Drizzle schemas (16 tables)
│   │   ├── src/seed/               # Seed data (236 vehicles, 26 users)
│   │   ├── src/client.ts           # Neon HTTP + WS clients
│   │   └── drizzle.config.ts       # Migration config
│   ├── events/                     # Event bus (19 event types)
│   ├── validators/                 # Zod schemas (18 validators)
│   └── mcp-server/                 # MCP server (8 tools)
│
├── .github/workflows/ci.yml        # CI pipeline
├── docker-compose.yml              # Local Postgres + Redis
├── turbo.json                      # Turborepo config
├── pnpm-workspace.yaml             # Workspace config
└── package.json                    # Root package + overrides
```

---

## Folder-by-Folder Breakdown

### `apps/web/src/app/` — App Router

| Folder | Purpose | Subsystem | Key Files |
|--------|---------|-----------|-----------|
| `app/` | Root layout + home page | Frontend | `layout.tsx`, `page.tsx`, `error.tsx`, `not-found.tsx`, `globals.css` |
| `app/login/` | Authentication | Auth | `page.tsx`, `login-form.tsx`, `actions.ts` |
| `app/vehicles/` | Vehicle browsing | Search | `page.tsx`, `loading.tsx` |
| `app/vehicles/[id]/` | Vehicle detail | Search | `page.tsx`, `loading.tsx` |
| `app/vehicles/[id]/book/` | Booking creation | Booking | `page.tsx` |
| `app/bookings/` | Booking list | Booking | `page.tsx`, `loading.tsx` |
| `app/bookings/[id]/` | Booking detail | Booking | `page.tsx` |
| `app/bookings/[id]/pay/` | Payment flow | Payment | `page.tsx` (client component) |
| `app/bookings/[id]/confirmation/` | Payment receipt | Booking | `page.tsx` |
| `app/bookings/[id]/review/` | Review submission | Reviews | `page.tsx` |
| `app/trips/[id]/` | Trip tracking | Trips | `page.tsx`, `complete-trip-form.tsx` |
| `app/trip-planner/` | AI trip planner | AI | `page.tsx`, `trip-planner-client.tsx` |
| `app/profile/` | User profile | Users | `page.tsx` |
| `app/dashboard/` | Dashboard root | Dashboard | `layout.tsx`, `page.tsx` |
| `app/dashboard/host/` | Host dashboard | Host | `page.tsx` + bookings/earnings/vehicles subpages |
| `app/dashboard/admin/` | Admin dashboard | Admin | `page.tsx` + bookings/users/analytics subpages |
| `app/simulator/` | Testing tools | Dev | `page.tsx` + booking/lifecycle subpages |

### `apps/web/src/app/api/` — API Routes (45+ endpoints)

| Route Group | Purpose | Auth | Services Used |
|-------------|---------|------|---------------|
| `api/auth/` | NextAuth handlers | Public | auth |
| `api/mcp/auth/` | MCP token issuance | Public | jose |
| `api/health/` | Health check | Public | db, redis |
| `api/cities/` | City listing | Public | vehicleService |
| `api/vehicles/` | Vehicle CRUD | Mixed | vehicleService |
| `api/vehicles/search/` | Vehicle search | Public | vehicleService |
| `api/vehicles/[id]/chat/` | Per-vehicle AI chat | Session | vehicleService, groq |
| `api/vehicles/[id]/availability/` | Availability management | Mixed | availabilityService |
| `api/bookings/` | Booking CRUD | Session+Bearer | bookingService, pricingService |
| `api/bookings/[id]/` | Booking detail + actions | Session+Bearer | bookingService |
| `api/payments/create-order/` | Razorpay order | Session | paymentService |
| `api/payments/verify/` | Payment verification | Session | paymentService |
| `api/payments/webhook/` | Razorpay webhook | Webhook sig | paymentService |
| `api/trips/` | Trip start | Session | tripService |
| `api/trips/[id]/` | Trip detail + complete | Session | tripService |
| `api/trips/[id]/live/` | SSE trip tracking | Session | tripService |
| `api/trips/[id]/latest-location/` | Latest GPS | Session | tripService |
| `api/notifications/` | Notification list | Session | notificationService |
| `api/notifications/[id]/` | Mark read | Session | notificationService |
| `api/notifications/read-all/` | Mark all read | Session | notificationService |
| `api/reviews/` | Review CRUD | Mixed | reviewService |
| `api/reviews/summary/` | AI review summary | Public | reviewService, groq |
| `api/reviews/[id]/flag/` | Flag review | Session | reviewService |
| `api/chat/` | Main AI chatbot | Session | vehicleService, bookingService, groq |
| `api/nl-search/` | NL → filters | Session | groq, redis |
| `api/ai/range-advisor/` | EV range advice | Session | groq, redis |
| `api/ai/recommendations/` | Personalized recs | Session | vehicleService, groq, redis |
| `api/trip-planner/` | AI trip planner | Session | vehicleService, groq |
| `api/pricing/estimate/` | Price calculator | Public | pricingService |
| `api/pickup-points/` | Pickup locations | Public | db |
| `api/geofences/` | Operating zones | Public | db |
| `api/profile/` | User profile | Session | db |
| `api/promo/` | Promo codes | Session | hardcoded |
| `api/alerts/price-drop/` | Price alerts | Session | notificationService |
| `api/payouts/` | Host payouts | Session (host) | payoutService |
| `api/payouts/earnings/` | Earnings calc | Session (host) | payoutService |
| `api/payouts/webhook/` | Payout webhook | Webhook sig | payoutService |
| `api/payouts/[id]/process/` | Process payout | Session (admin) | payoutService |
| `api/admin/users/` | User management | Session (admin) | db |
| `api/admin/stats/` | Platform stats | Session (admin) | db |
| `api/admin/trust-scores/` | Trust scores | Session (admin) | trustScoreService |
| `api/admin/reviews/` | Review moderation | Session (admin) | reviewService |
| `api/admin/reviews/[id]/` | Review actions | Session (admin) | reviewService |
| `api/cron/process-outbox/` | Outbox processor | Cron secret | outboxProcessor |

### `apps/web/src/components/` — React Components

| Component | Type | Purpose | Key Dependencies |
|-----------|------|---------|-----------------|
| **Navigation** | | | |
| `nav.tsx` | Server | Top navigation bar | auth() |
| `logo.tsx` | Server | Brand logo SVG | None |
| `user-menu.tsx` | Client | User dropdown with avatar | useSession |
| `logout-button.tsx` | Client | Sign out button | signOut |
| `command-bar.tsx` | Client | Cmd+K palette with AI chat | useChat, localStorage |
| **Vehicle** | | | |
| `vehicle-card.tsx` | Server | Vehicle listing card | next/image |
| `vehicle-filters.tsx` | Client | Search filter panel | useSearchParams, useRouter |
| `vehicles-content.tsx` | Client | List/map view toggle | dynamic(VehicleMap) |
| `vehicle-map.tsx` | Client | Mapbox GL map | mapbox-gl (dynamic import) |
| `vehicle-chat.tsx` | Client | Per-vehicle AI Q&A | fetch (streaming) |
| `chat-vehicle-card.tsx` | Client | Vehicle card in AI chat | None |
| `mobile-filter-sheet.tsx` | Client | Bottom sheet for mobile filters | None |
| **Booking** | | | |
| `booking-form.tsx` | Client | Multi-step booking creation | fetch, Razorpay SDK |
| `cancel-booking-button.tsx` | Client | Cancellation with confirmation | fetch |
| `price-breakdown.tsx` | Client | Dynamic pricing display | None |
| `protection-plans.tsx` | Client | Plan selector (basic/std/premium) | None |
| `pickup-point-selector.tsx` | Client | Pickup location chooser | fetch |
| `places-autocomplete.tsx` | Client | Google Places autocomplete | Google Maps API |
| **AI** | | | |
| `ai-chat.tsx` | Client | Floating chat widget (1583 lines) | useChat, localStorage |
| `home-ai.tsx` | Client | Hero section AI (976 lines) | useChat, geolocation |
| `nl-search-bar.tsx` | Client | Natural language search | fetch |
| `personalized-recommendations.tsx` | Client | AI vehicle recommendations | fetch |
| `range-advisor.tsx` | Client | EV range estimation | fetch |
| `review-summary.tsx` | Client | AI review summarization | fetch |
| **Trip** | | | |
| `trip-timeline.tsx` | Server | Trip status visualization | None |
| `start-trip-button.tsx` | Client | Multi-step trip start (OTP → inspect) | fetch |
| `inspection-form.tsx` | Client | Pre/post trip inspection form | None |
| **Reviews** | | | |
| `review-form.tsx` | Client | Rating + text submission | fetch |
| `review-card.tsx` | Server | Review display card | None |
| `review-list.tsx` | Client | Paginated review list | fetch |
| `star-rating.tsx` | Client | Interactive star input | None |
| **Notifications** | | | |
| `notification-bell.tsx` | Client | Header notification icon + badge | fetch (30s polling) |
| `notification-panel.tsx` | Client | Full notification list | fetch |
| **Other** | | | |
| `profile-form.tsx` | Client | User profile editing | fetch |
| `price-drop-alert.tsx` | Client | Price alert subscription | fetch |
| `mutation-listener.tsx` | Client | Cross-component cache invalidation | subscribe() |
| `providers.tsx` | Client | SessionProvider + ToastProvider | next-auth/react |
| **UI Primitives** | | | |
| `ui/modal.tsx` | Client | Dialog overlay | None |
| `ui/toast.tsx` | Client | Toast notification | ToastContext |
| `ui/toast-context.tsx` | Client | Toast provider + context | React context |
| `ui/custom-select.tsx` | Client | Accessible dropdown | None |
| `ui/empty-state.tsx` | Server | Empty state placeholder | None |
| `ui/skeleton.tsx` | Server | Loading skeleton | None |
| `ui/vehicle-card-skeleton.tsx` | Server | Vehicle loading state | Skeleton |
| **Dashboard** | | | |
| `dashboard/dashboard-sidebar.tsx` | Client | Role-based nav sidebar | useSession, usePathname |
| `dashboard/booking-request-actions.tsx` | Client | Accept/reject booking | fetch |
| `dashboard/vehicle-actions.tsx` | Client | List/delist/delete vehicle | fetch |
| `dashboard/vehicle-form.tsx` | Client | Vehicle creation/editing | fetch |

### `apps/web/src/services/` — Service Layer

| Service | File | DB Tables | External APIs | Events |
|---------|------|-----------|---------------|--------|
| BookingService | `booking.ts` | bookings, booking_events, vehicle_availability | — | booking.created/confirmed/cancelled |
| VehicleService | `vehicle.ts` | vehicles, bookings, vehicle_availability | — | — |
| PaymentService | `payment.ts` | payments, bookings, booking_events | Razorpay | payment.captured/refunded |
| PricingService | `pricing.ts` | — (pure computation) | — | — |
| TripService | `trip.ts` | trips, trip_locations, bookings | — | trip.started/completed |
| ReviewService | `review.ts` | reviews, vehicles, users | — | review.created/flagged/hidden/published |
| NotificationService | `notification.ts` | notifications, users | Resend (email) | — |
| AvailabilityService | `availability.ts` | vehicle_availability, vehicles, bookings | — | — |
| PayoutService | `payout.ts` | payouts, bookings, payments | RazorpayX | — |
| TrustScoreService | `trust-score.ts` | users, bookings, reviews, payments | — | — |

### `apps/web/src/lib/` — Utilities

| Module | File | Purpose | Dependencies |
|--------|------|---------|-------------|
| `db.ts` | Database clients | Lazy-init Neon HTTP + WS | @neondatabase/serverless, drizzle-orm |
| `auth.ts` | NextAuth config | Google, GitHub, demo credentials | next-auth, drizzle |
| `bearer-auth.ts` | JWT verification | Bearer token auth for API | jose |
| `resolve-user-id.ts` | User ID mapping | OAuth session → stable DB ID | drizzle |
| `emit-event.ts` | Event emission | Outbox pattern + after() | drizzle, events package |
| `outbox-processor.ts` | Event retry | Batch process failed events | drizzle, events package |
| `event-handlers.ts` | Event subscriptions | All event handlers registered | services, email, trust score |
| `razorpay.ts` | Payment SDK | Server-side Razorpay + sig verification | razorpay, crypto |
| `razorpay-client.ts` | Checkout SDK | Client-side Razorpay loader | Razorpay CDN script |
| `email.ts` | Email delivery | Send via Resend | resend |
| `ses.ts` | Email delivery (dup) | Send via Resend (misleading name) | resend |
| `email-templates.ts` | HTML templates | 6 email templates | None |
| `api-error.ts` | Error handling | ApiError class + response helper | @sentry/nextjs |
| `logger.ts` | Logging | Structured JSON + Sentry | @sentry/nextjs |
| `format.ts` | Display formatting | Price, rating, labels, icons | None |
| `ai-cache.ts` | AI response cache | Redis GET/SET with TTL | @upstash/redis |
| `mutation-store.ts` | Pub/sub | Client mutation invalidation | None |

### `packages/db/` — Database Package

| File | Purpose |
|------|---------|
| `src/client.ts` | Neon HTTP + WebSocket clients with lazy init |
| `src/index.ts` | Re-exports all schemas + client |
| `src/schema/users.ts` | Users table + role/status enums |
| `src/schema/vehicles.ts` | Vehicles table + type/fuel/transmission enums |
| `src/schema/bookings.ts` | Bookings + booking_events tables |
| `src/schema/payments.ts` | Payments table + type/status/method enums |
| `src/schema/trips.ts` | Trips + trip_locations tables |
| `src/schema/reviews.ts` | Reviews table + type/status enums |
| `src/schema/pricing.ts` | Pricing rules + demand snapshots |
| `src/schema/notifications.ts` | Notifications table + channel enum |
| `src/schema/outbox.ts` | Outbox events table |
| `src/schema/availability.ts` | Vehicle availability table |
| `src/schema/payouts.ts` | Payouts table + status enum |
| `src/schema/geo.ts` | Pickup points + geofences |
| `src/schema/enums.ts` | Shared enums |
| `src/schema/index.ts` | Re-exports all schemas |
| `src/seed/index.ts` | Seed runner (delete + insert) |
| `src/seed/data/*.ts` | Seed data files (users, vehicles, bookings, etc.) |
| `drizzle.config.ts` | Migration output config |

### `packages/events/` — Event Bus

| File | Purpose |
|------|---------|
| `src/index.ts` | TypedEventBus class (Map-based pub/sub), EventMap (19 events), singleton export |

### `packages/validators/` — Validation Schemas

| File | Purpose |
|------|---------|
| `src/index.ts` | 18 Zod schemas + 16 TypeScript types for all API inputs |

### `packages/mcp-server/` — MCP Server

| File | Purpose |
|------|---------|
| `src/index.ts` | 8 tools, stdio transport, auth gating, response formatting |

---

## Dependency Graph

```
                    ┌──────────────┐
                    │  @vroom/db   │
                    │  (schemas)   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
    │ @vroom/events│ │@vroom/   │ │  apps/web    │
    │ (event bus)  │ │validators│ │  (Next.js)   │
    └──────┬───────┘ └────┬─────┘ └──────────────┘
           │              │              ▲
           └──────────────┼──────────────┘
                          │
              ┌───────────┘
              │
    ┌─────────▼────────┐
    │ @vroom/mcp-server│  (standalone, HTTP-only to apps/web API)
    └──────────────────┘
```

---

## Where Things Live

| Concern | Location |
|---------|----------|
| **Business rules** | `apps/web/src/services/*.ts` |
| **Database schema** | `packages/db/src/schema/*.ts` |
| **Input validation** | `packages/validators/src/index.ts` |
| **Authentication** | `apps/web/src/lib/auth.ts`, `bearer-auth.ts` |
| **Event handling** | `apps/web/src/lib/event-handlers.ts`, `emit-event.ts` |
| **Side effects** (emails, notifications, trust scores) | `apps/web/src/lib/event-handlers.ts` |
| **Database operations** | Service methods in `apps/web/src/services/*.ts` |
| **Caching** | `apps/web/src/lib/ai-cache.ts` (Redis) |
| **Rate limiting** | `apps/web/src/middleware.ts` (Upstash) |
| **Payment processing** | `apps/web/src/services/payment.ts`, `lib/razorpay.ts` |
| **AI calls** | API route handlers (`/api/chat/`, `/api/nl-search/`, `/api/ai/`) |
| **API definitions** | `apps/web/src/app/api/*/route.ts` |
| **Page rendering** | `apps/web/src/app/*/page.tsx` |
| **UI components** | `apps/web/src/components/*.tsx` |
