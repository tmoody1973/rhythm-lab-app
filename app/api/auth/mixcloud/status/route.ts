import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { hasValidMixcloudToken } from '@/lib/mixcloud/oauth'

/**
 * Check Mixcloud OAuth connection status for current user
 */
async function handleStatus(request: NextRequest, user: any) {
  try {
    const connected = await hasValidMixcloudToken(user.id)

    return NextResponse.json({
      connected,
      user_id: user.id
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