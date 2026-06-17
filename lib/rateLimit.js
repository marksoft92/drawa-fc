const buckets = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minut
const MAX_ATTEMPTS = 10;

export function checkRateLimit(key) {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.start > WINDOW_MS) {
    bucket = { start: now, count: 0 };
    buckets.set(key, bucket);
  }

  bucket.count++;

  if (bucket.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((bucket.start + WINDOW_MS - now) / 1000);
    return { blocked: true, retryAfter };
  }

  return { blocked: false };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.start > WINDOW_MS) buckets.delete(key);
  }
}, 60_000);
