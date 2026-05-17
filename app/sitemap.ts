import { client } from '@/lib/sanity/client'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rhythmlabradio.com'

  // Static pages that should always be included
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shows`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }
  ]

  try {
    const [posts, deepDives, profiles] = await Promise.all([
      client.fetch<{ slug: string; _updatedAt: string }[]>(
        `*[_type == "post" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`
      ),
      client.fetch<{ slug: string; _updatedAt: string }[]>(
        `*[_type == "deepDive" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`
      ),
      client.fetch<{ slug: string; _updatedAt: string }[]>(
        `*[_type == "artistProfile" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`
      ),
    ])

    const postUrls: MetadataRoute.Sitemap = posts.map((doc) => ({
      url: `${baseUrl}/blog/${doc.slug}`,
      lastModified: new Date(doc._updatedAt || new Date()),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

    const deepDiveUrls: MetadataRoute.Sitemap = deepDives.map((doc) => ({
      url: `${baseUrl}/deep-dives/${doc.slug}`,
      lastModified: new Date(doc._updatedAt || new Date()),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

    const profileUrls: MetadataRoute.Sitemap = profiles.map((doc) => ({
      url: `${baseUrl}/artists/${doc.slug}`,
      lastModified: new Date(doc._updatedAt || new Date()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    return [...staticUrls, ...postUrls, ...deepDiveUrls, ...profileUrls]
  } catch (error) {
    console.error('Error generating sitemap from Sanity:', error)
    return staticUrls
  }
}
