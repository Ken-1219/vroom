# Request Flow Analysis

## Complete End-to-End Request Traces

This document traces every major user action through the complete system stack.

---

## 1. Authentication Flow

### Google OAuth Login

```
USER ACTION: Click "Sign in with Google"
    │
    ▼
[login-form.tsx] (Client Component)
    │ Calls server action: loginWithGoogle()
    │
    ▼
[login/actions.ts] (Server Action)
    │ signIn("google", { redirectTo: "/" })
    │
    ▼
[NextAuth v5] (/api/auth/[...nextauth]/route.ts)
    │ Redirects to Google OAuth consent screen
    │
    ▼
[Google OAuth]
    │ User grants consent → callback to /api/auth/callback/google
    │
    ▼
[NextAuth Callbacks]
    │
    ├── jwt callback:
    │   │ Lookup user by email in DB
    │   │ (db.select().from(users).where(eq(users.email, token.email)))
    │   │ Set token.role = dbUser.role
    │   │ Set token.sub = dbUser.id (stable DB user ID)
    │   └── Return JWT with id, email, name, role
    │
    ├── session callback:
    │   │ session.user.id = token.sub
    │   │ session.user.role = token.role
    │   └── Return session
    │
    └── Set httpOnly cookie with JWT (12-hour expiry)
    │
    ▼
[Browser] Redirect to "/"
    │ Cookie is now set for all subsequent requests
    │
    ▼
[middleware.ts] (on every subsequent request)
    │ Reads session token from cookie
    │ Verifies JWT → attaches user context
    │ Allows request to proceed
```

### Demo Login (Credentials)

```
USER ACTION: Select demo account (e.g., "Renter")
    │
    ▼
[login-form.tsx] useActionState → loginWithCredentials(formData)
    │
    ▼
[login/actions.ts] signIn("credentials", { email, password })
    │
    ▼
[NextAuth authorize callback]
    │ Match against 6 hardcoded demo accounts:
    │ - renter@vroom.demo / renter123 (role: renter)
    │ - host@vroom.demo / host123 (role: host)
    │ - admin@vroom.demo / admin123 (role: admin)
    │ - fleet@vroom.demo / fleet123 (role: host)
    │ - renter.us@vroom.demo / renter123 (role: renter)
    │ - renter.eu@vroom.demo / renter123 (role: renter)
    │
    ▼
[Same JWT/session flow as OAuth]
```

### MCP Bearer Token Auth

```
AI ASSISTANT: Calls POST /api/mcp/auth { email, password }
    │
    ▼
[/api/mcp/auth/route.ts]
    │ Validate against same demo accounts
    │ Sign JWT using jose: HS256, AUTH_SECRET, 30-day expiry
    │ Return { token, expiresIn, user }
    │
    ▼
[MCP Server stores token as VROOM_API_KEY]
    │
    ▼
[Subsequent MCP requests]
    │ Authorization: Bearer <token>
    │
    ▼
[middleware.ts]
    │ bearerAuth() → jose.jwtVerify(token, AUTH_SECRET)
    │ Extracts sub, email, name, role
    └── Request proceeds with user context
```

---

## 2. Vehicle Search Flow

```
USER ACTION: Navigate to /vehicles?city=Bangalore&vehicleType=suv
    │
    ▼
[middleware.ts]
    │ Public GET route → skip auth
    │ Rate limit check (general: 60/60s)
    │ Add security headers
    │
    ▼
[vehicles/page.tsx] (Server Component)
    │ const searchParams = await searchParams
    │ Parse: city, vehicleType, fuelType, transmission, 
    │        maxPrice, startDate, endDate, sort, page
    │
    ▼
[vehicleService.search(params)]
    │
    ├── Build WHERE conditions:
    │   │ vehicles.status = "listed"
    │   │ AND vehicles.city ILIKE "%Bangalore%"
    │   │ AND vehicles.vehicleType = "suv"
    │   │
    │   ├── If dates provided:
    │   │   AND NOT EXISTS (
    │   │     SELECT 1 FROM bookings
    │   │     WHERE vehicle_id = vehicles.id
    │   │     AND status IN ('pending','confirmed','active')
    │   │     AND start_date < endDate AND end_date > startDate
    │   │   )
    │   │   AND NOT EXISTS (
    │   │     SELECT 1 FROM vehicle_availability
    │   │     WHERE vehicle_id = vehicles.id
    │   │     AND start_date < endDate AND end_date > startDate
    │   │   )
    │   │
    │   └── If lat/lng provided:
    │       AND earth_box(ll_to_earth(lat, lng), radiusKm*1000)
    │           @> ll_to_earth(vehicles.latitude, vehicles.longitude)
    │
    ├── Execute in parallel:
    │   Promise.all([
    │     db.select().from(vehicles).where(conditions).orderBy(sort).limit(20).offset(page*20),
    │     db.select({count: count()}).from(vehicles).where(conditions)
    │   ])
    │
    └── Return { vehicles, total, page, limit }
    │
    ▼
[vehicles/page.tsx] Render results
    │ Pass to <VehiclesContent vehicles={results.vehicles} />
    │          <VehicleFilters />
    │
    ▼
[Browser] HTML with vehicle cards, filters, pagination
```

