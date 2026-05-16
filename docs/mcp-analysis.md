# MCP (Model Context Protocol) Analysis

## Overview

Vroom implements a **custom MCP server** (`@vroom/mcp-server`) that exposes the car rental platform as a set of AI-consumable tools. This allows AI assistants (Claude Desktop, Claude Code, etc.) to search vehicles, manage bookings, and get pricing — all through natural language.

**Key architectural decision:** The MCP server is a **thin API proxy** with zero business logic. It translates MCP tool calls into HTTP requests against the Next.js API, formats responses as human-readable text, and handles auth gating. All actual validation and business rules live in the backend.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     AI Assistant (Host)                       │
│               (Claude Desktop / Claude Code)                 │
└────────────────────────┬─────────────────────────────────────┘
                         │ stdio (stdin/stdout)
                         │ JSON-RPC over MCP protocol
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  MCP Server (vroom-mcp)                       │
│                                                              │
│  packages/mcp-server/src/index.ts                            │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ Tool Router  │  │ Auth Gate    │  │ Response Formatters │ │
│  │ (8 tools)    │  │ (API key)    │  │ (text output)       │ │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘ │
│         │                │                      │            │
│         └────────────────┼──────────────────────┘            │
│                          │                                   │
│              vroomFetch() helper                             │
│         (HTTP + Bearer token auth)                           │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP/HTTPS
                         │ Authorization: Bearer <VROOM_API_KEY>
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              Next.js API Routes (Backend)                     │
│          /api/vehicles/search, /api/bookings, etc.           │
└──────────────────────────────────────────────────────────────┘
```

---

## Transport Layer

| Property | Value |
|----------|-------|
| **Transport** | `StdioServerTransport` (stdin/stdout) |
| **Protocol** | JSON-RPC over MCP |
| **Launch** | Child process spawned by AI host |
| **Binary** | `vroom-mcp` (via `bin` field in package.json) |
| **Runtime** | Node.js >= 18, ESM |
| **SDK** | `@modelcontextprotocol/sdk` ^1.29.0 |

**Why stdio over HTTP/SSE?** Stdio transport is the standard for local MCP servers. It avoids port conflicts, TLS complexity, and network exposure. The server runs as a subprocess of the AI assistant, making it inherently single-tenant and tied to the host process lifecycle.

**File:** `packages/mcp-server/src/index.ts` (lines ~1-15)

```
const server = new McpServer({ name: "vroom", version: "0.1.0" });
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Authentication Model

| Variable | Purpose | Default |
|----------|---------|---------|
| `VROOM_BASE_URL` | API endpoint | `http://localhost:3000` | `https://vroom-cars.vercel.app` |
| `VROOM_API_KEY` | Bearer token for auth | Required for write ops |

