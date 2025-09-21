import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/favorites(.*)',
])

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

// Main Clerk middleware with unified authentication
export default clerkMiddleware((auth, req) => {
  // Admin routes: Temporarily allow all while setting up admin accounts
  if (isAdminRoute(req)) {
    // For now, just require authentication until admin accounts are created
    auth.protect()
    // TODO: Add proper admin role checking after Phase 3 completion
  }

  // Regular protected routes: Just require authentication
  if (isProtectedRoute(req)) {
    auth.protect()
  }

  // All other routes are public
})

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}