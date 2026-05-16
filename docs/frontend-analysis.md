# Frontend Analysis

## Architecture Overview

The frontend is a **Next.js 16 App Router** application using React 19. It follows a **Server Component shell with Client Component islands** pattern — pages are server-rendered with interactive widgets as client components.

| Property | Value |
|----------|-------|
| **Framework** | Next.js 16.2.5 (App Router) |
| **React** | 19.2.4 |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| **Fonts** | DM Sans (body) + Bricolage Grotesque (display) via `next/font/google` |
| **Maps** | Mapbox GL (dynamic import, SSR disabled) |
| **Autocomplete** | Google Places API (manual script injection) |
| **AI Chat** | Vercel AI SDK 6.x `useChat` hook |
| **Auth** | NextAuth v5 with `SessionProvider` |
| **Monitoring** | Sentry (client + server instrumentation) |

---

## Route Map

| Route | File | Type | Rendering | Auth |
|-------|------|------|-----------|------|
| `/` | `app/page.tsx` | Server | SSR (parallel: cities + auth) | Public |
| `/login` | `app/login/page.tsx` | Server | SSR, redirects if authed | Public |
| `/vehicles` | `app/vehicles/page.tsx` | Server | SSR, searchParams-driven | Public |
| `/vehicles/[id]` | `app/vehicles/[id]/page.tsx` | Server | SSR (parallel: vehicle + reviews) | Public |
| `/vehicles/[id]/book` | `app/vehicles/[id]/book/page.tsx` | Server | SSR wrapper for client form | Auth required |
| `/bookings` | `app/bookings/page.tsx` | Server | SSR | Auth required |
| `/bookings/[id]` | `app/bookings/[id]/page.tsx` | Server | SSR, role-based sections | Auth required |
| `/bookings/[id]/pay` | `app/bookings/[id]/pay/page.tsx` | **Client** | CSR (Razorpay SDK) | Auth required |
| `/bookings/[id]/confirmation` | `app/bookings/[id]/confirmation/page.tsx` | Server | SSR receipt | Auth required |
| `/bookings/[id]/review` | `app/bookings/[id]/review/page.tsx` | Server | SSR, ownership check | Auth required |
| `/trips/[id]` | `app/trips/[id]/page.tsx` | Server | SSR, role-gated | Auth required |
| `/trip-planner` | `app/trip-planner/page.tsx` | Server | SSR wrapper for client AI | Auth required |
| `/profile` | `app/profile/page.tsx` | Server | SSR | Auth required |
| `/dashboard` | `app/dashboard/page.tsx` | Server | Redirect to /dashboard/host | Auth (host/admin) |
| `/dashboard/host/*` | 5 pages | Server | SSR with parallel fetches | Auth (host/admin) |
| `/dashboard/admin/*` | 4 pages | Server | SSR with direct Drizzle queries | Auth (admin) |
| `/simulator/*` | 3 pages | Server/Client | Testing tools | Auth required |

---

## Server vs. Client Component Boundaries

### Design Principle

Server Components handle data fetching and static rendering. Client Components handle interactivity (forms, state, browser APIs, streaming).

```
Server Component (page.tsx)
    │
    ├── Calls auth(), service methods, DB queries
    ├── Renders static HTML
    │
    └── Passes data as props to:
        │
        └── Client Component ("use client")
            ├── useState, useEffect, event handlers
            ├── fetch() to API routes
            └── Browser APIs (localStorage, Razorpay SDK, Mapbox)
```

### Server Components (No "use client")

| Component | Purpose |
|-----------|---------|
| All `page.tsx` files (except pay) | Data fetching + layout |
| `nav.tsx` | Async server component, calls `auth()` |
| `logo.tsx` | Static SVG |
| `vehicle-card.tsx` | Vehicle display card |
| `review-card.tsx` | Review display card |
| `trip-timeline.tsx` | Trip status visualization |
| `ui/empty-state.tsx` | Empty state placeholder |
| `ui/skeleton.tsx` | Loading skeleton |
| `ui/vehicle-card-skeleton.tsx` | Vehicle loading state |

### Client Components ("use client") — 35+ Components

**Forms & Input:**
- `login-form.tsx` — `useActionState` (React 19 server action form)
- `booking-form.tsx` — Multi-step: form → payment → processing
- `vehicle-form.tsx` — Host vehicle creation/editing
- `profile-form.tsx` — User profile editing
- `review-form.tsx` — Rating + text submission
- `inspection-form.tsx` — Pre/post trip inspection
- `complete-trip-form.tsx` — Trip completion with inspection

