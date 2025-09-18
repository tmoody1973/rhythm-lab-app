import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'
import { getMixcloudToken } from '@/lib/mixcloud/oauth'
import { uploadToTempStorage } from '@/lib/storage/temp-uploads'
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

    // Create upload job record
    const supabase = await createClient()
    const { data: uploadJob, error: jobError } = await supabase
      .from('upload_jobs')
      .insert({
        user_id: user.id,
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
      // Attempt direct upload to Mixcloud first
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
        await supabase
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
      }
    } catch (mixcloudError) {
      console.log('Direct Mixcloud upload failed, falling back to queue:', mixcloudError)

      // Fallback: Store in Supabase Storage and queue for retry
      try {
        const storageResult = await uploadToTempStorage(
          audioFile,
          uploadJob.filename,
          user.id,
          audioFile.type
        )

        // Update job with storage path and queued status
        await supabase
          .from('upload_jobs')
          .update({
            status: 'queued',
            storage_path: storageResult.path,
            progress_percentage: 50 // File uploaded to storage, waiting for Mixcloud
          })
          .eq('id', uploadJob.id)

        // TODO: Trigger background job to retry Mixcloud upload
        // This could be done via a queue system like BullMQ or similar

        return NextResponse.json({
          success: true,
          status: 'queued',
          job_id: uploadJob.id,
          message: 'Upload queued - Mixcloud is temporarily unavailable. You\'ll be notified when it\'s processed.',
          errors: playlistErrors.length > 0 ? playlistErrors : undefined
        })
      } catch (storageError) {
        console.error('Storage fallback failed:', storageError)

        // Update job status to failed
        await supabase
          .from('upload_jobs')
          .update({
            status: 'failed',
            error_message: `Both Mixcloud and storage upload failed: ${storageError}`,
            progress_percentage: 0
          })
          .eq('id', uploadJob.id)

        return NextResponse.json(
          { success: false, message: 'Upload failed', errors: ['Both direct upload and backup storage failed'] },
          { status: 500 }
        )
      }
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
  // Check if user has valid OAuth token
  const token = await getMixcloudToken(userId)
  if (!token) {
    throw new Error('No valid Mixcloud OAuth token. Please reconnect your account.')
  }

  // Prepare form data for Mixcloud upload
  const formData = new FormData()
  formData.append('mp3', audioFile)
  formData.append('name', metadata.title)
  if (metadata.description) formData.append('description', metadata.description)
  if (metadata.tags && metadata.tags.length > 0) {
    formData.append('tags', metadata.tags.join(', '))
  }

  // Add track sections if we have parsed tracks
  if (metadata.tracks && metadata.tracks.length > 0) {
    const mixcloudSections = tracksToMixcloudFormat(metadata.tracks)

    // Add the artist/song fields from the converted format
    Object.keys(mixcloudSections).forEach(key => {
      formData.append(key, mixcloudSections[key])
    })

    // Add start times (assume 3 minutes per track as default)
    metadata.tracks.forEach((_track: any, index: number) => {
      formData.append(`sections-${index}-start_time`, (index * 180).toString())
    })
  }

  // Upload cover image if provided
  if (metadata.coverImage) {
    formData.append('picture', metadata.coverImage)
  }

  // Make upload request to Mixcloud
  const uploadResponse = await fetch('https://api.mixcloud.com/upload/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.access_token}`
    },
    body: formData
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    throw new Error(`Mixcloud upload failed: ${uploadResponse.status} - ${errorText}`)
  }

  const uploadResult = await uploadResponse.json()

  // Get the final show URL and embed code
  const showUrl = uploadResult.result?.url || uploadResult.url
  if (!showUrl) {
    throw new Error('No show URL returned from Mixcloud')
  }

  // Fetch embed code using oEmbed
  const embedResponse = await fetch(`https://www.mixcloud.com/oembed/?url=${encodeURIComponent(showUrl)}&format=json`)
  const embedData = embedResponse.ok ? await embedResponse.json() : null

  return {
    success: true,
    url: showUrl,
    embed: embedData?.html || '',
    picture: uploadResult.result?.pictures?.large || embedData?.thumbnail_url || ''
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