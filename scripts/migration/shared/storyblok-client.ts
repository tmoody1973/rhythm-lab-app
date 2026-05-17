import 'dotenv/config'

const STORYBLOK_TOKEN = process.env.STORYBLOK_ACCESS_TOKEN

if (!STORYBLOK_TOKEN) throw new Error('STORYBLOK_ACCESS_TOKEN is required')

/** Extract plain text from a Storyblok richtext field or return the value unchanged if already a string */
export function extractPlainText(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  const node = value as { text?: string; content?: unknown[] }
  if (node.text) return node.text
  if (Array.isArray(node.content)) {
    return node.content.map(extractPlainText).join(' ').replace(/\s+/g, ' ').trim()
  }
  return ''
}

export async function fetchStoryblokStories(path: string, params: Record<string, string> = {}): Promise<unknown[]> {
  const allStories: unknown[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const query = new URLSearchParams({
      version: 'published',
      per_page: String(perPage),
      page: String(page),
      token: STORYBLOK_TOKEN!,
      ...params,
    })
    const url = `https://api.storyblok.com/v2/cdn/stories?starts_with=${encodeURIComponent(path)}&${query}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Storyblok error: ${res.status} ${res.statusText}`)
    const data = await res.json()
    const stories: unknown[] = data.stories ?? []
    allStories.push(...stories)
    if (stories.length < perPage) break
    page++
  }

  return allStories
}
