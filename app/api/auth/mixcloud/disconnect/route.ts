import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { revokeMixcloudToken } from '@/lib/auth/mixcloud-oauth'

/**
 * Disconnect Mixcloud OAuth connection
 */
async function handleDisconnect(request: NextRequest, user: any) {
  try {
    const success = await revokeMixcloudToken(user.id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to disconnect' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Disconnected from Mixcloud'
    })
  } catch (error) {
    console.error('Disconnect error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    )
  }
}

export const POST = withAdminAuth(handleDisconnect)