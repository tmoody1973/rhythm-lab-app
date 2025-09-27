import { NextRequest, NextResponse } from 'next/server'
import { generatePodcastFromDeepDive } from '@/lib/elevenlabs/podcast-generator'
import { uploadPodcastAudio } from '@/lib/podcast/upload-helper'

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

    // Step 2: Upload audio to Supabase (always) and optionally update Storyblok
    console.log('Uploading audio to Supabase...')

    const filename = `podcast-${storyId || 'generated'}-${Date.now()}.mp3`

    const uploadResult = await uploadPodcastAudio(
      podcastResult.audioBuffer,
      filename,
      'audio/mpeg',
      {
        storyId,
        title: `Sound Refinery Podcast${storyId ? ` - Story ${storyId}` : ''}`
      }
    )

    if (!uploadResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error || 'Failed to upload audio to Supabase'
        },
        { status: 500 }
      )
    }

    // Step 3: Prepare response
    const response: any = {
      success: true,
      podcast: {
        script: podcastResult.script,
        audioSize: podcastResult.audioBuffer.length,
        duration: Math.ceil(podcastResult.script?.length || 0 / 800), // Rough estimate
        audioUrl: uploadResult.audio?.url, // Supabase public URL
        fileName: uploadResult.audio?.fileName,
        storage: 'supabase'
      },
      audio: uploadResult.audio, // Full audio metadata from Supabase
      storyblok: storyId && uploadResult.audio ? {
        audioUploaded: true,
        storyUpdated: true, // Supabase route handles Storyblok update
        audioUrl: uploadResult.audio.url,
        storage: 'supabase'
      } : null
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