/**
 * Mixcloud OAuth utility functions
 * Handles token management, refresh, and validation
 */

// Note: Using service role client instead of regular client for RLS bypass

interface MixcloudToken {
  id: string
  user_id: string
  access_token: string
  refresh_token?: string
  token_type: string
  expires_at?: string
  scope?: string
  mixcloud_user_id?: string
  mixcloud_username?: string
  created_at: string
  updated_at: string
}

interface TokenRefreshResponse {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
}

/**
 * Get stored OAuth token for a user (Clerk user ID)
 */
export async function getMixcloudToken(clerkUserId: string): Promise<MixcloudToken | null> {
  // Use service role client to bypass RLS for token operations
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (profileError || !profile) {
    return null
  }

  const { data, error } = await supabase
    .from('mixcloud_oauth_tokens')
    .select('*')
    .eq('user_id', profile.id)
    .single()

  if (error || !data) {
    return null
  }

  return data as MixcloudToken
}

/**
 * Check if token is expired or will expire soon (within 5 minutes)
 */
export function isTokenExpired(token: MixcloudToken): boolean {
  if (!token.expires_at) {
    return false // No expiration set, assume it's valid
  }

  const expiryTime = new Date(token.expires_at).getTime()
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  return expiryTime <= (now + fiveMinutes)
}

/**
 * Refresh an expired OAuth token
 */
export async function refreshMixcloudToken(token: MixcloudToken): Promise<MixcloudToken | null> {
  if (!token.refresh_token) {
    console.error('No refresh token available for user:', token.user_id)
    return null
  }

  try {
    const refreshResponse = await fetch('https://www.mixcloud.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.MIXCLOUD_CLIENT_ID!,
        client_secret: process.env.MIXCLOUD_CLIENT_SECRET!,
        refresh_token: token.refresh_token
      }).toString()
    })

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text()
      console.error('Token refresh failed:', refreshResponse.status, errorText)
      return null
    }

    const refreshData: TokenRefreshResponse = await refreshResponse.json()

    // Update token in database
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )
    const expiresAt = refreshData.expires_in
      ? new Date(Date.now() + (refreshData.expires_in * 1000))
      : null

    const { data: updatedToken, error } = await supabase
      .from('mixcloud_oauth_tokens')
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || token.refresh_token, // Keep old if no new one
        token_type: refreshData.token_type,
        expires_at: expiresAt?.toISOString(),
        scope: refreshData.scope || token.scope,
        updated_at: new Date().toISOString()
      })
      .eq('id', token.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update refreshed token:', error)
      return null
    }

    console.log('Token refreshed successfully for user:', token.user_id)
    return updatedToken as MixcloudToken

  } catch (error) {
    console.error('Token refresh error:', error)
    return null
  }
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidMixcloudToken(userId: string): Promise<string | null> {
  let token = await getMixcloudToken(userId)

  if (!token) {
    return null
  }

  // Check if token needs refresh
  if (isTokenExpired(token)) {
    console.log('Token expired, attempting refresh for user:', userId)
    token = await refreshMixcloudToken(token)

    if (!token) {
      console.error('Failed to refresh token for user:', userId)
      return null
    }
  }

  return token.access_token
}

/**
 * Check if user has valid Mixcloud connection
 */
export async function hasValidMixcloudConnection(userId: string): Promise<boolean> {
  const token = await getValidMixcloudToken(userId)
  return !!token
}

/**
 * Revoke/delete stored token
 */
export async function revokeMixcloudToken(clerkUserId: string): Promise<boolean> {
  // Use service role client to bypass RLS for token operations
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (profileError || !profile) {
    return false
  }

  const { error } = await supabase
    .from('mixcloud_oauth_tokens')
    .delete()
    .eq('user_id', profile.id)

  if (error) {
    console.error('Failed to revoke token:', error)
    return false
  }

  return true
}

/**
 * Test token validity by making API call to Mixcloud
 * Note: Mixcloud expects access_token as query parameter, not Authorization header
 */
export async function testTokenValidity(accessToken: string): Promise<{
  valid: boolean
  userInfo?: any
  error?: string
}> {
  try {
    const url = new URL('https://api.mixcloud.com/me/')
    url.searchParams.set('access_token', accessToken)

    const response = await fetch(url.toString())

    if (!response.ok) {
      return {
        valid: false,
        error: `API call failed: ${response.status}`
      }
    }

    const userInfo = await response.json()

    // Check if we got an error response
    if (userInfo.error) {
      return {
        valid: false,
        error: userInfo.error.message || 'API error'
      }
    }

    return {
      valid: true,
      userInfo
    }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Unknown error'
    }
  }
}