### Auth Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ User runs    │     │ MCP server   │     │ POST             │
│ POST         │────▶│ reads        │────▶│ /api/mcp/auth    │
│ /api/mcp/auth│     │ VROOM_API_KEY│     │ returns JWT      │
└─────────────┘     └──────────────┘     └─────────────────┘
```

### Token Acquisition

The token is obtained by calling `POST /api/mcp/auth` on the backend, which issues a JWT. This JWT is set as `VROOM_API_KEY` environment variable before launching the MCP server.

### Auth Gating Rules

| Category | Tools | Auth Required |
|----------|-------|---------------|
| **Read-only** | `search_vehicles`, `get_vehicle`, `get_price_estimate`, `get_cities` | No |
| **Write/Personal** | `create_booking`, `get_my_bookings`, `get_booking`, `cancel_booking` | Yes |

Write tools check `if (!API_KEY)` before making HTTP calls and return `isError: true` with the hint: `"Get your token from POST /api/mcp/auth"`.

---

## Registered Tools (8 Total)

### Tool Registry Table

| # | Tool Name | Method | Endpoint | Auth | Purpose |
|---|-----------|--------|----------|------|---------|
| 1 | `search_vehicles` | GET | `/api/vehicles/search` | No | Find available vehicles by filters |
| 2 | `get_vehicle` | GET | `/api/vehicles/{id}` | No | Get vehicle details |
| 3 | `get_price_estimate` | POST | `/api/pricing/estimate` | No | Calculate rental pricing |
| 4 | `create_booking` | POST | `/api/bookings` | Yes | Create a new booking |
| 5 | `get_my_bookings` | GET | `/api/bookings` | Yes | List user's bookings |
| 6 | `get_booking` | GET | `/api/bookings/{id}` | Yes | Get booking details |
| 7 | `cancel_booking` | PATCH | `/api/bookings/{id}` | Yes | Cancel a booking |
| 8 | `get_cities` | GET | `/api/cities` | No | List available cities |

---

### Tool 1: `search_vehicles`

**File:** `packages/mcp-server/src/index.ts`

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `city` | string | No | City name filter |
| `vehicleType` | enum | No | sedan/suv/hatchback/luxury/ev/mpv |
| `fuelType` | enum | No | petrol/diesel/electric/hybrid/cng |
| `transmission` | enum | No | manual/automatic |
| `startDate` | string | No | ISO date or YYYY-MM-DD |
| `endDate` | string | No | ISO date or YYYY-MM-DD |
| `maxPricePerDay` | number | No | Max price in **rupees** (converted to paise) |
| `limit` | number | No | Results limit (default 10, max 20) |

**Execution Flow:**
1. Assemble query parameters from tool arguments
2. Normalize dates: bare `YYYY-MM-DD` gets `T00:00:00Z` appended
3. Convert `maxPricePerDay` from rupees to paise (`* 100`)
4. Cap `limit` at 20: `Math.min(Number(args.limit ?? 10), 20)`
5. GET `/api/vehicles/search?{params}`
6. Format response as numbered list with ID, type, city, price/day, rating, trip count

**Response Format:**
```
Found 5 vehicles:

1. Toyota Camry (sedan)
   ID: abc-123
   City: Mumbai
   ₹1,200/day | ⭐ 4.5 | 23 trips
```

---

### Tool 2: `get_vehicle`

**Parameters:** `vehicleId` (string, required)

**Execution Flow:**
1. GET `/api/vehicles/{vehicleId}`
2. Format detailed view with make, model, year, type, fuel, transmission, seats, features, rules, location, rating, trip count

---

### Tool 3: `get_price_estimate`

**Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `vehicleId` | string | Yes |
| `startDate` | string | Yes |
| `endDate` | string | Yes |
| `protectionPlan` | enum | No (basic/standard/premium) |

**Execution Flow:**
1. Normalize dates
2. POST `/api/pricing/estimate` with `{ vehicleId, startDate, endDate, protectionPlan }`
3. Format breakdown showing base price, weekend surcharge, platform fee, insurance, taxes, total
4. All amounts converted from paise to rupees via `paise()` helper

**Response Format:**
```
Price Estimate for 3 days:
  Base price:        ₹3,600
  Weekend surcharge: ₹400
  Platform fee:      ₹200
  Insurance:         ₹300
  Tax (GST 18%):     ₹810
  ─────────────────────────
  Total:             ₹5,310
