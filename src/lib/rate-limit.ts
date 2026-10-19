import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Shared, cross-instance rate limiting via Upstash Redis (HTTP-based, so it
 * works from Vercel's serverless/edge functions). This matters because a
 * plain in-process counter (a `Map`, a module-level variable) gives almost no
 * real protection on Vercel — each invocation can land on a different, fresh
 * function instance with its own memory, so an attacker's requests spread
 * across instances mostly reset the count back to zero.
 *
 * Falls back to a local in-memory limiter when Upstash isn't configured, so
 * dev/preview still works without extra setup — same graceful-degradation
 * pattern as isSupabaseConfigured()/isEmailConfigured() elsewhere in this repo.
 * That fallback is NOT safe as the sole protection in a real multi-instance
 * production deployment; set UPSTASH_REDIS_REST_URL/TOKEN before launch.
 */

function isUpstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// Cache one Ratelimit instance per (limit, window) pair so repeated calls with
// the same budget reuse the same sliding-window bucket definition.
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowSeconds: number): Ratelimit {
  const cacheKey = `${limit}:${windowSeconds}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: "nordway",
      analytics: false,
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

// In-memory fallback (per server instance only) — same shape as the limiter
// this replaces in src/app/api/assistant/route.ts.
const memoryHits = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  // Opportunistic sweep so the Map can't grow unbounded (memory leak).
  if (memoryHits.size > 5000) {
    for (const [k, v] of memoryHits) if (now > v.resetAt) memoryHits.delete(k);
  }
  const entry = memoryHits.get(key);
  if (!entry || now > entry.resetAt) {
    memoryHits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

/**
 * True if `key` (typically a caller IP) has exceeded `limit` requests within
 * `windowSeconds`. Uses Upstash Redis when configured; otherwise the
 * in-memory fallback above.
 */
export async function isRateLimited(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  if (isUpstashConfigured()) {
    try {
      const { success } = await getUpstashLimiter(limit, windowSeconds).limit(key);
      return !success;
    } catch {
      // Redis unreachable — fail open. A rate limiter going down should never
      // take the whole endpoint down with it.
      return false;
    }
  }
  return memoryRateLimited(key, limit, windowSeconds * 1000);
}
