import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { downloadImageForUpload } from '@/lib/serpapi/image-search'
import { uploadAudioToStoryblok } from '@/lib/storyblok/content-api' // We'll reuse the upload logic

// Function to upload image to Storyblok (similar to audio upload)
async function uploadImageToStoryblok(
  imageBuffer: Buffer,
  filename: string,
  contentType: string,
  spaceId: number
): Promise<{ success: boolean; asset?: any; error?: string }> {
  try {
    // Get Storyblok management token and space ID
    const token = process.env.STORYBLOK_MANAGEMENT_TOKEN!
    const actualSpaceId = spaceId || parseInt(process.env.STORYBLOK_SPACE_ID!)

    console.log('Uploading to Storyblok space:', actualSpaceId)

    // First, get signed upload URL
    const signedResponse = await fetch(`https://mapi.storyblok.com/v1/spaces/${actualSpaceId}/assets`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: filename,
        asset_folder_id: null, // You can specify a folder ID if needed
        size: imageBuffer.length
      })
    })

    if (!signedResponse.ok) {
      const errorText = await signedResponse.text()
      console.error('Storyblok signed URL error:', errorText)
      throw new Error(`Failed to get upload URL: ${signedResponse.status} - ${errorText}`)
    }

    const uploadData = await signedResponse.json()

    // Upload file to the signed URL
    const formData = new FormData()
    Object.keys(uploadData.fields).forEach(key => {
      formData.append(key, uploadData.fields[key])
    })

    const arrayBuffer = imageBuffer.buffer.slice(
      imageBuffer.byteOffset,
      imageBuffer.byteOffset + imageBuffer.byteLength
    ) as ArrayBuffer

    formData.append('file', new Blob([arrayBuffer], { type: contentType }), filename)

    const uploadResponse = await fetch(uploadData.post_url, {
      method: 'POST',
      body: formData
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => 'No error details')
      console.error('Image upload error:', errorText)
      throw new Error(`Failed to upload image: ${uploadResponse.status} - ${errorText}`)
    }

    // Finalize the asset
    const finalizeResponse = await fetch(`https://mapi.storyblok.com/v1/spaces/${actualSpaceId}/assets/${uploadData.id}`, {
      method: 'GET',
      headers: {
        'Authorization': token
      }
    })

    if (!finalizeResponse.ok) {
      const errorText = await finalizeResponse.text().catch(() => 'No error details')
      console.error('Asset finalization error:', errorText)
      throw new Error(`Failed to finalize asset: ${finalizeResponse.status} - ${errorText}`)
    }

    const finalizedAsset = await finalizeResponse.json()

    return {
      success: true,
      asset: finalizedAsset.asset
    }
  } catch (error: any) {
    console.error('Error uploading image to Storyblok:', error)
    return {
      success: false,
      error: error.message || 'Failed to upload image'
    }
  }
}

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { imageUrl, title, alt, contentType } = body

    if (!imageUrl?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Check required environment variables
    if (!process.env.STORYBLOK_MANAGEMENT_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Storyblok management token not configured' },
        { status: 500 }
      )
    }

    if (!process.env.STORYBLOK_SPACE_ID) {
      return NextResponse.json(
        { success: false, error: 'Storyblok space ID not configured' },
        { status: 500 }
      )
    }

    // Download the image
    const downloadResult = await downloadImageForUpload(imageUrl)

    if (!downloadResult.success) {
      return NextResponse.json(
        { success: false, error: downloadResult.error },
        { status: 400 }
      )
    }

    // Generate a proper filename
    const timestamp = Date.now()
    const sanitizedTitle = (title || 'image')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)

    const extension = downloadResult.filename?.split('.').pop() || 'jpg'
    const finalFilename = `${contentType}-${sanitizedTitle}-${timestamp}.${extension}`

    // Upload to Storyblok
    const uploadResult = await uploadImageToStoryblok(
      downloadResult.buffer!,
      finalFilename,
      downloadResult.contentType!,
      parseInt(process.env.STORYBLOK_SPACE_ID!)
    )

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 500 }
      )
    }

    // Add alt text and title to the asset metadata
    const assetWithMetadata = {
      ...uploadResult.asset,
      alt: alt || title || '',
      title: title || ''
    }

    return NextResponse.json({
      success: true,
      asset: assetWithMetadata,
      message: 'Image uploaded successfully to Storyblok'
    })

  } catch (error: any) {
    console.error('Image upload API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})