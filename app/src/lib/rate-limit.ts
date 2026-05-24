/**
 * Sliding-window in-memory IP rate limit.
 * Sufficient for MVP & Edge function single-region. For multi-region scale,
 * replace with Upstash Redis (Vercel Marketplace).
 *
 * Note on Edge runtime: module-scoped Map is per-isolate. Different invocations
 * in different isolates won't share counters — this is OK for MVP since one
 * isolate handles a burst. Hard limit > soft limit per region.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  windowMs: number;   // window length in ms
  max: number;        // requests allowed in window
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;    // epoch ms
};

const DEFAULT: RateLimitOptions = { windowMs: 60_000, max: 30 };

export function rateLimit(key: string, opts: Partial<RateLimitOptions> = {}): RateLimitResult {
  const { windowMs, max } = { ...DEFAULT, ...opts };
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  const remaining = Math.max(0, max - bucket.count);
  return {
    ok: bucket.count <= max,
    remaining,
    resetAt: bucket.resetAt,
  };
}

export function ipKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}
