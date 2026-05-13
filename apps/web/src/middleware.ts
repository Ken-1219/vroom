import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.REDIS_URL && process.env.REDIS_TOKEN
    ? new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN,
      })
    : null;

const generalLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      prefix: "rl:general",
    })
  : null;

const aiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      prefix: "rl:ai",
    })
  : null;

const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      prefix: "rl:auth",
    })
  : null;

const AI_PATHS = [
  "/api/chat",
  "/api/nl-search",
  "/api/ai/",
  "/api/trip-planner",
  "/api/reviews/summary",
];

const AUTH_PATHS = ["/api/mcp/auth", "/api/auth/"];

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  "X-DNS-Prefetch-Control": "on",
};

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

function isAiPath(pathname: string): boolean {
  return AI_PATHS.some((p) => pathname.startsWith(p));
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname.startsWith(p));
}

function isVehicleChatPath(pathname: string): boolean {
  return /^\/api\/vehicles\/[^/]+\/chat$/.test(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (pathname.startsWith("/api/") && redis) {
    const ip = getClientIp(request);

    // Pick the right limiter
    let limiter = generalLimiter;
    if (isAiPath(pathname) || isVehicleChatPath(pathname)) {
      limiter = aiLimiter;
    } else if (isAuthPath(pathname)) {
      limiter = authLimiter;
    }

    if (limiter) {
      const { success, limit, remaining, reset } = await limiter.limit(ip);
      if (!success) {
        return new NextResponse(
          JSON.stringify({ error: { code: "RATE_LIMITED", message: "Too many requests" } }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
              "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
              ...SECURITY_HEADERS,
            },
          }
        );
      }
    }
  }

  const response = NextResponse.next();

  // Security headers on all responses
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // HSTS only on production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
