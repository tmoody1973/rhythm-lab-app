import { client } from './client'
import { draftMode } from 'next/headers'

// Plain sanityFetch — no live subscriptions (next-sanity/live uses useEffectEvent
// which is incompatible with Next.js 15 webpack). Cache invalidation is handled
// via Sanity webhook → /api/webhooks/sanity → revalidatePath.
export async function sanityFetch<T = unknown>({
  query,
  params = {},
  perspective,
}: {
  query: string
  params?: Record<string, unknown>
  perspective?: 'published' | 'previewDrafts'
}): Promise<{ data: T }> {
  let usePerspective = perspective ?? 'published'

  try {
    const draft = await draftMode()
    if (draft.isEnabled) usePerspective = 'previewDrafts'
  } catch {
    // Falls outside a request scope (e.g. generateStaticParams) — use published
  }

  const fetchClient = usePerspective === 'previewDrafts'
    ? client.withConfig({
        token: process.env.SANITY_API_READ_TOKEN,
        useCdn: false,
        perspective: 'previewDrafts' as const,
      })
    : client

  const data = await fetchClient.fetch<T>(query, params)
  return { data }
}

// Stub — exported so existing imports compile. Renders nothing.
export function SanityLive() {
  return null
}
