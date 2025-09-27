/**
 * Helper functions for podcast audio upload
 * Handles large file uploads by bypassing Edge Function limits
 */

interface UploadOptions {
  storyId?: string
  title?: string
  onProgress?: (progress: number) => void
}

interface UploadResult {
  success: boolean
  audio?: {
    url: string
    path: string
    fileName: string
    size: number
    mimeType: string
    storage: string
  }
  error?: string
}

/**
 * Upload audio file directly to Supabase via FormData
 * This bypasses the 6MB Edge Function limit
 */
export async function uploadAudioToSupabase(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    console.log(`Uploading audio file: ${fileName}, size: ${audioBuffer.byteLength} bytes`)

    // Create FormData for multipart upload
    const formData = new FormData()

    // Create blob from buffer
    const audioBlob = new Blob([audioBuffer], { type: mimeType })
    formData.append('audioFile', audioBlob, fileName)

    // Add metadata as JSON string
    if (options.storyId || options.title) {
      formData.append('metadata', JSON.stringify({
        storyId: options.storyId,
        title: options.title
      }))
    }

    // Upload using fetch with multipart/form-data
    const response = await fetch('/api/podcast/upload-to-supabase', {
      method: 'POST',
      body: formData // Don't set Content-Type header - let browser set it with boundary
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Upload failed: ${response.status}`)
    }

    const result = await response.json()
    console.log('Upload successful:', result.audio?.url)

    return {
      success: true,
      audio: result.audio
    }

  } catch (error: any) {
    console.error('Upload failed:', error)
    return {
      success: false,
      error: error.message || 'Upload failed'
    }
  }
}

/**
 * Upload audio via base64 (for smaller files < 4MB)
 * Uses the existing JSON API method
 */
export async function uploadAudioViaBase64(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // Check file size - use FormData upload for larger files
    const fileSizeMB = audioBuffer.byteLength / (1024 * 1024)
    if (fileSizeMB > 4) {
      console.log(`File too large for base64 upload (${fileSizeMB.toFixed(1)}MB), using direct upload...`)
      return uploadAudioToSupabase(audioBuffer, fileName, mimeType, options)
    }

    console.log(`Uploading audio via base64: ${fileName}, size: ${audioBuffer.byteLength} bytes`)

    // Convert to base64
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')

    const response = await fetch('/api/podcast/upload-to-supabase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audioData: audioBase64,
        audioMimeType: mimeType,
        fileName,
        storyId: options.storyId,
        title: options.title
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Upload failed: ${response.status}`)
    }

    const result = await response.json()
    console.log('Base64 upload successful:', result.audio?.url)

    return {
      success: true,
      audio: result.audio
    }

  } catch (error: any) {
    console.error('Base64 upload failed:', error)
    return {
      success: false,
      error: error.message || 'Upload failed'
    }
  }
}

/**
 * Smart upload function - automatically chooses best method based on file size
 */
export async function uploadPodcastAudio(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const fileSizeMB = audioBuffer.byteLength / (1024 * 1024)

  console.log(`Smart upload for ${fileName}: ${fileSizeMB.toFixed(1)}MB`)

  // Use direct upload for files > 4MB to avoid Edge Function limits
  if (fileSizeMB > 4) {
    return uploadAudioToSupabase(audioBuffer, fileName, mimeType, options)
  } else {
    return uploadAudioViaBase64(audioBuffer, fileName, mimeType, options)
  }
}

/**
 * Upload and publish podcast to Podbean
 */
export async function uploadAndPublishPodcast(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  title: string,
  description: string,
  options: UploadOptions = {}
): Promise<{ success: boolean; audio?: any; podcast?: any; error?: string }> {
  try {
    // First upload to Supabase
    const uploadResult = await uploadPodcastAudio(audioBuffer, fileName, mimeType, {
      ...options,
      title
    })

    if (!uploadResult.success || !uploadResult.audio) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload audio'
      }
    }

    console.log('Audio uploaded successfully, now publishing to Podbean...')

    // Then publish to Podbean using the Supabase URL
    const publishResponse = await fetch('/api/podcast/publish-to-podbean', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        description,
        audioUrl: uploadResult.audio.url, // Use the Supabase URL
        fileName,
        storyId: options.storyId
      })
    })

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json()
      return {
        success: false,
        audio: uploadResult.audio,
        error: errorData.error || 'Failed to publish to Podbean'
      }
    }

    const publishResult = await publishResponse.json()

    return {
      success: true,
      audio: uploadResult.audio,
      podcast: publishResult
    }

  } catch (error: any) {
    console.error('Upload and publish failed:', error)
    return {
      success: false,
      error: error.message || 'Upload and publish failed'
    }
  }
}