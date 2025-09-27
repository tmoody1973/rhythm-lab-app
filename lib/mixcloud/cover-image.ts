/**
 * Mixcloud Cover Image Utilities
 * Handles fetching cover images from Mixcloud API and uploading to Storyblok
 */

/**
 * Extract cover image URL from Mixcloud show URL
 * Uses Mixcloud's API to get show metadata including cover image
 */
export async function getMixcloudCoverImage(mixcloudUrl: string): Promise<string | null> {
  try {
    // Extract the show path from Mixcloud URL
    // URL format: https://www.mixcloud.com/rhythmlab/show-name/
    const url = new URL(mixcloudUrl)
    const showPath = url.pathname // e.g., /rhythmlab/show-name/

    // Call Mixcloud API to get show data
    const apiUrl = `https://api.mixcloud.com${showPath}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      console.warn(`Failed to fetch Mixcloud show data: ${response.status}`)
      return null
    }

    const showData = await response.json()

    // Extract cover image URL from various possible locations
    const coverUrl = showData.pictures?.large ||
                    showData.pictures?.medium ||
                    showData.pictures?.small ||
                    showData.pictures?.['1024wx1024h'] ||
                    showData.pictures?.['640wx640h'] ||
                    showData.pictures?.['320wx320h'] ||
                    null

    return coverUrl

  } catch (error) {
    console.error('Error fetching Mixcloud cover image:', error)
    return null
  }
}

/**
 * Upload image file directly to Storyblok as asset
 */
export async function uploadImageFileToStoryblok(
  imageFile: File,
  filename: string
): Promise<{ id: number; filename: string; public_url: string } | null> {
  try {
    const storyblokToken = process.env.STORYBLOK_MANAGEMENT_TOKEN
    const spaceId = process.env.STORYBLOK_SPACE_ID

    if (!storyblokToken || !spaceId) {
      console.warn('Storyblok credentials not configured for asset upload')
      return null
    }

    // Determine file extension from file name or type
    const extension = imageFile.name.includes('.')
      ? `.${imageFile.name.split('.').pop()}`
      : '.jpg'

    // Upload to Storyblok
    const formData = new FormData()
    formData.append('file', imageFile, `${filename}${extension}`)

    const uploadResponse = await fetch(`https://mapi.storyblok.com/v1/spaces/${spaceId}/assets/`, {
      method: 'POST',
      headers: {
        'Authorization': storyblokToken
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      throw new Error(`Storyblok asset upload failed (${uploadResponse.status}): ${error}`)
    }

    const assetData = await uploadResponse.json()
    console.log('Successfully uploaded cover image file to Storyblok:', assetData.public_url)

    return assetData

  } catch (error) {
    console.error('Error uploading image file to Storyblok:', error)
    return null
  }
}

/**
 * Download image from URL and upload to Storyblok as asset
 */
export async function uploadImageUrlToStoryblok(
  imageUrl: string,
  filename: string
): Promise<{ id: number; filename: string; public_url: string } | null> {
  try {
    const storyblokToken = process.env.STORYBLOK_MANAGEMENT_TOKEN
    const spaceId = process.env.STORYBLOK_SPACE_ID

    if (!storyblokToken || !spaceId) {
      console.warn('Storyblok credentials not configured for asset upload')
      return null
    }

    // Download the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Determine file extension from content type
    const extension = contentType.includes('png') ? '.png' :
                     contentType.includes('gif') ? '.gif' :
                     '.jpg'

    // Create a blob for the form data
    const imageBlob = new Blob([imageBuffer], { type: contentType })

    // Upload to Storyblok
    const formData = new FormData()
    formData.append('file', imageBlob, `${filename}${extension}`)

    const uploadResponse = await fetch(`https://mapi.storyblok.com/v1/spaces/${spaceId}/assets/`, {
      method: 'POST',
      headers: {
        'Authorization': storyblokToken
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      throw new Error(`Storyblok asset upload failed (${uploadResponse.status}): ${error}`)
    }

    const assetData = await uploadResponse.json()
    console.log('Successfully uploaded cover image to Storyblok:', assetData.public_url)

    return assetData

  } catch (error) {
    console.error('Error uploading image to Storyblok:', error)
    return null
  }
}