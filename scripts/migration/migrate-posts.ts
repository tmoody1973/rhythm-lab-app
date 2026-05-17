import 'dotenv/config'
import { fetchStoryblokStories, extractPlainText } from './shared/storyblok-client'
import { sanityWriteClient, uploadImageFromUrl } from './shared/sanity-client'
import { storyblokRichtextToPortableText } from './shared/rich-text'

type StoryblokContent = {
  title?: string
  subtitle?: string
  excerpt?: string
  intro?: string
  reading_time?: number
  estimated_read_time?: number
  featured_image?: { filename?: string }
  image?: { filename?: string }
  content?: { content?: unknown[] }
  long_text?: { content?: unknown[] }
  body?: { content?: unknown[] }
}

type StoryblokStory = {
  name: string
  slug: string
  first_published_at?: string
  created_at: string
  content: StoryblokContent
}

async function migratePosts(): Promise<void> {
  console.log('Fetching blog posts from Storyblok...')
  const rawStories = await fetchStoryblokStories('blog/')
  const stories = rawStories as StoryblokStory[]
  console.log(`Found ${stories.length} posts`)

  if (stories.length === 0) {
    console.log('No posts found. Check the Storyblok folder path.')
    return
  }

  let created = 0
  let skipped = 0

  for (const story of stories) {
    const content = story.content
    const title = content.title ?? story.name
    const slug = story.slug

    // Skip if already migrated (idempotent)
    const existing = await sanityWriteClient.fetch<string | null>(
      `*[_type == "post" && slug.current == $slug][0]._id`,
      { slug }
    )
    if (existing) {
      console.log(`  Skipping (already exists): ${slug}`)
      skipped++
      continue
    }

    console.log(`  Migrating: ${title}`)

    let coverImageRef:
      | { _type: string; asset: { _type: string; _ref: string } }
      | undefined

    const imageUrl =
      content.featured_image?.filename ?? content.image?.filename
    if (imageUrl) {
      try {
        const assetId = await uploadImageFromUrl(imageUrl)
        coverImageRef = {
          _type: 'image',
          asset: { _type: 'reference', _ref: assetId },
        }
        console.log(`    Uploaded cover image`)
      } catch (e) {
        console.warn(`    Failed to upload cover image:`, e)
      }
    }

    const richTextSource =
      content.content ?? content.long_text ?? content.body
    const body = storyblokRichtextToPortableText(
      richTextSource as { content?: unknown[] } | null | undefined
    )

    const doc = {
      _type: 'post',
      title,
      ...(content.subtitle ? { subtitle: content.subtitle } : {}),
      slug: { _type: 'slug', current: slug },
      publishedAt: story.first_published_at ?? story.created_at,
      ...((() => { const ex = extractPlainText(content.excerpt || content.intro); return ex ? { excerpt: ex } : {} })()),
      readingTime:
        content.reading_time ?? content.estimated_read_time ?? null,
      body,
      ...(coverImageRef ? { coverImage: coverImageRef } : {}),
    }

    await sanityWriteClient.create(doc)
    console.log(`    Created post: ${slug}`)
    created++
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
}

migratePosts().catch((err: unknown) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
