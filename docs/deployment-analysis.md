# Deployment Analysis

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Repository                            │
│                     (main branch)                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Push / PR
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions CI                            │
│                                                                  │
│  1. Install pnpm                                                │
│  2. Setup Node.js 22 with pnpm cache                           │
│  3. pnpm install --frozen-lockfile                              │
│  4. Typecheck: pnpm -F web exec tsc --noEmit                   │
│  5. Lint: pnpm lint                                             │
│  6. Build: pnpm build                                           │
│  (NO TEST STEP)                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ On push to main
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel                                       │
│                                                                  │
│  Auto-deploy on push to main (production)                       │
│  Auto-deploy on PR (preview)                                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Vercel Build  │  │ Vercel       │  │ Vercel Cron        │    │
│  │ (next build)  │  │ Functions    │  │ (daily at midnight) │    │
│  │               │  │ (Fluid      │  │ /api/cron/          │    │
│  │ + env check   │  │  Compute)   │  │ process-outbox      │    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
     ┌──────────┐  ┌──────────────┐  ┌──────────┐
     │ Neon     │  │ Upstash      │  │ External │
     │ Postgres │  │ Redis        │  │ APIs     │
     │ (DB)     │  │ (Cache)      │  │ (Razorpay│
     └──────────┘  └──────────────┘  │  Groq,   │
                                     │  Resend)  │
                                     └──────────┘
```

---

## CI/CD Pipeline Detail

**File:** `.github/workflows/ci.yml`

### Pipeline Stages

| Stage | Command | Purpose | Duration |
|-------|---------|---------|----------|
| Checkout | `actions/checkout@v4` | Clone repo | ~5s |
| Install pnpm | `pnpm/action-setup@v4` | Install package manager | ~3s |
| Setup Node | `actions/setup-node@v4` (Node 22) | Runtime with pnpm cache | ~10s |
| Install deps | `pnpm install --frozen-lockfile` | Reproducible installs | ~30s |
| Typecheck | `pnpm -F web exec tsc --noEmit` | TypeScript validation | ~20s |
| Lint | `pnpm lint` | ESLint via Turborepo | ~15s |
| Build | `pnpm build` | Full production build | ~60s |

**Total estimated pipeline time:** ~2.5 minutes

### Concurrency Configuration

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Same-branch pushes cancel in-progress runs (saves CI minutes on rapid pushes).

### What's Missing from CI

| Missing Step | Impact |
|-------------|--------|
| **Tests** | No unit, integration, or e2e tests run |
| **Security scanning** | No `npm audit`, no Snyk, no CodeQL |
| **DB migrations** | Migrations not run or validated in CI |
| **Preview URL testing** | No smoke tests against Vercel preview deployments |
| **Bundle size check** | No tracking of JavaScript bundle growth |
| **Lighthouse CI** | No performance regression detection |

---

## Vercel Configuration

### `vercel.json`

```json
{
  "crons": [{
    "path": "/api/cron/process-outbox",
    "schedule": "0 0 * * *"
  }]
}
```

Single cron job: outbox processor runs daily at midnight UTC.

### `next.config.ts`

| Setting | Value | Purpose |
|---------|-------|---------|
| Sentry wrapping | `withSentryConfig()` | Error tracking + source maps |
| Source maps | Conditional on `SENTRY_AUTH_TOKEN` | Upload to Sentry for error context |
| Image domains | `images.unsplash.com`, `plus.unsplash.com` | Remote image optimization |
| Tunnel route | Not configured | Sentry requests go direct |

### Pre-build Environment Check

**File:** `apps/web/scripts/check-env.mjs`

Runs before `dev` and `build`. Categorizes env vars:

**Required (build fails):**
- `DATABASE_URL`
- `AUTH_SECRET`

**Recommended (warning only):**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RESEND_API_KEY`
- `GROQ_API_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `REDIS_URL`
- `NEXT_PUBLIC_SENTRY_DSN`

---

## Environment Variables

### Complete Environment Variable Map

| Variable | Where | Required | Purpose |
|----------|-------|----------|---------|
| `DATABASE_URL` | Server | Yes | Neon Postgres connection string |
| `AUTH_SECRET` | Server | Yes | NextAuth JWT signing secret |
| `AUTH_URL` | Server | No | NextAuth callback URL (default: inferred) |
| `GOOGLE_CLIENT_ID` | Server | Recommended | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Server | Recommended | Google OAuth |
| `GITHUB_ID` | Server | No | GitHub OAuth |
| `GITHUB_SECRET` | Server | No | GitHub OAuth |
| `RAZORPAY_KEY_ID` | Server | Recommended | Razorpay server-side |
| `RAZORPAY_KEY_SECRET` | Server | Recommended | Razorpay server-side |
| `RAZORPAY_WEBHOOK_SECRET` | Server | Recommended | Webhook signature verification |
| `RAZORPAY_DEFAULT_FUND_ACCOUNT_ID` | Server | No | Fallback payout fund account |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client | Recommended | Razorpay Checkout SDK |
| `RESEND_API_KEY` | Server | Recommended | Transactional email |
| `FROM_EMAIL` | Server | No | Email sender address |
| `RESEND_FROM_EMAIL` | Server | No | Legacy email sender address |
| `GROQ_API_KEY` | Server | Recommended | AI features (Llama models) |
| `GOOGLE_AI_API_KEY` | Server | No | Gemini (unused) |
| `CLOUDFLARE_AI_TOKEN` | Server | No | Cloudflare AI (unused) |
| `HF_API_KEY` | Server | No | Hugging Face (unused) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Client | Recommended | Map visualization |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | Recommended | Places autocomplete |
| `REDIS_URL` | Server | Recommended | Rate limiting + AI cache |
| `REDIS_TOKEN` | Server | No | Upstash Redis auth token |
| `NEXT_PUBLIC_SENTRY_DSN` | Both | No | Error tracking |
| `SENTRY_DSN` | Server | No | Server-side error tracking |
| `SENTRY_AUTH_TOKEN` | Build | No | Source map upload |
| `CRON_SECRET` | Server | No | Cron endpoint authentication |

---

## Docker Compose (Local Development)

**File:** `docker-compose.yml`

| Service | Image | Port | Volumes | Health Check |
|---------|-------|------|---------|-------------|
| PostgreSQL | `postgis/postgis:16-3.4` | 5432 | `pgdata` | `pg_isready` |
| Redis | `redis:7-alpine` | 6379 | `redisdata` | `redis-cli ping` |

Local development connects to Docker containers; production connects to Neon + Upstash.

---

## Sentry Integration

### Server-Side (`sentry.server.config.ts`)

| Setting | Value |
|---------|-------|
| DSN | `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` |
| Traces sample rate | 10% production, 100% development |
| `beforeSend` | Defined but passes through all events |

### Client-Side (`sentry.client.config.ts`)

| Setting | Value |
|---------|-------|
| DSN | `NEXT_PUBLIC_SENTRY_DSN` |
| Traces sample rate | 10% production, 100% development |

Both configs are no-ops if no DSN is set (Sentry entirely optional).

### Instrumentation

**File:** `src/instrumentation.ts`
- Registers Sentry for Node.js runtime
- Implements `onRequestError` hook for automatic request error capture

**File:** `src/instrumentation-client.ts`
- Imports `sentry.client.config` for client-side initialization

---

## Monorepo Build Order

Turborepo manages build dependencies:

```
packages/db       ──build──▶ (generates types)
packages/events   ──build──▶ (transpiles TS)
packages/validators ──build──▶ (transpiles TS)
     │                │              │
     └────────────────┼──────────────┘
                      │
                      ▼
              apps/web  ──build──▶ (.next output)
