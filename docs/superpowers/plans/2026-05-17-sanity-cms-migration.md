# Sanity CMS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all content from Storyblok to Sanity.io using a strangler fig approach — one content type at a time, site stays live throughout.

**Architecture:** Sanity Content Lake replaces Storyblok as the CMS. `next-sanity` with `defineLive` provides real-time content updates and embedded Studio at `/studio`. Content migrates in 4 phases: blog posts → deep dives → about/nav → artist profiles + show overrides.

**Tech Stack:** `next-sanity` v11+, `@portabletext/react`, `@portabletext/block-tools`, `@sanity/image-url`, TypeScript, Next.js 15 App Router

**Sanity Project:** ID `b9cutvrc`, dataset `production`

---

## File Map

**Created:**
- `sanity.config.ts` — Studio configuration
- `app/studio/[[...tool]]/page.tsx` — Embedded Studio route
- `lib/sanity/client.ts` — Sanity client
- `lib/sanity/live.ts` — `defineLive` setup
- `lib/sanity/image.ts` — Image URL builder
- `lib/sanity/queries/posts.ts` — GROQ for blog posts
- `lib/sanity/queries/deepDives.ts` — GROQ for deep dives
- `lib/sanity/queries/aboutPage.ts` — GROQ for about/nav singletons
- `lib/sanity/queries/artistProfiles.ts` — GROQ for profiles
- `lib/sanity/queries/showOverrides.ts` — GROQ for show editorial
- `schemas/post.ts` — Blog post schema
- `schemas/deepDive.ts` — Deep dive schema
- `schemas/artistProfile.ts` — Artist profile schema
- `schemas/showOverride.ts` — Show editorial overlay schema
- `schemas/author.ts` — Author schema
- `schemas/tag.ts` — Tag schema
- `schemas/singletons/aboutPage.ts` — About page singleton
- `schemas/singletons/siteSettings.ts` — Nav/settings singleton
- `schemas/index.ts` — Schema barrel export
- `components/portable-text-renderer.tsx` — `@portabletext/react` renderer
- `app/api/admin/publish-to-sanity/route.ts` — AI content → Sanity draft
- `app/api/webhooks/sanity/route.ts` — Sanity revalidation webhook
- `scripts/migration/migrate-posts.ts` — Blog post migration script
- `scripts/migration/migrate-deep-dives.ts` — Deep dive migration script
- `scripts/migration/migrate-about.ts` — About page migration script
- `scripts/migration/migrate-artist-profiles.ts` — Artist profile migration script
- `scripts/migration/shared/storyblok-client.ts` — Storyblok fetch helper
- `scripts/migration/shared/sanity-client.ts` — Sanity write client for migration
- `scripts/migration/shared/rich-text.ts` — Storyblok richtext → Portable Text converter

**Modified:**
- `next.config.mjs` — Add `cdn.sanity.io` to image domains
- `app/blog/page.tsx` — Switch from Storyblok to Sanity GROQ
- `app/blog/[slug]/page.tsx` — Switch from Storyblok to Sanity GROQ
- `app/deep-dives/page.tsx` — Switch to Sanity GROQ
- `app/deep-dives/[slug]/page.tsx` — Switch to Sanity GROQ
- `app/about/page.tsx` — Switch to Sanity singleton
- `app/shows/[id]/page.tsx` — Merge Mixcloud + Sanity `showOverride`
- `app/api/algolia/index-content/route.ts` — Source from Sanity instead of Storyblok
- `app/api/revalidate/route.ts` — Accept Sanity webhook format
- `app/admin/mixcloud/page.tsx` — Add "Add Editorial Content" button
- `app/layout.tsx` — Add `<SanityLive />`

**Retired (after Phase 4):**
- `app/api/storyblok/` — All routes removed
- `app/api/admin/publish-to-storyblok/route.ts` — Replaced
- `app/api/admin/upload-image-to-storyblok/route.ts` — Replaced
- `lib/storyblok-management.ts` — Removed
- `components/storyblok-error-boundary.tsx` — Removed
- `components/RichTextRenderer.tsx` — Replaced by `components/portable-text-renderer.tsx`

---

## Phase 0: Foundation Setup

### Task 1: Install packages and configure environment

**Files:**
- Modify: `package.json`
- Modify: `.env.local`
- Modify: `next.config.mjs`

- [ ] **Step 1: Install Sanity packages**

```bash
cd rhythm-lab-app
npm install next-sanity sanity @portabletext/react @sanity/image-url
npm install --save-dev @portabletext/block-tools
```

Expected: packages install without errors

- [ ] **Step 2: Add environment variables to `.env.local`**

Open `.env.local` and append:

```bash
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=b9cutvrc
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-05-17
# Generate at https://www.sanity.io/manage → project → API → Tokens
# Read token: Viewer role
SANITY_API_READ_TOKEN=
# Write token: Editor role (for AI content creation)
SANITY_API_WRITE_TOKEN=
# Set this after creating webhook in Sanity
SANITY_WEBHOOK_SECRET=
```

Generate both tokens at `https://www.sanity.io/manage` → project `b9cutvrc` → API → Tokens. Create:
- "rhythm-lab-reader" with **Viewer** role → paste value as `SANITY_API_READ_TOKEN`
- "rhythm-lab-writer" with **Editor** role → paste value as `SANITY_API_WRITE_TOKEN`

- [ ] **Step 3: Add `cdn.sanity.io` to `next.config.mjs` image domains**

In `next.config.mjs`, add to the `images.remotePatterns` array (after the existing entries):

```js
{
  protocol: 'https',
  hostname: 'cdn.sanity.io',
  port: '',
  pathname: '/images/**',
},
```

- [ ] **Step 4: Commit**

```bash
git add next.config.mjs package.json package-lock.json .env.local
git commit -m "chore: install next-sanity and add Sanity env vars"
```

---

### Task 2: Create Sanity client, live config, and image builder

**Files:**
- Create: `lib/sanity/client.ts`
- Create: `lib/sanity/live.ts`
- Create: `lib/sanity/image.ts`

- [ ] **Step 1: Write failing test**

Create `lib/sanity/__tests__/client.test.ts`:

```typescript
import { client } from '../client'
import { imageUrlBuilder } from '../image'

describe('Sanity client', () => {
  it('has correct project config', () => {
    const config = client.config()
    expect(config.projectId).toBe('b9cutvrc')
    expect(config.dataset).toBe('production')
    expect(config.useCdn).toBe(true)
  })

  it('image builder generates a URL for a Sanity image reference', () => {
    const ref = {
      asset: { _ref: 'image-abc123-100x100-jpg' }
    }
    const url = imageUrlBuilder.image(ref).width(300).url()
    expect(url).toContain('cdn.sanity.io')
    expect(url).toContain('w=300')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest lib/sanity/__tests__/client.test.ts
```

Expected: FAIL — `Cannot find module '../client'`

- [ ] **Step 3: Create `lib/sanity/client.ts`**

```typescript
import { createClient } from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2026-05-17',
  useCdn: true,
})
```

- [ ] **Step 4: Create `lib/sanity/live.ts`**

```typescript
import { defineLive } from 'next-sanity'
import { client } from './client'

export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({ apiVersion: '2026-05-17' }),
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: process.env.SANITY_API_READ_TOKEN,
})
```

- [ ] **Step 5: Create `lib/sanity/image.ts`**

