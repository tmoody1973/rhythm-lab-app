import 'dotenv/config'
import { createClient } from '@sanity/client'

if (!process.env.SANITY_API_WRITE_TOKEN) {
  throw new Error('SANITY_API_WRITE_TOKEN is required')
}

export const sanityWriteClient = createClient({
  projectId: 'b9cutvrc',
  dataset: 'production',
  apiVersion: '2026-05-17',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

export async function uploadImageFromUrl(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to fetch image: ${imageUrl} (${res.status})`)
  const buffer = await res.arrayBuffer()
  const filename = imageUrl.split('/').pop()?.split('?')[0] ?? 'image'
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const asset = await sanityWriteClient.assets.upload('image', Buffer.from(buffer), {
    filename,
    contentType,
  })
  return asset._id
}
