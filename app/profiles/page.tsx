import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { sanityFetch } from '@/lib/sanity/live'
import { ALL_ARTIST_PROFILES_QUERY } from '@/lib/sanity/queries/artistProfiles'
import { urlForImage } from '@/lib/sanity/image'
import Link from "next/link"
import { Metadata } from 'next'

// Generate metadata for the profiles page
export const metadata: Metadata = {
  title: 'Artist Profiles | Rhythm Lab Radio',
  description: "Deep conversations with music's most innovative creators covering electronic music, jazz, and experimental sounds.",
  openGraph: {
    title: 'Artist Profiles | Rhythm Lab Radio',
    description: "Deep conversations with music's most innovative creators covering electronic music, jazz, and experimental sounds.",
  },
}

// Helper function to generate consistent colors for profiles based on slug hash
function getProfileColor(slug: string) {
  const colors = [
    "#10b981", "#b12e2e", "#8b5cf6", "#ec4899",
    "#f59e0b", "#ef4444", "#b12e2e", "#8b5a2b"
  ]
  const hash = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export default async function ProfilesPage() {
  let profiles: any[] = []
  let fetchError = false

  try {
    const { data } = await sanityFetch({ query: ALL_ARTIST_PROFILES_QUERY })
    profiles = data ?? []
  } catch (err) {
    console.error('Failed to fetch artist profiles from Sanity:', err)
    fetchError = true
  }

  const hasProfiles = !fetchError && profiles.length > 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold nts-text-caps mb-2">Artist Profiles</h1>
            <p className="text-muted-foreground">Deep conversations with music's most innovative creators</p>
          </div>

          {fetchError && (
            <div className="text-center py-12">
              <p className="text-red-500 text-lg">Failed to load artist profiles. Please try again later.</p>
            </div>
          )}

          {!fetchError && !hasProfiles && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No artist profiles available yet. Check back soon for in-depth conversations!
              </p>
            </div>
          )}

          {hasProfiles && (
            <div>
              <h2 className="text-2xl font-bold nts-text-caps mb-6">All Profiles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((profile) => {
                  const profileColor = getProfileColor(profile.slug)
                  const imageUrl = profile.featuredImage
                    ? urlForImage(profile.featuredImage).width(600).height(400).url()
                    : null

                  return (
                    <Card
                      key={profile._id}
                      className="bg-card/80 backdrop-blur-sm hover:shadow-lg hover:bg-card/90 transition-all duration-200 cursor-pointer overflow-hidden border border-border/30 rounded-xl"
                    >
                      <Link href={`/profiles/${profile.slug}`}>
                        <div className="aspect-[16/9] relative overflow-hidden">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={profile.featuredImage?.alt || profile.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-white text-lg font-bold p-4 text-center"
                              style={{ backgroundColor: profileColor }}
                            >
                              {profile.title}
                            </div>
                          )}
                        </div>
                      </Link>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge
                            className="text-white text-xs px-3 py-1 rounded-full font-medium"
                            style={{ backgroundColor: profileColor }}
                          >
                            PROFILE
                          </Badge>
                          {profile.genre && (
                            <span className="text-xs text-muted-foreground nts-text-caps">
                              {profile.genre}
                            </span>
                          )}
                        </div>
                        <Link href={`/profiles/${profile.slug}`}>
                          <h3 className="text-foreground font-bold text-base mb-2 leading-tight hover:text-primary transition-colors">
                            {profile.title}
                          </h3>
                        </Link>
                        {profile.subtitle && (
                          <p className="text-muted-foreground text-sm mb-3 leading-relaxed line-clamp-3">
                            {profile.subtitle}
                          </p>
                        )}
                        {profile.tags && profile.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {profile.tags.slice(0, 2).map((tag: { label: string; slug: string }) => (
                              <Badge
                                key={tag.slug}
                                variant="outline"
                                className="text-xs px-2 py-1 rounded-full font-medium"
                                style={{ borderColor: profileColor, color: profileColor }}
                              >
                                {tag.label.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-end text-sm text-muted-foreground">
                          <Link href={`/profiles/${profile.slug}`}>
                            <Button
                              size="sm"
                              className="text-white text-xs px-3 py-1"
                              style={{ backgroundColor: profileColor }}
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
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