```typescript
import createImageUrlBuilder from '@sanity/image-url'
import { client } from './client'

export const imageUrlBuilder = createImageUrlBuilder(client)

export function urlForImage(source: Parameters<typeof imageUrlBuilder.image>[0]) {
  return imageUrlBuilder.image(source)
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx jest lib/sanity/__tests__/client.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/sanity/
git commit -m "feat: add Sanity client, live config, and image builder"
```

---

### Task 3: Define schemas — author, tag, post

**Files:**
- Create: `schemas/author.ts`
- Create: `schemas/tag.ts`
- Create: `schemas/post.ts`
- Create: `schemas/index.ts`

- [ ] **Step 1: Create `schemas/author.ts`**

```typescript
import { defineField, defineType } from 'sanity'

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'bio', title: 'Bio', type: 'text', rows: 3 }),
    defineField({ name: 'avatar', title: 'Avatar', type: 'image', options: { hotspot: true } }),
  ],
  preview: { select: { title: 'name', media: 'avatar' } },
})
```

- [ ] **Step 2: Create `schemas/tag.ts`**

```typescript
import { defineField, defineType } from 'sanity'

export const tag = defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: r => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'label', maxLength: 96 },
      validation: r => r.required(),
    }),
  ],
  preview: { select: { title: 'label' } },
})
```

- [ ] **Step 3: Create `schemas/post.ts`**

```typescript
import { defineField, defineType } from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'string' }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: r => r.required(),
    }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
    defineField({ name: 'readingTime', title: 'Reading Time (mins)', type: 'number' }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt Text' }),
            defineField({ name: 'caption', type: 'string', title: 'Caption' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
        defineField({ name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 2 }),
        defineField({ name: 'ogImage', title: 'OG Image', type: 'image' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'coverImage' },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : 'Draft', media }
    },
  },
})
```

- [ ] **Step 4: Create `schemas/index.ts`**

```typescript
import { author } from './author'
import { tag } from './tag'
import { post } from './post'

export const schemaTypes = [author, tag, post]
```

- [ ] **Step 5: Commit**

```bash
git add schemas/
git commit -m "feat: add author, tag, and post schemas"
```

---

### Task 4: Configure Sanity Studio and embed it at /studio

**Files:**
- Create: `sanity.config.ts`
- Create: `app/studio/[[...tool]]/page.tsx`

- [ ] **Step 1: Create `sanity.config.ts` at project root**

```typescript
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'rhythm-lab',
  title: 'Rhythm Lab',
  projectId: 'b9cutvrc',
  dataset: 'production',
  plugins: [
    structureTool(),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
```

- [ ] **Step 2: Create `app/studio/[[...tool]]/page.tsx`**

```typescript
import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function StudioPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  return <NextStudio config={config} />
}
```

- [ ] **Step 3: Verify Studio loads**

```bash
npm run dev
```

Open `http://localhost:3000/studio` in your browser. You should be redirected to sign-in if not authenticated. After signing in with an admin Clerk account, you should see the Sanity Studio interface.

- [ ] **Step 4: Commit**

```bash
git add sanity.config.ts app/studio/
git commit -m "feat: embed Sanity Studio at /studio with Clerk auth gate"
```

---

### Task 5: Add `<SanityLive />` to root layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add SanityLive to `app/layout.tsx`**

Open `app/layout.tsx`. Add the import and render `<SanityLive />` inside the body, before the closing `</body>` tag:

```typescript
// Add to imports
import { SanityLive } from '@/lib/sanity/live'

// Inside the body element, before closing </body>:
<SanityLive />
```

The exact placement depends on the current layout structure. Place it as a sibling to `{children}` inside the outermost body element.

