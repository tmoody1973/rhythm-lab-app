import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'

interface MixcloudShow {
  key: string
  name: string
  slug: string
  url: string
  created_time: string
  updated_time: string
  description: string
  picture: {
    medium: string
    large: string
    thumbnail: string
  }
  audio_length: number
  user: {
    username: string
    name: string
  }
  tags: Array<{
    name: string
    url: string
  }>
  sections?: Array<{
    start_time: number
    track?: {
      name: string
      artist: {
        name: string
      }
    }
  }>
}

interface FetchArchiveRequest {
  username?: string
  limit?: number
  offset?: number
}

interface FetchArchiveResponse {
  success: boolean
  shows?: MixcloudShow[]
  total_count?: number
  has_more?: boolean
  message?: string
  errors?: string[]
}

/**
 * GET /api/mixcloud/fetch-archive
 * Fetch all shows from a Mixcloud user's archive
 */
const handler = withAdminAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username') || process.env.MIXCLOUD_USERNAME
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!username) {
      return NextResponse.json({
        success: false,
        message: 'Username is required (either as parameter or in MIXCLOUD_USERNAME env var)'
      }, { status: 400 })
    }

    // Validate limit bounds
    if (limit < 1 || limit > 100) {
      return NextResponse.json({
        success: false,
        message: 'Limit must be between 1 and 100'
      }, { status: 400 })
    }

    console.log(`Fetching archive for ${username}, limit: ${limit}, offset: ${offset}`)

    // Fetch user's shows from Mixcloud API
    const mixcloudUrl = `https://api.mixcloud.com/${username}/cloudcasts/?limit=${limit}&offset=${offset}`

    const response = await fetch(mixcloudUrl, {
      headers: {
        'User-Agent': 'Rhythm Lab Radio App'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          message: `User '${username}' not found on Mixcloud`
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        message: `Mixcloud API error: ${response.status}`
      }, { status: response.status })
    }

    const data = await response.json()

    // Transform data to include relevant fields for import
    // Note: Mixcloud's bulk API returns minimal data - descriptions are often empty
    const shows: MixcloudShow[] = data.data?.map((show: any) => ({
      key: show.key,
      name: show.name,
      slug: show.slug,
      url: show.url,
      created_time: show.created_time,
      updated_time: show.updated_time,
      description: show.description || '', // Often empty from bulk API
      picture: {
        medium: show.pictures?.medium || '',
        large: show.pictures?.large || '',
        thumbnail: show.pictures?.thumbnail || ''
      },
      audio_length: show.audio_length || 0,
      user: {
        username: show.user?.username || '',
        name: show.user?.name || ''
      },
      tags: show.tags?.map((tag: any) => ({
        name: tag.name,
        url: tag.url
      })) || [],
      sections: show.sections?.map((section: any) => ({
        start_time: section.start_time,
        track: section.track ? {
          name: section.track.name,
          artist: {
            name: section.track.artist?.name || 'Unknown Artist'
          }
        } : undefined
      })) || []
    })) || []

    const totalCount = data.paging?.total || shows.length
    const hasMore = (offset + shows.length) < totalCount

    console.log(`Successfully fetched ${shows.length} shows (${totalCount} total available)`)

    return NextResponse.json({
      success: true,
      shows,
      total_count: totalCount,
      has_more: hasMore,
      message: `Fetched ${shows.length} shows from ${username}'s archive`
    })

  } catch (error) {
    console.error('Fetch archive error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error while fetching archive',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }, { status: 500 })
  }
})

export const GET = handler