import { generatePodcastScript } from '../ai/content-generator'

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

// Voice options - you can customize these based on your ElevenLabs account
export const VOICE_OPTIONS = {
  // Professional podcast voice options
  professional_male: 'onwK4e9ZLuTAKqWW03F9', // Example voice ID
  professional_female: 'ThT5KcBeYPX3keUQqHPh', // Example voice ID
  conversational: 'pNInz6obpgDQGcFmaJgB', // Example voice ID
} as const

export type VoiceOption = keyof typeof VOICE_OPTIONS

// Audio generation settings
export interface PodcastGenerationOptions {
  voice: VoiceOption
  speed?: number // 0.25 - 4.0
  stability?: number // 0.0 - 1.0
  clarityBoost?: number // 0.0 - 1.0
  speakerBoost?: boolean
  outputFormat?: 'mp3_44100_128' | 'mp3_22050_32' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000'
}

// Generate podcast audio from deep dive content
export async function generatePodcastFromDeepDive(
  deepDiveContent: string,
  options: PodcastGenerationOptions = { voice: 'professional_male' }
): Promise<{ success: boolean; audioBuffer?: Buffer; script?: string; error?: string }> {
  try {
    console.log('Generating podcast script from deep dive content...')

    // Step 1: Convert deep dive content to podcast script
    const script = await generatePodcastScript(deepDiveContent)

    console.log('Script generated, converting to audio...')

    // Step 2: Generate audio using ElevenLabs
    const audioResult = await generateAudioFromScript(script, options)

    if (audioResult.success && audioResult.audioBuffer) {
      return {
        success: true,
        audioBuffer: audioResult.audioBuffer,
        script: script
      }
    } else {
      return {
        success: false,
        error: audioResult.error || 'Failed to generate audio'
      }
    }

  } catch (error: any) {
    console.error('Podcast generation error:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate podcast'
    }
  }
}

// Generate audio from script using ElevenLabs v3 API
export async function generateAudioFromScript(
  script: string,
  options: PodcastGenerationOptions
): Promise<{ success: boolean; audioBuffer?: Buffer; error?: string }> {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured')
    }

    const voiceId = VOICE_OPTIONS[options.voice]
    if (!voiceId) {
      throw new Error(`Invalid voice option: ${options.voice}`)
    }

    // Prepare the request payload for Eleven v3
    const payload = {
      text: script,
      model_id: 'eleven_v3', // Using Eleven v3 model
      voice_settings: {
        stability: options.stability ?? 0.5, // More natural setting for v3
        similarity_boost: options.clarityBoost ?? 0.75, // Better clarity for podcasts
        style: 0.0,
        use_speaker_boost: options.speakerBoost ?? true
      },
      pronunciation_dictionary_locators: [],
      seed: null,
      previous_text: null,
      next_text: null,
      previous_request_ids: [],
      next_request_ids: []
    }

    // Add speed control if specified
    if (options.speed && options.speed !== 1.0) {
      // Note: Speed control might require specific model support
      payload.voice_settings = {
        ...payload.voice_settings,
        // speed: options.speed // Uncomment if supported by your ElevenLabs plan
      }
    }

    console.log('Making request to ElevenLabs API...')

    const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
    }

    // Get audio data as buffer
    const audioArrayBuffer = await response.arrayBuffer()
    const audioBuffer = Buffer.from(audioArrayBuffer)

    console.log(`Audio generated successfully, size: ${audioBuffer.length} bytes`)

    return {
      success: true,
      audioBuffer: audioBuffer
    }

  } catch (error: any) {
    console.error('ElevenLabs API error:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate audio'
    }
  }
}

// Get available voices from ElevenLabs
export async function getAvailableVoices(): Promise<{ success: boolean; voices?: any[]; error?: string }> {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured')
    }

    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      voices: data.voices
    }

  } catch (error: any) {
    console.error('Error fetching voices:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch voices'
    }
  }
}

// Get user's subscription info and usage
export async function getUsageInfo(): Promise<{ success: boolean; usage?: any; error?: string }> {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured')
    }

    const response = await fetch(`${ELEVENLABS_BASE_URL}/user/subscription`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch usage info: ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      usage: data
    }

  } catch (error: any) {
    console.error('Error fetching usage info:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch usage info'
    }
  }
}

// Estimate character count and cost
export function estimatePodcastCost(script: string): {
  characterCount: number
  estimatedCost: number
  estimatedDuration: number
} {
  const characterCount = script.length

  // Rough estimates - adjust based on your ElevenLabs plan
  const costPerCharacter = 0.00003 // Example rate, check your actual pricing
  const charactersPerMinute = 800 // Rough estimate for speech

  return {
    characterCount,
    estimatedCost: characterCount * costPerCharacter,
    estimatedDuration: Math.ceil(characterCount / charactersPerMinute)
  }
}