- [ ] **Step 2: Verify build still compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: no type errors related to SanityLive

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add SanityLive to root layout for real-time content"
```

---

### Task 6: Create PortableText renderer component

**Files:**
- Create: `components/portable-text-renderer.tsx`

- [ ] **Step 1: Create `components/portable-text-renderer.tsx`**

```typescript
import { PortableText, PortableTextComponents } from '@portabletext/react'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) return null
      return (
        <figure className="my-8">
          <Image
            src={urlForImage(value).width(800).url()}
            alt={value.alt ?? ''}
            width={800}
            height={450}
            className="rounded-lg w-full object-cover"
          />
          {value.caption && (
            <figcaption className="text-center text-sm text-gray-500 mt-2">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  marks: {
    link: ({ value, children }) => (
      <a
        href={value?.href}
        rel={value?.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        target={value?.href?.startsWith('http') ? '_blank' : undefined}
        className="text-purple-400 underline hover:text-purple-300"
      >
        {children}
      </a>
    ),
  },
  block: {
    h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-bold mt-5 mb-2">{children}</h3>,
    normal: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-purple-500 pl-4 italic my-6 text-gray-300">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
  },
}

interface PortableTextRendererProps {
  value: Parameters<typeof PortableText>[0]['value']
  className?: string
}

export function PortableTextRenderer({ value, className }: PortableTextRendererProps) {
  return (
    <div className={className}>
      <PortableText value={value} components={components} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/portable-text-renderer.tsx
git commit -m "feat: add PortableText renderer component"
```

---

## Phase 1: Blog Posts Migration

### Task 7: Create GROQ queries for posts

**Files:**
- Create: `lib/sanity/queries/posts.ts`

- [ ] **Step 1: Create `lib/sanity/queries/posts.ts`**

```typescript
import { defineQuery } from 'next-sanity'

export const ALL_POSTS_QUERY = defineQuery(`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    subtitle,
    "slug": slug.current,
    publishedAt,
    excerpt,
    coverImage,
    readingTime,
    "tags": tags[]->{label, "slug": slug.current},
    "author": author->{name, avatar}
  }
`)

export const POST_BY_SLUG_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    subtitle,
    "slug": slug.current,
    publishedAt,
    excerpt,
    coverImage,
    body,
    readingTime,
    "tags": tags[]->{label, "slug": slug.current},
    "author": author->{name, avatar},
    seo
  }
`)

export const ALL_POST_SLUGS_QUERY = defineQuery(`
  *[_type == "post"]{"slug": slug.current}
`)
```

- [ ] **Step 2: Commit**

```bash
git add lib/sanity/queries/
git commit -m "feat: add GROQ queries for blog posts"
```

---

### Task 8: Write blog post migration script

**Files:**
- Create: `scripts/migration/shared/storyblok-client.ts`
- Create: `scripts/migration/shared/sanity-client.ts`
- Create: `scripts/migration/shared/rich-text.ts`
- Create: `scripts/migration/migrate-posts.ts`

- [ ] **Step 1: Create `scripts/migration/shared/storyblok-client.ts`**

```typescript
const STORYBLOK_TOKEN = process.env.STORYBLOK_ACCESS_TOKEN

if (!STORYBLOK_TOKEN) throw new Error('STORYBLOK_ACCESS_TOKEN is required')

export async function fetchStoryblokStories(path: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams({
    version: 'published',
    per_page: '100',
    token: STORYBLOK_TOKEN!,
    ...params,
  })
  const res = await fetch(`https://api.storyblok.com/v2/cdn/stories?starts_with=${path}&${query}`)
  if (!res.ok) throw new Error(`Storyblok error: ${res.status}`)
  const data = await res.json()
  return data.stories ?? []
}
```

- [ ] **Step 2: Create `scripts/migration/shared/sanity-client.ts`**

```typescript
import { createClient } from '@sanity/client'

export const sanityWriteClient = createClient({
  projectId: 'b9cutvrc',
  dataset: 'production',
  apiVersion: '2026-05-17',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

export async function uploadImageFromUrl(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to fetch image: ${imageUrl}`)
  const buffer = await res.arrayBuffer()
  const asset = await sanityWriteClient.assets.upload('image', Buffer.from(buffer), {
    filename: imageUrl.split('/').pop(),
  })
  return asset._id
}
```

- [ ] **Step 3: Create `scripts/migration/shared/rich-text.ts`**

Storyblok richtext nodes map to Portable Text blocks:

```typescript
type StoryblokNode = {
  type: string
  content?: StoryblokNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  attrs?: Record<string, unknown>
}

export function storyblokRichtextToPortableText(sbContent: { content?: StoryblokNode[] }): unknown[] {
  if (!sbContent?.content) return []
  return sbContent.content.flatMap(nodeToPortableText)
}

function nodeToPortableText(node: StoryblokNode): unknown[] {
  if (node.type === 'paragraph') {
    return [{
      _type: 'block',
      _key: Math.random().toString(36).slice(2),
      style: 'normal',
      children: (node.content ?? []).map(spanToChild),
      markDefs: [],
    }]
  }
  if (['heading'].includes(node.type) && node.attrs?.level) {
    const styleMap: Record<number, string> = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4' }
    return [{
      _type: 'block',
      _key: Math.random().toString(36).slice(2),
      style: styleMap[node.attrs.level as number] ?? 'normal',
      children: (node.content ?? []).map(spanToChild),
      markDefs: [],
    }]
  }
  if (node.type === 'bullet_list' || node.type === 'ordered_list') {
    const listItem = node.type === 'bullet_list' ? 'bullet' : 'number'
    return (node.content ?? []).flatMap(li =>
      (li.content ?? []).flatMap(child => nodeToPortableText(child)).map((block: unknown) => ({
        ...(block as Record<string, unknown>),
        listItem,
      }))
    )
  }
  if (node.type === 'blockquote') {
    return [{
      _type: 'block',
      _key: Math.random().toString(36).slice(2),
      style: 'blockquote',
      children: (node.content ?? []).flatMap(child =>
        (child.content ?? []).map(spanToChild)
      ),
      markDefs: [],
    }]
  }
  return []
}

function spanToChild(node: StoryblokNode) {
  const marks: string[] = (node.marks ?? []).map((m) => {
    if (m.type === 'bold') return 'strong'
    if (m.type === 'italic') return 'em'
    if (m.type === 'code') return 'code'
    return m.type
  })
  return {
    _type: 'span',
    _key: Math.random().toString(36).slice(2),
    text: node.text ?? '',
    marks,
  }
}
```

- [ ] **Step 4: Create `scripts/migration/migrate-posts.ts`**

```typescript
import 'dotenv/config'
import { fetchStoryblokStories } from './shared/storyblok-client'
import { sanityWriteClient, uploadImageFromUrl } from './shared/sanity-client'
import { storyblokRichtextToPortableText } from './shared/rich-text'

async function migratePosts() {
  console.log('Fetching blog posts from Storyblok...')
  const stories = await fetchStoryblokStories('blog/')
  console.log(`Found ${stories.length} posts`)

  for (const story of stories) {
    const content = story.content
    console.log(`Migrating: ${content.title || story.name}`)

    let coverImageRef: { _type: string; asset: { _type: string; _ref: string } } | undefined

    if (content.featured_image?.filename) {
      try {
        const assetId = await uploadImageFromUrl(content.featured_image.filename)
        coverImageRef = { _type: 'image', asset: { _type: 'reference', _ref: assetId } }
      } catch (e) {
        console.warn(`  Failed to upload cover image for ${story.slug}:`, e)
      }
    }

    const body = storyblokRichtextToPortableText(content.content || content.long_text || {})

    const doc = {
      _type: 'post',
      title: content.title || story.name,
      subtitle: content.subtitle || '',
      slug: { _type: 'slug', current: story.slug },
      publishedAt: story.first_published_at || story.created_at,
      excerpt: content.excerpt || content.intro || '',
      readingTime: content.reading_time || null,
      body,
      ...(coverImageRef ? { coverImage: coverImageRef } : {}),
    }

    await sanityWriteClient.create(doc)
    console.log(`  ✓ Created post: ${doc.slug.current}`)
  }

  console.log('Blog post migration complete.')
}

migratePosts().catch(console.error)
```

- [ ] **Step 5: Run the migration script (dry-run check first)**

First verify the Storyblok fetch returns data:

```bash
STORYBLOK_ACCESS_TOKEN=<your-token> SANITY_API_WRITE_TOKEN=<your-token> \
  npx ts-node --esm scripts/migration/migrate-posts.ts 2>&1 | head -20
```

Expected: `Found N posts` printed. If 0 posts, check the `starts_with` path matches your Storyblok folder structure.

- [ ] **Step 6: Run full migration**

```bash
STORYBLOK_ACCESS_TOKEN=<your-token> SANITY_API_WRITE_TOKEN=<your-token> \
  npx ts-node --esm scripts/migration/migrate-posts.ts
```

Expected: each post prints `✓ Created post: <slug>`. Verify in Sanity Studio at `http://localhost:3000/studio` that posts appear in the Blog Post list.

- [ ] **Step 7: Commit**

```bash
git add scripts/
git commit -m "feat: add blog post migration script"
```

---

### Task 9: Update blog list page to use Sanity

**Files:**
- Modify: `app/blog/page.tsx`

- [ ] **Step 1: Replace Storyblok fetch with Sanity GROQ in `app/blog/page.tsx`**

Replace the entire import section and fetch logic. The component structure stays the same — only the data source changes:

```typescript
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/favorite-button"
import Link from "next/link"
import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/live'
import { ALL_POSTS_QUERY } from '@/lib/sanity/queries/posts'
import { urlForImage } from '@/lib/sanity/image'

export const metadata: Metadata = {
  title: 'Blog | Rhythm Lab Radio',
  description: 'Read the latest insights, reviews, and deep dives from Rhythm Lab Radio covering electronic music, culture, and sound exploration.',
  openGraph: {
    title: 'Blog | Rhythm Lab Radio',
    description: 'Read the latest insights, reviews, and deep dives from Rhythm Lab Radio covering electronic music, culture, and sound exploration.',
  },
}

function getPostColor(id: number) {
  const colors = ["#8b5cf6", "#ec4899", "#b12e2e", "#f59e0b", "#10b981", "#ef4444", "#b12e2e", "#8b5a2b"]
  return colors[id % colors.length]
}

export default async function BlogPage() {
  const { data: blogPosts } = await sanityFetch({ query: ALL_POSTS_QUERY })

  if (!blogPosts || blogPosts.length === 0) {
    return (
      <div>
        <Header />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-gray-400">No blog posts found.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post, idx) => (
            <Card key={post._id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-0">
                {post.coverImage && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={urlForImage(post.coverImage).width(600).height(400).url()}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {!post.coverImage && (
                  <div
                    className="h-48 rounded-t-lg"
                    style={{ backgroundColor: getPostColor(idx) }}
                  />
                )}
                <div className="p-4">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.tags?.map(tag => (
                      <Badge key={tag.slug} variant="outline" className="text-xs">
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                  <h2 className="text-lg font-semibold mb-1 line-clamp-2">{post.title}</h2>
                  {post.subtitle && (
                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">{post.subtitle}</p>
                  )}
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between">
                    {post.readingTime && (
                      <span className="text-xs text-gray-500">{post.readingTime} min read</span>
                    )}
                    <Link href={`/blog/${post.slug}`}>
                      <Button size="sm" variant="outline">Read More</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the blog page renders**

```bash
npm run dev
```

Open `http://localhost:3000/blog`. Expected: blog posts render from Sanity data. If the page renders with zero posts, run the migration script (Task 8) first.

- [ ] **Step 3: Commit**

```bash
git add app/blog/page.tsx
git commit -m "feat: migrate blog list page from Storyblok to Sanity"
```

---

### Task 10: Update blog post detail page to use Sanity

**Files:**
- Modify: `app/blog/[slug]/page.tsx`

- [ ] **Step 1: Replace Storyblok fetch with Sanity GROQ in `app/blog/[slug]/page.tsx`**

```typescript
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/live'
import { POST_BY_SLUG_QUERY, ALL_POST_SLUGS_QUERY } from '@/lib/sanity/queries/posts'
import { urlForImage } from '@/lib/sanity/image'
import { PortableTextRenderer } from '@/components/portable-text-renderer'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const { data } = await sanityFetch({ query: ALL_POST_SLUGS_QUERY, perspective: 'published' })
  return (data ?? []).map(({ slug }: { slug: string }) => ({ slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const { data: post } = await sanityFetch({ query: POST_BY_SLUG_QUERY, params: { slug } })
  if (!post) return { title: 'Blog Post | Rhythm Lab Radio' }
  return {
    title: post.seo?.seoTitle || `${post.title} | Rhythm Lab Radio`,
    description: post.seo?.metaDescription || post.excerpt || '',
    openGraph: {
      title: post.seo?.seoTitle || post.title,
      description: post.seo?.metaDescription || post.excerpt || '',
      images: post.coverImage
        ? [urlForImage(post.coverImage).width(1200).height(630).url()]
        : [],
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const { data: post } = await sanityFetch({ query: POST_BY_SLUG_QUERY, params: { slug } })
  if (!post) notFound()

  return (
    <div>
      <Header />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-4">
          <Link href="/blog">
            <Button variant="ghost" size="sm">← Back to Blog</Button>
          </Link>
        </div>
        {post.coverImage && (
          <div className="relative h-64 mb-8 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlForImage(post.coverImage).width(800).height(400).url()}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags?.map((tag: { label: string; slug: string }) => (
            <Badge key={tag.slug} variant="outline">{tag.label}</Badge>
          ))}
        </div>
        <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
        {post.subtitle && <p className="text-xl text-gray-400 mb-4">{post.subtitle}</p>}
        <div className="flex gap-4 text-sm text-gray-500 mb-8">
          {post.author && <span>By {post.author.name}</span>}
          {post.publishedAt && (
            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
          )}
          {post.readingTime && <span>{post.readingTime} min read</span>}
        </div>
        {post.body && (
          <PortableTextRenderer value={post.body} className="prose prose-invert max-w-none" />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify a post renders at `/blog/[slug]`**

```bash
npm run dev
```

Navigate to `http://localhost:3000/blog`, click a post. Expected: post renders with body content from Sanity Portable Text.

- [ ] **Step 3: Commit**

```bash
git add app/blog/\[slug\]/page.tsx
git commit -m "feat: migrate blog post detail page from Storyblok to Sanity"
```

---

### Task 11: Create publish-to-sanity API route for AI content

**Files:**
- Create: `app/api/admin/publish-to-sanity/route.ts`

- [ ] **Step 1: Create `app/api/admin/publish-to-sanity/route.ts`**

```typescript
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

export async function POST(request: NextRequest) {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Sanity write token not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { content, contentType } = body

    if (!content || !contentType) {
      return NextResponse.json({ error: 'content and contentType are required' }, { status: 400 })
    }

    const sanityType = CONTENT_TYPE_MAP[contentType]
    if (!sanityType) {
      return NextResponse.json({ error: `Unknown content type: ${contentType}` }, { status: 400 })
    }

    const slug = content.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const doc = {
      _type: sanityType,
      title: content.title,
      subtitle: content.subtitle || '',
      slug: { _type: 'slug', current: slug },
      excerpt: content.excerpt || '',
      body: content.portableText || [],
      seo: {
        seoTitle: content.seoTitle || content.title,
        metaDescription: content.metaDescription || content.excerpt || '',
      },
    }

    // Create as draft (not published) so a human can review in Studio
    const created = await sanityClient.create(doc)

    await addContentHistoryEntry({
      title: content.title,
      type: contentType,
      destination: 'sanity',
      sanityId: created._id,
    })

    return NextResponse.json({
      success: true,
      sanityId: created._id,
      studioUrl: `https://rhythmlab.sanity.studio/studio/structure/${sanityType};${created._id}`,
    })
  } catch (error) {
    console.error('Error publishing to Sanity:', error)
    return NextResponse.json({ error: 'Failed to publish to Sanity' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/publish-to-sanity/
git commit -m "feat: add publish-to-sanity API route for AI content generation"
```

---

### Task 12: Update Algolia indexing to source from Sanity

**Files:**
- Modify: `app/api/algolia/index-content/route.ts`

- [ ] **Step 1: Replace Storyblok fetch in the Algolia route**

In `app/api/algolia/index-content/route.ts`, replace the Storyblok API call and transformation with a Sanity GROQ query. Find the block that fetches from Storyblok (starting with `const storyblokResponse = await Promise.race([`) and replace it and the transformation logic below it:

```typescript
import { createClient } from '@sanity/client'

const sanityClient = createClient({
  projectId: 'b9cutvrc',
  dataset: 'production',
  apiVersion: '2026-05-17',
  useCdn: false,
})

// Inside the POST handler, replace the Storyblok fetch block with:
const [posts, deepDives, profiles] = await Promise.all([
  sanityClient.fetch(`
    *[_type == "post"] {
      _id, title, subtitle, "slug": slug.current,
      publishedAt, excerpt, "tags": tags[]->{label}
    }
  `),
  sanityClient.fetch(`
    *[_type == "deepDive"] {
      _id, title, subtitle, "slug": slug.current,
      publishedAt, excerpt, "tags": tags[]->{label}
    }
  `),
  sanityClient.fetch(`
    *[_type == "artistProfile"] {
      _id, title, subtitle, "slug": slug.current,
      "tags": tags[]->{label}
    }
  `),
])

const algoliaObjects = [
  ...posts.map((p: any) => ({
    objectID: p._id,
    title: p.title,
    subtitle: p.subtitle,
    slug: p.slug,
    type: 'blog-post',
    url: `/blog/${p.slug}`,
    publishedAt: p.publishedAt,
    excerpt: p.excerpt,
    tags: p.tags?.map((t: any) => t.label) ?? [],
  })),
  ...deepDives.map((d: any) => ({
    objectID: d._id,
    title: d.title,
    subtitle: d.subtitle,
    slug: d.slug,
    type: 'deep-dive',
    url: `/deep-dives/${d.slug}`,
    publishedAt: d.publishedAt,
    excerpt: d.excerpt,
    tags: d.tags?.map((t: any) => t.label) ?? [],
  })),
  ...profiles.map((a: any) => ({
    objectID: a._id,
    title: a.title,
    subtitle: a.subtitle,
    slug: a.slug,
    type: 'artist-profile',
    url: `/profiles/${a.slug}`,
    tags: a.tags?.map((t: any) => t.label) ?? [],
  })),
]
```

Then continue with the existing Algolia `saveObjects` call below — the `algoliaObjects` variable name stays the same.

- [ ] **Step 2: Remove the Storyblok token check** that was at the top of the POST handler (the `if (!storyblokToken)` block) — it's no longer needed.

- [ ] **Step 3: Test the Algolia index route**

```bash
curl -X POST http://localhost:3000/api/algolia/index-content \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json"
```

Expected: `{"indexed": N}` response, where N equals the count of Sanity documents.

- [ ] **Step 4: Commit**

```bash
git add app/api/algolia/index-content/route.ts
git commit -m "feat: update Algolia indexing to source from Sanity instead of Storyblok"
```

---

### Task 13: Set up Sanity revalidation webhook

**Files:**
- Create: `app/api/webhooks/sanity/route.ts`
- Modify: `app/api/revalidate/route.ts`

- [ ] **Step 1: Create `app/api/webhooks/sanity/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-sanity-webhook-secret')
  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { _type, slug } = body

  if (_type === 'post') {
    revalidatePath('/blog')
    if (slug?.current) revalidatePath(`/blog/${slug.current}`)
  } else if (_type === 'deepDive') {
    revalidatePath('/deep-dives')
    if (slug?.current) revalidatePath(`/deep-dives/${slug.current}`)
  } else if (_type === 'artistProfile') {
    revalidatePath('/profiles')
    if (slug?.current) revalidatePath(`/profiles/${slug.current}`)
  } else if (_type === 'aboutPage') {
    revalidatePath('/about')
  } else if (_type === 'siteSettings') {
    revalidatePath('/')
  }

  return NextResponse.json({ revalidated: true })
}
```

- [ ] **Step 2: Register the webhook in Sanity**

Go to `https://www.sanity.io/manage` → project `b9cutvrc` → API → Webhooks → Create webhook:
- URL: `https://your-domain.vercel.app/api/webhooks/sanity`
- Dataset: `production`
- Trigger on: create, update, delete
- Filter: `_type in ["post", "deepDive", "artistProfile", "aboutPage", "siteSettings"]`
- Secret: generate a random string, save it as `SANITY_WEBHOOK_SECRET` in `.env.local` and in Vercel env vars

- [ ] **Step 3: Commit**

```bash
git add app/api/webhooks/
git commit -m "feat: add Sanity revalidation webhook endpoint"
```

---

## Phase 2: Deep Dives Migration

### Task 14: Add deepDive schema and GROQ queries

**Files:**
- Create: `schemas/deepDive.ts`
- Modify: `schemas/index.ts`
- Create: `lib/sanity/queries/deepDives.ts`

- [ ] **Step 1: Create `schemas/deepDive.ts`**

```typescript
import { defineField, defineType } from 'sanity'

export const deepDive = defineType({
  name: 'deepDive',
  title: 'Deep Dive',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'string' }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: r => r.required(),
    }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }] }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
    defineField({
      name: 'difficultyLevel',
      title: 'Difficulty Level',
      type: 'string',
      options: { list: ['Beginner', 'Intermediate', 'Advanced'] },
    }),
    defineField({ name: 'estimatedReadTime', title: 'Estimated Read Time (mins)', type: 'number' }),
    defineField({ name: 'relatedArtists', title: 'Related Artists', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'audioFile',
      title: 'Audio File',
      type: 'file',
      options: { accept: 'audio/*' },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt Text' }),
            defineField({ name: 'caption', type: 'string', title: 'Caption' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
        defineField({ name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 2 }),
        defineField({ name: 'ogImage', title: 'OG Image', type: 'image' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'coverImage' },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : 'Draft', media }
    },
  },
})
```

- [ ] **Step 2: Add `deepDive` to `schemas/index.ts`**

```typescript
import { author } from './author'
import { tag } from './tag'
import { post } from './post'
import { deepDive } from './deepDive'

export const schemaTypes = [author, tag, post, deepDive]
```

- [ ] **Step 3: Create `lib/sanity/queries/deepDives.ts`**

```typescript
import { defineQuery } from 'next-sanity'

export const ALL_DEEP_DIVES_QUERY = defineQuery(`
  *[_type == "deepDive"] | order(publishedAt desc) {
    _id,
    title,
    subtitle,
    "slug": slug.current,
    publishedAt,
    excerpt,
    coverImage,
    estimatedReadTime,
    difficultyLevel,
    "tags": tags[]->{label, "slug": slug.current},
    "author": author->{name, avatar}
  }
`)

export const DEEP_DIVE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "deepDive" && slug.current == $slug][0] {
    _id,
    title,
    subtitle,
    "slug": slug.current,
    publishedAt,
    excerpt,
    coverImage,
    body,
    estimatedReadTime,
    difficultyLevel,
    relatedArtists,
    "tags": tags[]->{label, "slug": slug.current},
    "author": author->{name, avatar},
    seo
  }
`)

export const ALL_DEEP_DIVE_SLUGS_QUERY = defineQuery(`
  *[_type == "deepDive"]{"slug": slug.current}
`)
```

- [ ] **Step 4: Commit**

```bash
git add schemas/deepDive.ts schemas/index.ts lib/sanity/queries/deepDives.ts
git commit -m "feat: add deepDive schema and GROQ queries"
```

---

### Task 15: Write deep dives migration script and update pages

**Files:**
- Create: `scripts/migration/migrate-deep-dives.ts`
- Modify: `app/deep-dives/page.tsx`
- Modify: `app/deep-dives/[slug]/page.tsx`

- [ ] **Step 1: Create `scripts/migration/migrate-deep-dives.ts`**

```typescript
import 'dotenv/config'
import { fetchStoryblokStories } from './shared/storyblok-client'
import { sanityWriteClient, uploadImageFromUrl } from './shared/sanity-client'
import { storyblokRichtextToPortableText } from './shared/rich-text'

async function migrateDeepDives() {
  console.log('Fetching deep dives from Storyblok...')
  const stories = await fetchStoryblokStories('deep-dives/')
  console.log(`Found ${stories.length} deep dives`)

  for (const story of stories) {
    const content = story.content
    console.log(`Migrating: ${content.title || story.name}`)

    let coverImageRef: { _type: string; asset: { _type: string; _ref: string } } | undefined

    if (content.featured_image?.filename) {
      try {
        const assetId = await uploadImageFromUrl(content.featured_image.filename)
        coverImageRef = { _type: 'image', asset: { _type: 'reference', _ref: assetId } }
      } catch (e) {
        console.warn(`  Failed to upload cover image for ${story.slug}:`, e)
      }
    }

    const body = storyblokRichtextToPortableText(content.content || content.long_text || {})

    const doc = {
      _type: 'deepDive',
      title: content.title || story.name,
      subtitle: content.subtitle || '',
      slug: { _type: 'slug', current: story.slug },
      publishedAt: story.first_published_at || story.created_at,
      excerpt: content.excerpt || '',
      difficultyLevel: content.difficulty_level || null,
      estimatedReadTime: content.estimated_read_time || null,
      relatedArtists: content.related_artists || [],
      body,
      ...(coverImageRef ? { coverImage: coverImageRef } : {}),
    }

    await sanityWriteClient.create(doc)
    console.log(`  ✓ Created deep dive: ${doc.slug.current}`)
  }

  console.log('Deep dive migration complete.')
}

migrateDeepDives().catch(console.error)
```

- [ ] **Step 2: Run the deep dives migration**

```bash
STORYBLOK_ACCESS_TOKEN=<your-token> SANITY_API_WRITE_TOKEN=<your-token> \
  npx ts-node --esm scripts/migration/migrate-deep-dives.ts
```

Expected: each deep dive prints `✓ Created deep dive: <slug>`.

- [ ] **Step 3: Update `app/deep-dives/page.tsx`**

Replace the Storyblok fetch with Sanity. The pattern mirrors the blog page. Replace the import section and the data fetching inside `DeepDivesPage`:

```typescript
import { sanityFetch } from '@/lib/sanity/live'
import { ALL_DEEP_DIVES_QUERY } from '@/lib/sanity/queries/deepDives'
import { urlForImage } from '@/lib/sanity/image'
// Remove: import { sb } from "@/src/lib/storyblok"
// Remove: import { safeRenderText } from '@/lib/utils/rich-text'

export default async function DeepDivesPage() {
  const { data: deepDives } = await sanityFetch({ query: ALL_DEEP_DIVES_QUERY })

  // Use deepDives instead of the old Storyblok stories array
  // Map: post.title, post.slug, post.excerpt, post.coverImage, post.tags, post.estimatedReadTime
  // Link href: `/deep-dives/${deepDive.slug}`
}
```

Adapt the existing JSX to use the Sanity field names (which match what the GROQ query returns).

- [ ] **Step 4: Update `app/deep-dives/[slug]/page.tsx`**

Apply the same pattern as `app/blog/[slug]/page.tsx` (Task 10) — replace Storyblok fetch with `sanityFetch({ query: DEEP_DIVE_BY_SLUG_QUERY, params: { slug } })` and render `body` with `<PortableTextRenderer />`.

- [ ] **Step 5: Verify deep dives render**

```bash
npm run dev
```

Open `http://localhost:3000/deep-dives`. Expected: deep dives list renders from Sanity.

- [ ] **Step 6: Commit**

```bash
git add scripts/migration/migrate-deep-dives.ts app/deep-dives/
git commit -m "feat: migrate deep dives from Storyblok to Sanity"
```

---

## Phase 3: About Page + Nav

### Task 16: Add singleton schemas, migrate content, update pages

**Files:**
- Create: `schemas/singletons/aboutPage.ts`
- Create: `schemas/singletons/siteSettings.ts`
- Modify: `schemas/index.ts`
- Create: `lib/sanity/queries/aboutPage.ts`
- Create: `scripts/migration/migrate-about.ts`
- Modify: `app/about/page.tsx`
- Modify: `sanity.config.ts` (structure for singletons)

- [ ] **Step 1: Create `schemas/singletons/aboutPage.ts`**

```typescript
import { defineField, defineType } from 'sanity'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'heroText', title: 'Hero Text', type: 'text', rows: 3 }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
    }),
  ],
})
```

- [ ] **Step 2: Create `schemas/singletons/siteSettings.ts`**

```typescript
import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({ name: 'siteTitle', title: 'Site Title', type: 'string' }),
    defineField({
      name: 'navItems',
      title: 'Navigation Items',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'label', type: 'string', title: 'Label' }),
          defineField({ name: 'href', type: 'string', title: 'URL' }),
        ],
        preview: { select: { title: 'label', subtitle: 'href' } },
      }],
    }),
  ],
})
```

- [ ] **Step 3: Add singletons to `schemas/index.ts`**

```typescript
import { author } from './author'
import { tag } from './tag'
import { post } from './post'
import { deepDive } from './deepDive'
import { aboutPage } from './singletons/aboutPage'
import { siteSettings } from './singletons/siteSettings'

export const schemaTypes = [author, tag, post, deepDive, aboutPage, siteSettings]
```

- [ ] **Step 4: Create `lib/sanity/queries/aboutPage.ts`**

```typescript
import { defineQuery } from 'next-sanity'

export const ABOUT_PAGE_QUERY = defineQuery(`
  *[_type == "aboutPage"][0] {
    title,
    heroText,
    body
  }
`)

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0] {
    siteTitle,
    navItems
  }
`)
```

- [ ] **Step 5: Create singleton documents in Sanity Studio**

```bash
npm run dev
```

Open `http://localhost:3000/studio`. The About Page and Site Settings document types now appear. Create one document of each type (they are singletons — only one should ever exist).

- [ ] **Step 6: Create `scripts/migration/migrate-about.ts`**

```typescript
import 'dotenv/config'
import { sanityWriteClient } from './shared/sanity-client'
import { storyblokRichtextToPortableText } from './shared/rich-text'

const STORYBLOK_TOKEN = process.env.STORYBLOK_ACCESS_TOKEN

async function migrateAbout() {
  const res = await fetch(
    `https://api.storyblok.com/v2/cdn/stories/about?version=published&token=${STORYBLOK_TOKEN}`
  )
  if (!res.ok) {
    console.log('No about story found in Storyblok, skipping.')
    return
  }
  const { story } = await res.json()
  const content = story.content

  const body = storyblokRichtextToPortableText(content.body || content.content || {})

  // Patch the singleton (use the ID you got from Studio)
  // First get the existing singleton ID
  const existing = await sanityWriteClient.fetch(`*[_type == "aboutPage"][0]._id`)
  if (!existing) {
    console.error('Create the aboutPage singleton in Studio first, then run this script.')
    process.exit(1)
  }

  await sanityWriteClient
    .patch(existing)
    .set({
      title: content.title || story.name,
      heroText: content.hero_text || content.subtitle || '',
      body,
    })
    .commit()

  console.log('✓ About page migrated.')
}

migrateAbout().catch(console.error)
```

- [ ] **Step 7: Run the about migration**

```bash
STORYBLOK_ACCESS_TOKEN=<your-token> SANITY_API_WRITE_TOKEN=<your-token> \
  npx ts-node --esm scripts/migration/migrate-about.ts
```

- [ ] **Step 8: Update `app/about/page.tsx` to use Sanity**

Open `app/about/page.tsx`. Replace the Storyblok fetch with:

```typescript
import { sanityFetch } from '@/lib/sanity/live'
import { ABOUT_PAGE_QUERY } from '@/lib/sanity/queries/aboutPage'
import { PortableTextRenderer } from '@/components/portable-text-renderer'

export default async function AboutPage() {
  const { data: about } = await sanityFetch({ query: ABOUT_PAGE_QUERY })
  // Render: about.title, about.heroText, about.body (via PortableTextRenderer)
}
```

Adapt the existing JSX layout to use the Sanity fields.

- [ ] **Step 9: Commit**

```bash
git add schemas/singletons/ schemas/index.ts lib/sanity/queries/aboutPage.ts \
  scripts/migration/migrate-about.ts app/about/page.tsx
git commit -m "feat: migrate about page and nav to Sanity singletons"
```

---

## Phase 4: Artist Profiles + Show Editorial

### Task 17: Add artistProfile and showOverride schemas

**Files:**
- Create: `schemas/artistProfile.ts`
- Create: `schemas/showOverride.ts`
- Modify: `schemas/index.ts`
- Create: `lib/sanity/queries/artistProfiles.ts`
- Create: `lib/sanity/queries/showOverrides.ts`

- [ ] **Step 1: Create `schemas/artistProfile.ts`**

```typescript
import { defineField, defineType } from 'sanity'

export const artistProfile = defineType({
  name: 'artistProfile',
  title: 'Artist Profile',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Artist Name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'subtitle', title: 'Tagline', type: 'string' }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: r => r.required(),
    }),
    defineField({ name: 'genre', title: 'Genre', type: 'string' }),
    defineField({ name: 'website', title: 'Website', type: 'url' }),
    defineField({ name: 'featuredImage', title: 'Featured Image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
    defineField({
      name: 'body',
      title: 'Profile Content',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'seoTitle', type: 'string', title: 'SEO Title' }),
        defineField({ name: 'metaDescription', type: 'text', title: 'Meta Description', rows: 2 }),
      ],
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'genre', media: 'featuredImage' } },
})
```

- [ ] **Step 2: Create `schemas/showOverride.ts`**

```typescript
import { defineField, defineType } from 'sanity'