### Natural Language Search Variant

```
USER ACTION: Types "cheap automatic car in Mumbai" in NL search bar
    │
    ▼
[nl-search-bar.tsx] POST /api/nl-search { query: "cheap automatic car in Mumbai" }
    │
    ▼
[middleware.ts] AI rate limit (10/60s)
    │
    ▼
[/api/nl-search/route.ts]
    │
    ├── Check Redis cache: nl-search:{hash("cheap automatic car in mumbai")}
    │   └── Cache HIT → Return cached filters immediately
    │
    ├── Cache MISS:
    │   ├── Call Groq: groq("llama-3.3-70b-versatile").generateText({
    │   │     system: "Extract vehicle search filters...",
    │   │     prompt: "cheap automatic car in Mumbai"
    │   │   })
    │   │
    │   ├── LLM returns: {
    │   │     city: "Mumbai",
    │   │     transmission: "automatic",
    │   │     maxPrice: 150000,
    │   │     sortBy: "price"
    │   │   }
    │   │
    │   └── Cache in Redis (TTL: 1 hour)
    │
    └── Return structured filters
    │
    ▼
[nl-search-bar.tsx]
    │ Apply filters to URL: router.push("/vehicles?city=Mumbai&transmission=automatic&maxPrice=150000&sort=price")
    │
    ▼
[Same vehicle search flow as above]
```

---

## 3. Complete Booking Flow

