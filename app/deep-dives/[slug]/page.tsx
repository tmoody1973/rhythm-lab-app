import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PortableTextRenderer } from "@/components/portable-text-renderer"
import { sanityFetch } from '@/lib/sanity/live'
import { client } from '@/lib/sanity/client'
import { DEEP_DIVE_BY_SLUG_QUERY, ALL_DEEP_DIVE_SLUGS_QUERY } from '@/lib/sanity/queries/deepDives'
import { urlForImage } from '@/lib/sanity/image'
import Link from "next/link"
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface DeepDivePageProps {
  params: Promise<{
    slug: string
  }>
}

// Helper function to generate consistent colors for deep dives based on slug hash
function getPostColor(slug: string) {
  const colors = [
    "#8b5cf6", "#ec4899", "#b12e2e", "#f59e0b",
    "#10b981", "#ef4444", "#b12e2e", "#8b5a2b"
  ]
  const hash = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

// Pre-render known deep dive slugs at build time
// Use base client (not sanityFetch) — generateStaticParams runs outside a request
// context and draftMode() cannot be called there
export async function generateStaticParams() {
  const data = await client.fetch<Array<{ slug: string }>>(ALL_DEEP_DIVE_SLUGS_QUERY)
  return (data ?? []).map(({ slug }) => ({ slug }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DeepDivePageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const { data: deepDive } = await sanityFetch({ query: DEEP_DIVE_BY_SLUG_QUERY, params: { slug } })
    if (!deepDive) return { title: 'Deep Dive | Rhythm Lab Radio' }
    return {
      title: deepDive.seo?.seoTitle || `${deepDive.title} | Rhythm Lab Radio Deep Dives`,
      description: deepDive.seo?.metaDescription || deepDive.excerpt || 'In-depth exploration from Rhythm Lab Radio',
      openGraph: {
        title: deepDive.seo?.seoTitle || deepDive.title,
        description: deepDive.seo?.metaDescription || deepDive.excerpt || '',
        images: deepDive.coverImage
          ? [urlForImage(deepDive.coverImage).width(1200).height(630).url()]
          : [],
      },
    }
  } catch {
    return { title: 'Deep Dive | Rhythm Lab Radio' }
  }
}

export default async function DeepDivePage({ params }: DeepDivePageProps) {
  const { slug } = await params
  const { data: deepDive } = await sanityFetch({ query: DEEP_DIVE_BY_SLUG_QUERY, params: { slug } })
  if (!deepDive) return notFound()

  const postColor = getPostColor(slug)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back to Deep Dives */}
        <div className="mb-8">
          <Link
            href="/deep-dives"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Deep Dives
          </Link>
        </div>

        <article>
          {/* Featured Image */}
          {deepDive.coverImage && (
            <div className="aspect-video w-full overflow-hidden rounded-xl mb-8">
              <img
                src={urlForImage(deepDive.coverImage).width(1200).height(675).url()}
                alt={deepDive.coverImage.alt || deepDive.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              {deepDive.difficultyLevel ? (
                <Badge
                  className="text-white text-sm px-4 py-2 rounded-full font-medium"
                  style={{ backgroundColor: postColor }}
                >
                  {deepDive.difficultyLevel.toUpperCase()}
                </Badge>
              ) : (
                <Badge
                  className="text-white text-sm px-4 py-2 rounded-full font-medium"
                  style={{ backgroundColor: postColor }}
                >
                  DEEP DIVE
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {deepDive.publishedAt
                  ? new Date(deepDive.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : ''}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {deepDive.title}
            </h1>

            {/* Excerpt / Intro */}
            {deepDive.excerpt && (
              <div className="text-xl text-muted-foreground mb-8 leading-relaxed font-medium">
                {deepDive.excerpt}
              </div>
            )}

            {/* Tags */}
            {deepDive.tags && deepDive.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {deepDive.tags.map((tag: { label: string; slug: string }) => (
                  <Badge
                    key={tag.slug}
                    variant="outline"
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ borderColor: postColor, color: postColor }}
                  >
                    {tag.label.toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}

            {/* Related Artists */}
            {deepDive.relatedArtists && deepDive.relatedArtists.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Related Artists
                </h3>
                <div className="flex flex-wrap gap-2">
                  {deepDive.relatedArtists.map((artist: string) => (
                    <Badge
                      key={artist}
                      variant="secondary"
                      className="text-sm px-3 py-1 rounded-full"
                    >
                      {artist}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* Article Content */}
          <div className="mb-12">
            {deepDive.body && (
              <PortableTextRenderer value={deepDive.body} className="prose prose-invert max-w-none" />
            )}
          </div>

          {/* Article Footer */}
          <footer className="border-t border-border pt-8">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {deepDive.publishedAt && (
                  <span>
                    Published on {new Date(deepDive.publishedAt).toLocaleDateString()}
                  </span>
                )}
                {deepDive.estimatedReadTime && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{deepDive.estimatedReadTime} min read</span>
                  </>
                )}
              </div>

              <Link href="/deep-dives">
                <Button
                  className="text-white"
                  style={{ backgroundColor: postColor }}
                >
                  More Deep Dives
                </Button>
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </div>
  )
}
