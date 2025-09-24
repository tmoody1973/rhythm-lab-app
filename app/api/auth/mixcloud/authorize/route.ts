import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'

/**
 * Initiate Mixcloud OAuth authorization flow
 * Redirects user to Mixcloud for permission grant
 */
async function handleAuthorize(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = searchParams.get('redirect_uri') || `${baseUrl}/api/auth/mixcloud/callback`

    // Check for required environment variables
    const clientId = process.env.MIXCLOUD_CLIENT_ID
    if (!clientId) {
      return NextResponse.json(
        { error: 'Mixcloud OAuth not configured' },
        { status: 500 }
      )
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID()

    // Build authorization URL
    const authUrl = new URL('https://www.mixcloud.com/oauth/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'upload')
    authUrl.searchParams.set('state', state)
    // Force fresh authorization by adding timestamp
    authUrl.searchParams.set('approval_prompt', 'force')
    authUrl.searchParams.set('_t', Date.now().toString())

    // Store state in session/cookie for verification
    console.log('Setting OAuth state cookie:', state)
    const response = NextResponse.redirect(authUrl.toString())
    response.cookies.set('mixcloud_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure in production, allow HTTP in development
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/' // Ensure cookie is available for all paths
    })

    return response
  } catch (error) {
    console.error('OAuth authorize error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(handleAuthorize)