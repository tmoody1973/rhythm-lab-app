import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rhythmlabradio.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Disallow search pages from being indexed (to avoid duplicate content issues)
        disallow: ['/search?*', '/api/*', '/_next/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}