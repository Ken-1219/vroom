import { Redis } from "@upstash/redis";

// Lazily create Redis client
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) return null;
  if (!redis) {
    redis = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
  }
  return redis;
}

export async function getCachedAiResponse<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis();
    if (!r) return null;
    return await r.get<T>(key);
  } catch {
    return null;
  }
}

export async function setCachedAiResponse<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;
    await r.set(key, value, { ex: ttlSeconds });
  } catch {
    // Cache write failure is non-critical
  }
}

export function makeCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sorted = JSON.stringify(params, Object.keys(params).sort());
  // Simple hash for cache key
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `${prefix}:${Math.abs(hash).toString(36)}`;
}
