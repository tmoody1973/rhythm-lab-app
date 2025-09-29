import { NextRequest, NextResponse } from 'next/server'

interface UploadRequest {
  audioData: string // base64 encoded audio
  audioMimeType: string
  fileName: string
  storyId?: string // optional story to attach the audio to
  title?: string // title for the audio asset
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audioData, audioMimeType, fileName, storyId, title } = body as UploadRequest

    if (!audioData || !audioMimeType || !fileName) {
      return NextResponse.json(
        { error: 'Audio data, mime type, and filename are required' },
        { status: 400 }
      )
    }

    if (!process.env.STORYBLOK_MANAGEMENT_TOKEN || !process.env.STORYBLOK_SPACE_ID) {
      return NextResponse.json(
        { error: 'Storyblok configuration missing (management token or space ID)' },
        { status: 500 }
      )
    }

    console.log(`Uploading audio asset to Storyblok: ${fileName}`)

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData, 'base64')
    console.log(`Audio buffer size: ${audioBuffer.length} bytes`)

    // Validate file size (Storyblok has limits)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (audioBuffer.length > maxSize) {
      return NextResponse.json(
        { error: `Audio file too large. Maximum size is ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Determine the correct API endpoint based on region
    const region = process.env.STORYBLOK_REGION || 'us'
    const apiBaseUrl = region === 'eu' ? 'https://mapi.storyblok.com' : 'https://api-us.storyblok.com'

    console.log(`Using Storyblok Management API: ${apiBaseUrl}`)

    // Step 1: Get signed upload URL from Storyblok Management API
    const signedFormData = new FormData()
    signedFormData.append('filename', fileName)
    signedFormData.append('size', audioBuffer.length.toString())
    signedFormData.append('content_type', audioMimeType)
    signedFormData.append('validate_upload', '1') // Enables the finish endpoint

    // Optional: Add asset folder or title
    if (title) {
      signedFormData.append('title', title)
    }

    console.log('Step 1: Requesting signed upload URL...')
    const signedResponse = await fetch(
      `${apiBaseUrl}/v1/spaces/${process.env.STORYBLOK_SPACE_ID}/assets`,
      {
        method: 'POST',
        headers: {
          'Authorization': process.env.STORYBLOK_MANAGEMENT_TOKEN,
        },
        body: signedFormData
      }
    )

    if (!signedResponse.ok) {
      const contentType = signedResponse.headers.get('content-type') || ''
      let errorMessage = 'Failed to get signed upload URL'

      try {
        if (contentType.includes('application/json')) {
          const errorData = await signedResponse.json()
          errorMessage = errorData?.message || errorData?.error || errorMessage
        } else {
          const textError = await signedResponse.text()
          errorMessage = textError?.slice(0, 400) || errorMessage
        }
      } catch {
        errorMessage = `HTTP ${signedResponse.status}: ${signedResponse.statusText}`
      }

      console.error('Storyblok signed URL error:', {
        status: signedResponse.status,
        statusText: signedResponse.statusText,
        error: errorMessage
      })

      return NextResponse.json(
        { error: errorMessage },
        { status: signedResponse.status }
      )
    }

    const signedData = await signedResponse.json()
    console.log('Step 1 complete: Got signed upload data')

    // Step 2: Upload file to S3 using the signed URL and fields
    console.log('Step 2: Uploading to S3...')
    const s3FormData = new FormData()

    // Add all the fields from Storyblok (required for S3)
    Object.entries(signedData.fields).forEach(([key, value]) => {
      s3FormData.append(key, String(value))
    })

    // Add the actual file last (S3 requirement)
    const audioBlob = new Blob([audioBuffer], { type: audioMimeType })
    s3FormData.append('file', audioBlob, fileName)

    const s3Response = await fetch(signedData.post_url, {
      method: 'POST',
      body: s3FormData
      // Don't set Content-Type header - let FormData set the boundary
    })

    if (!s3Response.ok) {
      const s3Error = await s3Response.text() // S3 returns XML/HTML on error
      console.error('S3 upload error:', s3Error)
      return NextResponse.json(
        { error: `S3 upload failed: ${s3Error.slice(0, 400)}` },
        { status: s3Response.status }
      )
    }

    console.log('Step 2 complete: File uploaded to S3')

    // Step 3: Finish the upload process with Storyblok
    console.log('Step 3: Finishing upload with Storyblok...')
    const finishResponse = await fetch(
      `${apiBaseUrl}/v1/spaces/${process.env.STORYBLOK_SPACE_ID}/assets/${signedData.id}/finish_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': process.env.STORYBLOK_MANAGEMENT_TOKEN,
        }
      }
    )

    if (!finishResponse.ok) {
      const finishError = await finishResponse.text()
      console.error('Storyblok finish upload error:', finishError)
      return NextResponse.json(
        { error: `Failed to finish upload: ${finishError.slice(0, 400)}` },
        { status: finishResponse.status }
      )
    }

    const uploadResult = await finishResponse.json()
    console.log('Step 3 complete: Upload finished, asset ID:', uploadResult.id)

    let storyUpdateResult = null

    // If story ID is provided, update the story to include the audio
    if (storyId && uploadResult.filename) {
      console.log(`Updating story ${storyId} with audio asset...`)

      try {
        // First, get the current story content
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

          // Add audio field to the story content
          const updatedContent = {
            ...story.content,
            podcast_audio_url: uploadResult.pretty_url || uploadResult.public_url || uploadResult.filename,
            podcast_audio: {
              filename: uploadResult.filename,
              alt: title || `Sound Refinery Podcast: ${story.name}`,
              name: uploadResult.name || fileName,
              focus: null
            }
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
            console.log('Story updated successfully with podcast audio')
          } else {
            const updateError = await updateResponse.text()
            console.error('Failed to update story:', updateError)
          }
        }
      } catch (storyError) {
        console.error('Error updating story with audio:', storyError)
        // Don't fail the entire request if story update fails
      }
    }

    return NextResponse.json({
      success: true,
      asset: {
        id: uploadResult.id,
        filename: uploadResult.filename,
        url: uploadResult.pretty_url || uploadResult.public_url || uploadResult.filename,
        size: audioBuffer.length,
        mimeType: audioMimeType
      },
      storyUpdate: storyUpdateResult ? {
        success: true,
        storyId: storyId,
        updatedAt: new Date().toISOString()
      } : null,
      metadata: {
        uploadedAt: new Date().toISOString(),
        fileName: fileName,
        title: title,
        uploadSteps: 'Completed 3-step Storyblok upload process'
      }
    })

  } catch (error: any) {
    console.error('Storyblok upload error:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload audio to Storyblok',
        details: error.message
      },
      { status: 500 }
    )
  }
}