import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

export async function GET() {
  const result: Record<string, unknown> = {
    status: "healthy",
    version: "0.1.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  // Database check
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`SELECT 1`;
    result.db = "ok";
  } catch (err) {
    logger.error("Health check: database unreachable", {
      error: err instanceof Error ? err.message : String(err),
    });
    result.db = "error";
    result.status = "unhealthy";
  }

  // Redis check
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      await redis.ping();
      result.redis = "ok";
    } catch (err) {
      logger.error("Health check: redis unreachable", {
        error: err instanceof Error ? err.message : String(err),
      });
      result.redis = "error";
      result.status = "unhealthy";
    }
  } else {
    result.redis = "not_configured";
  }

  const status = result.status === "healthy" ? 200 : 503;
  return NextResponse.json(result, { status });
}
