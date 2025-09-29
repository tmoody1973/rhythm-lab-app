import { NextRequest, NextResponse } from 'next/server'
import { generateContent, ContentRequest } from '@/lib/ai/content-generator'
import { withAdminAuth } from '@/lib/auth/admin'

const handler = withAdminAuth(async (request: NextRequest) => {
  try {
    const { title, tracks } = await request.json()

    // Validate required fields
    if (!title || !tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title and tracks array are required' },
        { status: 400 }
      )
    }

    // Additional input validation for security
    if (typeof title !== 'string' || title.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Invalid title (max 500 characters)' },
        { status: 400 }
      )
    }

    if (tracks.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Too many tracks (max 100)' },
        { status: 400 }
      )
    }

    // Format tracklist for the AI prompt
    const tracklistText = formatTracksForPrompt(tracks)

    // Create content request for show description
    const contentRequest: ContentRequest = {
      type: 'show-description',
      topic: title,
      additionalContext: tracklistText,
      targetLength: 'short' // Show descriptions should be concise
    }

    // Generate content using the existing system
    const generatedContent = await generateContent(contentRequest)

    // Extract just the description text (first 500-600 chars of the generated content)
    const description = extractDescription(generatedContent.richTextContent)

    return NextResponse.json({
      success: true,
      description,
      characterCount: description.length,
      metadata: {
        generatedAt: new Date().toISOString(),
        tracksAnalyzed: tracks.length,
        title: title
      }
    })

  } catch (error: any) {
    console.error('Error generating show description:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate description',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
})

export const POST = handler

// Format tracks array into readable text for the AI prompt
function formatTracksForPrompt(tracks: any[]): string {
  if (!tracks || tracks.length === 0) {
    return 'No tracks provided'
  }

  let formattedText = ''
  let currentHour = null

  tracks.forEach((track, index) => {
    // Add hour headers if present
    if (track.hour && track.hour !== currentHour) {
      currentHour = track.hour
      if (index > 0) formattedText += '\n'
      formattedText += `HOUR ${track.hour}\n`
    }

    // Add track info
    if (track.artist && track.track) {
      formattedText += `${track.position || index + 1}. ${track.artist} - ${track.track}\n`
    } else if (track.artist || track.track) {
      formattedText += `${track.position || index + 1}. ${track.artist || track.track}\n`
    }
  })

  return formattedText.trim()
}

// Extract plain text description from Storyblok rich text format
function extractDescription(richTextContent: any): string {
  if (!richTextContent || !richTextContent.content) {
    return ''
  }

  let description = ''

  function extractTextFromNode(node: any): void {
    if (node.type === 'text' && node.text) {
      description += node.text
    } else if (node.content && Array.isArray(node.content)) {
      node.content.forEach(extractTextFromNode)
    }
  }

  richTextContent.content.forEach(extractTextFromNode)

  // Clean up the description
  description = description.trim().replace(/\s+/g, ' ')

  // Ensure it's within the 500-600 character range
  if (description.length > 600) {
    // Find the last complete sentence within 600 chars
    const truncated = description.substring(0, 597) + '...'
    const lastPeriod = truncated.lastIndexOf('.')
    const lastExclamation = truncated.lastIndexOf('!')
    const lastQuestion = truncated.lastIndexOf('?')

    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion)

    if (lastSentenceEnd > 450) { // Don't truncate too early
      description = description.substring(0, lastSentenceEnd + 1)
    } else {
      description = truncated
    }
  } else if (description.length < 500) {
    // If too short, we'll let it be - the AI should handle this in the prompt
    console.warn(`Generated description is only ${description.length} characters, below optimal range`)
  }

  return description
}