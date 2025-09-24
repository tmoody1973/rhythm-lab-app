/**
 * Client-side Mixcloud upload - bypasses server size limits
 * Uploads directly from browser to Mixcloud API
 */

export interface MixcloudUploadOptions {
  file: File
  title: string
  description?: string
  tags?: string[]
  tracks?: Array<{
    artist?: string
    song?: string
    track?: string  // Parser uses 'track'
    title?: string  // Alternative name
    start_time?: number
  }>
  coverImage?: File
}

export interface MixcloudUploadResult {
  success: boolean
  url?: string
  error?: string
  details?: any
}

/**
 * Upload audio file directly to Mixcloud from the browser
 * Bypasses Next.js API route to avoid serverless size limits
 */
export async function uploadToMixcloudDirect(
  accessToken: string,
  options: MixcloudUploadOptions,
  onProgress?: (percent: number) => void
): Promise<MixcloudUploadResult> {
  const { file, title, description, tags, tracks, coverImage } = options

  // Validate file size (Mixcloud limit is ~250MB)
  const maxSize = 250 * 1024 * 1024 // 250MB
  if (file.size > maxSize) {
    return {
      success: false,
      error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB (max 250MB)`
    }
  }

  // Build FormData
  const formData = new FormData()
  formData.append('mp3', file)
  formData.append('name', title)

  if (description) {
    formData.append('description', description)
  }

  // Add tags (Mixcloud expects individual tag fields, max 5)
  if (tags && tags.length > 0) {
    tags.slice(0, 5).forEach((tag, index) => {
      formData.append(`tags-${index}-tag`, tag)
    })
  }

  // Add track sections
  if (tracks && tracks.length > 0) {
    tracks.forEach((track, index) => {
      if (track.artist) {
        formData.append(`sections-${index}-artist`, track.artist)
      }
      // Handle both 'song' and 'track' property names
      const songTitle = track.song || track.track || track.title
      if (songTitle) {
        formData.append(`sections-${index}-song`, songTitle)
      }
      // Skip timestamps since you don't have them
      // Only add if explicitly provided
      if (track.start_time !== undefined) {
        formData.append(`sections-${index}-start_time`, track.start_time.toString())
      }
    })
  }

  // Add cover image if provided
  if (coverImage) {
    formData.append('picture', coverImage)
  }

  try {
    // Upload directly to Mixcloud
    const uploadUrl = `https://api.mixcloud.com/upload/?access_token=${accessToken}`

    // Simulate progress since we can't track real progress on cross-origin requests
    if (onProgress) {
      onProgress(20) // Starting upload

      // Simulate gradual progress based on file size
      const fileSizeMB = file.size / (1024 * 1024)
      const estimatedSeconds = Math.min(fileSizeMB * 0.5, 60) // Estimate 0.5 sec per MB, max 60 seconds
      let progress = 20

      const progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 10, 85) // Go up to 85%
        onProgress(progress)
      }, (estimatedSeconds * 1000) / 8) // Update 8 times during upload

      // Make the actual upload
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
        // Let browser set Content-Type with boundary
      }).finally(() => {
        clearInterval(progressInterval)
        onProgress(90) // Upload complete, processing response
      })

      // Process the response
      const result = await processUploadResponse(response)
      if (result.success) onProgress(100)
      return result
    }

    // No progress callback version
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
      // Let browser set Content-Type with boundary
    })

    return processUploadResponse(response)
  } catch (error) {
    console.error('Upload error:', error)
    if (onProgress) onProgress(0) // Reset on error
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    }
  }

  // Process the upload response
  async function processUploadResponse(response: Response): Promise<MixcloudUploadResult> {
    // Read response as text first to handle both JSON and HTML
    const contentType = response.headers.get('content-type') || ''
    const responseText = await response.text()

    console.log('Mixcloud response status:', response.status)
    console.log('Mixcloud response type:', contentType)
    console.log('Mixcloud response preview:', responseText.substring(0, 200))

    // Check for specific error patterns
    if (response.status === 413 || responseText.includes('Request Entity Too Large')) {
      return {
        success: false,
        error: 'File too large for upload. Please reduce file size.'
      }
    }

    if (response.status === 401 || responseText.includes('Unauthorized')) {
      return {
        success: false,
        error: 'Authentication failed. Please reconnect your Mixcloud account.'
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Upload failed (${response.status}): ${responseText.substring(0, 200)}`
      }
    }

    // Log the actual response for debugging
    console.log('Mixcloud response preview:', responseText.substring(0, 500))

    // Parse JSON response if it's JSON
    // Note: Sometimes content-type might be text/html even for JSON responses
    if (contentType.includes('application/json') || responseText.trim().startsWith('{')) {
      const data = JSON.parse(responseText)

      // Check if this is a successful upload response
      // Also handle draft/processing status
      if (data.result?.success === true ||
          data.success === true ||
          data.status === 'processing' ||
          data.result?.status === 'processing' ||
          data.result?.state === 'draft') {
        // Extract URL from various possible response structures
        let showUrl = null

        if (data.url) {
          showUrl = data.url
        } else if (data.result?.url) {
          showUrl = data.result.url
        } else if (data.result?.key) {
          // Construct URL from key (key already includes slashes and username)
          showUrl = `https://www.mixcloud.com${data.result.key}`
        } else if (data.cloudcast?.url) {
          showUrl = data.cloudcast.url
        } else if (data.key) {
          showUrl = `https://www.mixcloud.com${data.key}`
        } else if (data.slug) {
          showUrl = `https://www.mixcloud.com/rhythmlab/${data.slug}/`
        }

        if (showUrl) {
          console.log('Upload successful! Show URL:', showUrl)
          return {
            success: true,
            url: showUrl,
            details: data
          }
        } else {
          console.error('Upload succeeded but no URL/key in response:', data)
          return {
            success: false,
            error: 'Upload succeeded but no show URL returned',
            details: data
          }
        }
      } else {
        // Upload failed
        const errorMessage = data.error?.message || data.message || 'Upload failed'
        return {
          success: false,
          error: errorMessage,
          details: data
        }
      }
    } else {
      // Try to parse as JSON anyway in case content-type is wrong
      try {
        const data = JSON.parse(responseText)

        // Check if this looks like a successful response
        if (data.result?.success === true || data.success === true || data.result?.key) {
          const showUrl = data.result?.key ? `https://www.mixcloud.com${data.result.key}` : null

          if (showUrl) {
            console.log('Upload successful (despite wrong content-type)! URL:', showUrl)
            return {
              success: true,
              url: showUrl,
              details: data
            }
          }
        }

        // JSON but not successful
        return {
          success: false,
          error: data.error?.message || 'Upload failed',
          details: data
        }
      } catch (parseError) {
        // Really not JSON - likely an HTML error page
        console.error('Response is not JSON:', responseText.substring(0, 500))
        return {
          success: false,
          error: `Mixcloud returned non-JSON response: ${responseText.substring(0, 200)}`,
          details: responseText
        }
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    }
  }
}

/**
 * Get the user's Mixcloud access token from the API
 * (Still uses server route for security - tokens shouldn't be exposed to client)
 */
export async function getMixcloudAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/mixcloud/token')
    if (!response.ok) {
      console.error('Token endpoint returned status:', response.status)
      const errorText = await response.text()
      console.error('Token endpoint error:', errorText)
      return null
    }
    const data = await response.json()
    console.log('Got access token from server')
    return data.access_token
  } catch (error) {
    console.error('Failed to get access token:', error)
    return null
  }
}