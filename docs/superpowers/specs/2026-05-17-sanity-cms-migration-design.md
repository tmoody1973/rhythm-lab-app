# Sanity CMS Migration Design

**Date:** 2026-05-17  
**Project:** Rhythm Lab App  
**Scope:** Migrate all content from Storyblok to Sanity.io using a strangler fig (content-type-by-content-type) approach.

---

## 1. Overview

Replace Storyblok as the headless CMS with Sanity.io. The migration follows a strangler fig pattern: one content type migrates at a time, the site stays fully functional throughout, and Storyblok is decommissioned after the last content type is cut over.

**Three goals in one migration:**
1. Move all editorial content into Sanity Content Lake
2. Embed Sanity Studio at `/studio` (protected by Clerk) as the content editing interface
3. Establish a new editorial layer for Mixcloud shows (Sanity stores overrides, Mixcloud stays the audio source of truth)

---

## 2. Architecture

### Tech Added
- `next-sanity` v11+ — embedded Studio, Live Content API (`defineLive`), Draft Mode
- `@sanity/client` — data fetching + Management API writes for AI content generation
- `@portabletext/react` — Portable Text rendering (replaces `storyblok-rich-text-react-renderer`)
- `@portabletext/block-tools` + `@portabletext/markdown` — migration scripts for converting rich text
- `@sanity/image-url` — image URL building (replaces Storyblok CDN references)

### Tech Removed (after full migration)
- `storyblok-js-client`
- `storyblok-rich-text-react-renderer`
- `components/RichTextRenderer.tsx`
- `components/storyblok-error-boundary.tsx`
- `lib/storyblok-management.ts`

### New File Structure
```
sanity.config.ts                   — Studio configuration (project root)
schemas/                           — Sanity schema definitions
  post.ts
  deepDive.ts
  artistProfile.ts
  showOverride.ts
  author.ts
  tag.ts
  singletons/
    aboutPage.ts
    siteSettings.ts

lib/sanity/
  client.ts                        — Sanity client config
  live.ts                          — defineLive setup (real-time content)
  queries.ts                       — GROQ queries per content type
  image.ts                         — @sanity/image-url builder

app/studio/[[...tool]]/
  page.tsx                         — Embedded Studio (Clerk-protected)

scripts/migration/
  migrate-posts.ts                 — Blog post migration from Storyblok
  migrate-deep-dives.ts            — Deep dive migration from Storyblok
  migrate-artist-profiles.ts       — Artist profile migration
  migrate-about.ts                 — About page singleton migration
```

### Revalidation Strategy
Switch from Storyblok webhooks to Sanity webhooks targeting the existing `/api/revalidate` route. The Live Content API (`defineLive` + `<SanityLive />` in root layout) handles preview/draft mode automatically without additional polling.

---

## 3. Content Schema

### Document Types

#### `post` (migrated from `blog_post`)
| Field | Type | Notes |
|-------|------|-------|
| `title` | string | required |
| `subtitle` | string | |
| `slug` | slug | source: title |
| `publishedAt` | datetime | |
| `author` | reference → `author` | |
| `excerpt` | text | plain text preview |
| `body` | array (Portable Text) | main rich content |
| `coverImage` | image | with hotspot |
| `tags` | array of reference → `tag` | |
| `readingTime` | number | minutes, stored not computed |
| `seo` | embedded object | seoTitle, metaDescription, ogImage |

#### `deepDive` (migrated from `deep_dive`)
All `post` fields plus:
| Field | Type | Notes |
|-------|------|-------|
| `audioFile` | file | for podcast integration |
| `difficultyLevel` | string | Beginner / Intermediate / Advanced |
| `estimatedReadTime` | number | |
| `relatedArtists` | array of strings | referenced artist names |

#### `artistProfile` (migrated from `artist_profile`)
| Field | Type | Notes |
|-------|------|-------|
| `title` | string | required |
| `subtitle` | string | |
| `slug` | slug | |
| `body` | array (Portable Text) | |
| `genre` | string | |
| `website` | url | |
| `featuredImage` | image | |
| `tags` | array of reference → `tag` | |
| `seo` | embedded object | |

#### `showOverride` (new — editorial layer over Mixcloud)
| Field | Type | Notes |
|-------|------|-------|
| `mixcloudKey` | string | required, FK to Mixcloud (e.g. `/rhythmlab/show-name/`) |
| `customDescription` | array (Portable Text) | editorial description overriding Mixcloud's |
| `featuredImage` | image | override Mixcloud cover image |
| `tags` | array of reference → `tag` | |
| `relatedContent` | array of reference | → `post`, `deepDive`, `artistProfile` |

#### `author`
| Field | Type | Notes |
|-------|------|-------|
| `name` | string | required |
| `bio` | text | |
| `avatar` | image | |

#### `tag`
| Field | Type | Notes |
|-------|------|-------|
| `label` | string | required |
| `slug` | slug | |

### Singletons
- **`aboutPage`** — title, hero text, body (Portable Text), team members
- **`siteSettings`** — site title, nav items (array of embedded objects with label + href), social links

### Modeling Decisions
- `author` is a **reference** — reused across many documents, needs central management
- `seo` is **embedded** — unique per document, no sharing needed
- `showOverride` links to Mixcloud via `mixcloudKey` string (not a Sanity reference, since Mixcloud is the authoritative system for show existence)
- `tags` are **references** to `tag` docs (consistent taxonomy, filterable in GROQ; replaces flat string arrays)

---

## 4. Migration Phases

### Phase 1 — Blog Posts
**Goal:** Validate the full migration pattern on the lowest-risk content type.

