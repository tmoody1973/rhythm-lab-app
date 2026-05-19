import { NextRequest, NextResponse } from 'next/server'
import { upsertEpisode } from '@/lib/sanity/episodeHelpers'

interface UpdateTracklistRequest {
  mixcloudUrl: string
  tracklist: Array<{ startTime: number; artistName: string; trackName: string }>
}

/**
 * PATCH /api/episodes/update-tracklist
 * Called after a playlist is saved in the Mixcloud admin to sync the tracklist to Sanity.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body: UpdateTracklistRequest = await request.json()
    const { mixcloudUrl, tracklist } = body

    if (!mixcloudUrl) {
      return NextResponse.json({ error: 'mixcloudUrl is required' }, { status: 400 })
    }

    const mixcloudKey = mixcloudUrl.startsWith('https://www.mixcloud.com')
      ? mixcloudUrl.replace('https://www.mixcloud.com', '')
      : mixcloudUrl

    // upsertEpisode is idempotent — only patches the tracklist field on existing docs
    const result = await upsertEpisode({
      mixcloudKey,
      title: '', // title won't be overwritten if doc already has one (patch only updates provided fields)
      tracklist,
    })

    return NextResponse.json({ success: true, sanityId: result.sanityId, slug: result.slug })
  } catch (error) {
    console.error('Episode tracklist update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
