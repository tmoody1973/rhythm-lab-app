# Rhythm Lab App — Claude Instructions

## Sanity CMS Integration Rules

**MANDATORY: Before any Sanity-related work, invoke the `sanity-best-practices` skill.**

This project uses Sanity.io as its headless CMS (migrated from Storyblok in May 2026). Key facts:
- **Project ID:** `b9cutvrc` | **Dataset:** `production`
- **Studio:** Hosted at `https://rhythmlab.sanity.studio` (do NOT use embedded Studio — `sanity` v5 is incompatible with Next.js 15 webpack due to `useEffectEvent`)
- **Client:** `@/lib/sanity/client` (use `client.fetch` directly for server components)
- **Fetch helper:** `@/lib/sanity/live` exports `sanityFetch` (thin wrapper, no live subscriptions)
- **Schemas:** `schemas/` directory — `post`, `deepDive`, `artistProfile`, `showOverride` (Episode), `author`, `tag`, `aboutPage`, `siteSettings`
- **Queries:** `lib/sanity/queries/` — `posts.ts`, `deepDives.ts`, `episodes.ts`, `artistProfiles.ts`, `showOverrides.ts`, `aboutPage.ts`
- **Image builder:** `@/lib/sanity/image` — use `urlForImage(asset).width(N).url()`
- **Episode helper:** `lib/sanity/episodeHelpers.ts` — `upsertEpisode()` called by Mixcloud import routes

### Critical Patterns (Learned from Production)

- `generateStaticParams` → use `client.fetch` directly, NOT `sanityFetch` — `sanityFetch` calls `draftMode()` which crashes outside a request scope
- `if (!doc) return notFound()` — must use `return` for TypeScript narrowing
- Env vars use `||` not `??` — so empty-string env vars fall back to hardcoded defaults
- `NEXT_PUBLIC_SANITY_*` vars must be added to Vercel with `--value` flag (not piped `echo`) to avoid trailing `\n` pollution — `echo "b9cutvrc"` stores `b9cutvrc\n` which fails Sanity's projectId validation
- Never import from the `sanity` npm package in app code — only `@sanity/client` and `next-sanity@11.x`
- `next-sanity@11.x` is required for Next.js 15 compatibility (v12+ requires Next.js 16)

### Skills to Use

- **`sanity-best-practices`** — invoke before any Sanity integration work
- **`content-modeling-best-practices`** — invoke before schema design decisions

## Mixcloud Integration

- **Shows source of truth:** Mixcloud API (audio, tracklist, play counts)
- **Episode editorial layer:** Sanity `showOverride` documents (keyed by `mixcloudKey`)
- **Auto-creation:** `/api/mixcloud/import` and `/api/mixcloud/create-show` call `upsertEpisode()` after Supabase save
- **AI descriptions:** `/api/episodes/generate-description` patches Sanity document async (fire-and-forget)
- **Episode pages:** `/episodes/[slug]` — fetches from Sanity, embeds Mixcloud player via `MixcloudOEmbedPlayer`
- **Admin:** `/admin/mixcloud` — Archive Import, Import by URL, Upload New Show
