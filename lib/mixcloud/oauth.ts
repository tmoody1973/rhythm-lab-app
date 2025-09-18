import { createClient } from '@/lib/supabase/server'

export interface MixcloudOAuthToken {
  id: string
  user_id: string
  access_token: string
  refresh_token?: string
  token_type: string
  expires_at?: string
  scope: string
  mixcloud_user_id?: string
  mixcloud_username?: string
  created_at: string
  updated_at: string
}

/**
 * Get valid Mixcloud OAuth token for a user
 * Automatically refreshes if expired
 */
export async function getMixcloudToken(userId: string): Promise<MixcloudOAuthToken | null> {
  const supabase = await createClient()

  // Get current token
  const { data: token, error } = await supabase
    .from('mixcloud_oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !token) {
    console.log('No Mixcloud token found for user:', userId)
    return null
  }

  // Check if token is expired
  if (token.expires_at) {
    const expiresAt = new Date(token.expires_at)
    const now = new Date()
    const bufferTime = 5 * 60 * 1000 // 5 minutes buffer

    if (expiresAt.getTime() - now.getTime() < bufferTime) {
      console.log('Token expired, attempting refresh...')

      if (token.refresh_token) {
        const refreshedToken = await refreshMixcloudToken(token)
        if (refreshedToken) {
          return refreshedToken
        }
      }

      console.log('Token expired and cannot refresh')
      return null
    }
  }

  return token
}

/**
 * Refresh an expired Mixcloud OAuth token
 */
async function refreshMixcloudToken(token: MixcloudOAuthToken): Promise<MixcloudOAuthToken | null> {
  try {
    const refreshUrl = 'https://www.mixcloud.com/oauth/access_token'

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.MIXCLOUD_CLIENT_ID!,
      client_secret: process.env.MIXCLOUD_CLIENT_SECRET!,
      refresh_token: token.refresh_token!
    })

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token refresh failed:', response.status, errorText)
      return null
    }

    const refreshData = await response.json()

    // Update token in database
    const supabase = await createClient()
    const expiresAt = new Date(Date.now() + (refreshData.expires_in * 1000))

    const { data: updatedToken, error } = await supabase
      .from('mixcloud_oauth_tokens')
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || token.refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: refreshData.scope || token.scope
      })
      .eq('id', token.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update refreshed token:', error)
      return null
    }

    console.log('Token refreshed successfully')
    return updatedToken
  } catch (error) {
    console.error('Token refresh error:', error)
    return null
  }
}

/**
 * Check if user has valid Mixcloud OAuth connection
 */
export async function hasValidMixcloudToken(userId: string): Promise<boolean> {
  const token = await getMixcloudToken(userId)
  return token !== null
}

/**
 * Revoke Mixcloud OAuth token
 */
export async function revokeMixcloudToken(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('mixcloud_oauth_tokens')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Failed to revoke token:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Token revocation error:', error)
    return false
  }
}

/**
 * Make authenticated request to Mixcloud API
 */
export async function makeMixcloudApiRequest(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getMixcloudToken(userId)

  if (!token) {
    throw new Error('No valid Mixcloud token available')
  }

  const url = endpoint.startsWith('http') ? endpoint : `https://api.mixcloud.com${endpoint}`

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      ...options.headers
    }
  })
}