```
USER ACTION: Click "Book Now" on vehicle detail page
    │
    ▼
[vehicles/[id]/book/page.tsx] (Server Component)
    │ auth() → verify authenticated
    │ vehicleService.getById(id) → fetch vehicle data
    │ Pass to <BookingForm vehicle={vehicle} />
    │
    ▼
[booking-form.tsx] (Client Component, Step 1: "form")
    │ User selects:
    │   - Start date, end date
    │   - Protection plan (basic/standard/premium)
    │   - Pickup point or custom address
    │   - Promo code (optional)
    │
    ├── On date change: POST /api/pricing/estimate
    │   → pricingService.calculateEstimate()
    │   → Return price breakdown (displayed in PriceBreakdown component)
    │
    ├── On promo code: POST /api/promo { code, subtotalPaise }
    │   → Validate against 4 hardcoded codes
    │   → Return discount amount
    │
    └── On submit: POST /api/bookings
    │
    ▼
[/api/bookings/route.ts] POST handler
    │
    ├── Auth: session or bearer token
    ├── Validate: createBookingSchema (Zod)
    ├── resolveUserId() → stable DB user ID
    ├── Auto-insert user if first booking (upsert by email)
    │
    ├── Auto-expire stale pending bookings (>15 min, same vehicle)
    │   db.update(bookings).set({status: "cancelled"})
    │     .where(renterId AND vehicleId AND status="pending" AND age>15min)
    │
    ├── vehicleService.getById(vehicleId) → get vehicle + hostId
    ├── pricingService.calculateEstimate() → compute total
    │
    ├── bookingService.create(input, renterId, hostId)
    │   │
    │   └── ATOMIC SQL:
    │       INSERT INTO bookings (...)
    │       SELECT ... WHERE NOT EXISTS (
    │         overlapping bookings for same vehicle
    │       ) AND NOT EXISTS (
    │         blocked availability periods
    │       )
    │       RETURNING *
    │       
    │       If rows returned = 0 → "Vehicle unavailable for these dates"
    │
    ├── registerEventHandlers() (idempotent)
    ├── emitEvent("booking.created", { bookingId, vehicleId, renterId, hostId })
    │   │
    │   ├── INSERT INTO outbox_events (persist)
    │   └── after() → eventBus.publish("booking.created")
    │       └── Handler: notificationService.send(hostId, "New booking request!")
    │
    └── Return 201 { booking }
    │
    ▼
[booking-form.tsx] (Step 2: "payment")
    │
    ├── POST /api/payments/create-order { bookingId }
    │   │
    │   ├── Verify: booking exists, user is renter, status is "pending"
    │   ├── Check: no existing captured payment (409 if duplicate)
    │   ├── Amount cap: 50,000,000 paise (₹5,00,000)
    │   │
    │   ├── paymentService.createOrder(bookingId, amount, currency, userId)
    │   │   ├── Check idempotency: return existing pending payment if found
    │   │   ├── razorpay.orders.create({ amount, currency, receipt: bookingId })
    │   │   ├── INSERT INTO payments (type: "charge", status: "pending")
    │   │   └── Return { orderId }
    │   │
    │   └── Return { orderId, amount, currency, key: NEXT_PUBLIC_RAZORPAY_KEY_ID }
    │
    ├── openRazorpayCheckout({ key, amount, currency, order_id, ... })
    │   │
    │   └── [Razorpay Checkout SDK opens payment modal]
    │       User completes UPI / Card / Netbanking payment
    │       On success: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
    │
    └── POST /api/payments/verify { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature }
        │
        ├── paymentService.capturePayment()
        │   ├── Verify HMAC-SHA256 signature (crypto.timingSafeEqual)
        │   ├── UPDATE payments SET status = "captured"
        │   └── Return payment record
        │
        ├── UPDATE bookings SET status = "confirmed", version = version + 1
        │   WHERE id = bookingId AND version = current_version
        │
        ├── INSERT INTO booking_events (type: "confirmed")
        │
        ├── emitEvent("booking.confirmed")
        │   └── Handlers:
        │       ├── Generate 6-digit OTP → UPDATE bookings SET pickupOtp
        │       ├── notificationService.send(renterId, "Booking confirmed!")
        │       ├── sendEmail(renter, bookingConfirmedEmail)
        │       └── sendEmail(renter, confirmationEmail) [duplicate via ses.ts]
        │
        └── Return { success: true, status: "confirmed" }
    │
    ▼
[Browser] Redirect to /bookings/{id}/confirmation
```

### Razorpay Webhook (Parallel Path)

```
[Razorpay Server] → POST /api/payments/webhook
    │
    ├── Verify x-razorpay-signature (HMAC-SHA256)
    │
    ├── paymentService.handleWebhookEvent("payment.captured", payload)
    │   ├── Extract payment_id from payload
    │   ├── UPDATE payments SET status = "captured", method = fetched_method
    │   │   WHERE gateway_reference = order_id
    │   │
    │   ├── UPDATE bookings SET status = "confirmed"
    │   │   WHERE id = bookingId AND status = "pending"
    │   │   (guard: only if still pending — may already be confirmed by verify route)
    │   │
    │   ├── INSERT booking_event (type: "payment_captured")
    │   │
    │   └── emitEvent("payment.captured")
    │       └── Handler: notificationService.send + email
    │
    └── Return 200 OK (always, even on error)
```

---

## 4. Trip Lifecycle Flow

