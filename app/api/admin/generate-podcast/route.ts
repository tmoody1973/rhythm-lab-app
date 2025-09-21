import { NextRequest, NextResponse } from 'next/server'
import { generatePodcastFromDeepDive } from '@/lib/elevenlabs/podcast-generator'
import { uploadAudioToStoryblok, addAudioToDeepDive } from '@/lib/storyblok/content-api'

const STORYBLOK_SPACE_ID = parseInt(process.env.STORYBLOK_SPACE_ID || '0')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, voice, storyId } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Deep dive content is required' },
        { status: 400 }
      )
    }

    if (!STORYBLOK_SPACE_ID) {
      return NextResponse.json(
        { error: 'Storyblok space ID not configured' },
        { status: 500 }
      )
    }

    console.log('Generating podcast from deep dive content...')

    // Step 1: Generate podcast audio using ElevenLabs
    const podcastResult = await generatePodcastFromDeepDive(content, {
      voice: voice || 'professional_male',
      stability: 0.71,
      clarityBoost: 0.5,
      speakerBoost: true
    })

    if (!podcastResult.success || !podcastResult.audioBuffer) {
      return NextResponse.json(
        {
          success: false,
          error: podcastResult.error || 'Failed to generate podcast audio'
        },
        { status: 500 }
      )
    }

    // Step 2: Upload audio to Storyblok (if storyId is provided)
    let uploadResult = null
    let updateResult = null

    if (storyId && STORYBLOK_SPACE_ID) {
      console.log('Uploading audio to Storyblok...')

      const filename = `podcast-${storyId}-${Date.now()}.mp3`

      uploadResult = await uploadAudioToStoryblok(
        podcastResult.audioBuffer,
        filename,
        STORYBLOK_SPACE_ID
      )

      if (uploadResult.success && uploadResult.asset) {
        console.log('Adding audio to deep dive story...')

        updateResult = await addAudioToDeepDive(
          parseInt(storyId),
          uploadResult.asset,
          STORYBLOK_SPACE_ID
        )
      }
    }

    // Step 3: Prepare response
    const response: any = {
      success: true,
      podcast: {
        script: podcastResult.script,
        audioSize: podcastResult.audioBuffer.length,
        duration: Math.ceil(podcastResult.script?.length || 0 / 800), // Rough estimate
      },
      storyblok: storyId ? {
        audioUploaded: uploadResult?.success || false,
        storyUpdated: updateResult?.success || false,
        asset: uploadResult?.asset,
        error: uploadResult?.error || updateResult?.error
      } : null
    }

    // Step 4: If no Storyblok integration, return audio as base64 for download
    if (!storyId) {
      response.podcast = {
        ...response.podcast,
        audioBase64: podcastResult.audioBuffer.toString('base64')
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Podcast generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate podcast'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check ElevenLabs usage and available voices
export async function GET(request: NextRequest) {
  try {
    const { getAvailableVoices, getUsageInfo } = await import('@/lib/elevenlabs/podcast-generator')

    const [voicesResult, usageResult] = await Promise.all([
      getAvailableVoices(),
      getUsageInfo()
    ])

    return NextResponse.json({
      voices: voicesResult.success ? voicesResult.voices : [],
      usage: usageResult.success ? usageResult.usage : null,
      errors: {
        voices: voicesResult.error,
        usage: usageResult.error
      }
    })

  } catch (error: any) {
    console.error('Error fetching ElevenLabs info:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ElevenLabs info' },
      { status: 500 }
    )
  }
}