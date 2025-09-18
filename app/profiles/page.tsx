import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/favorite-button"
import { sb } from "@/src/lib/storyblok"
import Link from "next/link"
import { Metadata } from 'next'

// Generate metadata for the profiles page
export const metadata: Metadata = {
  title: 'Artist Profiles | Rhythm Lab Radio',
  description: 'Deep conversations with music\'s most innovative creators covering electronic music, jazz, and experimental sounds.',
  openGraph: {
    title: 'Artist Profiles | Rhythm Lab Radio',
    description: 'Deep conversations with music\'s most innovative creators covering electronic music, jazz, and experimental sounds.',
  },
}

// Helper function to generate consistent colors for profiles
function getProfileColor(id: number) {
  const colors = [
    "#10b981", "#00d4ff", "#8b5cf6", "#ec4899",
    "#f59e0b", "#ef4444", "#3b82f6", "#8b5a2b"
  ];
  return colors[id % colors.length];
}

export default async function ProfilesPage() {
  let profiles: any[] = [];
  let error: string | null = null;

  try {
    // Fetch artist profiles from Storyblok
    const storyblokApi = sb();

    // Try multiple approaches to find artist profile content
    let response;
    try {
      // First try with artist-profiles/ folder
      response = await storyblokApi.get('cdn/stories', {
        version: 'published',
        per_page: 100,
        sort_by: 'first_published_at:desc',
        starts_with: 'artist-profiles/'
      });

      if (response.data.stories.length === 0) {
        // Try finding all stories and filter for profile related ones
        const allResponse = await storyblokApi.get('cdn/stories', {
          version: 'published',
          per_page: 100,
          sort_by: 'first_published_at:desc'
        });

        // Filter for stories that might be artist profiles
        response.data.stories = allResponse.data.stories.filter((story: any) =>
          story.name.toLowerCase().includes('profile') ||
          story.slug.includes('profile') ||
          story.content?.category?.toLowerCase().includes('profile') ||
          story.tag_list?.some((tag: string) => tag.toLowerCase().includes('profile'))
        );
      }
    } catch (folderError) {
      // If that fails, try getting all stories
      response = await storyblokApi.get('cdn/stories', {
        version: 'published',
        per_page: 100,
        sort_by: 'first_published_at:desc'
      });

      // Filter for potential artist profile content
      response.data.stories = response.data.stories.filter((story: any) =>
        story.name.toLowerCase().includes('profile') ||
        story.slug.includes('profile') ||
        story.content?.category?.toLowerCase().includes('profile') ||
        story.tag_list?.some((tag: string) => tag.toLowerCase().includes('profile'))
      );
    }

    profiles = response.data.stories || [];
    console.log('Found artist profiles:', profiles.length, profiles.map(p => ({ slug: p.slug, name: p.name, full_slug: p.full_slug })));
  } catch (err) {
    console.error('Error fetching artist profiles:', err);
    error = 'Failed to load artist profiles. Please try again later.';
  }

  // If we have no dynamic content, use fallback static data
  const hasProfiles = profiles.length > 0;

  // Fallback static data for when Storyblok is unavailable
  const fallbackProfiles = [
    {
      id: 1,
      title: "FLOATING POINTS: NEUROSCIENCE MEETS ELECTRONIC MUSIC",
      description: "How Sam Shepherd bridges scientific research and musical innovation",
      image: "/images/ALBUM-DEFAULT.png",
      date: "16.09.25",
      duration: "35m",
      plays: "1.5k",
      tags: ["ELECTRONIC", "AMBIENT", "JAZZ"],
      color: "#10b981",
      artist: "Floating Points"
    },
    {
      id: 2,
      title: "KERRI CHANDLER: THE SOUL OF DEEP HOUSE",
      description: "Exploring the legendary producer's influence on house music culture",
      image: "/images/ALBUM-DEFAULT.png",
      date: "14.09.25",
      duration: "42m",
      plays: "2.1k",
      tags: ["HOUSE", "DEEP HOUSE", "SOUL"],
      color: "#00d4ff",
      artist: "Kerri Chandler"
    },
    {
      id: 3,
      title: "APHEX TWIN: THE ENIGMA OF ELECTRONIC EXPERIMENTATION",
      description: "Decoding Richard D. James's impact on experimental electronic music",
      image: "/images/ALBUM-DEFAULT.png",
      date: "12.09.25",
      duration: "48m",
      plays: "2.8k",
      tags: ["ELECTRONIC", "EXPERIMENTAL", "IDM"],
      color: "#8b5cf6",
      artist: "Aphex Twin"
    },
    {
      id: 4,
      title: "NINA KRAVIZ: FROM DENTIST TO TECHNO ICON",
      description: "The journey of Russia's most influential techno ambassador",
      image: "/images/ALBUM-DEFAULT.png",
      date: "10.09.25",
      duration: "39m",
      plays: "1.9k",
      tags: ["TECHNO", "ELECTRONIC", "UNDERGROUND"],
      color: "#ec4899",
      artist: "Nina Kraviz"
    },
    {
      id: 5,
      title: "ROBERT GLASPER: REDEFINING MODERN JAZZ",
      description: "How the pianist revolutionized jazz with hip-hop and R&B influences",
      image: "/images/ALBUM-DEFAULT.png",
      date: "08.09.25",
      duration: "44m",
      plays: "1.7k",
      tags: ["JAZZ", "HIP HOP", "R&B"],
      color: "#f59e0b",
      artist: "Robert Glasper"
    },
    {
      id: 6,
      title: "JAMIE XX: THE EVOLUTION OF UK ELECTRONIC",
      description: "From The xx to solo success: a journey through UK's electronic landscape",
      image: "/images/ALBUM-DEFAULT.png",
      date: "06.09.25",
      duration: "41m",
      plays: "2.3k",
      tags: ["ELECTRONIC", "UK", "INDIE"],
      color: "#10b981",
      artist: "Jamie xx"
    },
    {
      id: 7,
      title: "KAMASI WASHINGTON: THE MODERN JAZZ RENAISSANCE",
      description: "Leading the new wave of spiritual jazz and cosmic consciousness",
      image: "/images/ALBUM-DEFAULT.png",
      date: "04.09.25",
      duration: "52m",
      plays: "2.0k",
      tags: ["JAZZ", "SPIRITUAL", "FUSION"],
      color: "#f59e0b",
      artist: "Kamasi Washington"
    },
    {
      id: 8,
      title: "BURIAL: GHOST IN THE UK GARAGE MACHINE",
      description: "The mysterious producer who redefined underground electronic music",
      image: "/images/ALBUM-DEFAULT.png",
      date: "02.09.25",
      duration: "46m",
      plays: "2.5k",
      tags: ["UK GARAGE", "DUBSTEP", "AMBIENT"],
      color: "#8b5cf6",
      artist: "Burial"
    }
  ]

  // Use dynamic content if available, otherwise fallback to static
  const featuredProfiles = hasProfiles
    ? profiles.filter(profile => profile.content?.featured === true)
    : fallbackProfiles.slice(0, 2);
  const regularProfiles = hasProfiles
    ? profiles.filter(profile => profile.content?.featured !== true)
    : fallbackProfiles.slice(2);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold nts-text-caps mb-2">Artist Profiles</h1>
            <p className="text-muted-foreground">Deep conversations with music's most innovative creators</p>
          </div>

          {error && (
            <div className="text-center py-12">
              <p className="text-red-500 text-lg">{error}</p>
            </div>
          )}

          {!error && !hasProfiles && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No artist profiles available yet. Check back soon for in-depth conversations!
              </p>
            </div>
          )}

          {/* Featured Profiles Section */}
          {featuredProfiles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold nts-text-caps mb-6">Featured</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredProfiles.map((profile) => {
                const profileColor = hasProfiles ? getProfileColor(profile.id) : profile.color;
                return (
                <Card
                  key={profile.id}
                  className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl"
                >
                  <Link href={hasProfiles ? `/profiles/${profile.slug}` : '#'}>
                    <div className="aspect-[16/10] relative overflow-hidden">
                      {hasProfiles ? (
                        profile.content?.artist_photo?.filename ? (
                          <img
                            src={profile.content.artist_photo.filename}
                            alt={profile.content.artist_photo.alt || profile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
                            style={{ backgroundColor: profileColor }}
                          >
                            {profile.name}
                          </div>
                        )
                      ) : (
                        <img
                          src={profile.image}
                          alt={profile.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        className="text-white text-sm px-4 py-2 rounded-full font-medium"
                        style={{ backgroundColor: profileColor }}
                      >
                        FEATURED
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">
                        {hasProfiles
                          ? new Date(profile.published_at || profile.created_at).toLocaleDateString()
                          : profile.date
                        }
                      </span>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm text-muted-foreground nts-text-caps">
                        {hasProfiles ? (profile.content?.artist || profile.name) : profile.artist}
                      </span>
                    </div>
                    <Link href={hasProfiles ? `/profiles/${profile.slug}` : '#'}>
                      <h3 className="text-foreground font-bold text-xl mb-3 leading-tight hover:text-primary transition-colors">
                        {hasProfiles ? profile.name : profile.title}
                      </h3>
                    </Link>
                    <p className="text-muted-foreground text-base mb-4 leading-relaxed">
                      {hasProfiles
                        ? (profile.content?.intro || profile.content?.description || 'Discover in-depth conversations with music\'s most innovative creators.')
                        : profile.description
                      }
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hasProfiles ? (
                        (profile.content?.tags || []).slice(0, 3).map((tag: string, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-3 py-1 rounded-full font-medium"
                            style={{ borderColor: profileColor, color: profileColor }}
                          >
                            {String(tag).toUpperCase()}
                          </Badge>
                        ))
                      ) : (
                        profile.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-3 py-1 rounded-full font-medium"
                            style={{ borderColor: profileColor, color: profileColor }}
                          >
                            {tag}
                          </Badge>
                        ))
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span>
                          {hasProfiles
                            ? `${profile.content?.duration || '45m'} • ${profile.content?.plays || profile.content?.play_count || '1.2k'} plays`
                            : `${profile.duration} • ${profile.plays} plays`
                          }
                        </span>
                        {hasProfiles && (
                          <FavoriteButton
                            content={{
                              id: profile.id,
                              title: profile.name,
                              type: 'artist_profile',
                              image: profile.content?.artist_photo?.filename,
                              description: profile.content?.intro || profile.content?.description
                            }}
                            size="sm"
                          />
                        )}
                      </div>
                      <Link href={hasProfiles ? `/profiles/${profile.slug}` : '#'}>
                        <Button
                          size="sm"
                          className="text-white text-sm px-6 py-2"
                          style={{ backgroundColor: profileColor }}
                        >
                          Read More
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </div>
          )}

          {/* Regular Profiles Grid */}
          <div>
            <h2 className="text-2xl font-bold nts-text-caps mb-6">All Profiles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regularProfiles.map((profile) => {
                const profileColor = hasProfiles ? getProfileColor(profile.id) : profile.color;
                return (
                <Card
                  key={profile.id}
                  className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl"
                >
                  <Link href={hasProfiles ? `/profiles/${profile.slug}` : '#'}>
                    <div className="aspect-[16/9] relative overflow-hidden">
                      {hasProfiles ? (
                        profile.content?.artist_photo?.filename ? (
                          <img
                            src={profile.content.artist_photo.filename}
                            alt={profile.content.artist_photo.alt || profile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white text-lg font-bold p-4 text-center"
                            style={{ backgroundColor: profileColor }}
                          >
                            {profile.name}
                          </div>
                        )
                      ) : (
                        <img
                          src={profile.image}
                          alt={profile.title}
                          className="w-full h-full object-cover"
                        />
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
                      <span className="text-sm text-muted-foreground font-medium">
                        {hasProfiles
                          ? new Date(profile.published_at || profile.created_at).toLocaleDateString()
                          : profile.date
                        }
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground nts-text-caps">
                        {hasProfiles ? (profile.content?.artist || profile.name) : profile.artist}
                      </span>
                    </div>
                    <Link href={hasProfiles ? `/profiles/${profile.slug}` : '#'}>
                      <h3 className="text-foreground font-bold text-base mb-2 leading-tight hover:text-primary transition-colors">
                        {hasProfiles ? profile.name : profile.title}
                      </h3>
                    </Link>
                    {(hasProfiles ? (profile.content?.intro || profile.content?.description) : profile.description) && (
                      <p className="text-muted-foreground text-sm mb-3 leading-relaxed line-clamp-3">
                        {hasProfiles
                          ? (profile.content?.intro || profile.content?.description)
                          : profile.description
                        }
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {hasProfiles ? (
                        (profile.content?.tags || []).slice(0, 2).map((tag: string, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ borderColor: profileColor, color: profileColor }}
                          >
                            {String(tag).toUpperCase()}
                          </Badge>
                        ))
                      ) : (
                        profile.tags.slice(0, 2).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ borderColor: profileColor, color: profileColor }}
                          >
                            {tag}
                          </Badge>
                        ))
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="text-xs">
                        {hasProfiles
                          ? `${profile.content?.duration || '45m'} • ${profile.content?.plays || profile.content?.play_count || '1.2k'} plays`
                          : `${profile.duration} • ${profile.plays} plays`
                        }
                      </span>
                      <Link href={hasProfiles ? `/profiles/${profile.slug}` : '#'}>
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
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}