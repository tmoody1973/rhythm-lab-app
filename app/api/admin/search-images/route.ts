import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { searchImages, generateImageSearchQueries } from '@/lib/serpapi/image-search'

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { query, contentType, maxResults = 20 } = body

    if (!query?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Search for images using SerpAPI
    const searchResult = await searchImages({
      query: query.trim(),
      safeSearch: 'active',
      imageType: 'photos',
      imageSize: 'large',
      maxResults,
      page: 1
    })

    if (!searchResult.success) {
      return NextResponse.json(
        { success: false, error: searchResult.error },
        { status: 500 }
      )
    }

    // Generate additional suggested queries if this is the first search
    const suggestedQueries = generateImageSearchQueries({
      title: query,
      type: contentType,
      topic: query
    })

    return NextResponse.json({
      success: true,
      images: searchResult.images,
      searchInfo: searchResult.searchInfo,
      suggestedQueries: suggestedQueries.filter(q => q !== query) // Remove current query
    })

  } catch (error: any) {
    console.error('Image search API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})