# Security Audit Report
**Date:** September 29, 2025
**App:** Rhythm Lab Radio Application
**Auditor:** Claude Code

---

## Executive Summary

Your application has a **solid security foundation** with proper authentication via Clerk and RLS-protected database access. There are **8 medium-priority issues** and **3 low-priority recommendations** that should be addressed to harden security further.

**Overall Security Rating:** ⭐⭐⭐⭐☆ (4/5 - Good, with room for improvement)

---

## ✅ What's Working Well

### 1. **Authentication & Authorization**
- ✅ Clerk integration for user authentication
- ✅ Admin role verification via `withAdminAuth` middleware
- ✅ Protected admin endpoints (22 routes use `withAdminAuth`)
- ✅ Clerk user ID checks in favorites endpoint

### 2. **Database Security**
- ✅ Using Supabase Service Role key for admin operations
- ✅ Anon key for user-level operations
- ✅ RLS policies in place (enforced via service/anon key separation)

### 3. **Dependency Security**
- ✅ **Zero npm vulnerabilities** detected
- ✅ 728 total dependencies with no known security issues

### 4. **Environment Variables**
- ✅ Secrets properly managed in `.env` files
- ✅ `.env` files properly gitignored
- ✅ Clear `.env.example` for setup guidance

---

## ⚠️ Medium Priority Issues

### 1. **NEXT_PUBLIC_ADMIN_TOKEN Exposure Risk** 🔴
**Severity:** HIGH
**Location:** Multiple files

```typescript
// ❌ PROBLEM: This exposes the admin token to client-side code
process.env.NEXT_PUBLIC_ADMIN_TOKEN

// Files affected:
// - components/ai-enhanced-influence-graph.tsx:91
// - components/unified-ai-insights.tsx:102
// - components/ai-insights/ai-insights-panel.tsx:77
// - app/api/process-relationships/route.ts:52
// - app/api/enhance-relationships-spotify/route.ts:18
// - app/api/cron/sync-live-songs/route.ts:194
// - app/api/cache-youtube-videos/route.ts:14
```

**Risk:** Any client-side code can read `NEXT_PUBLIC_*` variables. An attacker could extract this token from your JavaScript bundle and call your admin APIs.

**Recommendation:**
1. Remove `NEXT_PUBLIC_` prefix from admin token
2. Only use `ADMIN_TOKEN` (without NEXT_PUBLIC_) in server-side API routes
3. Client components should call protected API endpoints, not send auth headers directly

**Fix Example:**
```typescript
// ❌ Before (in client component)
fetch('/api/process-relationships', {
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`
  }
})

// ✅ After (in client component)
fetch('/api/process-relationships') // Auth handled server-side via Clerk

// ✅ In API route
const { userId } = await auth()
if (!userId) return unauthorized()
```

---

### 2. **AI Generation Endpoint Lacks Rate Limiting** 🟡
**Severity:** MEDIUM
**Location:** `/api/ai/generate-description/route.ts`

**Issue:** No authentication or rate limiting on AI content generation endpoint.

```typescript
// ❌ CURRENT: Anyone can call this and consume your Perplexity API quota
export async function POST(request: NextRequest) {
  const { title, tracks } = await request.json()
  const generatedContent = await generateContent(contentRequest) // Costs money!
  // ...
}
```

**Risk:**
- Attackers could drain your AI API quota
- Potential cost overruns from abuse
- No tracking of who generated what

**Recommendation:**
```typescript
// ✅ Add auth check
import { withAdminAuth } from '@/lib/auth/admin'

const handler = withAdminAuth(async (request: NextRequest) => {
  const { title, tracks } = await request.json()
  // ... rest of code
})

