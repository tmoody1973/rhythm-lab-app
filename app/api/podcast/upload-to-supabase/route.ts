import { NextRequest, NextResponse } from 'next/server'
import { supabaseStorage } from '@/lib/supabase'

interface UploadRequest {
  audioData?: string // base64 encoded audio (for smaller files)
  audioBlob?: Blob   // Direct blob upload (for larger files)
  audioMimeType: string
  fileName: string
  storyId?: string // optional story to reference the audio
  title?: string // title for the audio asset
}

export async function POST(request: NextRequest) {
  try {
    // Check if this is a direct file upload (multipart/form-data)
    const contentType = request.headers.get('content-type')

    let audioBuffer: Buffer
    let audioMimeType: string
    let fileName: string
    let storyId: string | undefined
    let title: string | undefined

    if (contentType?.includes('multipart/form-data')) {
      // Handle direct file upload (bypasses 6MB Edge Function limit)
      const formData = await request.formData()
      const audioFile = formData.get('audioFile') as File
      const metadata = formData.get('metadata') as string

      if (!audioFile) {
        return NextResponse.json(
          { error: 'Audio file is required' },
          { status: 400 }
        )
      }

      audioBuffer = Buffer.from(await audioFile.arrayBuffer())
      audioMimeType = audioFile.type
      fileName = audioFile.name

      if (metadata) {
        const parsedMetadata = JSON.parse(metadata)
        storyId = parsedMetadata.storyId
        title = parsedMetadata.title
      }

      console.log(`Direct file upload: ${fileName}, size: ${audioBuffer.length} bytes`)
    } else {
      // Handle JSON payload (existing method for smaller files)
      const body = await request.json()
      const { audioData, audioMimeType: mimeType, fileName: name, storyId: id, title: audioTitle } = body as UploadRequest

      if (!audioData || !mimeType || !name) {
        return NextResponse.json(
          { error: 'Audio data, mime type, and filename are required' },
          { status: 400 }
        )
      }

      // Convert base64 to buffer
      audioBuffer = Buffer.from(audioData, 'base64')
      audioMimeType = mimeType
      fileName = name
      storyId = id
      title = audioTitle

      console.log(`JSON upload: ${fileName}, size: ${audioBuffer.length} bytes`)
    }

    console.log(`Uploading audio to Supabase Storage: ${fileName}`)

    // Validate file size (adjust as needed for your storage limits)
    const maxSize = 100 * 1024 * 1024 // 100MB limit for Supabase
    if (audioBuffer.length > maxSize) {
      return NextResponse.json(
        { error: `Audio file too large. Maximum size is ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Create a unique file path for the audio
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `podcasts/sound-refinery/${timestamp}_${sanitizedFileName}`

    console.log(`Uploading to Supabase path: ${storagePath}`)

    // Upload to Supabase Storage
    const bucketName = 'audio_files' // Match the bucket you created

    console.log(`Uploading to bucket: ${bucketName}`)

    // Upload to the existing bucket
    let { data: uploadData, error: uploadError } = await supabaseStorage
      .from(bucketName)
      .upload(storagePath, audioBuffer, {
        contentType: audioMimeType,
        cacheControl: '3600',
        upsert: false,
        metadata: {
          title: title || 'Sound Refinery Podcast',
          originalFileName: fileName,
          storyId: storyId || '',
          uploadedAt: new Date().toISOString(),
          source: 'admin-podcast-generator'
        }
      })


    if (uploadError) {
      console.error('Supabase upload error:', {
        message: uploadError.message,
        error: uploadError,
        bucketName,
        storagePath
      })
      return NextResponse.json(
        {
          error: 'Failed to upload audio to Supabase',
          details: uploadError.message,
          bucketName,
          storagePath
        },
        { status: 500 }
      )
    }

    if (!uploadData) {
      return NextResponse.json(
        {
          error: 'Upload failed - no data returned',
          details: 'Upload completed but no file data was returned'
        },
        { status: 500 }
      )
    }

    console.log('Upload successful:', uploadData.path)

    // Get the public URL for the uploaded file
    const { data: urlData } = supabaseStorage
      .from(bucketName)
      .getPublicUrl(storagePath)

    const publicUrl = urlData.publicUrl

    console.log('Public URL generated:', publicUrl)

    // If story ID is provided, we could update Storyblok with the external URL
    let storyUpdateResult = null
    if (storyId && process.env.STORYBLOK_MANAGEMENT_TOKEN) {
      try {
        console.log(`Updating Storyblok story ${storyId} with Supabase audio URL...`)

        const region = process.env.STORYBLOK_REGION || 'us'
        const apiBaseUrl = region === 'eu' ? 'https://mapi.storyblok.com' : 'https://api-us.storyblok.com'

        // Get current story content
        const storyResponse = await fetch(
          `${apiBaseUrl}/v1/spaces/${process.env.STORYBLOK_SPACE_ID}/stories/${storyId}`,
          {
            headers: {
              'Authorization': process.env.STORYBLOK_MANAGEMENT_TOKEN,
            }
          }
        )

        if (storyResponse.ok) {
          const storyData = await storyResponse.json()
          const story = storyData.story

          // Update story content with external audio URL
          const updatedContent = {
            ...story.content,
            podcast_audio_url: publicUrl,
            podcast_audio_title: title || `Sound Refinery: ${story.name}`,
            podcast_audio_filename: fileName,
            podcast_audio_storage: 'supabase'
          }

          // Update the story
          const updateResponse = await fetch(
            `${apiBaseUrl}/v1/spaces/${process.env.STORYBLOK_SPACE_ID}/stories/${storyId}`,
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

          if (updateResponse.ok) {
            storyUpdateResult = await updateResponse.json()
            console.log('Storyblok story updated with Supabase audio URL')
          } else {
            const updateError = await updateResponse.text()
            console.error('Failed to update Storyblok story:', updateError)
          }
        }
      } catch (storyError) {
        console.error('Error updating Storyblok story with audio URL:', storyError)
        // Don't fail the entire request if story update fails
      }
    }

    return NextResponse.json({
      success: true,
      audio: {
        url: publicUrl,
        path: uploadData?.path || storagePath,
        fileName: fileName,
        size: audioBuffer.length,
        mimeType: audioMimeType,
        storage: 'supabase'
      },
      storyUpdate: storyUpdateResult ? {
        success: true,
        storyId: storyId,
        updatedAt: new Date().toISOString(),
        audioUrl: publicUrl
      } : null,
      metadata: {
        uploadedAt: new Date().toISOString(),
        fileName: fileName,
        title: title,
        storagePath: storagePath,
        provider: 'Supabase Storage'
      }
    })

  } catch (error: any) {
    console.error('Supabase upload error:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload audio to Supabase',
        details: error.message
      },
      { status: 500 }
    )
  }
}