/**
 * Storyblok Management API Helper
 * Handles creation and updates of Storyblok stories via Management API
 */

import { getMixcloudCoverImage, uploadImageUrlToStoryblok } from './mixcloud/cover-image'

interface StoryblokStoryContent {
  component: string
  [key: string]: any
}

interface StoryblokCreateStoryData {
  name: string
  slug: string
  content: StoryblokStoryContent
  parent_id?: number
  is_folder?: boolean
  published?: boolean
  tag_list?: string[]
}

interface StoryblokUpdateStoryData {
  name?: string
  content?: StoryblokStoryContent
  published?: boolean
  tag_list?: string[]
}

interface StoryblokApiResponse {
  story: {
    id: number
    name: string
    slug: string
    content: StoryblokStoryContent
    published: boolean
    created_at: string
    updated_at: string
  }
}

/**
 * Create a new Storyblok story
 */
export async function createStoryblokStory(
  storyData: StoryblokCreateStoryData
): Promise<StoryblokApiResponse> {
  const storyblokToken = process.env.STORYBLOK_MANAGEMENT_TOKEN
  const spaceId = process.env.STORYBLOK_SPACE_ID

  if (!storyblokToken) {
    throw new Error('STORYBLOK_MANAGEMENT_TOKEN not configured')
  }

  if (!spaceId) {
    throw new Error('STORYBLOK_SPACE_ID not configured')
  }

  const response = await fetch(`https://mapi.storyblok.com/v1/spaces/${spaceId}/stories/`, {
    method: 'POST',
    headers: {
      'Authorization': storyblokToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      story: storyData
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Storyblok create story error:', error)
    throw new Error(`Storyblok API error (${response.status}): ${error}`)
  }

  return response.json()
}

/**
 * Update an existing Storyblok story
 */
export async function updateStoryblokStory(
  storyId: string | number,
  updateData: StoryblokUpdateStoryData
): Promise<StoryblokApiResponse> {
  const storyblokToken = process.env.STORYBLOK_MANAGEMENT_TOKEN
  const spaceId = process.env.STORYBLOK_SPACE_ID

  if (!storyblokToken) {
    throw new Error('STORYBLOK_MANAGEMENT_TOKEN not configured')
  }

  if (!spaceId) {
    throw new Error('STORYBLOK_SPACE_ID not configured')
  }

  const response = await fetch(`https://mapi.storyblok.com/v1/spaces/${spaceId}/stories/${storyId}`, {
    method: 'PUT',
    headers: {
      'Authorization': storyblokToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      story: updateData
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Storyblok update story error:', error)
    throw new Error(`Storyblok API error (${response.status}): ${error}`)
  }

  return response.json()
}

/**
 * Create Mixcloud show story in Storyblok
 */
export async function createMixcloudShowStory({
  title,
  description,
  mixcloudUrl,
  publishedDate,
  tracklist,
  coverImageUrl,
  showId
}: {
  title: string
  description?: string
  mixcloudUrl: string
  publishedDate: Date
  tracklist?: any[] // Already formatted for Storyblok
  coverImageUrl?: string
  showId: string
}): Promise<StoryblokApiResponse> {
  // Generate embed code from Mixcloud URL
  const embedCode = generateMixcloudEmbed(mixcloudUrl)

  // Create slug from title (lowercase, replace spaces with hyphens, remove special chars)
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

  // Handle cover image - get from Mixcloud if not provided and upload to Storyblok
  let storyblokImageAsset = ''
  const imageUrl = coverImageUrl || await getMixcloudCoverImage(mixcloudUrl)

  if (imageUrl) {
    try {
      const assetData = await uploadImageUrlToStoryblok(imageUrl, slug)
      if (assetData) {
        // For Storyblok asset fields, we can use either the full URL or just the path
        storyblokImageAsset = assetData.public_url
      }
    } catch (error) {
      console.warn('Failed to upload cover image to Storyblok:', error)
      // Fallback to original URL if Storyblok upload fails
      storyblokImageAsset = imageUrl
    }
  }

  const storyContent = {
    component: 'mixcloud_show',
    title,
    description: description || '',
    mixcloud_url: mixcloudUrl,
    mixcloud_embed: embedCode,
    mixcloud_picture: storyblokImageAsset,
    published_date: formatDateForStoryblok(publishedDate),
    tracklist: tracklist || [], // Now properly formatted as Blocks array
    show_id: showId
  }

  const storyData: StoryblokCreateStoryData = {
    name: title,
    slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
    content: storyContent,
    parent_id: getShowsFolderId(),
    published: true,
    tag_list: ['mixcloud', 'radio-show']
  }

  return createStoryblokStory(storyData)
}

/**
 * Generate Mixcloud embed code from URL
 */
function generateMixcloudEmbed(mixcloudUrl: string): string {
  // Extract the path from Mixcloud URL
  // URL format: https://www.mixcloud.com/rhythmlab/show-name/
  try {
    const url = new URL(mixcloudUrl)
    const path = url.pathname

    return `<iframe width="100%" height="120" src="https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(path)}" frameborder="0"></iframe>`
  } catch (error) {
    console.warn('Invalid Mixcloud URL for embed generation:', mixcloudUrl)
    return ''
  }
}

/**
 * Format date for Storyblok Date/Time field
 */
function formatDateForStoryblok(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * Get the Storyblok folder ID for shows
 * This should be configured in environment variables or determined dynamically
 */
function getShowsFolderId(): number {
  const folderId = process.env.STORYBLOK_SHOWS_FOLDER_ID

  if (folderId) {
    return parseInt(folderId, 10)
  }

  // If no folder ID is configured, use root (null/undefined will place in root)
  console.warn('STORYBLOK_SHOWS_FOLDER_ID not configured, creating story in root folder')
  return 0
}

/**
 * Upload image to Storyblok assets
 */
export async function uploadStoryblokAsset(
  file: File,
  filename?: string
): Promise<{ id: number; filename: string; public_url: string }> {
  const storyblokToken = process.env.STORYBLOK_MANAGEMENT_TOKEN
  const spaceId = process.env.STORYBLOK_SPACE_ID

  if (!storyblokToken || !spaceId) {
    throw new Error('Storyblok credentials not configured')
  }

  const formData = new FormData()
  formData.append('file', file)
  if (filename) {
    formData.append('filename', filename)
  }

  const response = await fetch(`https://mapi.storyblok.com/v1/spaces/${spaceId}/assets/`, {
    method: 'POST',
    headers: {
      'Authorization': storyblokToken
    },
    body: formData
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Storyblok asset upload error (${response.status}): ${error}`)
  }

  return response.json()
}