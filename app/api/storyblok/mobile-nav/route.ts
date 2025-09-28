import { NextRequest, NextResponse } from 'next/server'

interface StoryblokMobileNavResponse {
  success: boolean
  story?: any
  message?: string
  error?: string
}

/**
 * GET /api/storyblok/mobile-nav
 * Fetch Mobile Navigation content from Storyblok
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const storyblokToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN

    if (!storyblokToken) {
      return NextResponse.json({
        success: false,
        error: 'Storyblok access token not configured'
      }, { status: 500 })
    }

    // Build Storyblok API URL
    const params = new URLSearchParams({
      token: storyblokToken,
      version: 'published',
      resolve_links: 'url',
      resolve_relations: []
    })

    console.log('Fetching Mobile Navigation from Storyblok...')

    // Try different possible slugs for the Mobile Navigation story
    const possibleSlugs = [
      'mobile-navigation',
      'mobile-nav',
      'mobile_navigation',
      'nav'
    ]

    let response
    let data
    let foundSlug = null

    for (const slug of possibleSlugs) {
      try {
        response = await fetch(`https://api.storyblok.com/v2/cdn/stories/${slug}?${params}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Rhythm Lab Radio App'
          }
        })

        if (response.ok) {
          data = await response.json()
          foundSlug = slug
          console.log(`Found Mobile Navigation with slug: ${slug}`)
          break
        }
      } catch (error) {
        console.log(`Slug ${slug} not found, trying next...`)
        continue
      }
    }

    if (!foundSlug || !response?.ok) {
      console.error('Mobile Navigation not found with any of the expected slugs:', possibleSlugs)
      return NextResponse.json({
        success: false,
        error: 'Mobile Navigation not found in Storyblok'
      }, { status: 404 })
    }

    if (!data.story) {
      return NextResponse.json({
        success: false,
        error: 'No story data returned from Storyblok'
      }, { status: 404 })
    }

    // Log the component type for debugging
    console.log('Story component:', data.story.content?.component)

    return NextResponse.json({
      success: true,
      story: data.story,
      message: `Mobile Navigation loaded successfully from slug: ${foundSlug}`
    })

  } catch (error) {
    console.error('Storyblok Mobile Navigation API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}