export const POST = handler
```

---

### 3. **Cron Endpoint Authentication Bypass in Development** 🟡
**Severity:** MEDIUM
**Location:** `/api/cron/sync-live-songs/route.ts:18`

```typescript
// ❌ PROBLEM: Auth is skipped in development
const isProduction = process.env.VERCEL_ENV === 'production'
if (isProduction && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Risk:** In development, anyone can trigger expensive Algolia indexing operations.

**Recommendation:**
```typescript
// ✅ Always require auth
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

### 4. **Storyblok Management Token in Client Code** 🟡
**Severity:** MEDIUM
**Location:** Multiple API routes

```typescript
// ⚠️ Storyblok management token used but should be server-only
const storyblokToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN
```

**Issue:** `NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN` is exposed to clients. While it's a read-only token, it's still not ideal.

**Recommendation:**
- Keep `NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN` for client-side reads (it's read-only, so lower risk)
- Ensure `STORYBLOK_MANAGEMENT_TOKEN` is **NEVER** prefixed with `NEXT_PUBLIC_`
- Verify management token is only used server-side

---

### 5. **Missing Input Validation on Several Endpoints** 🟡
**Severity:** MEDIUM
**Locations:** Various API routes

**Examples:**
```typescript
// ❌ No validation on user input
const { title, tracks } = await request.json()
// What if title is a 10MB string?
// What if tracks array has 1 million items?
```

**Recommendation:** Add input validation:
```typescript
// ✅ With validation
const body = await request.json()

if (!body.title || typeof body.title !== 'string' || body.title.length > 500) {
  return NextResponse.json({ error: 'Invalid title' }, { status: 400 })
}

if (!Array.isArray(body.tracks) || body.tracks.length === 0 || body.tracks.length > 100) {
  return NextResponse.json({ error: 'Invalid tracks array' }, { status: 400 })
}
```

---

### 6. **Service Role Key Logged in Console** 🟡
**Severity:** MEDIUM
**Location:** `/app/api/mixcloud/create-show/route.ts:78`

```typescript
// ❌ Logging sensitive key material
console.log('🔑 Using service role key (first 20 chars):', serviceRoleKey.substring(0, 20))
```

**Risk:** Logs might be stored/transmitted insecurely and leak partial key material.

**Recommendation:**
```typescript
// ✅ Remove or sanitize logging
console.log('🔑 Using service role key:', serviceRoleKey ? 'CONFIGURED' : 'MISSING')
```

---

### 7. **Error Messages Leak Implementation Details** 🟡
**Severity:** LOW-MEDIUM
**Location:** Multiple endpoints

```typescript
// ❌ Exposes internal errors to clients
catch (error) {
  return NextResponse.json({
    error: error.message // Might leak stack traces, file paths
  }, { status: 500 })
}
```

**Recommendation:**
```typescript
// ✅ Generic errors for clients, detailed logs server-side
catch (error) {
  console.error('Detailed error for logs:', error)
  return NextResponse.json({
    error: 'Internal server error' // Generic message
  }, { status: 500 })
}
```

---

### 8. **No Rate Limiting on Public Endpoints** 🟡
**Severity:** MEDIUM
**Affected:** All public GET endpoints

**Risk:** Attackers could:
- Scrape your entire database
- DDoS your API
- Abuse expensive operations

**Recommendation:** Implement rate limiting using Vercel Edge Config or Upstash Redis:

```typescript
// Example using simple in-memory rate limiting
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for')

  if (!rateLimit(ip, { limit: 60, window: 60000 })) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // ... rest of handler
}
```

---

## 💡 Low Priority Recommendations

### 1. **Add Security Headers**
Add security headers in `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]

module.exports = {
  async headers() {
    return [{
      source: '/:path*',
      headers: securityHeaders
    }]
  }
}
```

### 2. **Add CSRF Protection for State-Changing Operations**
For POST/PUT/DELETE operations, consider adding CSRF tokens, especially for admin operations.

### 3. **Implement Audit Logging**
Log all admin actions for accountability:

```typescript
await supabase.from('audit_log').insert({
  user_id: userId,
  action: 'CREATE_SHOW',
  resource_id: showId,
  timestamp: new Date().toISOString()
})
```

---

## 📊 Priority Action Plan

### Immediate (Do First)
1. ✅ Remove `NEXT_PUBLIC_` prefix from `ADMIN_TOKEN`
2. ✅ Add auth to AI generation endpoint
3. ✅ Stop logging service role key material

### Short Term (This Week)
4. ✅ Add input validation to all POST endpoints
5. ✅ Implement basic rate limiting
6. ✅ Fix cron endpoint auth bypass

### Medium Term (This Month)
7. ✅ Add security headers
8. ✅ Implement audit logging
9. ✅ Add CSRF protection

---

## 🛡️ Conclusion

Your app has **strong foundational security** with Clerk auth and Supabase RLS. The main risks are:
1. Exposed admin token in client code (HIGH PRIORITY)
2. Missing rate limiting on expensive operations
3. Unprotected AI endpoints

Fixing the top 3 issues will significantly improve your security posture. The rest are incremental improvements.

**Next Steps:**
1. Review this report
2. Prioritize fixes based on your risk tolerance
3. Let me know which issues you'd like me to fix first
4. I'll implement fixes incrementally with testing

---

**Questions or want me to start fixing any of these?** Let me know which issue to tackle first!