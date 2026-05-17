# Mixcloud + Sanity Episode Posts Design

**Date:** 2026-05-17
**Project:** Rhythm Lab App
**Scope:** Auto-create Sanity episode posts from Mixcloud imports, with AI-generated descriptions, structured tracklists, and dedicated `/episodes/[slug]` pages.

---

## 1. Overview

When a Mixcloud show is imported (from archive, URL, or upload), a Sanity `showOverride` document is automatically created as a draft. This document becomes the "episode post" — it holds the editorial content that makes each show discoverable and shareable. Editors review and publish in Sanity Studio (`https://rhythmlab.sanity.studio`). Published episodes are available at `/episodes/[slug]`.

**Three goals:**
1. Make every imported show auto-generate a rich episode draft in Sanity
2. Give each episode a dedicated SEO-indexable page at `/episodes/[slug]`
3. Use AI to generate an editorial description from the show's tracklist and metadata

---

## 2. Schema Changes

The existing `showOverride` document type (`schemas/showOverride.ts`) is expanded with new fields and renamed in the Studio UI from "Show Editorial Override" to "Episode".

### New Fields Added

| Field | Sanity Type | Source | Notes |
|-------|-------------|--------|-------|
| `title` | string | Mixcloud `name` | Copied on import, editable in Studio |
| `slug` | slug | Derived from `title` | Powers the `/episodes/[slug]` URL |
| `date` | datetime | Mixcloud `created_time` | When the show was uploaded to Mixcloud |
| `duration` | number | Mixcloud `audio_length` | In seconds |
| `tracklist` | array of objects | Mixcloud `sections[]` | See structure below |
| `aiDescription` | array (Portable Text) | AI-generated on import | Editors can override in Studio |

### Tracklist Object Shape

Each entry in `tracklist[]`:
```typescript
{
  startTime: number  // seconds from start of show
  artistName: string
  trackName: string
}
```

### Existing Fields Retained (Unchanged)

- `mixcloudKey` (string, required, primary FK to Mixcloud)
- `featuredImage` (image, uploaded to Sanity Assets)
- `customDescription` (Portable Text, manual editor override)
- `tags` (array of references to `tag` documents)
- `relatedContent` (array of references to post/deepDive/artistProfile)

### Studio Display Name

`defineType` title changes from `'Show Editorial Override'` → `'Episode'`. The underlying `_type` value stays `showOverride` — no document migration needed.

---

## 3. Import Flow

Triggered by: Archive Import, Import by URL, or Upload New Show in `/admin/mixcloud`.

The existing routes (`/api/mixcloud/import` and `/api/mixcloud/create-show`) are updated to add steps 3–5:

```
1. Fetch show data from Mixcloud API
     → name, key, created_time, audio_length, sections[], tags[], picture

2. Save show record to Supabase (unchanged, existing behavior)

3. Upload Mixcloud cover image to Sanity Asset Pipeline
     → fetch image from Mixcloud CDN → upload via sanityClient.assets.upload()
     → returns Sanity asset _id

4. Create or upsert showOverride document in Sanity (as draft)
     → check if document exists: *[_type == "showOverride" && mixcloudKey == $key][0]
     → if exists: patch with updated fields
     → if not: create new draft document
     Fields populated:
       mixcloudKey, title, slug (from title), date, duration,
       featuredImage (Sanity asset ref), tracklist (from sections[]),
       status: draft (unpublished)

5. Return success response to admin UI (episode draft is ready in Studio)

6. ASYNC (after response): Generate AI episode description
     → POST /api/episodes/generate-description with { mixcloudKey, title, tracklist, tags }
     → AI generates ~200-word editorial description as Portable Text
     → PATCH Sanity document: set aiDescription field
     → Admin UI can show "Generating description..." spinner
```

**Idempotency:** The upsert check on `mixcloudKey` ensures re-importing a show updates the existing episode rather than creating a duplicate.

**Error handling:** If Sanity creation fails, the Supabase save still succeeds. A warning is shown in the admin UI. The episode can be created manually in Studio.

---

## 4. AI Description Generation

**Route:** `POST /api/episodes/generate-description`

**Input:**
```typescript
{
  mixcloudKey: string
  title: string
  tracklist: Array<{ startTime: number; artistName: string; trackName: string }>
  tags: string[]
}
```

