import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'
import { getValidMixcloudToken } from '@/lib/auth/mixcloud-oauth'
import { parsePlaylistText, tracksToMixcloudFormat } from '@/lib/playlist-parser'

interface UploadRequest {
  audioFile: File
  showTitle: string
  showDescription?: string
  showTags?: string[]
  publishDate: string
  playlistText?: string
  coverImage?: File
}

interface MixcloudUploadResponse {
  success: boolean
  status: 'uploaded' | 'queued'
  mixcloud_url?: string
  mixcloud_embed?: string
  job_id?: string
  message: string
  errors?: string[]
}

/**
 * Handle Mixcloud show upload with hybrid direct/queue approach
 */
async function handleUpload(request: NextRequest, user: any): Promise<NextResponse> {
  try {
    // Parse multipart form data
    const formData = await request.formData()

    const audioFile = formData.get('audioFile') as File
    const showTitle = formData.get('showTitle') as string
    const showDescription = formData.get('showDescription') as string
    const showTags = formData.get('showTags') ? JSON.parse(formData.get('showTags') as string) : []
    const publishDate = formData.get('publishDate') as string
    const playlistText = formData.get('playlistText') as string
    const coverImage = formData.get('coverImage') as File

    // Validate required fields
    if (!audioFile || !showTitle || !publishDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields', errors: ['Audio file, title, and publish date are required'] },
        { status: 400 }
      )
    }

    // Validate file type and size
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3']
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type', errors: ['Only MP3 and WAV files are supported'] },
        { status: 400 }
      )
    }

    const maxSize = 500 * 1024 * 1024 // 500MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File too large', errors: ['File must be under 500MB'] },
        { status: 400 }
      )
    }

    // Parse playlist if provided
    let parsedTracks: any[] = []
    let playlistErrors: string[] = []

    if (playlistText) {
      const parseResult = parsePlaylistText(playlistText)
      parsedTracks = parseResult.tracks
      playlistErrors = parseResult.errors
    }

    // Get the user's profile UUID (required for foreign key relationships)
    const supabase = await createClient()

    // Use service role client to bypass RLS for profile lookup
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )

    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile lookup failed:', profileError, 'for Clerk user:', user.id)
      return NextResponse.json(
        { success: false, message: 'User profile not found', errors: ['Please ensure your account is properly set up'] },
        { status: 400 }
      )
    }

    // Create upload job record
    const { data: uploadJob, error: jobError } = await serviceSupabase
      .from('upload_jobs')
      .insert({
        user_id: profile.id, // Use profile UUID, not Clerk user ID
        filename: `${Date.now()}_${audioFile.name}`,
        original_filename: audioFile.name,
        file_size: audioFile.size,
        content_type: audioFile.type,
        show_title: showTitle,
        show_description: showDescription || '',
        show_tags: showTags,
        publish_date: publishDate,
        playlist_text: playlistText || '',
        parsed_tracks: parsedTracks,
        status: 'pending'
      })
      .select()
      .single()

    if (jobError || !uploadJob) {
      console.error('Failed to create upload job:', jobError)
      return NextResponse.json(
        { success: false, message: 'Failed to create upload job', errors: [jobError?.message || 'Unknown error'] },
        { status: 500 }
      )
    }

    try {
      // Direct upload to Mixcloud - no fallback complexity
      const mixcloudResult = await uploadToMixcloud(user.id, audioFile, {
        title: showTitle,
        description: showDescription,
        tags: showTags,
        publishDate,
        tracks: parsedTracks,
        coverImage
      })

      if (mixcloudResult.success) {
        // Update job status to completed
        await serviceSupabase
          .from('upload_jobs')
          .update({
            status: 'uploaded',
            mixcloud_url: mixcloudResult.url,
            mixcloud_embed: mixcloudResult.embed,
            mixcloud_picture: mixcloudResult.picture,
            progress_percentage: 100,
            completed_at: new Date().toISOString()
          })
          .eq('id', uploadJob.id)

        // Trigger sync to Supabase shows table and Storyblok
        await syncUploadedShow(uploadJob.id, mixcloudResult)

        return NextResponse.json({
          success: true,
          status: 'uploaded',
          mixcloud_url: mixcloudResult.url,
          mixcloud_embed: mixcloudResult.embed,
          job_id: uploadJob.id,
          message: 'Show uploaded successfully to Mixcloud!'
        })
      } else {
        throw new Error('Mixcloud upload failed')
      }
    } catch (mixcloudError) {
      console.error('Mixcloud upload failed:', mixcloudError)

      // Update job status to failed
      await serviceSupabase
        .from('upload_jobs')
        .update({
          status: 'failed',
          error_message: `Mixcloud upload failed: ${mixcloudError instanceof Error ? mixcloudError.message : 'Unknown error'}`,
          progress_percentage: 0
        })
        .eq('id', uploadJob.id)

      return NextResponse.json(
        {
          success: false,
          message: 'Upload to Mixcloud failed',
          errors: [
            mixcloudError instanceof Error ? mixcloudError.message : 'Unknown upload error',
            ...(playlistErrors.length > 0 ? playlistErrors : [])
          ]
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Upload failed', errors: [error instanceof Error ? error.message : 'Unknown error'] },
      { status: 500 }
    )
  }

  // This should never be reached, but TypeScript requires it
  return NextResponse.json(
    { success: false, message: 'Unexpected error' },
    { status: 500 }
  )
}

