import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'

interface FetchSingleRequest {
  url?: string
  key?: string
}

interface FetchSingleResponse {
  success: boolean
  show?: {
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
    // Additional fields for easy import
    embed_code?: string
    formatted_duration?: string
  }
  message?: string
  errors?: string[]
}

/**
 * GET /api/mixcloud/fetch-single?url={mixcloud_url}
 * POST /api/mixcloud/fetch-single with { url: "..." }
 * Fetch metadata for a single Mixcloud show
 */
const handler = withAdminAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  try {
    let mixcloudUrl: string | null = null

    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url)
      mixcloudUrl = searchParams.get('url')
    } else if (request.method === 'POST') {
      const body: FetchSingleRequest = await request.json()
      mixcloudUrl = body.url || body.key
    }

    if (!mixcloudUrl) {
      return NextResponse.json({
        success: false,
        message: 'Mixcloud URL or key is required'
      }, { status: 400 })
    }

    // Extract key from full URL if needed
    let apiKey = mixcloudUrl
    if (mixcloudUrl.includes('mixcloud.com')) {
      // Extract username/slug from URL like https://www.mixcloud.com/username/show-name/
      const urlMatch = mixcloudUrl.match(/mixcloud\.com\/([^\/]+\/[^\/]+)\/?/)
      if (urlMatch) {
        apiKey = urlMatch[1]
      } else {
        return NextResponse.json({
          success: false,
          message: 'Invalid Mixcloud URL format'
        }, { status: 400 })
      }
    }

    console.log(`Fetching single show: ${apiKey}`)

    // Fetch show data from Mixcloud API
    const apiUrl = `https://api.mixcloud.com/${apiKey}/`

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Rhythm Lab Radio App'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          message: `Show not found: ${apiKey}`
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        message: `Mixcloud API error: ${response.status}`
      }, { status: response.status })
    }

    const data = await response.json()

    // Format duration for display
    const formatDuration = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = seconds % 60

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
      }
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    // Generate embed code
    const generateEmbedCode = (showKey: string): string => {
      return `<iframe width="100%" height="60" src="https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=%2F${showKey.replace('/', '%2F')}%2F" frameborder="0"></iframe>`
    }

    // Transform data for our format
    const show = {
      key: data.key,
      name: data.name,
      slug: data.slug,
      url: data.url,
      created_time: data.created_time,
      updated_time: data.updated_time,
      description: data.description || '',
      picture: {
        medium: data.pictures?.medium || '',
        large: data.pictures?.large || '',
        thumbnail: data.pictures?.thumbnail || ''
      },
      audio_length: data.audio_length || 0,
      user: {
        username: data.user?.username || '',
        name: data.user?.name || ''
      },
      tags: data.tags?.map((tag: any) => ({
        name: tag.name,
        url: tag.url
      })) || [],
      sections: data.sections?.map((section: any) => ({
        start_time: section.start_time,
        track: section.track ? {
          name: section.track.name,
          artist: {
            name: section.track.artist?.name || 'Unknown Artist'
          }
        } : undefined
      })) || [],
      // Additional fields for easy import
      embed_code: generateEmbedCode(data.key),
      formatted_duration: formatDuration(data.audio_length || 0)
    }

    console.log(`Successfully fetched show: ${show.name} (${show.formatted_duration})`)

    return NextResponse.json({
      success: true,
      show,
      message: `Successfully fetched show: ${show.name}`
    })

  } catch (error) {
    console.error('Fetch single error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error while fetching show',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }, { status: 500 })
  }
})

export const GET = handler
export const POST = handler