**AI Interfaces:**
- `ai-chat.tsx` — Floating chat widget (1583 lines, largest component)
- `home-ai.tsx` — Hero section AI chat (976 lines)
- `command-bar.tsx` — Cmd+K palette with AI (1466 lines)
- `nl-search-bar.tsx` — Natural language search
- `vehicle-chat.tsx` — Per-vehicle AI Q&A
- `personalized-recommendations.tsx` — AI recommendations
- `range-advisor.tsx` — EV range estimation
- `review-summary.tsx` — AI review summarization

**Interactive UI:**
- `vehicle-filters.tsx` — Search filters (URL params)
- `vehicles-content.tsx` — List/map view toggle
- `vehicle-map.tsx` — Mapbox GL map (726 lines, dynamic import)
- `notification-bell.tsx` — Header bell with polling
- `notification-panel.tsx` — Full notification list
- `price-breakdown.tsx` — Dynamic pricing display
- `protection-plans.tsx` — Plan selection
- `pickup-point-selector.tsx` — Location picker
- `places-autocomplete.tsx` — Google Places
- `price-drop-alert.tsx` — Alert subscription
- `mobile-filter-sheet.tsx` — Bottom sheet for filters
- `cancel-booking-button.tsx` — Cancellation with confirmation
- `start-trip-button.tsx` — Multi-step: idle → OTP → inspection
- `star-rating.tsx` — Interactive star input

**Dashboard:**
- `dashboard-sidebar.tsx` — Role-based navigation
- `booking-request-actions.tsx` — Accept/reject buttons
- `vehicle-actions.tsx` — List/delist/delete
- Admin `user-actions.tsx` — Role/status changes

**Infrastructure:**
- `providers.tsx` — SessionProvider + ToastProvider + Toaster
- `mutation-listener.tsx` — Cross-component cache invalidation
- `user-menu.tsx` — Dropdown with avatar
- `logout-button.tsx` — Sign out action

---

## State Management

**No global state library.** State is managed through 5 patterns:

### 1. URL Parameters (Search/Filter State)

```
vehicle-filters.tsx:
  const searchParams = useSearchParams();
  const router = useRouter();
  
  function applyFilter(key, value) {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`/vehicles?${params}`);
  }
```

URL params drive vehicle search, admin filters, and pagination. This enables deep linking, back/forward navigation, and SSR on filter changes.

### 2. React Context (Minimal, 2 Contexts)

| Context | Provider | Purpose |
|---------|----------|---------|
| `ToastContext` | `toast-context.tsx` | Global toast notifications via `toast()` and `dismiss()` |
| `CommandBarProvider` | `command-bar.tsx` | Cmd+K palette state + cross-component mutation notification via `notify(key)` |

### 3. Local Component State (useState)

Most interactive components manage their own state. Multi-step flows use state machines:

```
booking-form.tsx:  step = "form" | "payment" | "processing"
start-trip-button.tsx: step = "idle" | "otp" | "inspection"
```

### 4. localStorage Persistence

| Component | Key | Data |
|-----------|-----|------|
| `ai-chat.tsx` | `vroom-chat-history` | Chat messages array |
| `home-ai.tsx` | `vroom-home-chat-history` | Home page chat messages |
| `command-bar.tsx` | `vroom-cmd-chat-history` | Command bar chat messages |

### 5. Mutation Store (Custom Pub/Sub)

```
lib/mutation-store.ts:
  subscribe(key, listener) → unsubscribe function
  notify(key) → triggers all listeners for key

mutation-listener.tsx:
  useEffect(() => {
    return subscribe("bookings", () => router.refresh());
  });
```

When a booking is created via the command bar, `notify("bookings")` triggers `router.refresh()` in the bookings page, revalidating server data.

---

## Data Fetching Patterns

### Server-Side (Server Components)

**Direct service imports:**
```typescript
// vehicles/page.tsx
const results = await vehicleService.search(params);
```

**Direct Drizzle ORM queries (admin pages):**
```typescript
// dashboard/admin/analytics/page.tsx
const revenue = await db.select({
  month: sql`to_char(payments.created_at, 'YYYY-MM')`,
  total: sum(payments.amount)
}).from(payments).groupBy(sql`1`);
```

