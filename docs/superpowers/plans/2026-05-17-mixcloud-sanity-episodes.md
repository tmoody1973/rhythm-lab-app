# Mixcloud + Sanity Episode Posts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-create rich Sanity episode drafts when Mixcloud shows are imported, with AI-generated descriptions and dedicated `/episodes/[slug]` pages.

**Architecture:** The existing `showOverride` Sanity schema is expanded into a full "Episode" document type. A shared `lib/sanity/episodeHelpers.ts` module handles upsert logic. Both `/api/mixcloud/import` and `/api/mixcloud/create-show` call this helper after saving to Supabase, replacing the broken Storyblok integration. Episode pages use `sanityFetch` with GROQ queries, following the exact patterns from the blog/deep-dives migration.

**Tech Stack:** Sanity Management API (`@sanity/client`), next-sanity `sanityFetch`, `MixcloudOEmbedPlayer` (existing component), OpenAI API for AI descriptions, Next.js 15 App Router

---

## File Map

**Created:**
- `lib/sanity/episodeHelpers.ts` — upsertEpisode() + uploadMixcloudCoverImage()
- `lib/sanity/queries/episodes.ts` — GROQ queries for episode list, detail, slugs
- `app/api/episodes/generate-description/route.ts` — async AI description generation
- `app/episodes/page.tsx` — episode list page
- `app/episodes/[slug]/page.tsx` — episode detail page

**Modified:**
- `schemas/showOverride.ts` — add title, slug, date, duration, tracklist, aiDescription; rename to "Episode"
- `lib/sanity/queries/showOverrides.ts` — update SHOW_OVERRIDE_BY_KEY_QUERY to include new fields
- `app/api/mixcloud/import/route.ts` — replace Storyblok call with upsertEpisode()
- `app/api/mixcloud/create-show/route.ts` — replace Storyblok call with upsertEpisode()
- `components/header.tsx` — add Episodes nav link
- `components/mobile-navigation-wrapper.tsx` — add Episodes nav item

---

## Task 1: Expand showOverride schema

**Files:**
- Modify: `schemas/showOverride.ts`

- [ ] **Step 1: Read the current file**

```bash
cat schemas/showOverride.ts
```

- [ ] **Step 2: Replace the file with the expanded schema**

```typescript
import { defineField, defineType, defineArrayMember } from 'sanity'

export const showOverride = defineType({
  name: 'showOverride',
  title: 'Episode',
  type: 'document',
  fields: [
    defineField({
      name: 'mixcloudKey', title: 'Mixcloud Key', type: 'string',
      description: 'The Mixcloud show key, e.g. /rhythmlab/show-name/',
      validation: r => r.required(),
    }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({ name: 'date', title: 'Date', type: 'datetime' }),
    defineField({ name: 'duration', title: 'Duration (seconds)', type: 'number' }),
    defineField({ name: 'featuredImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'aiDescription', title: 'AI Description', type: 'array',
      description: 'Auto-generated from tracklist. Editors can override with Editorial Description.',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'customDescription', title: 'Editorial Description', type: 'array',
      description: 'If set, overrides the AI Description on the episode page.',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'tracklist', title: 'Tracklist', type: 'array',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({ name: 'startTime', title: 'Start Time (seconds)', type: 'number' }),
          defineField({ name: 'artistName', title: 'Artist', type: 'string' }),
          defineField({ name: 'trackName', title: 'Track', type: 'string' }),
        ],
        preview: {
          select: { title: 'trackName', subtitle: 'artistName' },
        },
      })],
    }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }] })] }),
    defineField({
      name: 'relatedContent', title: 'Related Content', type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'post' }, { type: 'deepDive' }, { type: 'artistProfile' }] })],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'date', media: 'featuredImage' },
    prepare({ title, subtitle, media }: { title?: string; subtitle?: string; media: unknown }) {
      return {
        title: title || 'Untitled Episode',
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : 'No date',
        media,
      }
    },
  },
})
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "showOverride\|schemas/" | head -5
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add schemas/showOverride.ts
git commit -m "feat: expand showOverride schema into Episode with title, slug, tracklist, aiDescription"
```

---

## Task 2: Create GROQ queries for episodes

