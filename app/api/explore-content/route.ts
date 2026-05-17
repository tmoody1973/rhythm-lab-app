import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity/client'

export async function GET() {
  try {
    const docs = await client.fetch(`
      *[_type in ["post","deepDive","artistProfile"]] | order(publishedAt desc) [0..49] {
        _id, _type, title, "slug": slug.current, publishedAt,
        excerpt, "coverImage": coverImage{asset, alt},
        "featuredImage": featuredImage{asset, alt},
        "tags": tags[]->{label}
      }
    `)
    return NextResponse.json({ docs })
  } catch (err) {
    console.error('explore-content fetch error:', err)
    return NextResponse.json({ docs: [] })
  }
}
