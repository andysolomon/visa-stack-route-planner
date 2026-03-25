const windowMs = 60_000; // 1 minute
const maxRequests = 60;

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string): {
  success: boolean;
  remaining: number;
} {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: maxRequests - entry.count };
}