**Files:**
- Create: `lib/sanity/queries/episodes.ts`
- Modify: `lib/sanity/queries/showOverrides.ts`

- [ ] **Step 1: Create `lib/sanity/queries/episodes.ts`**

```typescript
import { defineQuery } from 'next-sanity'

export const ALL_EPISODES_QUERY = defineQuery(`
  *[_type == "showOverride" && defined(slug.current) && defined(title)] | order(date desc) {
    _id,
    title,
    "slug": slug.current,
    mixcloudKey,
    date,
    duration,
    "featuredImage": featuredImage{asset, hotspot, crop, alt},
    "tags": tags[]->{label, "slug": slug.current}
  }
`)

export const EPISODE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "showOverride" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    mixcloudKey,
    date,
    duration,
    "featuredImage": featuredImage{asset, hotspot, crop, alt},
    aiDescription,
    customDescription,
    "tracklist": tracklist[]{startTime, artistName, trackName},
    "tags": tags[]->{label, "slug": slug.current},
    "relatedContent": relatedContent[]->{_type, title, "slug": slug.current}
  }
`)

export const ALL_EPISODE_SLUGS_QUERY = defineQuery(`
  *[_type == "showOverride" && defined(slug.current)]{"slug": slug.current}
`)
```

- [ ] **Step 2: Update `lib/sanity/queries/showOverrides.ts` to include new fields**

Read the current file, then replace the `SHOW_OVERRIDE_BY_KEY_QUERY` to add the new fields:

```typescript
import { defineQuery } from 'next-sanity'

export const SHOW_OVERRIDE_BY_KEY_QUERY = defineQuery(`
  *[_type == "showOverride" && mixcloudKey == $mixcloudKey][0] {
    _id, title, mixcloudKey, "slug": slug.current,
    "featuredImage": featuredImage{asset, hotspot, crop, alt},
    aiDescription, customDescription,
    "tracklist": tracklist[]{startTime, artistName, trackName},
    "tags": tags[]->{label, "slug": slug.current},
    "relatedContent": relatedContent[]->{_type, title, "slug": slug.current}
  }
`)
```

- [ ] **Step 3: Commit**

```bash
git add lib/sanity/queries/episodes.ts lib/sanity/queries/showOverrides.ts
git commit -m "feat: add GROQ queries for episode list, detail, and slug generation"
```

---

## Task 3: Create Sanity episode helper module

**Files:**
- Create: `lib/sanity/episodeHelpers.ts`

This module is called by both import routes. It handles:
1. Uploading the Mixcloud cover image to Sanity Assets
2. Creating or updating (upsert) a `showOverride` document in Sanity

- [ ] **Step 1: Create `lib/sanity/episodeHelpers.ts`**

```typescript
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
  mixcloudKey: string        // e.g. /rhythmlab/show-name/
  title: string
  date?: string              // ISO string from Mixcloud created_time
  duration?: number          // seconds from Mixcloud audio_length
  coverImageUrl?: string     // Mixcloud CDN image URL
  tracklist?: TracklistItem[]
  tags?: string[]            // plain tag strings from Mixcloud
}

export interface UpsertEpisodeResult {
  sanityId: string
  slug: string
  created: boolean           // true = new doc, false = updated existing
}

/**
 * Upload a Mixcloud cover image URL to Sanity Asset Pipeline.
 * Returns the Sanity asset _id (e.g. "image-abc123-300x300-jpg").
 */
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

/**
 * Slugify a show title into a URL-safe slug.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96)
    || `episode-${Date.now().toString(36)}`
}

/**
 * Create or update a showOverride document in Sanity for a Mixcloud show.
 * Idempotent: if a doc with the same mixcloudKey exists, it is patched.
 */
