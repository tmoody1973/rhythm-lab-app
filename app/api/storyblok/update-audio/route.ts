import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'

interface UpdateAudioRequest {
  storyId: string
  audioUrl: string
  audioTitle?: string
}

/**
 * POST /api/storyblok/update-audio
 * Update an existing Storyblok story with podcast audio URL
 */
const handler = withAdminAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  try {
    const body: UpdateAudioRequest = await request.json()

    if (!body.storyId || !body.audioUrl) {
      return NextResponse.json({
        success: false,
        message: 'Story ID and audio URL are required'
      }, { status: 400 })
    }

    if (!process.env.STORYBLOK_MANAGEMENT_TOKEN || !process.env.STORYBLOK_SPACE_ID) {
      return NextResponse.json({
        success: false,
        message: 'Storyblok configuration missing'
      }, { status: 500 })
    }

    const region = process.env.STORYBLOK_REGION || 'us'
    const apiBaseUrl = region === 'eu' ? 'https://mapi.storyblok.com' : 'https://api-us.storyblok.com'

    console.log(`Updating story ${body.storyId} with audio URL: ${body.audioUrl}`)

    // First, get the current story content
    const storyResponse = await fetch(
      `${apiBaseUrl}/v1/spaces/${process.env.STORYBLOK_SPACE_ID}/stories/${body.storyId}`,
      {
        headers: {
          'Authorization': process.env.STORYBLOK_MANAGEMENT_TOKEN,
        }
      }
    )

    if (!storyResponse.ok) {
      const error = await storyResponse.text()
      console.error('Failed to fetch story:', error)
      return NextResponse.json({
        success: false,
        message: `Failed to fetch story: ${storyResponse.status}`
      }, { status: storyResponse.status })
    }

    const storyData = await storyResponse.json()
    const story = storyData.story

    // Add audio URL to the story content
    const updatedContent = {
      ...story.content,
      podcast_audio_url: body.audioUrl,
      podcast_audio_title: body.audioTitle || `Podcast: ${story.name}`
    }

    console.log('Updating story content with podcast_audio_url:', body.audioUrl)

    // Update the story
    const updateResponse = await fetch(
      `${apiBaseUrl}/v1/spaces/${process.env.STORYBLOK_SPACE_ID}/stories/${body.storyId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': process.env.STORYBLOK_MANAGEMENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story: {
            content: updatedContent
          }
        })
      }
    )

    if (!updateResponse.ok) {
      const updateError = await updateResponse.text()
      console.error('Failed to update story:', updateError)
      return NextResponse.json({
        success: false,
        message: `Failed to update story: ${updateResponse.status}`
      }, { status: updateResponse.status })
    }

    const updatedStory = await updateResponse.json()
    console.log('Story updated successfully with podcast audio URL')

    return NextResponse.json({
      success: true,
      message: 'Story updated with podcast audio URL',
      story: {
        id: updatedStory.story.id,
        name: updatedStory.story.name,
        slug: updatedStory.story.slug,
        podcast_audio_url: body.audioUrl
      }
    })

  } catch (error) {
    console.error('Update audio error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

export const POST = handler