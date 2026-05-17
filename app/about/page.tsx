import { Header } from "@/components/header"
import { sanityFetch } from '@/lib/sanity/live'
import { ABOUT_PAGE_QUERY } from '@/lib/sanity/queries/aboutPage'
import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Rhythm Lab Radio',
  description: 'Learn about Rhythm Lab Radio — Milwaukee\'s music discovery platform.',
}

export default async function AboutPage() {
  let about = null
  try {
    const { data } = await sanityFetch({ query: ABOUT_PAGE_QUERY })
    about = data
  } catch (err) {
    console.error('Failed to fetch about page from Sanity:', err)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {about?.title && (
          <h1 className="text-4xl md:text-6xl font-bold mb-8">{about.title}</h1>
        )}
        {!about?.title && (
          <h1 className="text-4xl md:text-6xl font-bold mb-8">About Rhythm Lab</h1>
        )}
        {about?.heroText && (
          <p className="text-xl text-muted-foreground mb-12 leading-relaxed">{about.heroText}</p>
        )}
        {about?.body && (
          <PortableTextRenderer value={about.body} className="prose prose-invert max-w-none" />
        )}
        {!about && (
          <p className="text-muted-foreground">About page content coming soon.</p>
        )}
      </main>
    </div>
  )
}
