import { GeneratedContent, ContentType } from '../ai/content-generator'

// Function to make direct API calls to Storyblok Management API
async function callStoryblokAPI(endpoint: string, method: string = 'GET', data?: any) {
  const token = process.env.STORYBLOK_MANAGEMENT_TOKEN!

  const response = await fetch(`https://mapi.storyblok.com/v1/${endpoint}`, {
    method,
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Storyblok API error: ${response.status} ${error}`)
  }

  return response.json()
}

// Content type mappings to Storyblok content types
const CONTENT_TYPE_MAPPING: Record<ContentType, string> = {
  'artist-profile': 'artist_profile',
  'deep-dive': 'deep_dive',
  'blog-post': 'blog_post'
}

// Storyblok story structure
export interface StoryblokStory {
  name: string
  slug: string
  content: {
    component: string
    title: string
    subtitle?: string
    content: any // Rich text content
    tags: string[]
    category: string
    published_at?: string
    author?: string
    featured_image?: any
    audio_file?: any // For podcast integration
    [key: string]: any
  }
  is_startpage: boolean
  parent_id: number | null
  group_id?: string
  first_published_at?: string
  published_at?: string
  alternates: any[]
  default_root: string
  disable_fe_editor: boolean
  deleted_at?: string
  sort_by_date?: string
  tag_list: string[]
  meta_data?: {
    title?: string
    description?: string
    og_image?: string
    og_title?: string
    og_description?: string
    twitter_image?: string
    twitter_title?: string
    twitter_description?: string
  }
}

// Create a new story in Storyblok
export async function createStoryblokStory(
  content: GeneratedContent,
  spaceId: number,
  folderId?: number
): Promise<{ success: boolean; story?: any; error?: string }> {
  try {
    const slug = generateSlug(content.title)
    const contentType = CONTENT_TYPE_MAPPING[content.metadata.contentType]

    // Create content object based on the content type
    const storyContent: any = {
      component: contentType,
      tags: content.tags,
      category: content.category,
      published_at: content.metadata.generatedAt,
      author: 'AI Content Generator',
    }

    // Add type-specific fields
    if (contentType === 'artist_profile') {
      storyContent.artist_name = content.title
      storyContent.subtitle = content.subtitle
      storyContent.full_biography = content.richTextContent
    } else {
      storyContent.title = content.title
      storyContent.subtitle = content.subtitle
      storyContent.content = content.richTextContent
    }

    const storyData = {
      name: content.title,
      slug: slug,
      content: storyContent,
      parent_id: folderId || 0,
      tag_list: content.tags,
      meta_data: {
        title: content.seoTitle,
        description: content.metaDescription,
        og_title: content.seoTitle,
        og_description: content.metaDescription,
        twitter_title: content.seoTitle,
        twitter_description: content.metaDescription
      }
    }

    const response = await callStoryblokAPI(`spaces/${spaceId}/stories/`, 'POST', {
      story: storyData
    })

    return {
      success: true,
      story: response.story
    }
  } catch (error: any) {
    console.error('Error creating Storyblok story:', error)
    return {
      success: false,
      error: error.message || 'Failed to create story'
    }
  }
}

// Update an existing story
export async function updateStoryblokStory(
  storyId: number,
  content: GeneratedContent,
  spaceId: number
): Promise<{ success: boolean; story?: any; error?: string }> {
  try {
    const contentType = CONTENT_TYPE_MAPPING[content.metadata.contentType]

    const updateData = {
      content: {
        component: contentType,
        title: content.title,
        subtitle: content.subtitle,
        content: content.richTextContent,
        tags: content.tags,
        category: content.category,
        author: 'AI Content Generator',
      },
      tag_list: content.tags,
      meta_data: {
        title: content.seoTitle,
        description: content.metaDescription,
        og_title: content.seoTitle,
        og_description: content.metaDescription,
        twitter_title: content.seoTitle,
        twitter_description: content.metaDescription
      }
    }

    const response = await callStoryblokAPI(`spaces/${spaceId}/stories/${storyId}`, 'PUT', {
      story: updateData,
      publish: 0 // Keep as draft
    })

    return {
      success: true,
      story: response.story
    }
  } catch (error: any) {
    console.error('Error updating Storyblok story:', error)
    return {
      success: false,
      error: error.message || 'Failed to update story'
    }
  }
}

// Publish a story
export async function publishStoryblokStory(
  storyId: number,
  spaceId: number
): Promise<{ success: boolean; story?: any; error?: string }> {
  try {
    const response = await callStoryblokAPI(`spaces/${spaceId}/stories/${storyId}`, 'GET')
    const story = response.story

    const publishResponse = await callStoryblokAPI(`spaces/${spaceId}/stories/${storyId}`, 'PUT', {
      story: story,
      publish: 1
    })

    return {
      success: true,
      story: publishResponse.story
    }
  } catch (error: any) {
    console.error('Error publishing Storyblok story:', error)
    return {
      success: false,
      error: error.message || 'Failed to publish story'
    }
  }
}

// Upload audio file for podcast integration
export async function uploadAudioToStoryblok(
  audioBuffer: Buffer,
  filename: string,
  spaceId: number
): Promise<{ success: boolean; asset?: any; error?: string }> {
  try {
    // First, get signed upload URL
    const signedResponse = await storyblokClient.post(`spaces/${spaceId}/assets`, {
      filename: filename,
      asset_folder_id: null, // You can specify a folder ID if needed
      size: audioBuffer.length
    })

    const uploadData = signedResponse.data

    // Upload file to the signed URL
    const formData = new FormData()
    Object.keys(uploadData.fields).forEach(key => {
      formData.append(key, uploadData.fields[key])
    })
    formData.append('file', new Blob([audioBuffer]), filename)

    const uploadResponse = await fetch(uploadData.post_url, {
      method: 'POST',
      body: formData
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload audio file')
    }

    // Finalize the asset
    const finalizeResponse = await storyblokClient.get(`spaces/${spaceId}/assets/${uploadData.id}`)

    return {
      success: true,
      asset: finalizeResponse.data.asset
    }
  } catch (error: any) {
    console.error('Error uploading audio to Storyblok:', error)
    return {
      success: false,
      error: error.message || 'Failed to upload audio'
    }
  }
}

// Add audio file to a deep dive story
export async function addAudioToDeepDive(
  storyId: number,
  audioAsset: any,
  spaceId: number
): Promise<{ success: boolean; story?: any; error?: string }> {
  try {
    // Get existing story
    const response = await storyblokClient.get(`spaces/${spaceId}/stories/${storyId}`)
    const story = response.data.story

    // Add audio file to the content
    const updatedContent = {
      ...story.content,
      audio_file: {
        id: audioAsset.id,
        alt: audioAsset.alt || '',
        name: audioAsset.name,
        focus: audioAsset.focus,
        title: audioAsset.title || '',
        filename: audioAsset.filename,
        copyright: audioAsset.copyright || '',
        fieldtype: 'asset',
        meta_data: audioAsset.meta_data || {}
      }
    }

    // Update the story
    const updateResponse = await storyblokClient.put(`spaces/${spaceId}/stories/${storyId}`, {
      story: {
        ...story,
        content: updatedContent
      },
      publish: 0 // Keep as draft
    })

    return {
      success: true,
      story: updateResponse.data.story
    }
  } catch (error: any) {
    console.error('Error adding audio to deep dive:', error)
    return {
      success: false,
      error: error.message || 'Failed to add audio to story'
    }
  }
}

// Get stories by content type
export async function getStoriesByType(
  contentType: ContentType,
  spaceId: number,
  page: number = 1,
  perPage: number = 25
): Promise<{ success: boolean; stories?: any[]; total?: number; error?: string }> {
  try {
    const storyblokContentType = CONTENT_TYPE_MAPPING[contentType]

    const response = await storyblokClient.get(`spaces/${spaceId}/stories`, {
      filter_query: {
        component: {
          in: storyblokContentType
        }
      },
      page: page,
      per_page: perPage,
      sort_by: 'created_at:desc'
    })

    return {
      success: true,
      stories: response.data.stories,
      total: response.headers['total']
    }
  } catch (error: any) {
    console.error('Error fetching stories by type:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch stories'
    }
  }
}

// Helper functions
function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // Add timestamp to make slug unique
  const timestamp = Date.now()
  return `${baseSlug}-${timestamp}`
}

function extractMetaDescription(richTextContent: any): string {
  try {
    // Extract first paragraph from rich text content for meta description
    const firstParagraph = richTextContent.content?.find((node: any) =>
      node.type === 'paragraph' && node.content?.[0]?.text
    )

    const text = firstParagraph?.content?.[0]?.text || ''
    return text.length > 160 ? text.substring(0, 160) + '...' : text
  } catch {
    return ''
  }
}

// Get Storyblok space information
export async function getSpaceInfo(spaceId: number): Promise<{ success: boolean; space?: any; error?: string }> {
  try {
    const response = await storyblokClient.get(`spaces/${spaceId}`)
    return {
      success: true,
      space: response.data.space
    }
  } catch (error: any) {
    console.error('Error fetching space info:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch space info'
    }
  }
}