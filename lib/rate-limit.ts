type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Lightweight sliding-window limiter, keyed per warm serverless
 * instance. On Vercel each instance enforces independently, so this is
 * a deterrent against bursts and scripts rather than a hard global
 * cap — the right trade for beta without adding infrastructure.
 */
export function checkRateLimit(
  req: Request,
  ns: string,
  max = 10,
  windowMs = 10 * 60_000
): boolean {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${ns}:${ip}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= max;
}
