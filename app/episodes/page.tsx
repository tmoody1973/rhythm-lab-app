import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/live'
import { ALL_EPISODES_QUERY } from '@/lib/sanity/queries/episodes'
import { urlForImage } from '@/lib/sanity/image'

export const metadata: Metadata = {
  title: 'Episodes | Rhythm Lab Radio',
  description: 'Browse every Rhythm Lab Radio episode — curated electronic music, jazz, hip-hop and more.',
  openGraph: {
    title: 'Episodes | Rhythm Lab Radio',
    description: 'Browse every Rhythm Lab Radio episode.',
  },
}

function getEpisodeColor(idx: number) {
  const colors = ["#8b5cf6", "#ec4899", "#b12e2e", "#f59e0b", "#10b981", "#ef4444", "#b12e2e", "#8b5a2b"]
  return colors[idx % colors.length]
}

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default async function EpisodesPage() {
  let episodes: any[] = []
  let fetchError = false

  try {
    const { data } = await sanityFetch({ query: ALL_EPISODES_QUERY })
    episodes = data ?? []
  } catch (err) {
    console.error('Failed to fetch episodes from Sanity:', err)
    fetchError = true
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">EPISODES</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Every show from Rhythm Lab Radio — curated selections across electronic music, jazz, hip-hop and beyond.
          </p>
        </div>

        {fetchError && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">Failed to load episodes. Please try again later.</p>
          </div>
        )}

        {!fetchError && episodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No episodes published yet. Check back soon!</p>
          </div>
        )}

        {!fetchError && episodes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes.map((episode, idx) => {
              const color = getEpisodeColor(idx)
              return (
                <Card key={episode._id} className="bg-card/80 hover:shadow-lg transition-all duration-200 overflow-hidden border border-border/30 rounded-xl">
                  <Link href={`/episodes/${episode.slug}`}>
                    <div className="aspect-video relative overflow-hidden">
                      {episode.featuredImage?.asset ? (
                        <img
                          src={urlForImage(episode.featuredImage).width(600).height(338).url()}
                          alt={episode.featuredImage.alt || episode.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: color }}>
                          <span className="text-white font-bold text-sm px-4 text-center line-clamp-3">{episode.title}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {episode.tags?.slice(0, 2).map((tag: { label: string; slug: string }) => (
                        <Badge key={tag.slug} variant="outline" className="text-xs">{tag.label}</Badge>
                      ))}
                    </div>
                    <Link href={`/episodes/${episode.slug}`}>
                      <h2 className="text-base font-semibold mb-1 line-clamp-2 hover:text-primary transition-colors">{episode.title}</h2>
                    </Link>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>{episode.date ? new Date(episode.date).toLocaleDateString() : ''}</span>
                      {episode.duration && <span>{formatDuration(episode.duration)}</span>}
                    </div>
                    <Link href={`/episodes/${episode.slug}`} className="mt-3 block">
                      <Button size="sm" variant="outline" className="w-full text-xs">Listen</Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
