import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/favorite-button"
import { sanityFetch } from '@/lib/sanity/live'
import { ALL_DEEP_DIVES_QUERY } from '@/lib/sanity/queries/deepDives'
import { urlForImage } from '@/lib/sanity/image'
import Link from "next/link"
import { Metadata } from 'next'

// Generate metadata for the deep dives page
export const metadata: Metadata = {
  title: 'Deep Dives | Rhythm Lab Radio',
  description: 'In-depth explorations of music, artists, and culture from Rhythm Lab Radio covering electronic music, jazz, and sound innovation.',
  openGraph: {
    title: 'Deep Dives | Rhythm Lab Radio',
    description: 'In-depth explorations of music, artists, and culture from Rhythm Lab Radio covering electronic music, jazz, and sound innovation.',
  },
}

// Helper function to generate consistent colors for deep dives based on index
function getPostColor(index: number) {
  const colors = [
    "#8b5cf6", "#ec4899", "#b12e2e", "#f59e0b",
    "#10b981", "#ef4444", "#b12e2e", "#8b5a2b"
  ]
  return colors[index % colors.length]
}

export default async function DeepDivesPage() {
  let deepDives: any[] = []
  let fetchError = false
  try {
    const { data } = await sanityFetch({ query: ALL_DEEP_DIVES_QUERY })
    deepDives = data ?? []
  } catch (err) {
    console.error('Failed to fetch deep dives from Sanity:', err)
    fetchError = true
  }
  const hasDeepDives = !fetchError && deepDives.length > 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            DEEP DIVES
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            In-depth explorations of music, artists, and culture from Rhythm Lab Radio
            covering electronic music, jazz, and sound innovation.
          </p>
        </div>

        {fetchError && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">Failed to load deep dives. Please try again later.</p>
          </div>
        )}

        {!hasDeepDives && !fetchError && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No deep dives available yet. Check back soon for in-depth explorations!
            </p>
          </div>
        )}

        {hasDeepDives && (
          <section>
            <h2 className="text-2xl font-bold nts-text-caps mb-6">All Deep Dives</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deepDives.map((dd, idx) => {
                const diveColor = getPostColor(idx)
                const coverImageUrl = dd.coverImage
                  ? urlForImage(dd.coverImage).width(600).height(400).url()
                  : null
                const favoriteImageUrl = dd.coverImage
                  ? urlForImage(dd.coverImage).width(300).url()
                  : undefined
                const readTime = dd.estimatedReadTime
                  ? `${dd.estimatedReadTime} min read`
                  : null

                return (
                  <Card
                    key={dd._id}
                    className="bg-card/80 backdrop-blur-sm hover:shadow-lg hover:bg-card/90 transition-all duration-200 cursor-pointer overflow-hidden border border-border/30 rounded-xl"
                  >
                    <Link href={`/deep-dives/${dd.slug}`}>
                      <div className="aspect-[16/9] relative overflow-hidden">
                        {coverImageUrl ? (
                          <img
                            src={coverImageUrl}
                            alt={dd.coverImage?.alt || dd.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white text-lg font-bold p-4 text-center"
                            style={{ backgroundColor: diveColor }}
                          >
                            {dd.title}
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge
                          className="text-white text-xs px-3 py-1 rounded-full font-medium"
                          style={{ backgroundColor: diveColor }}
                        >
                          {dd.difficultyLevel ? dd.difficultyLevel.toUpperCase() : 'DEEP DIVE'}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-medium">
                          {dd.publishedAt
                            ? new Date(dd.publishedAt).toLocaleDateString()
                            : ''}
                        </span>
                      </div>
                      <Link href={`/deep-dives/${dd.slug}`}>
                        <h3 className="text-foreground font-bold text-base mb-2 leading-tight hover:text-primary transition-colors">
                          {dd.title}
                        </h3>
                      </Link>
                      {dd.excerpt && (
                        <p className="text-muted-foreground text-sm mb-3 leading-relaxed line-clamp-3">
                          {dd.excerpt}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {dd.tags?.slice(0, 2).map((tag: { label: string; slug: string }) => (
                          <Badge
                            key={tag.slug}
                            variant="outline"
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ borderColor: diveColor, color: diveColor }}
                          >
                            {tag.label.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {readTime && <span className="text-xs">{readTime}</span>}
                          <FavoriteButton
                            content={{
                              id: dd._id,
                              title: dd.title,
                              type: 'deep_dive',
                              image: favoriteImageUrl,
                              description: dd.excerpt ?? undefined
                            }}
                            size="sm"
                          />
                        </div>
                        <Link href={`/deep-dives/${dd.slug}`}>
                          <Button
                            size="sm"
                            className="text-white text-xs px-3 py-1"
                            style={{ backgroundColor: diveColor }}
                          >
                            Read More
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