```
USER ACTION: Host clicks "Start Trip" on booking detail
    │
    ▼
[start-trip-button.tsx] (Client Component)
    │ Step 1: Show OTP input → Host enters 6-digit OTP from renter
    │ Step 2: Show InspectionForm → Host fills pre-inspection
    │         (photos, damage notes, odometer, fuel level)
    │
    └── POST /api/trips {
          bookingId, odometer: 45000, fuelLevel: 0.85,
          preInspection: { exterior: "good", interior: "good", ... }
        }
    │
    ▼
[/api/trips/route.ts]
    │ Validate: startTripSchema
    │
    ▼
[tripService.start()]
    │
    ├── Verify booking exists and status = "confirmed"
    ├── Verify caller is the host
    ├── Check no existing trip for this booking
    │
    ├── INSERT INTO trips (bookingId, status: "active", startOdometer, startFuelLevel, preInspection)
    ├── UPDATE bookings SET status = "active", version++
    │
    ├── emitEvent("trip.started")
    │   └── Handler: notify renter (in-app + email)
    │
    └── Return 201 { trip }
    │
    ▼
[DURING TRIP: GPS Tracking]
    │
    ├── Browser geolocation API → 
    │   POST /api/trips/{id}/... with { latitude, longitude, speed, heading, recordedAt }
    │   → tripService.addLocation()
    │   → INSERT INTO trip_locations
    │
    └── [trips/[id]/page.tsx] 
        │ EventSource → GET /api/trips/{id}/live (SSE endpoint)
        │
        ▼
    [/api/trips/[id]/live/route.ts]
        │ Verify auth + role (renter, host, or admin)
        │ Create ReadableStream:
        │   - Send "trip-info" event (initial data)
        │   - Every 3 seconds: poll trip_locations, send latest
        │   - Every 15 seconds: send heartbeat
        │   - If trip.status = "completed": send "trip-completed", close
        │   - On client disconnect: close stream
    │
    ▼
[USER ACTION: Host clicks "Complete Trip"]
    │
    ▼
[complete-trip-form.tsx]
    │ InspectionForm → post-inspection (odometer, fuel, photos)
    │
    └── PATCH /api/trips/{id} {
          odometer: 45350, fuelLevel: 0.70,
          postInspection: { exterior: "minor scratch", ... }
        }
    │
    ▼
[tripService.complete()]
    │
    ├── Verify trip exists and status = "active"
    ├── Verify caller is the host
    │
    ├── UPDATE trips SET status = "completed", actualEnd, endOdometer, endFuelLevel, postInspection
    ├── UPDATE bookings SET status = "completed", version++
    │
    ├── emitEvent("trip.completed")
    │   └── Handlers:
    │       ├── Notify renter (in-app + email)
    │       └── Trust score: +0.02 to both renter and host
    │
    └── Return updated trip
```

---

## 5. AI Chat Flow (with Tool Calling)

```
USER ACTION: Types "Find me a cheap SUV in Bangalore for this weekend"
    │
    ▼
[ai-chat.tsx] useChat hook → POST /api/chat
    │ Body: { messages: [{ role: "user", content: "Find me a cheap SUV..." }],
    │         latitude: 12.97, longitude: 77.59 }
    │
    ▼
[middleware.ts] AI rate limit (10/60s)
    │
    ▼
[/api/chat/route.ts]
    │
    ├── Build system prompt (dynamic):
    │   "You are Vroom AI. Today is 2026-05-16.
    │    User: Mohit (renter). Recent bookings: [...]
    │    Available cities: Bangalore (45), Mumbai (30), ...
    │    User location: 12.97, 77.59"
    │
    ├── Register 3 tools: searchVehicles, getVehicleInfo, manageBookings
    │
    ├── Call: streamText({
    │     model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    │     system: systemPrompt,
    │     messages: messages,
    │     tools: { searchVehicles, getVehicleInfo, manageBookings },
    │     stopWhen: stepCountIs(5)
    │   })
    │
    ├── STEP 1: LLM decides to call searchVehicles tool
    │   │ Tool args: { city: "Bangalore", vehicleType: "suv", maxPricePerDay: 200000, limit: 5 }
    │   │
    │   └── vehicleService.search({
    │         city: "Bangalore", vehicleType: "suv",
    │         maxPrice: 200000, sort: "price", limit: 5
    │       })
    │       → Returns 5 SUVs in Bangalore under ₹2000/day
    │       → Tool result sent back to LLM
    │
    ├── STEP 2: LLM generates text response incorporating search results
    │   "I found 5 affordable SUVs in Bangalore for this weekend! Here are the best options:
    │    1. Hyundai Creta - ₹1,200/day ⭐ 4.5
    │    2. Tata Harrier - ₹1,500/day ⭐ 4.3 ..."
    │
    └── Stream response via toUIMessageStreamResponse()
    │
    ▼
[ai-chat.tsx] 
    │ useChat processes stream → updates messages state
    │ Renders: text response + ChatVehicleCard components for each vehicle
    │
    ▼
[Browser] User sees conversational response with vehicle cards
```

---

## 6. Notification Flow

