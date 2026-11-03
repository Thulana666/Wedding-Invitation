/**
 * Small in-memory fixed-window rate limiter. Good enough for a single
 * instance; on multi-instance hosting it still slows down abuse per instance.
 */

const buckets = globalThis.__dsRateLimit || (globalThis.__dsRateLimit = new Map());

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, retryAfter: Math.ceil((entry.reset - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

export function resetRateLimit(key) {
  buckets.delete(key);
}