1. Design and deploy `post`, `author`, `tag` schemas to Sanity
2. Run `migrate-posts.ts`: pull from Storyblok API → convert rich text blocks to Portable Text via `@portabletext/block-tools` → download Storyblok-hosted images, re-upload to Sanity Asset Pipeline → create `post` documents in Sanity
3. Update `/app/blog/page.tsx` and `/app/blog/[slug]/page.tsx` to query Sanity via GROQ
4. Add `@portabletext/react` renderer for blog post body (replaces `RichTextRenderer.tsx` for this route)
5. Update `/app/api/admin/publish-to-storyblok/` → new `/app/api/admin/publish-to-sanity/` for AI blog generation (creates Sanity draft)
6. Update `/app/api/admin/upload-image-to-storyblok/` → use Sanity asset upload endpoint
7. Retire `/app/api/storyblok/` blog-related routes
8. Update Algolia indexing (`/app/api/algolia/index-content/`) to pull `post` type from Sanity GROQ instead of Storyblok

### Phase 2 — Deep Dives
Same pattern as Phase 1. Audio files remain in Supabase storage; only metadata and rich text content migrate to Sanity.

1. Deploy `deepDive` schema
2. Run `migrate-deep-dives.ts`
3. Update `/app/deep-dives/` routes to query Sanity
4. Update AI deep-dive generation to publish to Sanity
5. Update Algolia indexing for `deepDive` type

### Phase 3 — About Page + Nav
1. Deploy `aboutPage` and `siteSettings` singletons
2. Run `migrate-about.ts` to port about page rich text and nav items
3. Update `/app/about/page.tsx` to query `aboutPage` singleton
4. Update nav components to read from `siteSettings`
5. Retire `/app/api/storyblok/about/` and `/app/api/storyblok/mobile-nav/` routes

### Phase 4 — Artist Profiles + Show Overrides
1. Deploy `artistProfile` and `showOverride` schemas
2. Run `migrate-artist-profiles.ts` to migrate artist profile documents
3. Update `/app/profiles/[slug]/page.tsx` to query Sanity
4. Add "Add Editorial Content" action to `/admin/mixcloud/page.tsx` — deep-links to Sanity Studio for the `showOverride` type pre-filled with `mixcloudKey`
5. Update `/app/shows/[id]/page.tsx` to merge Mixcloud API response with Sanity override:

```typescript
const [mixcloudShow, sanityOverride] = await Promise.all([
  fetchFromMixcloud(mixcloudKey),
  sanityFetch({
    query: `*[_type == "showOverride" && mixcloudKey == $key][0]`,
    params: { key: mixcloudKey }
  })
])
// Merge: Sanity description overrides Mixcloud description if present
// Sanity image overrides Mixcloud cover image if present
```

6. Decommission all remaining `/app/api/storyblok/` routes
7. Remove Storyblok dependencies from `package.json`

---

## 5. Data Flow (Post-Migration)

```
Content Creation:
  Sanity Studio (/studio) → Sanity Content Lake
  AI Generator (admin) → Sanity Management API → Draft doc in Content Lake

Content Delivery:
  Sanity Content Lake
    → GROQ queries in Next.js Server Components (via sanityFetch / defineLive)
    → Algolia (re-indexed via Sanity webhook → /api/revalidate)
    → Vercel Edge Cache (invalidated via Sanity webhook on publish)

Show Pages (merged):
  Mixcloud API (audio, title, tracklist, play counts) + Sanity showOverride (description, image, tags, related)
```

---

## 6. Admin Workflow Changes

| Current | Post-Migration |
|---------|----------------|
| AI generates → publishes to Storyblok | AI generates → creates Sanity draft |
| Upload image → Storyblok asset library | Upload image → Sanity Asset Pipeline |
| Storyblok visual editor | Sanity Studio at `/studio` (Clerk-protected) |
| `/api/admin/publish-to-storyblok` | `/api/admin/publish-to-sanity` |
| `/api/admin/upload-image-to-storyblok` | Sanity client `assets.upload()` |
| Algolia sync reads from Storyblok | Algolia sync reads from Sanity GROQ |
| No editorial layer for shows | `/admin/mixcloud` → "Add Editorial Content" → Studio |

---

## 7. What Stays Unchanged

- Mixcloud auth, upload, archive sync, and player components — no changes
- Supabase database and all non-CMS data (shows, tracks, favorites, spinitron, etc.)
- Algolia search infrastructure — only the data source changes
- Clerk authentication and admin access control
- All Spinitron, YouTube, Discogs, Bandcamp integrations
- Vercel deployment and CI/CD pipeline

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Rich text conversion loses formatting | Validate Portable Text output for 5-10 representative posts before running full migration |
| Image CDN URLs break | Images re-uploaded to Sanity Assets before route cutover; Storyblok CDN stays up during migration |
| Algolia index gap during cutover | Run Sanity Algolia re-index immediately after each phase; do not remove Storyblok index records until new index verified |
| Sanity Studio access by non-technical editors | Studio embedded at `/studio`, protected by Clerk; no separate credentials required |
| AI content going to wrong CMS during migration | Feature-flag the content generation destination per content type (`NEXT_PUBLIC_CONTENT_DESTINATION=sanity|storyblok`) |

---

## 9. Success Criteria

- [ ] All blog posts, deep dives, artist profiles render from Sanity GROQ queries
- [ ] About page and nav content served from Sanity singletons
- [ ] Sanity Studio accessible at `/studio` behind Clerk auth
- [ ] AI-generated content creates Sanity draft documents (not Storyblok)
- [ ] Algolia indexes contain Sanity-sourced content with no gaps
- [ ] `showOverride` editorial content merges correctly on show pages
- [ ] All `/api/storyblok/` routes removed
- [ ] `storyblok-js-client` removed from `package.json`
- [ ] No Storyblok API calls in production (verified via network audit)
