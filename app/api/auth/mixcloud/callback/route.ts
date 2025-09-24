import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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

    if (!storedState || !state || storedState !== state) {
      console.error('OAuth state verification failed:', {
        hasStoredState: !!storedState,
        hasReceivedState: !!state,
        statesMatch: storedState === state
      })
      return NextResponse.redirect(`${baseUrl}/admin?error=invalid_state`)
    }

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code, baseUrl)

    if (!tokenResponse.access_token) {
      throw new Error('No access token received')
    }

    // Store token in database
    // Use service role client to bypass RLS for admin operations
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )

    // First, get the profile UUID for this Clerk user
    console.log('Looking up profile for Clerk user:', user.id)
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, clerk_user_id, email')
      .eq('clerk_user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile lookup error:', {
        error: profileError,
        clerkUserId: user.id,
        userObject: user
      })

      // Try to create the profile if it doesn't exist
      console.log('Attempting to create profile for user:', user.id)
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          clerk_user_id: user.id,
          email: user.email || '',
          full_name: user.fullName || ''
        })
        .select('id')
        .single()

      if (createError || !newProfile) {
        console.error('Failed to create profile:', createError)
        return NextResponse.redirect(`${baseUrl}/admin?error=profile_creation_failed`)
      }

      console.log('Created new profile:', newProfile)
      profile = newProfile
    }

    // Safety check - profile must exist at this point
    if (!profile) {
      console.error('Profile is still null after lookup/creation')
      return NextResponse.redirect(`${baseUrl}/admin?error=profile_null`)
    }

    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + (tokenResponse.expires_in * 1000))
      : null

    console.log('Attempting to store token for user:', {
      clerkUserId: user.id,
      profileId: profile.id,
      hasAccessToken: !!tokenResponse.access_token,
      hasRefreshToken: !!tokenResponse.refresh_token,
      expiresAt: expiresAt?.toISOString(),
      mixcloudUsername: tokenResponse.user?.username
    })

    const { error: dbError } = await supabase
      .from('mixcloud_oauth_tokens')
      .upsert({
        user_id: profile.id, // Use the profile UUID instead of Clerk user ID
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
      console.error('Database error storing token:', {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      })
      return NextResponse.redirect(`${baseUrl}/admin?error=db_error&details=${encodeURIComponent(dbError.message)}`)
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

  // Log the raw response from Mixcloud to debug the format
  console.log('Raw Mixcloud token response:', JSON.stringify(tokenData, null, 2))

  // Log what Mixcloud actually returned
  console.log('Token exchange response:', {
    hasAccessToken: !!tokenData.access_token,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in,
    scope: tokenData.scope,
    refreshToken: !!tokenData.refresh_token,
    error: tokenData.error
  })

  // Fetch user info if we have a valid token
  if (tokenData.access_token) {
    try {
      const userUrl = new URL('https://api.mixcloud.com/me/')
      userUrl.searchParams.set('access_token', tokenData.access_token)

      const userResponse = await fetch(userUrl.toString())

      if (userResponse.ok) {
        const userData = await userResponse.json()
        // Check if we got an error in the response
        if (!userData.error) {
          tokenData.user = userData
        } else {
          console.warn('User info fetch returned error:', userData.error)
        }
      }
    } catch (userError) {
      console.warn('Failed to fetch user info:', userError)
      // Continue without user info
    }
  }

  return tokenData
}

export const GET = withAdminAuth(handleCallback)