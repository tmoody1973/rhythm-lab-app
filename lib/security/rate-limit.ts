/**
 * Simple in-memory rate limiter
 *
 * NOTE: This is a basic implementation suitable for development and low-traffic production.
 * For high-traffic apps, consider using Redis or Vercel KV instead.
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

// Store rate limit data in memory (resets on server restart)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   * @default 60
   */
  limit?: number

  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  window?: number
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param options - Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const limit = options.limit || 60
  const window = options.window || 60000 // 1 minute default

  const now = Date.now()
  const key = `${identifier}:${options.limit}:${options.window}`

  let record = rateLimitStore.get(key)

  // Create new record if doesn't exist or if window has expired
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + window
    }
    rateLimitStore.set(key, record)
  }

  // Increment count
  record.count++

  const allowed = record.count <= limit
  const remaining = Math.max(0, limit - record.count)

  return {
    allowed,
    remaining,
    resetTime: record.resetTime
  }
}

/**
 * Get rate limit identifier from request
 * Uses IP address or fallback to user agent
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try to get real IP from various headers (Vercel/Cloudflare/etc)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0]?.trim()

  // Fallback to user agent if no IP found (shouldn't happen in production)
  if (!ip) {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    return `ua:${userAgent.substring(0, 50)}`
  }

  return `ip:${ip}`
}

/**
 * Create rate limit response headers
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
  }
}