import { NextRequest, NextResponse } from 'next/server'
import { generateContent, ContentRequest } from '@/lib/ai/content-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, topic, additionalContext, targetLength } = body

    if (!type || !topic) {
      return NextResponse.json(
        { error: 'Content type and topic are required' },
        { status: 400 }
      )
    }

    const contentRequest: ContentRequest = {
      type,
      topic,
      additionalContext,
      targetLength: targetLength || 'medium'
    }

    console.log('Generating content for:', contentRequest)

    const generatedContent = await generateContent(contentRequest)

    // Convert rich text content back to plain text for preview
    const plainTextContent = extractPlainTextFromRichText(generatedContent.richTextContent)

    // Ensure plainTextContent is always a string
    const contentString = typeof plainTextContent === 'string'
      ? plainTextContent
      : (typeof plainTextContent === 'object' && plainTextContent !== null && 'content' in plainTextContent)
        ? String((plainTextContent as any).content)
        : String(plainTextContent || '')

    const response = {
      content: {
        title: generatedContent.title,
        seoTitle: generatedContent.seoTitle,
        subtitle: generatedContent.subtitle,
        metaDescription: generatedContent.metaDescription,
        content: contentString,
        tags: generatedContent.tags,
        category: generatedContent.category,
        wordCount: generatedContent.metadata.wordCount,
        seoBlock: generatedContent.seoBlock, // Include the SEO block data
        searchResults: generatedContent.searchResults // Include source metadata from Perplexity
      },
      metadata: generatedContent.metadata
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Content generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    )
  }
}

// Helper function to extract plain text from Storyblok rich text format
function extractPlainTextFromRichText(richTextContent: any): string {
  if (!richTextContent?.content) return ''

  let isFirstHeading = true

  return richTextContent.content
    .map((node: any) => {
      if (node.type === 'paragraph' && node.content) {
        return node.content.map((textNode: any) => textNode.text || '').join('')
      }
      if (node.type === 'heading' && node.content) {
        // Skip the first h1 heading as it's the title
        if (isFirstHeading && node.attrs?.level === 1) {
          isFirstHeading = false
          return '' // Skip the title
        }
        const level = '#'.repeat(node.attrs?.level || 1)
        const text = node.content.map((textNode: any) => textNode.text || '').join('')
        return `${level} ${text}`
      }
      if (node.type === 'bullet_list' || node.type === 'ordered_list') {
        // Handle lists
        return node.content?.map((item: any) => {
          const itemText = item.content?.[0]?.content?.map((t: any) => t.text || '').join('') || ''
          return node.type === 'bullet_list' ? `• ${itemText}` : `- ${itemText}`
        }).join('\n') || ''
      }
      return ''
    })
    .filter((text: string) => text.trim())
    .join('\n\n')
}