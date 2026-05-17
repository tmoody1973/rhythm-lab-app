import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PortableTextRenderer } from "@/components/portable-text-renderer"
import { sanityFetch } from '@/lib/sanity/live'
import { client } from '@/lib/sanity/client'
import { ARTIST_PROFILE_BY_SLUG_QUERY, ALL_ARTIST_PROFILE_SLUGS_QUERY } from '@/lib/sanity/queries/artistProfiles'
import { urlForImage } from '@/lib/sanity/image'
import Link from "next/link"
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface ArtistProfilePageProps {
  params: Promise<{
    slug: string
  }>
}

// Helper function to generate consistent colors for profiles based on slug hash
function getProfileColor(slug: string) {
  const colors = [
    "#8b5cf6", "#ec4899", "#b12e2e", "#f59e0b",
    "#10b981", "#ef4444", "#b12e2e", "#8b5a2b"
  ]
  const hash = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

// Pre-render known artist profile slugs at build time
// Use base client (not sanityFetch) — generateStaticParams runs outside a request context
export async function generateStaticParams() {
  const data = await client.fetch<Array<{ slug: string }>>(ALL_ARTIST_PROFILE_SLUGS_QUERY)
  return (data ?? []).map(({ slug }) => ({ slug }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArtistProfilePageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const { data: profile } = await sanityFetch({ query: ARTIST_PROFILE_BY_SLUG_QUERY, params: { slug } })
    if (!profile) return { title: 'Artist Profile | Rhythm Lab Radio' }
    return {
      title: profile.seo?.seoTitle || `${profile.title} | Rhythm Lab Radio`,
      description: profile.seo?.metaDescription || profile.subtitle || 'Discover this artist on Rhythm Lab Radio',
      openGraph: {
        title: profile.seo?.seoTitle || profile.title,
        description: profile.seo?.metaDescription || profile.subtitle || '',
        images: profile.featuredImage
          ? [urlForImage(profile.featuredImage).width(1200).height(630).url()]
          : [],
      },
    }
  } catch {
    return { title: 'Artist Profile | Rhythm Lab Radio' }
  }
}

export default async function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { slug } = await params
  const { data: profile } = await sanityFetch({ query: ARTIST_PROFILE_BY_SLUG_QUERY, params: { slug } })
  if (!profile) return notFound()

  const profileColor = getProfileColor(slug)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back to Profiles */}
        <div className="mb-8">
          <Link
            href="/profiles"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Profiles
          </Link>
        </div>

        <article>
          {/* Featured Image */}
          {profile.featuredImage && (
            <div className="aspect-video w-full overflow-hidden rounded-xl mb-8">
              <img
                src={urlForImage(profile.featuredImage).width(1200).height(675).url()}
                alt={profile.featuredImage.alt || profile.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Profile Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Badge
                className="text-white text-sm px-4 py-2 rounded-full font-medium"
                style={{ backgroundColor: profileColor }}
              >
                {profile.genre?.toUpperCase() || 'ARTIST PROFILE'}
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {profile.title}
            </h1>

            {/* Subtitle / Tagline */}
            {profile.subtitle && (
              <div className="text-xl text-muted-foreground mb-8 leading-relaxed font-medium">
                {profile.subtitle}
              </div>
            )}

            {/* Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {profile.tags.map((tag: { label: string; slug: string }) => (
                  <Badge
                    key={tag.slug}
                    variant="outline"
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ borderColor: profileColor, color: profileColor }}
                  >
                    {tag.label.toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}

            {/* Website link */}
            {profile.website && (
              <div className="mb-8">
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Visit Website
                </a>
              </div>
            )}
          </header>

          {/* Profile Content */}
          <div className="mb-12">
            {profile.body && (
              <PortableTextRenderer value={profile.body} className="prose prose-invert max-w-none" />
            )}
          </div>

          {/* Profile Footer */}
          <footer className="border-t border-border pt-8">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Artist Profile
              </div>
              <Link href="/profiles">
                <Button
                  className="text-white"
                  style={{ backgroundColor: profileColor }}
                >
                  Discover More Artists
                </Button>
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </div>
  )
}
