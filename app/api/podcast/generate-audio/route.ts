import { NextRequest, NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { supabaseStorage } from '@/lib/supabase'

interface ScriptLine {
  speaker: 'Samara' | 'Carl'
  text: string
}

// Voice mapping for Sound Refinery hosts
const VOICE_MAP = {
  "Samara": "2zRM7PkgwBPiau2jvVXc",
  "Carl": "NNl6r8mD7vthiJatiJt1"
}

// Clean audio tags that ElevenLabs doesn't properly support
function cleanAudioTags(text: string): string {
  return text
    // Remove common audio tags that get spoken instead of processed
    .replace(/\[pause\]/gi, '... ')
    .replace(/\[chuckles\]/gi, '*chuckles* ')
    .replace(/\[laughs\]/gi, '*laughs* ')
    .replace(/\[with warmth\]/gi, '')
    .replace(/\[reflective\]/gi, '')
    .replace(/\[with excitement\]/gi, '')
    .replace(/\[thoughtful\]/gi, '')
    .replace(/\[surprised\]/gi, '')
    .replace(/\[impressed\]/gi, '')
    .replace(/\[serious\]/gi, '')
    .replace(/\[enthusiastic\]/gi, '')
    .replace(/\[warm\]/gi, '')
    .replace(/\[emphasizes\]/gi, '')
    .replace(/\[whispers\]/gi, '')
    .replace(/\[excited\]/gi, '')
    // Convert some tags to natural punctuation for better speech
    .replace(/\[pause\]/gi, '... ')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { script } = body

    if (!script || !Array.isArray(script)) {
      return NextResponse.json(
        { error: 'Script array is required' },
        { status: 400 }
      )
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    console.log(`Generating audio for script with ${script.length} lines...`)

    // Initialize ElevenLabs client
    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    })

    // Convert script to conversational audio using ElevenLabs conversational AI
    const audioSegments: Buffer[] = []

    try {
      console.log('Generating individual TTS for each speaker...')

      for (const line of script) {
        const voiceId = VOICE_MAP[line.speaker]

        if (!voiceId) {
          throw new Error(`Voice not found for speaker: ${line.speaker}`)
        }

        console.log(`Generating audio for ${line.speaker}: "${line.text.substring(0, 50)}..."`)

        // Clean the text to remove or convert audio tags that ElevenLabs doesn't support
        const cleanedText = cleanAudioTags(line.text)

        console.log(`Original: "${line.text}"`)
        console.log(`Cleaned: "${cleanedText}"`)

        // Generate audio for this line with optimized settings for each speaker
        const voiceSettings = line.speaker === 'Samara' ? {
          // More dynamic settings for Samara to sound bouncy and energetic
          stability: 0.35,        // Lower stability for more variation and energy
          similarity_boost: 0.75, // Keep recommended similarity
          style: 0.15,            // Add some style for more personality
          use_speaker_boost: true,
        } : {
          // Settings for Carl - more stable and authoritative
          stability: 0.55,
          similarity_boost: 0.80,
          style: 0.05,
          use_speaker_boost: true
        }

        console.log(`Voice settings for ${line.speaker}:`, voiceSettings)

        // Prepare the API request with potential speed control
        const requestOptions: any = {
          text: cleanedText,
          modelId: "eleven_turbo_v2_5", // Latest model with better audio tag support
          voice_settings: voiceSettings
        }

        // Try to add speed control for Samara (if supported by API)
        if (line.speaker === 'Samara') {
          // Attempt to add speed parameter for more energetic delivery
          try {
            requestOptions.voice_settings = {
              ...voiceSettings,
              // Some ElevenLabs plans support speed control
              speed: 1.1 // Slightly faster for Samara
            }
          } catch (e) {
            // If speed not supported, continue without it
            console.log('Speed parameter not supported, using default rate')
          }
        }

        console.log(`Request options for ${line.speaker}:`, requestOptions)

        const audioBuffer = await elevenlabs.textToSpeech.convert(voiceId, requestOptions)

        // Convert ReadableStream to Buffer
        if (audioBuffer && typeof audioBuffer === 'object' && 'getReader' in audioBuffer) {
          const reader = (audioBuffer as ReadableStream).getReader()
          const chunks: Uint8Array[] = []

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks.push(value)
          }

          const buffer = Buffer.concat(chunks)
          audioSegments.push(buffer)
        } else if (Buffer.isBuffer(audioBuffer)) {
          audioSegments.push(audioBuffer)
        } else {
          // Handle other possible return types
          const buffer = Buffer.from(audioBuffer as ArrayBuffer)
          audioSegments.push(buffer)
        }

        // Add a small pause between speakers for natural conversation flow
        const currentIndex = script.indexOf(line)
        if (currentIndex < script.length - 1) {
          const nextSpeaker = script[currentIndex + 1]?.speaker

          // Different pause lengths for different speaker transitions
          let pauseDuration = 0.3 // Default 0.3 seconds

          if (line.speaker !== nextSpeaker) {
            // Longer pause when switching speakers
            pauseDuration = 0.5
          }

          // Create pause buffer (44.1kHz sample rate, mono)
          const pauseFrames = Math.floor(44100 * pauseDuration)
          const pauseBuffer = Buffer.alloc(pauseFrames * 2) // 16-bit audio = 2 bytes per sample
          audioSegments.push(pauseBuffer)
        }
      }

      // Combine all audio segments into one file
      const finalAudio = Buffer.concat(audioSegments)

      console.log(`Generated audio: ${finalAudio.length} bytes`)

      // Check file size and decide how to return the audio
      const fileSizeMB = finalAudio.length / (1024 * 1024)
      const PAYLOAD_LIMIT_MB = 4 // Safe limit for Edge Functions

      if (fileSizeMB > PAYLOAD_LIMIT_MB) {
        console.log(`Audio file too large for payload (${fileSizeMB.toFixed(1)}MB), uploading to storage...`)

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const fileName = `sound-refinery-podcast-${timestamp}.mp3`

        // Upload directly to Supabase storage
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storagePath = `podcasts/sound-refinery/${timestamp}_${sanitizedFileName}`

        console.log(`Uploading to Supabase path: ${storagePath}`)

        const { data: uploadData, error: uploadError } = await supabaseStorage
          .from('audio_files')
          .upload(storagePath, finalAudio, {
            contentType: 'audio/mpeg',
            cacheControl: '3600',
            upsert: false,
            metadata: {
              title: 'Sound Refinery Podcast',
              originalFileName: fileName,
              uploadedAt: new Date().toISOString(),
              source: 'admin-podcast-generator'
            }
          })

        if (uploadError) {
          console.error('Supabase upload error:', uploadError)
          throw new Error(`Failed to upload audio to storage: ${uploadError.message}`)
        }

        // Get the public URL for the uploaded file
        const { data: urlData } = supabaseStorage
          .from('audio_files')
          .getPublicUrl(storagePath)

        const publicUrl = urlData.publicUrl
        console.log(`Audio uploaded successfully to: ${publicUrl}`)

        return NextResponse.json({
          success: true,
          audio: {
            url: publicUrl,
            path: storagePath,
            fileName: fileName,
            mimeType: 'audio/mpeg',
            size: finalAudio.length,
            duration: Math.round(script.length * 3), // Rough estimate: 3 seconds per line
            storage: 'supabase',
            uploadedToStorage: true
          },
          metadata: {
            generatedAt: new Date().toISOString(),
            scriptLines: script.length,
            voices: ['Samara', 'Carl'],
            format: 'mp3_44100_128',
            fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
            storagePath: storagePath
          }
        })
      } else {
        console.log(`Audio file small enough for payload (${fileSizeMB.toFixed(1)}MB), returning as base64...`)

        // Return the audio as base64 for small files
        const audioBase64 = finalAudio.toString('base64')

        return NextResponse.json({
          success: true,
          audio: {
            data: audioBase64,
            mimeType: 'audio/mpeg',
            size: finalAudio.length,
            duration: Math.round(script.length * 3), // Rough estimate: 3 seconds per line
            uploadedToStorage: false
          },
          metadata: {
            generatedAt: new Date().toISOString(),
            scriptLines: script.length,
            voices: ['Samara', 'Carl'],
            format: 'mp3_44100_128',
            fileSizeMB: parseFloat(fileSizeMB.toFixed(2))
          }
        })
      }

    } catch (elevenLabsError: any) {
      console.error('ElevenLabs API error:', elevenLabsError)
      return NextResponse.json(
        {
          error: 'Failed to generate audio with ElevenLabs',
          details: elevenLabsError.message || 'Unknown ElevenLabs error'
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Audio generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate podcast audio',
        details: error.message
      },
      { status: 500 }
    )
  }
}