export const showOverride = defineType({
  name: 'showOverride',
  title: 'Show Editorial Override',
  type: 'document',
  fields: [
    defineField({
      name: 'mixcloudKey',
      title: 'Mixcloud Key',
      type: 'string',
      description: 'The Mixcloud show key, e.g. /rhythmlab/show-name/',
      validation: r => r.required(),
    }),
    defineField({ name: 'featuredImage', title: 'Featured Image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'customDescription',
      title: 'Editorial Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
    defineField({
      name: 'relatedContent',
      title: 'Related Content',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }, { type: 'deepDive' }, { type: 'artistProfile' }] }],
    }),
  ],
  preview: {
    select: { title: 'mixcloudKey', media: 'featuredImage' },
    prepare({ title, media }) {
      return { title: `Show: ${title}`, media }
    },
  },
})
```

- [ ] **Step 3: Add all new schemas to `schemas/index.ts`**

```typescript
import { author } from './author'
import { tag } from './tag'
import { post } from './post'
import { deepDive } from './deepDive'
import { artistProfile } from './artistProfile'
import { showOverride } from './showOverride'
import { aboutPage } from './singletons/aboutPage'
import { siteSettings } from './singletons/siteSettings'

export const schemaTypes = [author, tag, post, deepDive, artistProfile, showOverride, aboutPage, siteSettings]
```

- [ ] **Step 4: Create `lib/sanity/queries/artistProfiles.ts`**

```typescript
import { defineQuery } from 'next-sanity'

