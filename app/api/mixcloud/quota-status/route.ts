import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { checkEnhancementQuotas } from '@/lib/external-apis/track-enhancement'

/**
 * GET /api/mixcloud/quota-status
 * Check API quota status for YouTube and Discogs
 */
const handler = withAdminAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  try {
    console.log('[Quota Status] Checking API quotas')

    const quotaStatus = await checkEnhancementQuotas()

    console.log('[Quota Status] Results:', {
      youtube_available: quotaStatus.youtube.available,
      youtube_remaining: quotaStatus.youtube.remaining,
      discogs_available: quotaStatus.discogs.available,
      discogs_remaining: quotaStatus.discogs.remaining
    })

    return NextResponse.json({
      success: true,
      youtube: quotaStatus.youtube,
      discogs: quotaStatus.discogs
    })

  } catch (error) {
    console.error('[Quota Status] Error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to check quota status',
      error: error instanceof Error ? error.message : 'Unknown error',
      // Provide fallback status
      youtube: { available: false, remaining: 0, message: 'Unable to check quota' },
      discogs: { available: false, remaining: 0, message: 'Unable to check quota' }
    }, { status: 500 })
  }
})

export const GET = handler