/**
 * Upload audio file and metadata to Mixcloud
 */
async function uploadToMixcloud(userId: string, audioFile: File, metadata: any) {
  // Get valid access token (handles refresh if needed)
  const accessToken = await getValidMixcloudToken(userId)
  if (!accessToken) {
    throw new Error('No valid Mixcloud OAuth token. Please reconnect your account.')
  }

  // Validate token format
  if (typeof accessToken !== 'string' || accessToken.length < 10) {
    console.error('Invalid access token format:', typeof accessToken, accessToken?.length)
    throw new Error('Invalid access token format')
  }

  console.log('Using access token (first 10 chars):', accessToken.substring(0, 10) + '...')

  // Test the token by making a simple API call first
  try {
    const testUrl = new URL('https://api.mixcloud.com/me/')
    testUrl.searchParams.set('access_token', accessToken)

    const testResponse = await fetch(testUrl.toString())
    console.log('Token test response status:', testResponse.status)

    if (!testResponse.ok) {
      const testError = await testResponse.text()
      console.error('Token test failed:', testError)
      throw new Error('Access token is invalid or expired. Please reconnect your Mixcloud account.')
    }

    const userInfo = await testResponse.json()
    console.log('Token is valid for user:', userInfo.username)
  } catch (tokenError) {
    console.error('Token validation failed:', tokenError)
    throw new Error('Failed to validate Mixcloud access token. Please reconnect your account.')
  }

  // Prepare form data for Mixcloud upload
  const formData = new FormData()
  formData.append('mp3', audioFile)
  formData.append('name', metadata.title)
  if (metadata.description) formData.append('description', metadata.description)

  // Add tags in correct format (individual fields, max 5)
  if (metadata.tags && metadata.tags.length > 0) {
    const tagsToAdd = metadata.tags.slice(0, 5)
    tagsToAdd.forEach((tag: string, index: number) => {
      formData.append(`tags-${index}-tag`, tag)
    })
  }

  // Add track sections if we have parsed tracks
  if (metadata.tracks && metadata.tracks.length > 0) {
    metadata.tracks.forEach((track: any, index: number) => {
      if (track.artist) {
        formData.append(`sections-${index}-artist`, track.artist)
      }
      if (track.song || track.title) {
        formData.append(`sections-${index}-song`, track.song || track.title)
      }
      // Add start time if available, otherwise use index * 180 seconds (3 minutes)
      const startTime = track.startTime || track.start_time || (index * 180)
      formData.append(`sections-${index}-start_time`, startTime.toString())
    })
  }

  // Upload cover image if provided
  if (metadata.coverImage) {
    formData.append('picture', metadata.coverImage)
  }

  // Build URL with access token as query parameter (Mixcloud API requirement)
  const uploadUrl = new URL('https://api.mixcloud.com/upload/')
  uploadUrl.searchParams.set('access_token', accessToken)

  console.log('Uploading to Mixcloud:', {
    url: uploadUrl.toString(),
    title: metadata.title,
    trackCount: metadata.tracks?.length || 0,
    tagCount: metadata.tags?.length || 0,
    hasImage: !!metadata.coverImage,
    hasAccessToken: !!accessToken
  })

  // Debug: Check if access token is in the URL
  console.log('Upload URL contains access_token:', uploadUrl.toString().includes('access_token'))

  // Make upload request to Mixcloud
  const uploadResponse = await fetch(uploadUrl.toString(), {
    method: 'POST',
    body: formData,
    // Add a timeout to prevent hanging
    signal: AbortSignal.timeout(300000) // 5 minutes
    // Note: Don't set Content-Type header - let fetch handle multipart boundaries
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    console.error('Mixcloud upload failed:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      error: errorText
    })
    throw new Error(`Mixcloud upload failed: ${uploadResponse.status} - ${errorText}`)
  }

  // Check if response is actually JSON before parsing
  const contentType = uploadResponse.headers.get('content-type')
  console.log('Response content-type:', contentType)

  const responseText = await uploadResponse.text()
  console.log('Raw response text (first 500 chars):', responseText.substring(0, 500))

  let uploadResult

  // Check for common error patterns in the response text first
  if (responseText.includes('Request Entity Too Large')) {
    throw new Error('File too large for Mixcloud. Maximum file size is 250MB.')
  } else if (responseText.includes('Unauthorized') || responseText.includes('Authentication')) {
    throw new Error('Authentication failed. Please reconnect your Mixcloud account.')
  } else if (responseText.includes('Bad Request')) {
    throw new Error('Invalid request format. Please check file format and metadata.')
  } else if (responseText.includes('Request Error') || responseText.startsWith('<html')) {
    throw new Error(`Mixcloud returned HTML error page: ${responseText.substring(0, 200)}`)
  }

  // Try to parse as JSON only if it looks like JSON
  if (contentType && contentType.includes('application/json')) {
    try {
      uploadResult = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response text that failed to parse:', responseText)
      throw new Error(`Failed to parse JSON response from Mixcloud: ${responseText.substring(0, 200)}`)
    }
  } else {
    // Not JSON content type - this is likely an error
    console.error('Response is not JSON, full response:', responseText)
    throw new Error(`Mixcloud returned non-JSON response: ${responseText.substring(0, 200)}`)
  }

  console.log('Mixcloud upload result:', uploadResult)

  // Get the final show URL - check multiple possible response structures
  let showUrl = null

  // Common response structures from Mixcloud API
  if (uploadResult.url) {
    showUrl = uploadResult.url
  } else if (uploadResult.result) {
    // Handle different result structures
    const result = uploadResult.result
    if (result.url) {
      showUrl = result.url
    } else if (result.key) {
      // Construct URL from key
      showUrl = `https://www.mixcloud.com/${result.user || 'rhythmlab'}/${result.key}/`
    } else if (result.slug) {
      // Construct URL from slug
      showUrl = `https://www.mixcloud.com/${result.user || 'rhythmlab'}/${result.slug}/`
    } else if (typeof result === 'string') {
      // Sometimes result is just a string URL or path
      showUrl = result.startsWith('http') ? result : `https://www.mixcloud.com${result}`
    }
  } else if (uploadResult.cloudcast && uploadResult.cloudcast.url) {
    showUrl = uploadResult.cloudcast.url
  } else if (uploadResult.data && uploadResult.data.url) {
    showUrl = uploadResult.data.url
  } else if (uploadResult.key) {
    // Sometimes Mixcloud returns just a key, construct the URL
    showUrl = `https://www.mixcloud.com/${uploadResult.user}/${uploadResult.key}/`
  } else if (uploadResult.slug) {
    // Another common pattern with slug
    showUrl = `https://www.mixcloud.com/${uploadResult.user || 'rhythmlab'}/${uploadResult.slug}/`
  }

  console.log('Extracted show URL:', showUrl)
  console.log('Available keys in response:', Object.keys(uploadResult))

  // Additional logging for result object if it exists
  if (uploadResult.result) {
    console.log('Result object type:', typeof uploadResult.result)
    console.log('Result object content:', uploadResult.result)
    if (typeof uploadResult.result === 'object') {
      console.log('Result object keys:', Object.keys(uploadResult.result))
    }
  }

  if (!showUrl) {
    console.error('Full Mixcloud response:', JSON.stringify(uploadResult, null, 2))
    throw new Error(`No show URL found in Mixcloud response. Available keys: ${Object.keys(uploadResult).join(', ')}`)
  }

  // Fetch embed code using oEmbed
  let embedData = null
  try {
    const embedResponse = await fetch(`https://www.mixcloud.com/oembed/?url=${encodeURIComponent(showUrl)}&format=json`)
    if (embedResponse.ok) {
      embedData = await embedResponse.json()
    }
  } catch (embedError) {
    console.warn('Failed to fetch embed data:', embedError)
  }

  return {
    success: true,
    url: showUrl,
    embed: embedData?.html || '',
    picture: uploadResult.pictures?.large || embedData?.thumbnail_url || ''
  }
}


/**
 * Sync uploaded show to main shows table and Storyblok
 */
async function syncUploadedShow(jobId: string, mixcloudResult: any) {
  // This would integrate with existing sync functionality
  // For now, just log that sync should happen
  console.log('TODO: Sync uploaded show to shows table and Storyblok:', jobId, mixcloudResult)

  // Could call existing sync endpoints or implement sync logic here
}

export const POST = withAdminAuth(handleUpload)