**Parallel fetching:**
```typescript
// dashboard/host/page.tsx
const [stats, bookings, vehicles] = await Promise.all([
  vehicleService.getHostStats(userId),
  bookingService.getByHost(userId),
  vehicleService.getByHost(userId)
]);
```

### Client-Side (Client Components)

**fetch() to API routes:**
```typescript
// profile-form.tsx
useEffect(() => {
  fetch("/api/profile").then(r => r.json()).then(setProfile);
}, []);
```

**AI SDK useChat:**
```typescript
// ai-chat.tsx
const { messages, input, handleSubmit, isLoading } = useChat({
  transport: new DefaultChatTransport({ api: "/api/chat" }),
});
```

**Polling:**
```typescript
// notification-bell.tsx
useEffect(() => {
  const interval = setInterval(() => {
    fetch("/api/notifications?limit=1")
      .then(r => r.json())
      .then(data => setUnread(data.unreadCount));
  }, 30000);
  return () => clearInterval(interval);
}, []);
```

**Manual streaming:**
```typescript
// vehicle-chat.tsx
const response = await fetch(`/api/vehicles/${vehicleId}/chat`, {
  method: "POST", body: JSON.stringify({ messages })
});
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  setText(prev => prev + new TextDecoder().decode(value));
}
```

---

## Component Deep Dives

### BookingForm (`components/booking-form.tsx`, ~778 lines)

Multi-step booking creation flow:

```
Step 1: "form"
├── Date selection (start/end)
├── ProtectionPlans selection
├── PickupPointSelector (pre-defined points)
├── PlacesAutocomplete (custom address)
├── PriceBreakdown (live calculation)
├── Promo code input
└── Submit → POST /api/bookings

Step 2: "payment"
├── Price summary
├── POST /api/payments/create-order → Razorpay order
├── openRazorpayCheckout() → Razorpay Checkout UI
├── On success: POST /api/payments/verify
└── Redirect to /bookings/{id}/confirmation

Step 3: "processing"
└── Loading spinner while payment processes
```

### AiChat (`components/ai-chat.tsx`, ~1583 lines)

The largest component. Features:
- Floating chat button (bottom-right corner)
- Expandable chat panel
- `useChat` hook with message history
- Tool result rendering (vehicle cards, booking confirmations)
- `ChatVehicleCard` for inline vehicle displays
- localStorage persistence
- Geolocation-aware (passes lat/lng if available)

### VehicleMap (`components/vehicle-map.tsx`, ~726 lines)

Mapbox GL integration:
- Dynamic import with `ssr: false` (requires browser APIs)
- Vehicle markers with popups
- Geofence polygon overlay
- Cluster markers for dense areas
- User location marker
- Responsive resize handling

### CommandBar (`components/command-bar.tsx`, ~1466 lines)

Cmd+K command palette:
- Keyboard shortcut listener (Cmd+K / Ctrl+K)
- Recent commands
- AI chat integration
- Booking creation from chat
- `notify("bookings")` for cross-component invalidation

---

## Performance Patterns

### What's Good

| Pattern | Impact |
|---------|--------|
| Server-first rendering | Minimal client JS for data-display pages |
| `Promise.all()` for parallel fetches | No sequential waterfall on data-heavy pages |
| `next/dynamic` for VehicleMap | ~726 line component + Mapbox lib not in initial bundle |
| `next/image` with responsive `sizes` | Proper srcset generation |
| `next/font/google` with swap | Font display optimization |
| CSS-only animations | No JS animation overhead |
| Skeleton loading states | Instant visual feedback |
| Suspense around useSearchParams | Prevents full-page client rendering |
| Debounced PlacesAutocomplete (250ms) | Reduces API calls |

### What Needs Improvement

| Issue | Impact | Fix |
|-------|--------|-----|
| **Large client components** | `ai-chat.tsx` (1583 lines), `command-bar.tsx` (1466 lines), `home-ai.tsx` (976 lines) ship heavy JS | Split into smaller sub-components, lazy-load AI features |
| **30-second notification polling** | Constant network traffic even when idle | Replace with Server-Sent Events or WebSocket |
| **No React.memo / useMemo** | Lists re-render fully on parent state changes | Add memoization to vehicle cards and review cards |
| **Client-side data fetching in useEffect** | Creates client-side waterfall for ProfileForm, ReviewList, PickupPointSelector, PriceDropAlert | Pass data as props from server component |
| **No cache strategy** | No `unstable_cache`, `revalidatePath`, or `revalidateTag` | Add Next.js caching for frequently-read data |
| **Inline SVG icons everywhere** | Duplicated SVGs across components increase bundle | Extract to shared icon component or SVG sprite |
| **Google Maps script injection** | Manual `<script>` tag, blocks on first use | Preload or use `next/script` with strategy |
| **No prefetching** | Link prefetching relies on Next.js defaults | Add explicit `<Link prefetch>` for high-traffic routes |