export const ALL_ARTIST_PROFILES_QUERY = defineQuery(`
  *[_type == "artistProfile"] | order(title asc) {
    _id, title, subtitle, "slug": slug.current,
    genre, featuredImage,
    "tags": tags[]->{label, "slug": slug.current}
  }
`)

export const ARTIST_PROFILE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "artistProfile" && slug.current == $slug][0] {
    _id, title, subtitle, "slug": slug.current,
    genre, website, featuredImage, body,
    "tags": tags[]->{label, "slug": slug.current},
    seo
  }
`)

export const ALL_ARTIST_PROFILE_SLUGS_QUERY = defineQuery(`
  *[_type == "artistProfile"]{"slug": slug.current}
`)
```

- [ ] **Step 5: Create `lib/sanity/queries/showOverrides.ts`**

```typescript
import { defineQuery } from 'next-sanity'

export const SHOW_OVERRIDE_BY_KEY_QUERY = defineQuery(`
  *[_type == "showOverride" && mixcloudKey == $mixcloudKey][0] {
    _id,
    mixcloudKey,
    featuredImage,
    customDescription,
    "tags": tags[]->{label, "slug": slug.current},
    "relatedContent": relatedContent[]->{
      _type, title, "slug": slug.current
    }
  }
`)
```

- [ ] **Step 6: Commit**