```
[Event Handler triggers notification]
    │
    ▼
[notificationService.send({
    userId, type: "booking_confirmed",
    title: "Booking Confirmed!",
    body: "Your booking #abc has been confirmed.",
    channel: "in_app", data: { bookingId: "abc" }
  })]
    │
    ├── INSERT INTO notifications (userId, type, title, body, channel, data, read: false)
    │
    ├── If channel = "email":
    │   ├── Look up user email
    │   └── sendEmail(email, subject: title, html: body)
    │       → Resend API → User's inbox
    │
    └── Return notification record
    │
    ▼
[notification-bell.tsx] (Client Component, polling)
    │ Every 30 seconds: GET /api/notifications?limit=1
    │
    ▼
[/api/notifications/route.ts]
    │ notificationService.getByUser(userId, limit: 1, offset: 0)
    │ → Promise.all([
    │     db.select().from(notifications).where(userId).orderBy(desc(createdAt)).limit(1),
    │     db.select({count}).from(notifications).where(userId, read: false)
    │   ])
    │ → Return { notifications: [...], unreadCount: 3 }
    │
    ▼
[notification-bell.tsx]
    │ Update badge count (3)
    │ User clicks bell → Show notification-panel.tsx
    │ User clicks notification → PATCH /api/notifications/{id}
    │   → notificationService.markRead(id, userId)
    │   → UPDATE notifications SET read = true WHERE id AND userId
```

---

## 7. MCP Flow

```
AI ASSISTANT: "Book a car in Mumbai for tomorrow"
    │
    ▼
[MCP Host (Claude Desktop)] Invokes tool: create_booking
    │ args: { vehicleId: "e1-mum-001", startDate: "2026-05-17", endDate: "2026-05-18" }
    │
    ▼
[vroom-mcp server] (stdio transport)
    │
    ├── Check VROOM_API_KEY is set
    ├── normalizeDate("2026-05-17") → "2026-05-17T00:00:00Z"
    │
    └── vroomFetch("POST", "/api/bookings", {
          vehicleId: "e1-mum-001",
          startDate: "2026-05-17T00:00:00Z",
          endDate: "2026-05-18T00:00:00Z"
        }, { Authorization: "Bearer <VROOM_API_KEY>" })
    │
    ▼
[middleware.ts]
    │ Bearer auth → jwtVerify → extract user context
    │ Rate limit check
    │
    ▼
[/api/bookings/route.ts] POST
    │ (Same flow as browser booking)
    │ resolveUserId → bookingService.create → emitEvent
    │
    ▼
[vroom-mcp server]
    │ Format response:
    │ "Booking created! 🚗
    │  ID: c0000050
    │  Status: pending
    │  Dates: May 17 - May 18, 2026
    │  Total: ₹1,200
    │  View: http://localhost:3000/bookings/c0000050"
    │
    ▼
[AI ASSISTANT] Shows formatted confirmation to user
```

---

## 8. Outbox Processing Flow

```
[emitEvent("booking.created", payload)]
    │
    ├── Step 1: PERSIST (synchronous, within request)
    │   INSERT INTO outbox_events (
    │     eventType: "booking.created",
    │     payload: { bookingId, vehicleId, renterId, hostId },
    │     status: "pending",
    │     attempts: 0
    │   )
    │
    ├── Step 2: PROCESS INLINE (async, via next/server after())
    │   │
    │   ├── eventBus.publish("booking.created", payload)
    │   │   └── All handlers run concurrently (Promise.allSettled)
    │   │       ├── notificationService.send(hostId, ...) → SUCCESS
    │   │       └── (any handler that fails)
    │   │
    │   ├── If all succeed:
    │   │   UPDATE outbox_events SET status = "processed", processedAt = now()
    │   │
    │   └── If any fail:
    │       ├── Retry up to 2 times (exponential backoff: 1s, 2s)
    │       ├── If retry succeeds: status = "processed"
    │       └── If retry fails: leave as "pending" for cron pickup
    │
    └── Step 3: CRON FALLBACK (daily at midnight)
        │
        └── GET /api/cron/process-outbox (Authorization: Bearer CRON_SECRET)
            │
            ├── processOutbox()
            │   SELECT * FROM outbox_events
            │   WHERE status = "pending"
            │   AND process_after <= now()
            │   ORDER BY created_at
            │   LIMIT 50
            │
            ├── For each event:
            │   ├── eventBus.publish(eventType, payload)
            │   │
            │   ├── Success:
            │   │   UPDATE SET status = "processed", processedAt = now()
            │   │
            │   └── Failure:
            │       attempts++
            │       If attempts >= 5:
            │         UPDATE SET status = "failed", lastError = error.message
            │       Else:
            │         UPDATE SET process_after = now() + (30s × 2^attempts)
            │
            └── Return { processed: N, failed: M }
```

