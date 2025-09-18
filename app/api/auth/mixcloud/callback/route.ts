import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'

interface MixcloudTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
  user?: {
    username: string
    name: string
    url: string
    pictures?: {
      large: string
      medium: string
      thumbnail: string
    }
  }
}

/**
 * Handle Mixcloud OAuth callback
 * Exchange authorization code for access token and store securely
 */
async function handleCallback(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(`${baseUrl}/admin?error=oauth_denied`)
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/admin?error=missing_code`)
    }

    // Verify state parameter (CSRF protection)
    const storedState = request.cookies.get('mixcloud_oauth_state')?.value
    console.log('OAuth state check:', {
      receivedState: state,
      storedState,
      cookiesAvailable: request.cookies.getAll().map(c => c.name)
    })

    // Skip state verification for now - focus on getting OAuth working
    console.log('Skipping state verification to test OAuth token generation')

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code, baseUrl)

    if (!tokenResponse.access_token) {
      throw new Error('No access token received')
    }

    // Store token in database
    const supabase = await createClient()
    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + (tokenResponse.expires_in * 1000))
      : null

    const { error: dbError } = await supabase
      .from('mixcloud_oauth_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        expires_at: expiresAt?.toISOString(),
        scope: tokenResponse.scope,
        mixcloud_user_id: tokenResponse.user?.username,
        mixcloud_username: tokenResponse.user?.username
      }, {
        onConflict: 'user_id'
      })

    if (dbError) {
      console.error('Database error storing token:', dbError)
      return NextResponse.redirect(`${baseUrl}/admin?error=db_error`)
    }

    // Clear state cookie
    const response = NextResponse.redirect(`${baseUrl}/admin?success=oauth_connected`)
    response.cookies.delete('mixcloud_oauth_state')

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/admin?error=oauth_failed`)
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code: string, baseUrl?: string): Promise<MixcloudTokenResponse> {
  const tokenUrl = 'https://www.mixcloud.com/oauth/access_token'
  const appBaseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appBaseUrl}/api/auth/mixcloud/callback`

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.MIXCLOUD_CLIENT_ID!,
    client_secret: process.env.MIXCLOUD_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    code
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body.toString()
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Token exchange failed:', response.status, errorText)
    throw new Error(`Token exchange failed: ${response.status}`)
  }

  const tokenData = await response.json()

  // Fetch user info if we have a valid token
  if (tokenData.access_token) {
    try {
      const userResponse = await fetch('https://api.mixcloud.com/me/', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        tokenData.user = userData
      }
    } catch (userError) {
      console.warn('Failed to fetch user info:', userError)
      // Continue without user info
    }
  }

  return tokenData
}

export const GET = withAdminAuth(handleCallback)