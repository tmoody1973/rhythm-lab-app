import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { getMixcloudToken, hasValidMixcloudConnection, testTokenValidity, getValidMixcloudToken } from '@/lib/auth/mixcloud-oauth'

/**
 * Check Mixcloud OAuth connection status for current user
 */
async function handleStatus(request: NextRequest, user: any) {
  try {
    const token = await getMixcloudToken(user.id)

    if (!token) {
      return NextResponse.json({
        connected: false,
        user_id: user.id,
        message: 'No OAuth token found'
      })
    }

    // Test if token is still valid by making API call
    const accessToken = await getValidMixcloudToken(user.id)
    if (!accessToken) {
      return NextResponse.json({
        connected: false,
        user_id: user.id,
        message: 'Token expired and could not be refreshed'
      })
    }

    const tokenTest = await testTokenValidity(accessToken)

    return NextResponse.json({
      connected: tokenTest.valid,
      user_id: user.id,
      mixcloud_username: token.mixcloud_username,
      expires_at: token.expires_at,
      scope: token.scope,
      userInfo: tokenTest.userInfo,
      message: tokenTest.valid ? 'Connected successfully' : tokenTest.error
    })
  } catch (error) {
    console.error('OAuth status check error:', error)
    return NextResponse.json(
      { connected: false, error: 'Failed to check status' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(handleStatus)