import { createClient } from '@sanity/client'

const sanityWriteClient = createClient({
  projectId: 'b9cutvrc',
  dataset: 'production',
  apiVersion: '2026-05-17',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

export interface TracklistItem {
  startTime: number
  artistName: string
  trackName: string
}

export interface UpsertEpisodeInput {
  mixcloudKey: string
  title: string
  date?: string
  duration?: number
  coverImageUrl?: string
  tracklist?: TracklistItem[]
  tags?: string[]
}

export interface UpsertEpisodeResult {
  sanityId: string
  slug: string
  created: boolean
}

async function uploadCoverImage(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const filename = imageUrl.split('/').pop()?.split('?')[0] ?? 'cover.jpg'
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const asset = await sanityWriteClient.assets.upload('image', Buffer.from(buffer), {
      filename,
      contentType,
    })
    return asset._id
  } catch {
    return null
  }
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 96) || `episode-${Date.now().toString(36)}`
  )
}

export async function upsertEpisode(input: UpsertEpisodeInput): Promise<UpsertEpisodeResult> {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    throw new Error('SANITY_API_WRITE_TOKEN is not configured')
  }

  const slug = slugify(input.title)

  const existing = await sanityWriteClient.fetch<{ _id: string } | null>(
    `*[_type == "showOverride" && mixcloudKey == $key][0]{_id}`,
    { key: input.mixcloudKey }
  )

  let featuredImageRef: { _type: string; asset: { _type: string; _ref: string } } | undefined
  if (input.coverImageUrl) {
    const assetId = await uploadCoverImage(input.coverImageUrl)
    if (assetId) {
      featuredImageRef = { _type: 'image', asset: { _type: 'reference', _ref: assetId } }
    }
  }

  const docFields: Record<string, unknown> = {
    mixcloudKey: input.mixcloudKey,
    // Only include title/slug if non-empty — prevents overwriting existing title on tracklist-only patches
    ...(input.title ? { title: input.title, slug: { _type: 'slug', current: slug } } : {}),
    ...(input.date ? { date: input.date } : {}),
    ...(input.duration !== undefined ? { duration: input.duration } : {}),
    ...(featuredImageRef ? { featuredImage: featuredImageRef } : {}),
    ...(input.tracklist?.length
      ? {
          tracklist: input.tracklist.map(t => ({
            _type: 'object',
            _key: Math.random().toString(36).slice(2, 10),
            ...t,
          })),
        }
      : {}),
  }

  if (existing) {
    await sanityWriteClient.patch(existing._id).set(docFields).commit()
    return { sanityId: existing._id, slug, created: false }
  } else {
    const created = await sanityWriteClient.create({ _type: 'showOverride', ...docFields })
    return { sanityId: created._id, slug, created: true }
  }
}