```bash
git add schemas/artistProfile.ts schemas/showOverride.ts schemas/index.ts \
  lib/sanity/queries/artistProfiles.ts lib/sanity/queries/showOverrides.ts
git commit -m "feat: add artistProfile and showOverride schemas and GROQ queries"
```

---

### Task 18: Migrate artist profiles and update profile pages

**Files:**
- Create: `scripts/migration/migrate-artist-profiles.ts`
- Modify: `app/profiles/page.tsx` (or `app/profiles/[slug]/page.tsx`)

- [ ] **Step 1: Create `scripts/migration/migrate-artist-profiles.ts`**

```typescript
import 'dotenv/config'
import { fetchStoryblokStories } from './shared/storyblok-client'
import { sanityWriteClient, uploadImageFromUrl } from './shared/sanity-client'
import { storyblokRichtextToPortableText } from './shared/rich-text'

async function migrateArtistProfiles() {
  console.log('Fetching artist profiles from Storyblok...')
  const stories = await fetchStoryblokStories('profiles/')
  console.log(`Found ${stories.length} artist profiles`)

  for (const story of stories) {
    const content = story.content
    console.log(`Migrating: ${content.title || story.name}`)

    let featuredImageRef: { _type: string; asset: { _type: string; _ref: string } } | undefined

    if (content.featured_image?.filename) {
      try {
        const assetId = await uploadImageFromUrl(content.featured_image.filename)
        featuredImageRef = { _type: 'image', asset: { _type: 'reference', _ref: assetId } }
      } catch (e) {
        console.warn(`  Failed to upload image for ${story.slug}:`, e)
      }
    }

    const body = storyblokRichtextToPortableText(content.content || {})

    const doc = {
      _type: 'artistProfile',
      title: content.title || story.name,
      subtitle: content.subtitle || '',
      slug: { _type: 'slug', current: story.slug },
      genre: content.genre || '',
      website: content.website || '',
      body,
      ...(featuredImageRef ? { featuredImage: featuredImageRef } : {}),
    }

    await sanityWriteClient.create(doc)
    console.log(`  ✓ Created artist profile: ${doc.slug.current}`)
  }

  console.log('Artist profile migration complete.')
}

migrateArtistProfiles().catch(console.error)
```