---

## 9. Payment Cancellation & Refund Flow

```
USER ACTION: Click "Cancel Booking" on booking detail
    │
    ▼
[cancel-booking-button.tsx]
    │ Confirm dialog → "Are you sure?"
    │
    └── PATCH /api/bookings/{id} { action: "cancel", reason: "Change of plans" }
    │
    ▼
[/api/bookings/[id]/route.ts] PATCH
    │ Validate: bookingActionSchema
    │ Auth: must be renter, host, or admin
    │
    ▼
[bookingService.cancel(bookingId, cancelledBy, reason)]
    │
    ├── Fetch booking (must be pending or confirmed)
    ├── Calculate refund: pricingService.getCancellationRefund(totalAmount, hoursUntilStart)
    │   │
    │   └── e.g., 36 hours until start → 75% refund → refundAmount = totalAmount × 0.75
    │
    ├── UPDATE bookings SET
    │     status = "cancelled",
    │     cancellationReason = "Change of plans",
    │     cancelledBy = userId,
    │     cancelledAt = now(),
    │     version = version + 1
    │   WHERE id = bookingId AND version = currentVersion
    │
    ├── INSERT booking_event (type: "cancelled", data: { reason, refundAmount })
    │
    └── emitEvent("booking.cancelled", { bookingId, reason, refundAmount })
    │
    ▼
[Event Handlers]
    │
    ├── If refundAmount > 0:
    │   paymentService.processRefund(bookingId, refundAmount, reason)
    │   │
    │   ├── Find captured payment for booking
    │   ├── razorpay.payments.refund(paymentId, { amount: refundAmount })
    │   ├── INSERT INTO payments (type: "refund", status: "captured", amount: refundAmount)
    │   │
    │   └── emitEvent("payment.refunded")
    │       └── Handler: notify renter (in-app + email)
    │
    ├── notificationService.send(renterId, "Booking cancelled")
    ├── notificationService.send(hostId, "Booking cancelled by renter")
    ├── sendEmail(renter, bookingCancelledEmail)
    │
    └── trustScoreService.applyScoreDelta(cancelledBy, -penalty)
        │ -0.10 if <24h before start
        │ -0.05 otherwise
        └── UPDATE users SET trustScore = clamped(score + delta)
```

---

## 10. Host Payout Flow

```
HOST ACTION: Navigate to /dashboard/host/earnings
    │
    ▼
[dashboard/host/earnings/page.tsx] (Server Component)
    │ auth() → verify host role
    │ payoutService.calculateHostEarnings(hostId, periodStart, periodEnd)
    │ payoutService.getByHost(hostId)
    │
    ├── calculateHostEarnings:
    │   ├── Find completed bookings in period
    │   ├── Sum captured charges - sum refunds = grossEarnings
    │   ├── platformFee = gross × 15%
    │   ├── netEarnings = gross - platformFee
    │   └── Return { gross, platformFee, net, bookingCount }
    │
    └── Render earnings page with payout history
    │
    ▼
HOST ACTION: Click "Request Payout"
    │
    └── POST /api/payouts { periodStart: "2026-04-01", periodEnd: "2026-04-30" }
    │
    ▼
[payoutService.createPayout(hostId, start, end)]
    │ INSERT INTO payouts (hostId, amount, platformFee, netAmount, bookingIds, status: "pending")
    │ Return payout record
    │
    ▼
ADMIN ACTION: Process payout
    │
    └── POST /api/payouts/{id}/process { fundAccountId? }
    │
    ▼
[payoutService.processPayout(payoutId, fundAccountId)]
    │
    ├── UPDATE payouts SET status = "processing"
    │
    ├── POST https://api.razorpay.com/v1/payouts {
    │     fund_account_id, amount: netAmount, currency: "INR",
    │     mode: "NEFT", queue_if_low_balance: true
    │   }
    │
    ├── UPDATE payouts SET gatewayReference = razorpayPayoutId
    │
    └── On Razorpay callback:
        POST /api/payouts/webhook (signature verified)
        │
        ├── payout.processed → UPDATE payouts SET status = "completed", processedAt
        ├── payout.reversed → UPDATE payouts SET status = "failed"
        └── payout.failed → UPDATE payouts SET status = "failed"
```
