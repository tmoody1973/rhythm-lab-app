import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Webhook endpoint for Storyblok to trigger cache revalidation
 * This ensures that when content is updated in Storyblok,
 * Vercel's cache is purged and fresh content is served
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the webhook is from Storyblok (optional security)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.STORYBLOK_WEBHOOK_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the webhook payload
    const body = await request.json()

    // Get the story that was updated
    const story = body.story || body
    const storySlug = story.slug || story.full_slug
    const storyPath = story.full_slug || story.slug

    console.log('[Revalidate] Processing webhook for story:', storySlug)

    // Revalidate specific paths based on content type
    const pathsToRevalidate = []

    // Determine paths to revalidate based on story structure
    if (storyPath) {
      // Handle different content types
      if (storyPath.startsWith('blog/')) {
        // Blog post - revalidate the specific post and blog listing
        const slug = storyPath.replace('blog/', '')
        pathsToRevalidate.push(`/blog/${slug}`)
        pathsToRevalidate.push('/blog')
      } else if (storyPath.startsWith('deep-dives/')) {
        // Deep dive - revalidate the specific post and listing
        const slug = storyPath.replace('deep-dives/', '')
        pathsToRevalidate.push(`/deep-dives/${slug}`)
        pathsToRevalidate.push('/deep-dives')
      } else if (storyPath.startsWith('profiles/')) {
        // Profile - revalidate the specific profile and listing
        const slug = storyPath.replace('profiles/', '')
        pathsToRevalidate.push(`/profiles/${slug}`)
        pathsToRevalidate.push('/profiles')
      } else {
        // Generic content - try to revalidate based on slug
        pathsToRevalidate.push(`/${storySlug}`)
      }
    }

    // Always revalidate the home page as it might show recent content
    pathsToRevalidate.push('/')

    // Revalidate all identified paths
    const revalidationPromises = pathsToRevalidate.map(async (path) => {
      try {
        revalidatePath(path)
        console.log(`[Revalidate] Successfully revalidated: ${path}`)
        return { path, success: true }
      } catch (error) {
        console.error(`[Revalidate] Failed to revalidate ${path}:`, error)
        return { path, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    const results = await Promise.all(revalidationPromises)

    // Also revalidate by tags if using tagged caching
    try {
      revalidateTag('storyblok')
      revalidateTag(`story-${story.id}`)
      console.log('[Revalidate] Successfully revalidated tags')
    } catch (error) {
      console.error('[Revalidate] Failed to revalidate tags:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Cache revalidated successfully',
      story: storySlug,
      paths: pathsToRevalidate,
      results
    })

  } catch (error) {
    console.error('[Revalidate] Webhook processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: 'Storyblok revalidation webhook endpoint',
    usage: 'POST to this endpoint with Storyblok webhook payload to trigger cache revalidation'
  })
}