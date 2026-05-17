import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/live'
import { client } from '@/lib/sanity/client'
import { EPISODE_BY_SLUG_QUERY, ALL_EPISODE_SLUGS_QUERY } from '@/lib/sanity/queries/episodes'
import { urlForImage } from '@/lib/sanity/image'
import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { MixcloudOEmbedPlayer } from '@/components/mixcloud-oembed-player'

interface EpisodePageProps {
  params: Promise<{ slug: string }>
}

// Use base client (not sanityFetch) — avoids draftMode() outside request scope
export async function generateStaticParams() {
  const data = await client.fetch<Array<{ slug: string }>>(ALL_EPISODE_SLUGS_QUERY)
  return (data ?? []).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: EpisodePageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const { data: episode } = await sanityFetch({ query: EPISODE_BY_SLUG_QUERY, params: { slug } })
    if (!episode) return { title: 'Episode | Rhythm Lab Radio' }

    const description = episode.customDescription ?? episode.aiDescription
    const descText = (description?.[0] as any)?.children?.[0]?.text?.slice(0, 160) ?? ''

    return {
      title: `${episode.title} | Rhythm Lab Radio`,
      description: descText,
      openGraph: {
        title: episode.title ?? '',
        description: descText,
        images: episode.featuredImage?.asset
          ? [urlForImage(episode.featuredImage).width(1200).height(630).url()]
          : [],
      },
    }
  } catch {
    return { title: 'Episode | Rhythm Lab Radio' }
  }
}

function formatStartTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { slug } = await params
  const { data: episode } = await sanityFetch({ query: EPISODE_BY_SLUG_QUERY, params: { slug } })
  if (!episode) return notFound()

  const mixcloudUrl = `https://www.mixcloud.com${episode.mixcloudKey}`
  const description = episode.customDescription ?? episode.aiDescription

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <div className="mb-8">
          <Link href="/episodes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← All Episodes
          </Link>
        </div>

        {/* Hero image */}
        {episode.featuredImage?.asset && (
          <div className="aspect-video w-full overflow-hidden rounded-xl mb-8">
            <img
              src={urlForImage(episode.featuredImage).width(1200).height(675).url()}
              alt={episode.featuredImage.alt || episode.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {episode.tags?.map((tag: { label: string; slug: string }) => (
              <Badge key={tag.slug} variant="outline">{tag.label}</Badge>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">{episode.title}</h1>
          <div className="flex gap-4 text-sm text-muted-foreground">
            {episode.date && (
              <span>{new Date(episode.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            )}
            {episode.duration && (
              <span>
                {Math.floor(episode.duration / 3600) > 0
                  ? `${Math.floor(episode.duration / 3600)}h ${Math.floor((episode.duration % 3600) / 60)}m`
                  : `${Math.floor(episode.duration / 60)}m`}
              </span>
            )}
          </div>
        </header>

        {/* Mixcloud Player */}
        <div className="mb-10">
          <MixcloudOEmbedPlayer
            mixcloudUrl={mixcloudUrl}
            showTitle={episode.title ?? ''}
            maxWidth={800}
            maxHeight={180}
          />
        </div>

        {/* Description */}
        {description && (
          <div className="mb-10">
            <PortableTextRenderer value={description} className="prose prose-invert max-w-none" />
          </div>
        )}

        {/* Tracklist */}
        {episode.tracklist && episode.tracklist.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4">Tracklist</h2>
            <div className="space-y-2">
              {episode.tracklist.map((track: { startTime: number; artistName: string; trackName: string }, idx: number) => (
                <div key={idx} className="flex items-start gap-3 py-2 border-b border-border/30">
                  <span className="text-xs text-muted-foreground font-mono w-12 flex-shrink-0 pt-0.5">
                    {formatStartTime(track.startTime)}
                  </span>
                  <span className="text-sm">
                    <span className="font-medium">{track.artistName}</span>
                    {track.trackName && (
                      <> <span className="text-muted-foreground">—</span> {track.trackName}</>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Content */}
        {episode.relatedContent && episode.relatedContent.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4">Related</h2>
            <ul className="space-y-2">
              {episode.relatedContent.map((item: { _type: string; title: string; slug: string }) => {
                const href = item._type === 'post' ? `/blog/${item.slug}`
                  : item._type === 'deepDive' ? `/deep-dives/${item.slug}`
                  : `/profiles/${item.slug}`
                return (
                  <li key={item.slug}>
                    <Link href={href} className="text-purple-400 hover:text-purple-300 underline text-sm">
                      {item.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-8">
          <Link href="/episodes">
            <Button variant="outline">← Back to All Episodes</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
