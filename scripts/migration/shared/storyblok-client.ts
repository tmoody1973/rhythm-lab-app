import 'dotenv/config'

const STORYBLOK_TOKEN = process.env.STORYBLOK_ACCESS_TOKEN

if (!STORYBLOK_TOKEN) throw new Error('STORYBLOK_ACCESS_TOKEN is required')

export async function fetchStoryblokStories(
  path: string,
  params: Record<string, string> = {}
): Promise<unknown[]> {
  const query = new URLSearchParams({
    version: 'published',
    per_page: '100',
    token: STORYBLOK_TOKEN!,
    ...params,
  })
  const res = await fetch(
    `https://api.storyblok.com/v2/cdn/stories?starts_with=${encodeURIComponent(path)}&${query}`
  )
  if (!res.ok) throw new Error(`Storyblok error: ${res.status} ${res.statusText}`)
  const data = (await res.json()) as { stories?: unknown[] }
  return data.stories ?? []
}
