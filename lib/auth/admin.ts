import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export interface AdminUser {
  id: string
  email: string
  role: string
}

export interface AuthResult {
  user?: AdminUser
  error?: string
}

/**
 * Admin authentication middleware for API routes
 * Verifies user is authenticated and has admin role using Clerk
 */
export async function verifyAdminAuth(_request: NextRequest): Promise<AuthResult> {
  try {
    // Get authenticated user from Clerk
    const user = await currentUser()

    if (!user) {
      return { error: 'Authentication required' }
    }

    // Check admin role in Clerk metadata
    const metadata = user.publicMetadata as { role?: string; isAdmin?: boolean }
    const isAdmin = metadata?.role === 'admin' || metadata?.isAdmin === true

    if (!isAdmin) {
      return { error: 'Admin access required' }
    }

    // Get email from emailAddresses
    const email = user.emailAddresses?.[0]?.emailAddress || ''

    return {
      user: {
        id: user.id,
        email: email,
        role: 'admin'
      }
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    return { error: 'Internal authentication error' }
  }
}

/**
 * Helper function to return unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Helper function to return forbidden response
 */
export function forbiddenResponse(message: string = 'Admin access required'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Middleware wrapper for admin-only API routes
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: AdminUser) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await verifyAdminAuth(request)

    if (authResult.error || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }

    try {
      return await handler(request, authResult.user)
    } catch (error) {
      console.error('API handler error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}