export async function upsertEpisode(input: UpsertEpisodeInput): Promise<UpsertEpisodeResult> {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    throw new Error('SANITY_API_WRITE_TOKEN is not configured')
  }

  const slug = slugify(input.title)

  // Check for existing document
  const existing = await sanityWriteClient.fetch<{ _id: string } | null>(
    `*[_type == "showOverride" && mixcloudKey == $key][0]{_id}`,
    { key: input.mixcloudKey }
  )

  // Upload cover image if provided
  let featuredImageRef: { _type: string; asset: { _type: string; _ref: string } } | undefined
  if (input.coverImageUrl) {
    const assetId = await uploadCoverImage(input.coverImageUrl)
    if (assetId) {
      featuredImageRef = { _type: 'image', asset: { _type: 'reference', _ref: assetId } }
    }
  }

  const docFields: Record<string, unknown> = {
    title: input.title,
    slug: { _type: 'slug', current: slug },
    mixcloudKey: input.mixcloudKey,
    ...(input.date ? { date: input.date } : {}),
    ...(input.duration !== undefined ? { duration: input.duration } : {}),
    ...(featuredImageRef ? { featuredImage: featuredImageRef } : {}),
    ...(input.tracklist?.length
      ? { tracklist: input.tracklist.map(t => ({ _type: 'object', _key: Math.random().toString(36).slice(2), ...t })) }
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
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "episodeHelpers" | head -5
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/sanity/episodeHelpers.ts
git commit -m "feat: add Sanity episode upsert helper (replaces storyblok-management for shows)"
```

---

## Task 4: Create async AI description generation route

**Files:**
- Create: `app/api/episodes/generate-description/route.ts`

This route is called fire-and-forget after import. It generates a 150-200 word editorial description using OpenAI, converts it to minimal Portable Text blocks, and patches the Sanity episode document.

- [ ] **Step 1: Create the directory and route**

```bash
mkdir -p app/api/episodes/generate-description
```

- [ ] **Step 2: Create `app/api/episodes/generate-description/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import OpenAI from 'openai'

const sanityWriteClient = createClient({
  projectId: 'b9cutvrc',
  dataset: 'production',
  apiVersion: '2026-05-17',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface GenerateRequest {
  mixcloudKey: string
  title: string
  tracklist: Array<{ startTime: number; artistName: string; trackName: string }>
  tags: string[]
}

function tracklistToText(tracklist: GenerateRequest['tracklist']): string {
  return tracklist
    .slice(0, 15) // cap at 15 tracks to keep prompt short
    .map(t => `${t.artistName} — ${t.trackName}`)
    .join(', ')
}

function textToPortableText(text: string): unknown[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => ({
      _type: 'block',
      _key: Math.random().toString(36).slice(2),
      style: 'normal',
      children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text: line, marks: [] }],
      markDefs: [],
    }))
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    const { mixcloudKey, title, tracklist, tags } = body

    if (!mixcloudKey || !title) {
      return NextResponse.json({ error: 'mixcloudKey and title are required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY || !process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Missing API keys' }, { status: 500 })
    }

    const tracklistText = tracklist?.length
      ? `Tracklist: ${tracklistToText(tracklist)}`
      : 'No tracklist available.'

    const tagText = tags?.length ? `Genres/tags: ${tags.join(', ')}.` : ''

    const prompt = `Write a 150-200 word editorial description for a Rhythm Lab Radio show episode titled "${title}". ${tracklistText}. ${tagText} Write in a warm, knowledgeable music journalist tone. Focus on the musical journey, the artists featured, and the sonic mood. Do not use phrases like "this episode" or "this show". Do not use markdown. Write in plain prose paragraphs.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    })

    const generatedText = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!generatedText) {
      return NextResponse.json({ error: 'AI returned empty response' }, { status: 500 })
    }

    const portableText = textToPortableText(generatedText)

    // Find the episode document by mixcloudKey and patch it
    const existing = await sanityWriteClient.fetch<{ _id: string } | null>(
      `*[_type == "showOverride" && mixcloudKey == $key][0]{_id}`,
      { key: mixcloudKey }
    )

    if (!existing) {
      return NextResponse.json({ error: 'Episode document not found in Sanity' }, { status: 404 })
    }

    await sanityWriteClient.patch(existing._id).set({ aiDescription: portableText }).commit()

    return NextResponse.json({ success: true, documentId: existing._id })
  } catch (error) {
    console.error('Episode description generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/episodes/
git commit -m "feat: add async AI episode description generation route"
```

---

## Task 5: Update import route to create Sanity episode

**Files:**
- Modify: `app/api/mixcloud/import/route.ts`

- [ ] **Step 1: Read the current file**

```bash
cat app/api/mixcloud/import/route.ts
```

- [ ] **Step 2: Replace the Storyblok block with Sanity episode creation**

Find the import at the top of the file:
```typescript
import { createMixcloudShowStory } from '@/lib/storyblok-management'
```
Remove it entirely.

Add this import at the top:
```typescript
import { upsertEpisode, type TracklistItem } from '@/lib/sanity/episodeHelpers'
```

Find the Storyblok block in the handler (the `try { const storyblokResponse = await createMixcloudShowStory(...)` block). Replace the entire Storyblok try/catch block with:

```typescript
// Create/update Sanity episode draft (replaces Storyblok)
let sanityEpisodeId: string | undefined
let sanitySlug: string | undefined
let sanityWarning: string | undefined

try {
  // Build tracklist from parsed tracks (parseResult.tracks has {artist, title, start_time})
  const tracklist: TracklistItem[] = parseResult.tracks
    .filter(t => t.artist && t.title)
    .map(t => ({
      startTime: t.start_time ?? 0,
      artistName: t.artist ?? '',
      trackName: t.title ?? '',
    }))

  const episodeResult = await upsertEpisode({
    mixcloudKey: body.mixcloud_url.replace('https://www.mixcloud.com', '') || body.mixcloud_url,
    title: body.title,
    date: body.date,
    duration: body.duration,
    coverImageUrl: body.cover_image,
    tracklist,
  })

  sanityEpisodeId = episodeResult.sanityId
  sanitySlug = episodeResult.slug

  // Fire async AI description generation (don't await — returns before it completes)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  fetch(`${baseUrl}/api/episodes/generate-description`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mixcloudKey: body.mixcloud_url.replace('https://www.mixcloud.com', '') || body.mixcloud_url,
      title: body.title,
      tracklist,
      tags: [],
    }),
  }).catch(err => console.warn('AI description generation failed:', err))

} catch (episodeError) {
  console.error('Sanity episode creation failed:', episodeError)
  sanityWarning = `Episode draft creation failed: ${episodeError instanceof Error ? episodeError.message : 'Unknown error'}`
}
```

Update the return statement to use `sanityEpisodeId` instead of `storyblokId`:
```typescript
return NextResponse.json({
  success: true,
  show_id: showId,
  sanity_episode_id: sanityEpisodeId,
  sanity_slug: sanitySlug,
  tracks_imported: tracksImported,
  errors: parseResult.errors,
  warnings: sanityWarning ? [sanityWarning, ...parseResult.warnings] : parseResult.warnings,
  message: `Successfully imported show "${body.title}" with ${tracksImported} tracks${sanitySlug ? `. Episode draft at /episodes/${sanitySlug}` : ''}`,
})
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "mixcloud/import" | head -5
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/api/mixcloud/import/route.ts
git commit -m "feat: replace Storyblok with Sanity episode creation in Mixcloud import route"
```

---

## Task 6: Update create-show route to create Sanity episode

**Files:**
- Modify: `app/api/mixcloud/create-show/route.ts`

- [ ] **Step 1: Read the current file**

```bash
cat app/api/mixcloud/create-show/route.ts
```

- [ ] **Step 2: Remove Storyblok import, add Sanity episode import**

Remove:
```typescript
import { createMixcloudShowStory } from '@/lib/storyblok-management'
```

Add:
```typescript
import { upsertEpisode, type TracklistItem } from '@/lib/sanity/episodeHelpers'
```

Find the Storyblok creation block (the `try { const storyblokResponse = await createMixcloudShowStory(...)` block). Replace it with:

```typescript
let sanityEpisodeId: string | undefined
let sanitySlug: string | undefined

try {
  const tracklist: TracklistItem[] = (parseResult?.tracks ?? [])
    .filter((t: any) => t.artist && t.title)
    .map((t: any) => ({
      startTime: t.start_time ?? 0,
      artistName: t.artist ?? '',
      trackName: t.title ?? '',
    }))

  // Extract mixcloudKey from URL
  const mixcloudKey = body.mixcloud_url.startsWith('https://www.mixcloud.com')
    ? body.mixcloud_url.replace('https://www.mixcloud.com', '')
    : body.mixcloud_url

  const episodeResult = await upsertEpisode({
    mixcloudKey,
    title: body.title,
    date: body.published_date,
    coverImageUrl: typeof body.cover_image === 'string' ? body.cover_image : undefined,
    tracklist,
  })

  sanityEpisodeId = episodeResult.sanityId
  sanitySlug = episodeResult.slug

  // Fire async AI description generation
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  fetch(`${baseUrl}/api/episodes/generate-description`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mixcloudKey, title: body.title, tracklist, tags: [] }),
  }).catch(err => console.warn('AI description generation failed:', err))

} catch (episodeError) {
  console.error('Sanity episode creation failed:', episodeError)
  // Non-fatal: show was already saved to Supabase
}
```

Update the response to include `sanity_episode_id` and `sanity_slug` fields.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "create-show" | head -5
```

- [ ] **Step 4: Commit**

```bash
git add app/api/mixcloud/create-show/route.ts
git commit -m "feat: replace Storyblok with Sanity episode creation in create-show route"
```

---

## Task 7: Create episode list page

**Files:**
- Create: `app/episodes/page.tsx`

- [ ] **Step 1: Create `app/episodes/page.tsx`**

```typescript
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/live'
import { ALL_EPISODES_QUERY } from '@/lib/sanity/queries/episodes'
import { urlForImage } from '@/lib/sanity/image'

export const metadata: Metadata = {
  title: 'Episodes | Rhythm Lab Radio',
  description: 'Browse every Rhythm Lab Radio episode — curated electronic music, jazz, hip-hop and more.',
  openGraph: {
    title: 'Episodes | Rhythm Lab Radio',
    description: 'Browse every Rhythm Lab Radio episode.',
  },
}

function getEpisodeColor(idx: number) {
  const colors = ["#8b5cf6", "#ec4899", "#b12e2e", "#f59e0b", "#10b981", "#ef4444", "#b12e2e", "#8b5a2b"]
  return colors[idx % colors.length]
}

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default async function EpisodesPage() {
  let episodes: any[] = []
  let fetchError = false

  try {
    const { data } = await sanityFetch({ query: ALL_EPISODES_QUERY })
    episodes = data ?? []
  } catch (err) {
    console.error('Failed to fetch episodes from Sanity:', err)
    fetchError = true
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">EPISODES</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Every show from Rhythm Lab Radio — curated selections across electronic music, jazz, hip-hop and beyond.
          </p>
        </div>

        {fetchError && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">Failed to load episodes. Please try again later.</p>
          </div>
        )}

        {!fetchError && episodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No episodes published yet. Check back soon!</p>
          </div>
        )}

        {!fetchError && episodes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes.map((episode, idx) => {
              const color = getEpisodeColor(idx)
              return (
                <Card key={episode._id} className="bg-card/80 hover:shadow-lg transition-all duration-200 overflow-hidden border border-border/30 rounded-xl">
                  <Link href={`/episodes/${episode.slug}`}>
                    <div className="aspect-video relative overflow-hidden">
                      {episode.featuredImage?.asset ? (
                        <img
                          src={urlForImage(episode.featuredImage).width(600).height(338).url()}
                          alt={episode.featuredImage.alt || episode.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: color }}>
                          <span className="text-white font-bold text-sm px-4 text-center line-clamp-3">{episode.title}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {episode.tags?.slice(0, 2).map((tag: { label: string; slug: string }) => (
                        <Badge key={tag.slug} variant="outline" className="text-xs">{tag.label}</Badge>
                      ))}
                    </div>
                    <Link href={`/episodes/${episode.slug}`}>
                      <h2 className="text-base font-semibold mb-1 line-clamp-2 hover:text-primary transition-colors">{episode.title}</h2>
                    </Link>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>{episode.date ? new Date(episode.date).toLocaleDateString() : ''}</span>
                      {episode.duration && <span>{formatDuration(episode.duration)}</span>}
                    </div>
                    <Link href={`/episodes/${episode.slug}`} className="mt-3 block">
                      <Button size="sm" variant="outline" className="w-full text-xs">Listen</Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "episodes/page" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add app/episodes/page.tsx
git commit -m "feat: add episode list page at /episodes"
```

---

## Task 8: Create episode detail page

**Files:**
- Create: `app/episodes/[slug]/page.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "app/episodes/[slug]"
```

- [ ] **Step 2: Create `app/episodes/[slug]/page.tsx`**

```typescript
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/live'
import { client } from '@/lib/sanity/client'
import { EPISODE_BY_SLUG_QUERY, ALL_EPISODE_SLUGS_QUERY } from '@/lib/sanity/queries/episodes'
import { urlForImage } from '@/lib/sanity/image'
import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { MixcloudOEmbedPlayer } from '@/components/mixcloud-oembed-player'

interface EpisodePageProps {
  params: Promise<{ slug: string }>
}

// Use base client (not sanityFetch) — avoids draftMode() outside request scope
export async function generateStaticParams() {
  const data = await client.fetch<Array<{ slug: string }>>(ALL_EPISODE_SLUGS_QUERY)
  return (data ?? []).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: EpisodePageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const { data: episode } = await sanityFetch({ query: EPISODE_BY_SLUG_QUERY, params: { slug } })
    if (!episode) return { title: 'Episode | Rhythm Lab Radio' }

    const description = episode.customDescription || episode.aiDescription
    const descText = description?.[0]?.children?.[0]?.text?.slice(0, 160) ?? ''

    return {
      title: `${episode.title} | Rhythm Lab Radio`,
      description: descText,
      openGraph: {
        title: episode.title ?? '',
        description: descText,
        images: episode.featuredImage?.asset
          ? [urlForImage(episode.featuredImage).width(1200).height(630).url()]
          : [],
      },
    }
  } catch {
    return { title: 'Episode | Rhythm Lab Radio' }
  }
}

function formatStartTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { slug } = await params
  const { data: episode } = await sanityFetch({ query: EPISODE_BY_SLUG_QUERY, params: { slug } })
  if (!episode) return notFound()

  const mixcloudUrl = `https://www.mixcloud.com${episode.mixcloudKey}`
  const description = episode.customDescription ?? episode.aiDescription

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <div className="mb-8">
          <Link href="/episodes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← All Episodes
          </Link>
        </div>

        {/* Hero */}
        {episode.featuredImage?.asset && (
          <div className="aspect-video w-full overflow-hidden rounded-xl mb-8">
            <img
              src={urlForImage(episode.featuredImage).width(1200).height(675).url()}
              alt={episode.featuredImage.alt || episode.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {episode.tags?.map((tag: { label: string; slug: string }) => (
              <Badge key={tag.slug} variant="outline">{tag.label}</Badge>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">{episode.title}</h1>
          <div className="flex gap-4 text-sm text-muted-foreground">
            {episode.date && <span>{new Date(episode.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
            {episode.duration && (
              <span>
                {Math.floor(episode.duration / 3600) > 0
                  ? `${Math.floor(episode.duration / 3600)}h ${Math.floor((episode.duration % 3600) / 60)}m`
                  : `${Math.floor(episode.duration / 60)}m`}
              </span>
            )}
          </div>
        </header>

        {/* Player */}
        <div className="mb-10">
          <MixcloudOEmbedPlayer
            mixcloudUrl={mixcloudUrl}
            showTitle={episode.title ?? ''}
            maxWidth={800}
            maxHeight={180}
          />
        </div>

        {/* Description */}
        {description && (
          <div className="mb-10">
            <PortableTextRenderer value={description} className="prose prose-invert max-w-none" />
          </div>
        )}

        {/* Tracklist */}
        {episode.tracklist && episode.tracklist.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4">Tracklist</h2>
            <div className="space-y-2">
              {episode.tracklist.map((track: { startTime: number; artistName: string; trackName: string }, idx: number) => (
                <div key={idx} className="flex items-start gap-3 py-2 border-b border-border/30">
                  <span className="text-xs text-muted-foreground font-mono w-12 flex-shrink-0 pt-0.5">
                    {formatStartTime(track.startTime)}
                  </span>
                  <span className="text-sm">
                    <span className="font-medium">{track.artistName}</span>
                    {track.trackName && (
                      <> <span className="text-muted-foreground">—</span> {track.trackName}</>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Content */}
        {episode.relatedContent && episode.relatedContent.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4">Related</h2>
            <ul className="space-y-2">
              {episode.relatedContent.map((item: { _type: string; title: string; slug: string }) => {
                const href = item._type === 'post' ? `/blog/${item.slug}`
                  : item._type === 'deepDive' ? `/deep-dives/${item.slug}`
                  : `/profiles/${item.slug}`
                return (
                  <li key={item.slug}>
                    <Link href={href} className="text-purple-400 hover:text-purple-300 underline text-sm">
                      {item.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-8">
          <Link href="/episodes">
            <Button variant="outline">← Back to All Episodes</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "episodes/\[slug\]" | head -5
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add "app/episodes/[slug]/page.tsx"
git commit -m "feat: add episode detail page at /episodes/[slug] with player, tracklist, description"
```

---

## Task 9: Add Episodes to navigation

**Files:**
- Modify: `components/header.tsx`
- Modify: `components/mobile-navigation-wrapper.tsx`

- [ ] **Step 1: Add Episodes to `components/header.tsx`**

Read the file and find where "DEEP DIVES" nav link appears. Add "EPISODES" immediately after it:

```tsx
<Link href="/episodes">
  <Button
    variant="ghost"
    className="nts-text-caps text-sm font-bold hover:bg-transparent hover:text-gray-700 px-0 text-black"
    style={{ color: "#000000" }}
  >
    EPISODES
  </Button>
</Link>
```

- [ ] **Step 2: Add Episodes to `components/mobile-navigation-wrapper.tsx`**

Read the file and find the `navItems` array. Add an Episodes entry with the `Radio` icon (already imported):

```typescript
{ label: 'Episodes', href: '/episodes', icon: Radio },
```

Place it after the existing "Weekly Show" entry. Remove or replace the existing Weekly Show entry if Episodes makes more sense there, otherwise keep both and drop one that's less used.

- [ ] **Step 3: Verify build compiles**

```bash
npx tsc --noEmit 2>&1 | grep "header\|mobile-nav" | head -5
```

- [ ] **Step 4: Commit**

```bash
git add components/header.tsx components/mobile-navigation-wrapper.tsx
git commit -m "feat: add Episodes to header and mobile navigation"
```

---

## Task 10: Remove storyblok-management dependency

Now that both import routes use `upsertEpisode`, the `storyblok-management.ts` lib is unused.

- [ ] **Step 1: Verify nothing else imports storyblok-management**

```bash
grep -rn "storyblok-management" app/ components/ lib/ --include="*.ts" --include="*.tsx"
```

Expected: no results (the two routes were the only consumers)

- [ ] **Step 2: Delete the file**

```bash
rm lib/storyblok-management.ts
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "storyblok-management" | head -5
```

Expected: no errors (file is gone, nothing imports it)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove lib/storyblok-management.ts — replaced by Sanity episodeHelpers"
```

---

## Self-Review

**Spec coverage:**
- ✅ showOverride schema expanded with title, slug, date, duration, tracklist, aiDescription — Task 1
- ✅ Schema renamed to "Episode" in Studio — Task 1
- ✅ Auto-create on import (both routes) — Tasks 5 & 6
- ✅ Upload cover image to Sanity Assets — Task 3 (upsertEpisode)
- ✅ AI description generated async — Tasks 4, 5, 6
- ✅ Idempotent upsert by mixcloudKey — Task 3
- ✅ `/episodes/` list page — Task 7
- ✅ `/episodes/[slug]` detail page — Task 8
- ✅ Player via MixcloudOEmbedPlayer — Task 8
- ✅ Tracklist rendered with formatted timestamps — Task 8
- ✅ customDescription overrides aiDescription — Task 8
- ✅ generateStaticParams uses client.fetch (not sanityFetch) — Task 8
- ✅ Episodes added to nav — Task 9
- ✅ storyblok-management removed — Task 10

**Type consistency:**
- `TracklistItem` defined in `episodeHelpers.ts`, imported by Tasks 5 & 6 ✅
- `EPISODE_BY_SLUG_QUERY` defined in `episodes.ts`, imported by Task 8 ✅
- `ALL_EPISODE_SLUGS_QUERY` defined in `episodes.ts`, imported by Task 8 ✅
- `ALL_EPISODES_QUERY` defined in `episodes.ts`, imported by Task 7 ✅
- `upsertEpisode` defined in `episodeHelpers.ts`, imported by Tasks 5 & 6 ✅
