import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { generateContent } from '@/lib/ai/content-generator'
import { getArtistDiscographyForProfile } from '@/lib/external-apis/discogs'

interface GenerateProfileRequest {
  artistName: string
  additionalContext?: string
  targetLength?: 'short' | 'medium' | 'long'
  includeDiscography?: boolean
  maxReleases?: number
  includeReleaseDetails?: boolean
  discogsUrl?: string  // New field for specific Discogs artist URL
  discogsId?: string   // New field for specific Discogs artist ID
}

interface GenerateProfileResponse {
  success: boolean
  content?: any
  discography?: any[]
  artistInfo?: any
  message?: string
  error?: string
}

/**
 * POST /api/ai/generate-artist-profile-with-discography
 * Generate artist profile content with Discogs discography integration
 */
const handler = withAdminAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  try {
    const body: GenerateProfileRequest = await request.json()
    const {
      artistName,
      additionalContext = '',
      targetLength = 'medium',
      includeDiscography = true,
      maxReleases = 15,
      includeReleaseDetails = true,
      discogsUrl,
      discogsId
    } = body

    if (!artistName?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Artist name is required'
      }, { status: 400 })
    }

    console.log(`[Artist Profile Generator] Starting profile generation for: ${artistName}`)

    // Fetch discography from Discogs if requested
    let discographyData = null
    if (includeDiscography) {
      console.log(`[Artist Profile Generator] Fetching discography from Discogs...`)

      discographyData = await getArtistDiscographyForProfile(artistName, {
        maxReleases,
        includeDetails: includeReleaseDetails,
        discogsUrl,
        discogsId
      })

      if (!discographyData.success) {
        console.warn(`[Artist Profile Generator] Discography fetch failed: ${discographyData.error}`)
        // Continue without discography rather than failing completely
      } else {
        console.log(`[Artist Profile Generator] Found ${discographyData.releases.length} releases`)
      }
    }

    // Prepare context for AI generation
    let enhancedContext = additionalContext
    if (discographyData?.success && discographyData.releases.length > 0) {
      const releasesList = discographyData.releases
        .slice(0, 10) // Limit for context
        .map(release => `${release.year}: ${release.title} (${release.label})`)
        .join('\n')

      enhancedContext += `\n\nKey releases:\n${releasesList}`
    }

    // Generate AI content with enhanced context
    console.log(`[Artist Profile Generator] Generating AI content with discography context...`)

    const prompt = `Create a comprehensive artist profile for ${artistName}. Include their musical style, career highlights, and impact on the music industry. ${enhancedContext.trim() ? `\n\nContext: ${enhancedContext}` : ''}`

    let aiContent
    try {
      aiContent = await generateContent({
        type: 'artist-profile',
        topic: artistName,
        targetLength,
        additionalContext: enhancedContext
      })
      console.log(`[Artist Profile Generator] AI content generated successfully`)
    } catch (aiError) {
      console.error(`[Artist Profile Generator] AI generation failed:`, aiError)
      // Fallback to basic content structure if AI fails
      aiContent = {
        title: `${artistName} - Artist Profile`,
        seoTitle: `${artistName} - Complete Artist Profile`,
        subtitle: `Comprehensive profile of ${artistName}`,
        metaDescription: `Learn about ${artistName}'s music, career, and discography.`,
        content: `${artistName} is a renowned artist with a significant impact on the music industry.`,
        richTextContent: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `${artistName} is a renowned artist with a significant impact on the music industry.`
                }
              ]
            }
          ]
        },
        tags: ['artist', 'profile', 'music'],
        category: 'Artist Profiles',
        metadata: {
          generatedAt: new Date().toISOString(),
          contentType: 'artist-profile' as const,
          wordCount: 50
        },
        searchResults: []
      }
    }

    const response: GenerateProfileResponse = {
      success: true,
      content: aiContent,
      message: `Artist profile generated successfully for ${artistName}`
    }

    // Add discography if available
    if (discographyData?.success) {
      response.discography = discographyData.releases
      response.artistInfo = discographyData.artistInfo
      response.message += ` with ${discographyData.releases.length} releases`
    } else if (includeDiscography) {
      response.message += ` (discography not available)`
    }

    console.log(`[Artist Profile Generator] Profile generation completed`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Artist profile generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate artist profile'
    }, { status: 500 })
  }
})

export { handler as POST }