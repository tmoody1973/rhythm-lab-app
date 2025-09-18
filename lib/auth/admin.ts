import { createServerClient } from '@supabase/ssr'
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
 * Verifies user is authenticated and has admin role
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // For API routes, we don't need to set cookies
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return { error: 'Admin access required' }
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        role: profile.role
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