---

## Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--brand` | `#FF4D00` | Primary orange |
| `--brand-hover` | `#E64500` | Hover state |
| `--brand-light` | `#FFF1EB` | Light backgrounds |
| `--surface` | `#FAFAF8` | Page background |
| `--surface-dark` | `#0D0D0D` | Dark mode surface |
| `--text-primary` | `#1A1A1A` | Headings |
| `--text-secondary` | `#6B6B6B` | Body text |
| `--text-tertiary` | `#999999` | Muted text |
| `--border` | `#E8E6E1` | Default borders |
| `--border-subtle` | `#F0EFEC` | Subtle borders |

### Typography

| Font | Family | Usage |
|------|--------|-------|
| DM Sans | `var(--font-sans)` | Body text, UI elements |
| Bricolage Grotesque | `var(--font-display)` | Headings, hero text |

### Custom Utility Classes

| Class | Purpose |
|-------|---------|
| `card-hover` | Lift + shadow transition on hover |
| `img-zoom` | Scale image on group hover |
| `noise-bg` | SVG noise texture overlay |
| `glass` / `glass-dark` | Backdrop blur effects |
| `stagger-1` through `stagger-6` | Staggered animation delays |
| Custom scrollbar | Light/dark scrollbar styling |

### Responsive Breakpoints

Uses Tailwind defaults: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px).

Mobile-first approach with:
- `MobileFilterSheet` for vehicle filters on small screens
- Hamburger sidebar in dashboard
- Responsive grid layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

---

## Accessibility Assessment

### What's Implemented

| Feature | Component |
|---------|-----------|
| ARIA labels | Interactive buttons, navigation links |
| `role="combobox"` + `role="listbox"` | CustomSelect |
| Keyboard navigation | CommandBar (arrow keys, enter, escape) |
| Screen reader text | Star ratings (`aria-label`) |
| Focus management | Modal dialog |
| `alt` text on images | VehicleCard |

### What's Missing

| Gap | Impact |
|-----|--------|
| No skip-to-content link | Screen reader users must tab through nav |
| Color contrast on `--text-tertiary` (#999) | Fails WCAG AA on white background (4.0:1 ratio, needs 4.5:1) |
| No `aria-live` regions | Toast notifications not announced to screen readers |
| Map is not accessible | No text alternative for vehicle map markers |
| No keyboard shortcuts listed | Command bar keyboard shortcuts not discoverable |
| Review star input not keyboard-friendly | Click-only star selection |
| No focus indicator customization | Default browser focus rings may be invisible on some themes |

---

## Frontend Scalability

### Current Limitations

1. **Polling-based notifications** — 30s polling doesn't scale with many concurrent users. Each connected user sends 2 requests/minute just for notifications.

2. **Large monolithic components** — ai-chat.tsx (1583 lines) and command-bar.tsx (1466 lines) can't be incrementally loaded. The entire AI chat widget must be downloaded before it's interactive.

3. **No code splitting beyond pages** — Only VehicleMap uses dynamic import. AI components, form components, and dashboard components are all eagerly loaded within their page bundles.

4. **No optimistic updates** — All mutations wait for server response before updating UI. This creates perceived latency for actions like marking notifications as read or toggling price alerts.

5. **No offline support** — No service worker, no offline caching. App is completely unusable without network.

### Production-Grade Improvements

| Priority | Improvement | Impact |
|----------|-------------|--------|
| High | Replace polling with SSE for notifications | 60x fewer requests for notifications |
| High | Split large components (AI chat, command bar) | Smaller initial bundles, faster page loads |
| High | Add optimistic updates for common actions | Perceived instant UI response |
| Medium | Dynamic import AI features on interaction | Don't load AI code until user engages |
| Medium | Add `useTransition` for filter changes | Non-blocking UI updates during search |
| Medium | Implement virtual scrolling for vehicle lists | Handle 1000+ results without DOM bloat |
| Low | Add service worker for offline browsing | Cache vehicle data for flaky connections |
| Low | Add `<Link prefetch>` for dashboard routes | Pre-load likely next pages |
