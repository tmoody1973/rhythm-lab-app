import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/favorites(.*)',
])

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

// Define public routes that should never require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sitemap.xml',
  '/robots.txt',
  '/opengraph-image(.*)',
  '/icon(.*)',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/search',
  '/shows',
  '/artists',
  '/blog',
  '/shows/(.*)',
  '/artists/(.*)',
  '/blog/(.*)',
  '/profiles/(.*)',
  '/_next/static/(.*)',
  '/_next/image/(.*)',
  '/(.*)\\.(png|jpg|jpeg|svg|gif|webp|css|js|ico|woff|woff2|ttf|eot)$',
])

// Main Clerk middleware with unified authentication
export default clerkMiddleware((auth, req) => {
  // Skip auth for public routes
  if (isPublicRoute(req)) {
    return
  }

  // Admin routes: Temporarily allow all while setting up admin accounts
  if (isAdminRoute(req)) {
    // For now, just require authentication until admin accounts are created
    auth.protect()
    // TODO: Add proper admin role checking after Phase 3 completion
    return
  }

  // Regular protected routes: Just require authentication
  if (isProtectedRoute(req)) {
    auth.protect()
    return
  }

  // All other routes are public by default
})

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}