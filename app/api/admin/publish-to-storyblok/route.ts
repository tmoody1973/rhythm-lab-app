import { NextRequest, NextResponse } from 'next/server'
import { createStoryblokStory } from '@/lib/storyblok/content-api'
import { GeneratedContent, ContentType } from '@/lib/ai/content-generator'

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
    const { content, contentType } = body

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

    // Convert the preview content back to GeneratedContent format
    const generatedContent: GeneratedContent = {
      title: content.title,
      subtitle: content.subtitle,
      seoTitle: content.seoTitle,
      metaDescription: content.metaDescription,
      richTextContent: convertPlainTextToRichText(content.content),
      tags: content.tags,
      category: content.category,
      metadata: {
        generatedAt: new Date().toISOString(),
        contentType: contentType as ContentType,
        wordCount: content.wordCount
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
function convertPlainTextToRichText(plainText: string) {
  const paragraphs = plainText.split('\n\n').filter(p => p.trim())

  return {
    type: 'doc',
    content: paragraphs.map(paragraph => {
      const trimmed = paragraph.trim()

      // Check if it's a heading
      if (trimmed.startsWith('#')) {
        const level = trimmed.match(/^#+/)?.[0].length || 1
        return {
          type: 'heading',
          attrs: { level: Math.min(level, 6) },
          content: [
            {
              type: 'text',
              text: trimmed.replace(/^#+\s*/, '')
            }
          ]
        }
      }

      // Regular paragraph
      return {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: trimmed
          }
        ]
      }
    })
  }
}