import { NextRequest, NextResponse } from 'next/server'

interface PublishRequest {
  audioData: string // base64 encoded audio
  audioMimeType: string
  fileName: string
  title: string
  description: string
  storyId?: string
  episodeType?: 'public' | 'private' | 'premium'
  status?: 'publish' | 'draft'
}

interface PodbeanAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

interface PodbeanAuthorizeResponse {
  presigned_url: string
  expire_at: number
  file_key: string
}

interface PodbeanEpisodeResponse {
  episode_url: string
  media_url: string
  episode_id: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      audioData,
      audioMimeType,
      fileName,
      title,
      description,
      storyId,
      episodeType = 'public',
      status = 'draft'
    } = body as PublishRequest

    if (!audioData || !audioMimeType || !fileName || !title || !description) {
      return NextResponse.json(
        { error: 'Audio data, mime type, filename, title, and description are required' },
        { status: 400 }
      )
    }

    if (!process.env.PODBEAN_CLIENT_ID || !process.env.PODBEAN_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Podbean API credentials not configured' },
        { status: 500 }
      )
    }

    console.log(`Publishing episode to Podbean: ${title}`)

    // Step 1: Get OAuth2 Access Token
    console.log('Step 1: Getting Podbean access token...')

    const authString = Buffer.from(
      `${process.env.PODBEAN_CLIENT_ID}:${process.env.PODBEAN_CLIENT_SECRET}`
    ).toString('base64')

    const authResponse = await fetch('https://api.podbean.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!authResponse.ok) {
      const authError = await authResponse.text()
      console.error('Podbean auth error:', authError)
      return NextResponse.json(
        { error: 'Failed to authenticate with Podbean', details: authError },
        { status: authResponse.status }
      )
    }

    const authData: PodbeanAuthResponse = await authResponse.json()
    console.log('Step 1 complete: Got access token')

    // Step 2: Authorize file upload to get presigned URL
    console.log('Step 2: Authorizing file upload with Podbean...')

    const audioBuffer = Buffer.from(audioData, 'base64')
    console.log(`Audio buffer size: ${audioBuffer.length} bytes (${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB)`)

    // Get presigned URL for upload
    const authorizeParams = new URLSearchParams({
      access_token: authData.access_token,
      filename: fileName,
      filesize: audioBuffer.length.toString(),
      content_type: audioMimeType
    })

    const authorizeResponse = await fetch(`https://api.podbean.com/v1/files/uploadAuthorize?${authorizeParams}`, {
      method: 'GET'
    })

    if (!authorizeResponse.ok) {
      const authorizeError = await authorizeResponse.text()
      console.error('Podbean authorize upload error:', authorizeError)
      return NextResponse.json(
        { error: 'Failed to authorize upload with Podbean', details: authorizeError },
        { status: authorizeResponse.status }
      )
    }

    const authorizeData: PodbeanAuthorizeResponse = await authorizeResponse.json()
    console.log('Step 2 complete: Got presigned URL')

    // Step 3: Upload file to presigned URL (S3)
    console.log('Step 3: Uploading file to presigned URL...')

    const audioBlob = new Blob([audioBuffer], { type: audioMimeType })
    const uploadResponse = await fetch(authorizeData.presigned_url, {
      method: 'PUT',
      body: audioBlob,
      headers: {
        'Content-Type': audioMimeType
      }
    })

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text()
      console.error('Podbean upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload audio to Podbean', details: uploadError },
        { status: uploadResponse.status }
      )
    }

    console.log('Step 3 complete: File uploaded to S3')

    // Use the file_key from the authorization response
    const fileKey = authorizeData.file_key
    console.log('Using file_key for episode:', fileKey)

    // Step 4: Publish Episode
    console.log('Step 4: Publishing episode...')

    const publishFormData = new FormData()
    publishFormData.append('access_token', authData.access_token)
    publishFormData.append('type', episodeType)
    publishFormData.append('status', status)
    publishFormData.append('media_key', fileKey)
    publishFormData.append('title', title)
    publishFormData.append('content', description)

    // Optional: Add Apple episode type for better podcast platform compatibility
    publishFormData.append('apple_episode_type', 'full')

    const episodeResponse = await fetch('https://api.podbean.com/v1/episodes', {
      method: 'POST',
      body: publishFormData
    })

    if (!episodeResponse.ok) {
      const episodeError = await episodeResponse.text()
      console.error('Podbean episode publish error:', episodeError)
      return NextResponse.json(
        { error: 'Failed to publish episode to Podbean', details: episodeError },
        { status: episodeResponse.status }
      )
    }

    const episodeData: PodbeanEpisodeResponse = await episodeResponse.json()
    console.log('Step 3 complete: Episode published')

    // Optional: Update Storyblok story with Podbean episode URL
    let storyUpdateResult = null
    if (storyId && process.env.STORYBLOK_MANAGEMENT_TOKEN) {
      try {
        console.log(`Updating Storyblok story ${storyId} with Podbean episode URL...`)

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

          // Update story content with Podbean episode information
          const updatedContent = {
            ...story.content,
            podbean_episode_url: episodeData.episode_url,
            podbean_media_url: episodeData.media_url,
            podbean_episode_id: episodeData.episode_id,
            podcast_status: status,
            podcast_platform: 'podbean'
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
            console.log('Storyblok story updated with Podbean episode details')
          } else {
            const updateError = await updateResponse.text()
            console.error('Failed to update Storyblok story:', updateError)
          }
        }
      } catch (storyError) {
        console.error('Error updating Storyblok story with Podbean details:', storyError)
        // Don't fail the entire request if story update fails
      }
    }

    return NextResponse.json({
      success: true,
      episode: {
        id: episodeData.episode_id,
        url: episodeData.episode_url,
        mediaUrl: episodeData.media_url,
        title: title,
        description: description,
        status: status,
        type: episodeType,
        platform: 'podbean'
      },
      storyUpdate: storyUpdateResult ? {
        success: true,
        storyId: storyId,
        updatedAt: new Date().toISOString(),
        episodeUrl: episodeData.episode_url
      } : null,
      metadata: {
        publishedAt: new Date().toISOString(),
        fileName: fileName,
        title: title,
        audioSize: audioBuffer.length,
        uploadSteps: 'Completed 3-step Podbean publish process',
        provider: 'Podbean'
      }
    })

  } catch (error: any) {
    console.error('Podbean publish error:', error)
    return NextResponse.json(
      {
        error: 'Failed to publish episode to Podbean',
        details: error.message
      },
      { status: 500 }
    )
  }
}