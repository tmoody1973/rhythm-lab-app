import { NextRequest, NextResponse } from 'next/server'
import { createStoryblokStory } from '@/lib/storyblok/content-api'
import { GeneratedContent, ContentType } from '@/lib/ai/content-generator'
import { markdownToStoryblokRichtext } from '@storyblok/richtext/markdown-parser'
import { formatContentWithCitations } from '@/lib/utils/citation-formatter'

// You'll need to set these environment variables
const STORYBLOK_SPACE_ID = parseInt(process.env.STORYBLOK_SPACE_ID || '0')

// Folder IDs for different content types
const STORYBLOK_FOLDERS = {
  'artist-profile': parseInt(process.env.STORYBLOK_PROFILES_FOLDER_ID || '0'),
  'deep-dive': parseInt(process.env.STORYBLOK_DEEP_DIVES_FOLDER_ID || '0'),
  'blog-post': parseInt(process.env.STORYBLOK_BLOG_FOLDER_ID || '0')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, contentType, selectedImage } = body

    if (!content || !contentType) {
      return NextResponse.json(
        { error: 'Content and content type are required' },
        { status: 400 }
      )
    }

    if (!STORYBLOK_SPACE_ID) {
      return NextResponse.json(
        { error: 'Storyblok space ID not configured' },
        { status: 500 }
      )
    }

    console.log('Publishing to Storyblok:', {
      title: content.title,
      type: contentType,
      spaceId: STORYBLOK_SPACE_ID
    })

    // Format content with styled citations using search results metadata
    const formattedContent = formatContentWithCitations(content.content, content.searchResults)

    // Convert the preview content back to GeneratedContent format
    const generatedContent: GeneratedContent = {
      title: content.title,
      subtitle: content.subtitle,
      seoTitle: content.seoTitle,
      metaDescription: content.metaDescription,
      richTextContent: convertPlainTextToRichText(formattedContent),
      tags: content.tags,
      category: content.category,
      metadata: {
        generatedAt: new Date().toISOString(),
        contentType: contentType as ContentType,
        wordCount: content.wordCount
      },
      // Use the SEO block from generated content, adding image if available
      seoBlock: content.seoBlock ? {
        ...content.seoBlock,
        // Add image fields if an image was selected and uploaded
        ...(selectedImage?.uploadedAsset ? {
          og_image: selectedImage.uploadedAsset,
          twitter_image: selectedImage.uploadedAsset
        } : {})
      } : {
        // Fallback SEO block if none was generated
        component: 'seo',
        title: content.seoTitle || content.title,
        description: content.metaDescription,
        og_title: content.seoTitle || content.title,
        og_description: content.metaDescription,
        twitter_title: content.seoTitle || content.title,
        twitter_description: content.metaDescription,
        // Add image fields if available
        ...(selectedImage?.uploadedAsset ? {
          og_image: selectedImage.uploadedAsset,
          twitter_image: selectedImage.uploadedAsset
        } : {})
      }
    }

    // Get the appropriate folder ID based on content type
    const folderId = STORYBLOK_FOLDERS[contentType as ContentType]

    const result = await createStoryblokStory(
      generatedContent,
      STORYBLOK_SPACE_ID,
      folderId || undefined
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        storyId: result.story?.id,
        url: `https://app.storyblok.com/#/me/spaces/${STORYBLOK_SPACE_ID}/stories/0/0/${result.story?.id}`,
        message: 'Content successfully published to Storyblok'
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Storyblok publish error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish to Storyblok' },
      { status: 500 }
    )
  }
}

// Convert plain text back to Storyblok rich text format
// Using markdown-to-richtext for better formatting preservation
function convertPlainTextToRichText(plainText: string) {
  // The content is likely markdown, so use the proper converter
  return markdownToStoryblokRichtext(plainText)
}