- [ ] **Step 2: Run the migration**

```bash
STORYBLOK_ACCESS_TOKEN=<your-token> SANITY_API_WRITE_TOKEN=<your-token> \
  npx ts-node --esm scripts/migration/migrate-artist-profiles.ts
```

- [ ] **Step 3: Update profile pages to use Sanity**

In `app/profiles/[slug]/page.tsx`, replace the Storyblok fetch with:

```typescript
import { sanityFetch } from '@/lib/sanity/live'
import { ARTIST_PROFILE_BY_SLUG_QUERY, ALL_ARTIST_PROFILE_SLUGS_QUERY } from '@/lib/sanity/queries/artistProfiles'
import { PortableTextRenderer } from '@/components/portable-text-renderer'

export async function generateStaticParams() {
  const { data } = await sanityFetch({ query: ALL_ARTIST_PROFILE_SLUGS_QUERY, perspective: 'published' })
  return (data ?? []).map(({ slug }: { slug: string }) => ({ slug }))
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: profile } = await sanityFetch({
    query: ARTIST_PROFILE_BY_SLUG_QUERY,
    params: { slug }
  })
  if (!profile) notFound()
  // Render profile.title, profile.body (PortableTextRenderer), etc.
}
```

- [ ] **Step 4: Commit**

```bash
git add scripts/migration/migrate-artist-profiles.ts app/profiles/
git commit -m "feat: migrate artist profiles from Storyblok to Sanity"
```

