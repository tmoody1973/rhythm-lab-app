import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { adminClient, INDICES } from '@/lib/algolia/client'

const sanityClient = createClient({
  projectId: 'b9cutvrc',
  dataset: 'production',
  apiVersion: '2026-05-17',
  useCdn: false,
})

interface SanityImageRef { asset?: { _ref?: string }; alt?: string }
interface SanityTag { label: string; slug: string }

interface SanityPost {
  _id: string; title: string; subtitle?: string; slug: string
  publishedAt?: string; excerpt?: string; readingTime?: number
  coverImage?: SanityImageRef; tags?: SanityTag[]; author?: { name: string }
}

interface SanityDeepDive {
  _id: string; title: string; subtitle?: string; slug: string
  publishedAt?: string; excerpt?: string; estimatedReadTime?: number
  difficultyLevel?: string; coverImage?: SanityImageRef
  tags?: SanityTag[]; author?: { name: string }
}

interface SanityArtistProfile {
  _id: string; title: string; subtitle?: string; slug: string
  genre?: string; featuredImage?: SanityImageRef; tags?: SanityTag[]
}

export async function POST(request: NextRequest) {
  try {
    if (!adminClient) {
      return NextResponse.json({ error: 'Algolia admin client not configured' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all content types from Sanity in parallel
    const [posts, deepDives, artistProfiles] = await Promise.all([
      sanityClient.fetch<SanityPost[]>(`
        *[_type == "post"] {
          _id, title, subtitle, "slug": slug.current,
          publishedAt, excerpt, readingTime,
          "coverImage": coverImage{asset, alt},
          "tags": tags[]->{label, "slug": slug.current},
          "author": author->{name}
        }
      `),
      sanityClient.fetch<SanityDeepDive[]>(`
        *[_type == "deepDive"] {
          _id, title, subtitle, "slug": slug.current,
          publishedAt, excerpt, estimatedReadTime, difficultyLevel,
          "coverImage": coverImage{asset, alt},
          "tags": tags[]->{label, "slug": slug.current},
          "author": author->{name}
        }
      `),
      sanityClient.fetch<SanityArtistProfile[]>(`
        *[_type == "artistProfile"] {
          _id, title, subtitle, "slug": slug.current,
          genre,
          "featuredImage": featuredImage{asset, alt},
          "tags": tags[]->{label, "slug": slug.current}
        }
      `),
    ])

    const publishedPostObjects = posts.map((post) => ({
      objectID: post._id,
      title: post.title,
      subtitle: post.subtitle || '',
      description: post.excerpt || post.subtitle || '',
      slug: post.slug,
      url: `/blog/${post.slug}`,
      content_type: 'blog_post',
      published_at: post.publishedAt || '',
      publish_timestamp: post.publishedAt ? new Date(post.publishedAt).getTime() : 0,
      tags: post.tags?.map(t => t.label) ?? [],
      author: post.author?.name || 'Rhythm Lab Radio',
      reading_time: post.readingTime || null,
      has_image: !!post.coverImage?.asset,
      searchable_text: [post.title, post.subtitle, post.excerpt, post.tags?.map(t => t.label).join(' ')].filter(Boolean).join(' '),
    }))

    const deepDiveObjects = deepDives.map((dd) => ({
      objectID: dd._id,
      title: dd.title,
      subtitle: dd.subtitle || '',
      description: dd.excerpt || dd.subtitle || '',
      slug: dd.slug,
      url: `/deep-dives/${dd.slug}`,
      content_type: 'deep_dive',
      published_at: dd.publishedAt || '',
      publish_timestamp: dd.publishedAt ? new Date(dd.publishedAt).getTime() : 0,
      tags: dd.tags?.map(t => t.label) ?? [],
      author: dd.author?.name || 'Rhythm Lab Radio',
      reading_time: dd.estimatedReadTime || null,
      difficulty: dd.difficultyLevel || null,
      has_image: !!dd.coverImage?.asset,
      searchable_text: [dd.title, dd.subtitle, dd.excerpt, dd.tags?.map(t => t.label).join(' ')].filter(Boolean).join(' '),
    }))

    const artistProfileObjects = artistProfiles.map((ap) => ({
      objectID: ap._id,
      title: ap.title,
      subtitle: ap.subtitle || '',
      description: ap.subtitle || '',
      slug: ap.slug,
      url: `/profiles/${ap.slug}`,
      content_type: 'artist_profile',
      genre: ap.genre || '',
      tags: ap.tags?.map(t => t.label) ?? [],
      has_image: !!ap.featuredImage?.asset,
      searchable_text: [ap.title, ap.subtitle, ap.genre, ap.tags?.map(t => t.label).join(' ')].filter(Boolean).join(' '),
    }))

    const algoliaObjects = [...publishedPostObjects, ...deepDiveObjects, ...artistProfileObjects]

    if (algoliaObjects.length === 0) {
      return NextResponse.json({ message: 'No content found to index' }, { status: 200 })
    }

    console.log(`Indexing ${algoliaObjects.length} content pieces from Sanity...`)

    const { taskID } = await adminClient.replaceAllObjects({
      indexName: INDICES.CONTENT,
      objects: algoliaObjects,
      batchSize: 1000,
    })

    return NextResponse.json({
      success: true,
      message: `Successfully queued ${algoliaObjects.length} content pieces for indexing`,
      taskID,
      indexed_count: algoliaObjects.length,
      content_types: {
        posts: publishedPostObjects.length,
        deepDives: deepDiveObjects.length,
        artistProfiles: artistProfileObjects.length,
      },
    })

  } catch (error) {
    console.error('Content indexing error:', error)
    return NextResponse.json(
      { error: 'Failed to index content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Sanity Content Indexing',
    description: 'POST to this endpoint with a Bearer token to index all Sanity content to Algolia',
    data_source: 'Sanity CMS (posts, deepDives, artistProfiles)',
  })
}