```

---

### Tool 4: `create_booking`

**Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `vehicleId` | string | Yes |
| `startDate` | string | Yes |
| `endDate` | string | Yes |
| `pickupAddress` | string | No |
| `dropoffAddress` | string | No |
| `protectionPlan` | enum | No |
| `notes` | string | No |

**Execution Flow:**
1. Check `API_KEY` — return error if missing
2. Normalize dates
3. POST `/api/bookings` with body
4. Format confirmation with booking ID, status, dates, total amount, deep link

**Response includes:** `{VROOM_BASE_URL}/bookings/{id}` deep link for browser access.

---

### Tool 5: `get_my_bookings`

**Parameters:** None  
**Auth:** Required  
**Flow:** GET `/api/bookings` → Format list of all user bookings with status, dates, vehicle info

---

### Tool 6: `get_booking`

**Parameters:** `bookingId` (string, required)  
**Auth:** Required  
**Flow:** GET `/api/bookings/{bookingId}` → Detailed booking view

---

### Tool 7: `cancel_booking`

**Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `bookingId` | string | Yes |
| `reason` | string | No |

**Cancellation Fee Schedule** (documented in tool description for LLM awareness):

| Timeframe | Fee |
|-----------|-----|
| > 48 hours before start | Free |
| 24-48 hours | 25% of total |
| 6-24 hours | 50% of total |
| < 6 hours | 100% of total |

**Flow:** PATCH `/api/bookings/{bookingId}` with `{ action: "cancel", reason }`

---

### Tool 8: `get_cities`

**Parameters:** None  
**Auth:** Not required  
**Flow:** GET `/api/cities` → List of supported cities with vehicle counts

---

## Formatting Helpers

| Function | Purpose | File |
|----------|---------|------|
| `paise(amount)` | Converts paise integers to `₹X,XXX` display strings (Indian locale) | `index.ts` |
| `normalizeDate(d)` | Appends `T00:00:00Z` to bare YYYY-MM-DD strings | `index.ts` |
| `formatVehicleList(data)` | Numbered list of vehicles with key metrics | `index.ts` |
| `formatVehicleDetail(data)` | Full vehicle details | `index.ts` |
| `formatPriceEstimate(data)` | Pricing breakdown table | `index.ts` |
| `formatBookingCreated(data)` | Booking confirmation with deep link | `index.ts` |
| `formatBookingList(data)` | List of user's bookings | `index.ts` |
| `formatBookingDetail(data)` | Detailed booking view | `index.ts` |

---

## Input Handling & Sanitization

- Parameters are explicitly coerced: `String(args.city)`, `Number(args.maxPricePerDay)`
- `limit` is client-side capped at 20 to prevent excessive API load
- Dates are normalized to ISO 8601 if provided as bare YYYY-MM-DD
- `maxPricePerDay` is converted from rupees to paise (×100) to match backend's paise-based pricing

---

## Error Handling

All tool execution is wrapped in try/catch:

```typescript
try {
  const res = await vroomFetch("/api/...");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { content: [{ type: "text", text: `Error: ${body.error || res.statusText}` }], isError: true };
  }
  // format and return
} catch (err) {
  return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
}
```

---

## Security Analysis

### What's Good

| Aspect | Detail |
|--------|--------|
| **Auth separation** | Write tools are gated; read tools are public (matches the web UI's behavior) |
| **No business logic** | Server is a proxy — can't introduce logic bugs or bypass backend validation |
| **Input coercion** | Explicit type conversion prevents type confusion |
| **Error containment** | Try/catch on every tool prevents crashes from propagating |
| **Limit capping** | Client-side `limit` cap of 20 prevents resource abuse |

### What's Dangerous

| Risk | Severity | Detail |
|------|----------|--------|
| **API key in environment** | Medium | `VROOM_API_KEY` is a long-lived bearer token stored as an env var. If the host machine is compromised, the token is exposed. No token rotation mechanism. |
| **No scope limitation** | Medium | The API key grants full access to the authenticated user's resources. There's no way to issue a read-only MCP token or limit which tools a specific token can access. |
| **No rate limiting at MCP layer** | Medium | An LLM making rapid tool calls can hammer the API. Rate limiting exists at the API layer (via Upstash), but the MCP server doesn't do any client-side throttling. |
| **Stdio transport = single tenant** | Low | Not a vulnerability per se, but the design assumes trusted local execution. If exposed over a network (not currently), the lack of TLS and per-request auth would be critical. |
| **No audit logging** | Low | MCP tool calls are not logged. In a production multi-user setup, there's no trail of which tools were invoked or what data was accessed. |

### What's Not Production-Ready

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **No token expiry/refresh** | Token works forever until manually rotated | Implement short-lived tokens with refresh flow |
| **No tool-level permissions** | All-or-nothing auth | Add scoped tokens (e.g., `read:vehicles`, `write:bookings`) |
| **No request correlation** | Can't trace MCP tool calls to API requests | Add `X-Request-ID` header from MCP to API |
| **No HTTP/SSE transport** | Can't be used remotely (e.g., from a cloud-hosted agent) | Add HTTP/SSE transport option alongside stdio |
| **No pagination** | `get_my_bookings` returns all bookings | Add cursor-based pagination to list tools |
| **No webhook/subscription** | MCP server can only poll; no push notifications | Add MCP resource subscriptions for booking status changes |
| **No caching** | Every tool call hits the API | Add in-memory TTL cache for city/vehicle data |

---

## Production-Grade Redesign

### Current vs. Ideal Architecture

```
CURRENT:
  AI Host ──stdio──▶ MCP Server ──HTTP──▶ Next.js API