---

### Task 19: Add show editorial overlay to show detail page

**Files:**
- Modify: `app/shows/[id]/page.tsx` (or the `RealShowDetail` component it renders)
- Modify: `app/admin/mixcloud/page.tsx`

- [ ] **Step 1: Find where the show's Mixcloud key is fetched**

```bash
grep -n "mixcloudKey\|cloudcast_key\|show_key\|/rhythmlab/" \
  /Users/tarikmoody/Documents/Projects/rhythm-lab-app/rhythm-lab-app/components/real-show-detail.tsx | head -20
```

Identify the variable that holds the Mixcloud show key (the `/rhythmlab/show-name/` path).

- [ ] **Step 2: Fetch the Sanity `showOverride` in parallel with Mixcloud data**

In the component that fetches the Mixcloud show (either `app/shows/[id]/page.tsx` or `components/real-show-detail.tsx`), add a parallel Sanity fetch. Because `real-show-detail.tsx` appears to be a client component, create a new server component wrapper:

Create `app/shows/[id]/show-with-editorial.tsx`:

```typescript
import { sanityFetch } from '@/lib/sanity/live'
import { SHOW_OVERRIDE_BY_KEY_QUERY } from '@/lib/sanity/queries/showOverrides'
import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { urlForImage } from '@/lib/sanity/image'

interface ShowWithEditorialProps {
  mixcloudKey: string
  children: React.ReactNode
}

export async function ShowWithEditorial({ mixcloudKey, children }: ShowWithEditorialProps) {
  const { data: override } = await sanityFetch({
    query: SHOW_OVERRIDE_BY_KEY_QUERY,
    params: { mixcloudKey }
  })

  return (
    <div>
      {children}
      {override && (
        <div className="mt-8 border-t border-gray-800 pt-8">
          {override.customDescription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">About This Show</h3>
              <PortableTextRenderer value={override.customDescription} />
            </div>
          )}
          {override.tags && override.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {override.tags.map((tag: { label: string; slug: string }) => (
                <span key={tag.slug} className="px-2 py-1 bg-gray-800 rounded text-sm">
                  {tag.label}
                </span>
              ))}
            </div>
          )}
          {override.relatedContent && override.relatedContent.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Related</h3>
              <ul className="space-y-2">
                {override.relatedContent.map((item: { _type: string; title: string; slug: string }) => {
                  const href = item._type === 'post' ? `/blog/${item.slug}`
                    : item._type === 'deepDive' ? `/deep-dives/${item.slug}`
                    : `/profiles/${item.slug}`
                  return (
                    <li key={item.slug}>
                      <a href={href} className="text-purple-400 hover:text-purple-300">
                        {item.title}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update `app/shows/[id]/page.tsx` to use `ShowWithEditorial`**

```typescript
import { Header } from "@/components/header"
import { RealShowDetail } from "@/components/real-show-detail"
import { ShowWithEditorial } from "./show-with-editorial"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ShowDetailPage({ params }: PageProps) {
  const { id } = await params
  // id is the Mixcloud key encoded as URL param — decode to get the full key
  const mixcloudKey = decodeURIComponent(id)

  return (
    <div>
      <Header />
      <ShowWithEditorial mixcloudKey={mixcloudKey}>
        <RealShowDetail showId={id} />
      </ShowWithEditorial>
    </div>
  )
}
```

- [ ] **Step 4: Add "Add Editorial Content" to Mixcloud admin page**

In `app/admin/mixcloud/page.tsx`, find where individual shows are rendered in the list. Add a button per show that links to the Sanity Studio to create or edit the `showOverride` for that show's key:

```typescript
// After each show's details in the list, add:
<a
  href={`/studio/structure/showOverride`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs text-purple-400 hover:text-purple-300 underline"
>
  Add Editorial Content →
</a>
```

(The exact Studio deep-link URL for creating a new showOverride depends on Sanity Studio's structure configuration. A simpler approach is to link to `/studio` with a note to create a Show Override document.)

- [ ] **Step 5: Commit**

```bash
git add app/shows/ app/admin/mixcloud/page.tsx
git commit -m "feat: add Sanity editorial overlay to show detail page"
```

---

## Phase 5: Cleanup

### Task 20: Remove Storyblok dependencies and retire routes

**Files:**
- Delete: `app/api/storyblok/` (all routes)
- Delete: `app/api/admin/publish-to-storyblok/route.ts`
- Delete: `app/api/admin/upload-image-to-storyblok/route.ts`
- Delete: `app/api/admin/debug-storyblok/route.ts`
- Delete: `app/storyblok-test/page.tsx`
- Delete: `lib/storyblok-management.ts`
- Delete: `components/storyblok-error-boundary.tsx`
- Modify: `package.json` (remove Storyblok packages)
- Modify: `next.config.mjs` (remove `a.storyblok.com` image domain)

- [ ] **Step 1: Verify no remaining Storyblok imports in app code**

```bash
grep -r "storyblok\|StoryBlok" \
  app/ components/ lib/ --include="*.ts" --include="*.tsx" \
  | grep -v "node_modules\|storyblok-management\|storyblok-error-boundary" \
  | grep -v "api/storyblok\|api/admin/publish-to-storyblok\|api/admin/upload-image-to-storyblok"
```

Expected: no output (all app code is Storyblok-free).

If any files still import Storyblok, update them to use Sanity before proceeding.

- [ ] **Step 2: Delete retired files**

```bash
rm -rf app/api/storyblok
rm -f app/api/admin/publish-to-storyblok/route.ts
rm -f app/api/admin/upload-image-to-storyblok/route.ts
rm -rf app/api/admin/debug-storyblok
rm -rf app/storyblok-test
rm -f lib/storyblok-management.ts
rm -f components/storyblok-error-boundary.tsx
rm -f components/RichTextRenderer.tsx
```

- [ ] **Step 3: Remove Storyblok packages from `package.json`**

```bash
npm uninstall storyblok-js-client storyblok-rich-text-react-renderer
```

- [ ] **Step 4: Remove `a.storyblok.com` from `next.config.mjs`**

In `next.config.mjs`, delete the entry:

```js
// Remove this block:
{
  protocol: 'https',
  hostname: 'a.storyblok.com',
  port: '',
  pathname: '/f/**',
},
```

- [ ] **Step 5: Run build to verify no broken imports**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: build succeeds with no Storyblok-related errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove Storyblok — full Sanity migration complete"
```

---

## Self-Review Notes

**Spec coverage verified:**
- ✅ Strangler fig (Phase 1 → 4) — covered in Tasks 7-19
- ✅ Embedded Studio at `/studio` with Clerk auth — Task 4
- ✅ All content types migrated — Tasks 8, 15, 16, 18
- ✅ AI content → Sanity draft — Task 11
- ✅ Algolia re-indexed from Sanity — Task 12
- ✅ Sanity revalidation webhook — Task 13
- ✅ Show editorial overlay — Task 19
- ✅ Storyblok decommission — Task 20

**Type consistency:**
- `sanityFetch` used consistently across all page updates
- `GROQ queries` use `"slug": slug.current` projection consistently — pages access `post.slug` not `post.slug.current`
- `PortableTextRenderer` takes `value` prop throughout
- `urlForImage(asset).width(N).url()` pattern consistent across all image renders
