// SerpAPI Image Search Integration
// Using native fetch API available in Next.js

export interface ImageResult {
  position: number
  thumbnail: string
  original: string
  title: string
  source: string
  is_product?: boolean
  link?: string
}

export interface ImageSearchOptions {
  query: string
  safeSearch?: 'active' | 'off'
  imageType?: 'photos' | 'clipart' | 'lineart' | 'any'
  imageSize?: 'large' | 'medium' | 'any'
  aspectRatio?: 'tall' | 'square' | 'wide' | 'any'
  page?: number
  maxResults?: number
}

export interface ImageSearchResponse {
  success: boolean
  images: ImageResult[]
  searchInfo?: {
    query: string
    totalResults?: number
    page: number
  }
  error?: string
}

/**
 * Search for images using SerpAPI Google Images
 */
export async function searchImages(options: ImageSearchOptions): Promise<ImageSearchResponse> {
  const {
    query,
    safeSearch = 'active',
    imageType = 'photos',
    imageSize = 'large',
    aspectRatio = 'any',
    page = 1,
    maxResults = 20
  } = options

  if (!process.env.SERPAPI_API_KEY) {
    return {
      success: false,
      images: [],
      error: 'SerpAPI key not configured'
    }
  }

  try {
    // Build search parameters
    const params = new URLSearchParams({
      engine: 'google_images',
      q: query,
      api_key: process.env.SERPAPI_API_KEY,
      safe: safeSearch,
      ijn: (page - 1).toString(), // SerpAPI pagination starts at 0
      num: Math.min(maxResults, 100).toString(), // Max 100 per request
    })

    // Add advanced filters using tbs parameter
    const filters: string[] = []

    // Image type filters
    if (imageType === 'photos') filters.push('itp:photos')
    if (imageType === 'clipart') filters.push('itp:clipart')
    if (imageType === 'lineart') filters.push('itp:lineart')

    // Image size filters (imgsz parameter)
    if (imageSize === 'large') filters.push('isz:l')
    if (imageSize === 'medium') filters.push('isz:m')

    // Aspect ratio filters (imgar parameter)
    if (aspectRatio === 'wide') filters.push('iar:w')
    if (aspectRatio === 'tall') filters.push('iar:t')
    if (aspectRatio === 'square') filters.push('iar:s')

    if (filters.length > 0) {
      params.append('tbs', filters.join(','))
    }

    const response = await fetch(`https://serpapi.com/search?${params}`)

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Handle SerpAPI errors
    if (data.error) {
      throw new Error(data.error)
    }

    const images: ImageResult[] = (data.images_results || []).map((img: any) => ({
      position: img.position || 0,
      thumbnail: img.thumbnail || '',
      original: img.original || '',
      title: img.title || '',
      source: img.source || '',
      is_product: img.is_product || false,
      link: img.link || ''
    }))

    return {
      success: true,
      images: images.slice(0, maxResults), // Ensure we don't exceed requested limit
      searchInfo: {
        query,
        totalResults: data.search_information?.total_results,
        page
      }
    }
  } catch (error: any) {
    console.error('SerpAPI image search error:', error)
    return {
      success: false,
      images: [],
      error: error.message || 'Failed to search images'
    }
  }
}

/**
 * Download and prepare image for Storyblok upload
 */
export async function downloadImageForUpload(imageUrl: string): Promise<{
  success: boolean
  buffer?: Buffer
  contentType?: string
  filename?: string
  error?: string
}> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentBot/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await response.arrayBuffer())

    // Generate filename from URL
    const urlParts = new URL(imageUrl)
    const pathParts = urlParts.pathname.split('/')
    const originalFilename = pathParts[pathParts.length - 1] || 'image'

    // Ensure proper extension
    const extension = contentType.includes('png') ? '.png' :
                    contentType.includes('gif') ? '.gif' :
                    contentType.includes('webp') ? '.webp' : '.jpg'

    const filename = originalFilename.includes('.') ?
                    originalFilename :
                    `${originalFilename}${extension}`

    return {
      success: true,
      buffer,
      contentType,
      filename
    }
  } catch (error: any) {
    console.error('Image download error:', error)
    return {
      success: false,
      error: error.message || 'Failed to download image'
    }
  }
}

/**
 * Generate contextual search queries for content
 */
export function generateImageSearchQueries(content: {
  title: string
  type: 'artist-profile' | 'deep-dive' | 'blog-post'
  topic: string
}): string[] {
  const { title, type, topic } = content
  const queries: string[] = []

  switch (type) {
    case 'artist-profile':
      queries.push(
        `${topic} musician artist photo`,
        `${topic} band live performance`,
        `${topic} album cover discography`,
        `${topic} concert stage photo`
      )
      break

    case 'deep-dive':
      queries.push(
        `${topic} music history`,
        `${topic} vintage photos`,
        `${topic} album covers`,
        `${topic} instruments equipment`
      )
      break

    case 'blog-post':
      queries.push(
        `${topic} music culture`,
        `${topic} artistic illustration`,
        `music ${topic} concept`,
        `${topic} lifestyle music`
      )
      break
  }

  // Add general fallback
  queries.push(topic, title)

  return queries.filter(q => q.length > 3) // Remove very short queries
}