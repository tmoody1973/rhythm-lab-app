import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { addContentHistoryEntry } from '@/lib/content-history'

const sanityClient = createClient({
  projectId: 'b9cutvrc',
  dataset: 'production',
  apiVersion: '2026-05-17',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const CONTENT_TYPE_MAP: Record<string, string> = {
  'blog-post': 'post',
  'deep-dive': 'deepDive',
  'artist-profile': 'artistProfile',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96)
}

export async function POST(request: NextRequest) {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Sanity write token not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { content, contentType } = body

    if (!content || !contentType) {
      return NextResponse.json(
        { error: 'content and contentType are required' },
        { status: 400 }
      )
    }

    const sanityType = CONTENT_TYPE_MAP[contentType]
    if (!sanityType) {
      return NextResponse.json(
        { error: `Unknown content type: ${contentType}. Valid types: ${Object.keys(CONTENT_TYPE_MAP).join(', ')}` },
        { status: 400 }
      )
    }

    if (!content.title) {
      return NextResponse.json({ error: 'content.title is required' }, { status: 400 })
    }

    const slug = slugify(content.title)

    const doc = {
      _type: sanityType,
      title: content.title,
      ...(content.subtitle ? { subtitle: content.subtitle } : {}),
      slug: { _type: 'slug', current: slug },
      ...(content.excerpt ? { excerpt: content.excerpt } : {}),
      body: content.portableText || [],
      seo: {
        seoTitle: content.seoTitle || content.title,
        metaDescription: content.metaDescription || content.excerpt || '',
      },
    }

    const created = await sanityClient.create(doc)

    await addContentHistoryEntry({
      title: content.title,
      contentType: contentType as 'artist-profile' | 'deep-dive' | 'blog-post' | 'show-description',
      status: 'draft',
      storyblokId: created._id,
      metadata: {
        generatedBy: 'AI Content Generator',
        wordCount: content.wordCount,
      },
    })

    return NextResponse.json({
      success: true,
      sanityId: created._id,
      slug,
      message: `Draft created in Sanity Studio. Review and publish at /studio`,
    })
  } catch (error) {
    console.error('Error publishing to Sanity:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to publish to Sanity: ${message}` },
      { status: 500 }
    )
  }
}