**Process:**
1. Build a prompt from the tracklist and title (e.g., "Write a 200-word editorial description for a music show titled '...' featuring tracks by [artists]...")
2. Call Claude API (existing AI infrastructure)
3. Convert the generated text to Portable Text blocks
4. PATCH the Sanity `showOverride` document at `mixcloudKey` with `{ aiDescription: portableTextBlocks }`

**Display logic on episode page:**
- If `customDescription` is set → use it (editor override)
- Else if `aiDescription` is set → use it (AI-generated)
- Else → show nothing (description pending)

---

## 5. New Pages

### `/episodes/[slug]` — Episode Detail Page

**File:** `app/episodes/[slug]/page.tsx`

**Data source:** `sanityFetch({ query: EPISODE_BY_SLUG_QUERY, params: { slug } })`

**GROQ query projection:**
```groq
*[_type == "showOverride" && slug.current == $slug][0] {
  _id, title, "slug": slug.current, mixcloudKey, date, duration,
  "featuredImage": featuredImage{asset, alt},
  aiDescription, customDescription,
  "tracklist": tracklist[]{ startTime, artistName, trackName },
  "tags": tags[]->{label, "slug": slug.current},
  "relatedContent": relatedContent[]->{_type, title, "slug": slug.current}
}
```

**Page layout:**
```
Header
├── Episode Hero
│   ├── Cover image (Sanity CDN)
│   ├── Title + formatted date + duration (HH:MM:SS)
│   └── Tag badges
├── Mixcloud Embedded Player (iframe via mixcloudKey)
├── Episode Description
│   └── customDescription if set, else aiDescription (PortableTextRenderer)
├── Tracklist
│   └── Table: [startTime formatted] · [artistName] — [trackName]
├── Related Content (if relatedContent.length > 0)
│   └── Cards linking to blog/deep-dives/profiles
└── "Back to all episodes" link
```

**SEO (generateMetadata):**
- title: `${episode.title} | Rhythm Lab Radio`
- description: First 160 chars of description text
- og:image: Cover image URL

**generateStaticParams:** Uses `client.fetch` (not `sanityFetch`) to avoid `draftMode()` outside request scope — same pattern as blog and deep-dives.

### `/episodes` — Episode List Page

**File:** `app/episodes/page.tsx`

Fetches all published `showOverride` documents with a `slug.current` defined, ordered by `date desc`. Renders a card grid identical to the blog/deep-dives list: cover image, title, date, tags, link to detail page.

---

## 6. Admin UI Updates

The Mixcloud admin interface (`components/admin/mixcloud-admin-interface.tsx`) gets a new status indicator on import results:

- After import: show "Episode draft created in Sanity Studio" with a link to the Studio document
- Show "Generating AI description..." until the async description patch completes
- If Sanity creation failed: show a warning with a "Create in Studio manually" link

No new tab needed — the feedback is inline in the existing Archive Import and Import by URL tabs.

---

## 7. Navigation

Add "Episodes" to the main nav (header + mobile nav) alongside Blog, Deep Dives, Profiles.

The Sanity `siteSettings` singleton can drive the nav — add an "Episodes" nav item pointing to `/episodes`. Until then, add it to the static nav arrays in `components/header.tsx` and `components/mobile-navigation-wrapper.tsx`.

---

## 8. What This Does NOT Change

- Mixcloud remains the audio source of truth — the player is always the Mixcloud iframe
- Supabase show records are unchanged
- Mixcloud OAuth, upload, and quota management are unchanged
- The `/shows/[id]` archive page stays as-is (archive view)
- Publishing in Sanity Studio is the gate — only published episodes appear on `/episodes/`

---

## 9. Success Criteria

- [ ] Import a Mixcloud show → Sanity episode draft appears in Studio within 5 seconds
- [ ] AI description appears in the draft within 15 seconds of import
- [ ] `/episodes/[slug]` renders with player, description, tracklist, and tags
- [ ] `/episodes/` list page shows all published episodes
- [ ] `showOverride` displays as "Episode" in Sanity Studio
- [ ] Re-importing the same show updates the episode (idempotent)
- [ ] If Sanity creation fails, Supabase save still succeeds