```

`apps/web` depends on `^build` (all packages build first).

---

## Deployment Gaps

### No Staging Environment

There's no separate staging deployment for pre-production testing. Vercel preview deployments serve as ad-hoc staging, but they don't connect to a staging database — they use the same Neon production branch.

**Recommendation:** Use Neon's branch feature to create a staging database branch for preview deployments.

### No Database Migration Pipeline

Migrations (`db:generate`, `db:migrate`, `db:push`) are not part of the CI/CD pipeline. They must be run manually.

**Risk:** Schema drift between development and production. Migration errors discovered only in production.

**Recommendation:** Add migration verification step to CI. Run `db:push --dry-run` or `db:generate` to validate schema matches.

### No Rollback Strategy

No documented rollback procedure. Vercel supports instant rollback to previous deployments, but there's no database rollback mechanism.

**Recommendation:** Document rollback procedure. Add down migrations. Test rollback path.

### No Blue-Green or Canary Deployment

All deployments go directly to production. No gradual rollout or canary testing.

**Recommendation:** Use Vercel's Rolling Releases for gradual deployment.

---

## Production Deployment Checklist

| # | Item | Status |
|---|------|--------|
| 1 | All `REQUIRED` env vars set | Check via `check-env.mjs` |
| 2 | All `RECOMMENDED` env vars set | Manual verification |
| 3 | Database migrations current | Manual `db:push` or `db:migrate` |
| 4 | Seed data loaded (if needed) | Manual `pnpm seed` |
| 5 | Sentry DSN configured | Set `NEXT_PUBLIC_SENTRY_DSN` |
| 6 | Razorpay webhook URL configured | Point to `/api/payments/webhook` |
| 7 | Payout webhook URL configured | Point to `/api/payouts/webhook` |
| 8 | Cron secret set | Set `CRON_SECRET` for outbox processor |
| 9 | Redis URL configured | Set `REDIS_URL` for rate limiting |
| 10 | Domain configured | Vercel domain settings |
| 11 | Demo credentials disabled | **NOT CURRENTLY POSSIBLE** |
