// src/lib/rateLimit.ts
// Simple in-memory sliding-window rate limiter.
// For production at scale, replace with Redis (Upstash).

const windows = new Map<string, number[]>();

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key      Unique key (e.g. "ai:1.2.3.4" or "create:1.2.3.4")
 * @param max      Max number of requests in the window
 * @param windowSec  Window duration in seconds
 */
export function rateLimit(key: string, max: number, windowSec: number): boolean {
  const now = Date.now();
  const cutoff = now - windowSec * 1000;

  const hits = (windows.get(key) ?? []).filter(t => t > cutoff);
  if (hits.length >= max) return false;

  hits.push(now);
  windows.set(key, hits);
  return true;
}
