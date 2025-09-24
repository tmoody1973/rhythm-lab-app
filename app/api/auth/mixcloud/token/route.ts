import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { getValidMixcloudToken } from '@/lib/auth/mixcloud-oauth'

/**
 * Simple endpoint to get the user's Mixcloud access token
 * Used by client-side upload to authenticate directly with Mixcloud
 */
async function getToken(request: Request, user: any) {
  try {
    // Get valid access token (handles refresh if needed)
    const accessToken = await getValidMixcloudToken(user.id)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No valid Mixcloud OAuth token. Please reconnect your account.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      access_token: accessToken,
      // Don't expose refresh token to client
    })
  } catch (error) {
    console.error('Error getting access token:', error)
    return NextResponse.json(
      { error: 'Failed to get access token' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(getToken)