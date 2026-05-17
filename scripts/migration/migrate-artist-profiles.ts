import 'dotenv/config'
import { fetchStoryblokStories, extractPlainText } from './shared/storyblok-client'
import { sanityWriteClient, uploadImageFromUrl } from './shared/sanity-client'
import { storyblokRichtextToPortableText } from './shared/rich-text'

type StoryblokContent = {
  title?: string
  subtitle?: string
  tagline?: string
  intro?: string
  description?: string
  genre?: string
  website_url?: string
  featured_image?: { filename?: string }
  artist_photo?: { filename?: string }
  image?: { filename?: string }
  content?: { content?: unknown[] }
  full_biography?: { content?: unknown[] }
  body?: { content?: unknown[] }
}

type StoryblokStory = {
  name: string
  slug: string
  first_published_at?: string
  created_at: string
  content: StoryblokContent
}

async function migrateArtistProfiles(): Promise<void> {
  console.log('Fetching artist profiles from Storyblok...')
  const rawStories = await fetchStoryblokStories('profiles/')
  const stories = rawStories as StoryblokStory[]
  console.log(`Found ${stories.length} artist profiles`)

  if (stories.length === 0) {
    console.log('No artist profiles found. Check the Storyblok folder path.')
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
      `*[_type == "artistProfile" && slug.current == $slug][0]._id`,
      { slug }
    )
    if (existing) {
      console.log(`  Skipping (already exists): ${slug}`)
      skipped++
      continue
    }

    console.log(`  Migrating: ${title}`)

    let featuredImageRef:
      | { _type: string; asset: { _type: string; _ref: string } }
      | undefined

    const imageUrl =
      content.featured_image?.filename ??
      content.artist_photo?.filename ??
      content.image?.filename
    if (imageUrl) {
      try {
        const assetId = await uploadImageFromUrl(imageUrl)
        featuredImageRef = {
          _type: 'image',
          asset: { _type: 'reference', _ref: assetId },
        }
        console.log(`    Uploaded featured image`)
      } catch (e) {
        console.warn(`    Failed to upload featured image:`, e)
      }
    }

    const richTextSource =
      content.content ?? content.full_biography ?? content.body
    const body = storyblokRichtextToPortableText(
      richTextSource as { content?: unknown[] } | null | undefined
    )

    const excerpt = extractPlainText(
      content.intro || content.description || content.subtitle
    )

    const doc = {
      _type: 'artistProfile',
      title,
      ...(content.subtitle || content.tagline
        ? { subtitle: content.subtitle ?? content.tagline }
        : {}),
      slug: { _type: 'slug', current: slug },
      ...(content.genre ? { genre: content.genre } : {}),
      ...(content.website_url ? { website: content.website_url } : {}),
      body,
      ...(featuredImageRef ? { featuredImage: featuredImageRef } : {}),
    }

    await sanityWriteClient.create(doc)
    console.log(`    Created artist profile: ${slug}`)
    created++
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
}

migrateArtistProfiles().catch((err: unknown) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
