/**
 * Storyblok Management API Helper
 * Handles creation and updates of Storyblok stories via Management API
 */

import { getMixcloudCoverImage, uploadImageFileToStoryblok } from './mixcloud/cover-image'

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

  // Log the payload being sent
  console.log('📤 Sending to Storyblok API:', {
    name: storyData.name,
    slug: storyData.slug,
    component: storyData.content.component,
    parent_id: storyData.parent_id,
    tracklistCount: storyData.content.tracklist?.length || 0,
    firstTrack: storyData.content.tracklist?.[0]
  })

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
    console.error('❌ Storyblok create story error:', {
      status: response.status,
      statusText: response.statusText,
      error
    })
    throw new Error(`Storyblok API error (${response.status}): ${error}`)
  }

  const result = await response.json()
  console.log('✅ Storyblok story created:', result.story.id)
  return result
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
  coverImageFile,
  showId
}: {
  title: string
  description?: string
  mixcloudUrl: string
  publishedDate: Date
  tracklist?: any[] // Already formatted for Storyblok
  coverImageFile?: File
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

  // Handle cover image - upload file or get from Mixcloud if not provided
  let storyblokImageAsset: any = null
  let imageUrl: string | null = null

  if (coverImageFile) {
    // Upload the provided file to Storyblok as asset
    const uploadResult = await uploadImageFileToStoryblok(coverImageFile, `${slug}-cover`)
    if (uploadResult) {
      storyblokImageAsset = {
        alt: `${title} cover image`,
        name: uploadResult.filename,
        focus: "",
        title: title,
        filename: uploadResult.filename,
        copyright: "",
        fieldtype: "asset",
        meta_data: {},
        id: uploadResult.id
      }
    }
  } else {
    // Fallback to Mixcloud cover image
    imageUrl = await getMixcloudCoverImage(mixcloudUrl)

    if (imageUrl) {
      console.log('Found cover image URL:', imageUrl)
      // Format for Storyblok asset field with external URL
      storyblokImageAsset = {
        alt: `${title} cover image`,
        name: `${slug}-cover`,
        focus: "",
        title: title,
        source: "url",
        copyright: "",
        fieldtype: "asset",
        meta_data: {},
        is_external_url: true,
        external_url: imageUrl
      }
    } else {
      console.warn('No cover image found for Mixcloud URL:', mixcloudUrl)
      storyblokImageAsset = null
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