IDEAL (Production):
  AI Host ──stdio/SSE──▶ MCP Gateway
                              │
                              ├── Auth middleware (JWT + scopes)
                              ├── Rate limiter (per-tool)
                              ├── Request logger (audit trail)
                              ├── Response cache (TTL by tool)
                              │
                              └──HTTP──▶ Internal API
                                          (not public-facing)
```

### Recommended Improvements

1. **Scoped tokens:** Issue tokens with granular permissions (`mcp:vehicles:read`, `mcp:bookings:write`)
2. **Token rotation:** 1-hour expiry with refresh tokens
3. **Dual transport:** Keep stdio for local; add HTTP/SSE for remote agents
4. **Per-tool rate limits:** `search_vehicles` → 30/min, `create_booking` → 5/min
5. **Audit logging:** Structured logs for every tool invocation (tool, params, user, timestamp)
6. **Response caching:** Cache `get_cities` for 1 hour, `get_vehicle` for 5 minutes
7. **Pagination support:** Add `cursor` parameter to list tools
8. **Health check tool:** Add a `ping` tool for connectivity testing
9. **Webhook transport:** Subscribe to booking status changes for proactive notifications

---

## Interview Explanation

### 2-Minute Version

> "We built an MCP server that lets AI assistants like Claude interact with our car rental platform through natural language. It exposes 8 tools — searching vehicles, getting prices, creating bookings, etc. The server uses stdio transport for local execution and acts as a thin HTTP proxy to our Next.js API. Authentication is via bearer tokens with a split between read-only tools (no auth needed) and write tools (token required). All business logic stays in the backend — the MCP server only handles protocol translation, parameter normalization (like converting rupees to paise), and response formatting."

### Common Interview Questions

**Q: Why MCP instead of a REST API for AI?**
> MCP provides a standardized tool-calling interface that AI assistants natively understand. Instead of the AI needing to know about HTTP methods, headers, and response parsing, it just calls a named tool with typed parameters. The MCP protocol handles serialization, error reporting, and tool discovery automatically.

**Q: Why is it a thin proxy instead of having its own logic?**
> Single source of truth. If we duplicated validation or business rules in the MCP server, we'd have two places to maintain and two places where bugs could hide. The backend already handles auth, validation, rate limiting, and business logic — the MCP server just needs to format inputs and outputs for LLM consumption.

**Q: How would you scale this for multiple concurrent users?**
> The current stdio transport is inherently single-tenant — one server per AI session. For multi-tenant, we'd add HTTP/SSE transport behind an API gateway with per-user auth and rate limiting. The MCP server is stateless, so it scales horizontally. The bottleneck shifts to the backend API, which already has Redis-based rate limiting.

**Q: What's the biggest security risk?**
> The long-lived API key. If compromised, it grants full access to the user's account through the MCP interface. The fix is short-lived JWT tokens with automatic refresh, plus scoped permissions so a read-only MCP session can't create bookings.
