import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/favorite-button"
import { sb } from "@/src/lib/storyblok"
import Link from "next/link"
import { Metadata } from 'next'
import { safeRenderText } from '@/lib/utils/rich-text'

// Generate metadata for the deep dives page
export const metadata: Metadata = {
  title: 'Deep Dives | Rhythm Lab Radio',
  description: 'In-depth explorations of music, artists, and culture from Rhythm Lab Radio covering electronic music, jazz, and sound innovation.',
  openGraph: {
    title: 'Deep Dives | Rhythm Lab Radio',
    description: 'In-depth explorations of music, artists, and culture from Rhythm Lab Radio covering electronic music, jazz, and sound innovation.',
  },
}

// Helper function to generate consistent colors for deep dives
function getPostColor(id: number) {
  const colors = [
    "#8b5cf6", "#ec4899", "#b12e2e", "#f59e0b",
    "#10b981", "#ef4444", "#b12e2e", "#8b5a2b"
  ];
  return colors[id % colors.length];
}

export default async function DeepDivesPage() {
  let deepDives: any[] = [];
  let error: string | null = null;

  try {
    // Fetch deep dives from Storyblok
    const storyblokApi = sb();

    // Try multiple approaches to find deep dive content
    let response;
    try {
      // First try with deep-dives/ folder
      response = await storyblokApi.get('cdn/stories', {
        version: 'published',
        per_page: 100,
        sort_by: 'first_published_at:desc',
        starts_with: 'deep-dives/'
      });

      if (response.data.stories.length === 0) {
        // Try finding all stories and filter for deep dive related ones
        const allResponse = await storyblokApi.get('cdn/stories', {
          version: 'published',
          per_page: 100,
          sort_by: 'first_published_at:desc'
        });

        // Filter for stories that might be deep dives
        response.data.stories = allResponse.data.stories.filter((story: any) =>
          story.name.toLowerCase().includes('deep') ||
          story.slug.includes('deep') ||
          story.content?.category?.toLowerCase().includes('deep') ||
          story.tag_list?.some((tag: string) => tag.toLowerCase().includes('deep'))
        );
      }
    } catch (folderError) {
      // If that fails, try getting all stories
      response = await storyblokApi.get('cdn/stories', {
        version: 'published',
        per_page: 100,
        sort_by: 'first_published_at:desc'
      });

      // Filter for potential deep dive content
      response.data.stories = response.data.stories.filter((story: any) =>
        story.name.toLowerCase().includes('deep') ||
        story.slug.includes('deep') ||
        story.content?.category?.toLowerCase().includes('deep') ||
        story.tag_list?.some((tag: string) => tag.toLowerCase().includes('deep'))
      );
    }

    deepDives = response.data.stories || [];
    console.log('Found deep dives:', deepDives.length, deepDives.map(d => ({ slug: d.slug, name: d.name, full_slug: d.full_slug })));
  } catch (err) {
    console.error('Error fetching deep dives:', err);
    error = 'Failed to load deep dives. Please try again later.';
  }

  // If we have no dynamic content, use fallback static data
  const hasDeepDives = deepDives.length > 0;

  // Fallback static data for when Storyblok is unavailable
  const fallbackDeepDives = [
    {
      id: 1,
      title: "MILES DAVIS: FROM BEBOP TO FUSION - A RHYTHM LAB PERSPECTIVE",
      description: "Exploring Miles Davis's revolutionary journey through jazz evolution",
      image: "/images/ALBUM-DEFAULT.png",
      date: "17.09.25",
      duration: "45m",
      plays: "1.9k",
      tags: ["JAZZ", "BEBOP", "FUSION"],
      color: "#f59e0b"
    },
    {
      id: 2,
      title: "THE EVOLUTION OF ELECTRONIC MUSIC: FROM KRAFTWERK TO AI",
      description: "A comprehensive look at how electronic music has shaped modern sound",
      image: "/images/ALBUM-DEFAULT.png",
      date: "14.09.25",
      duration: "52m",
      plays: "2.3k",
      tags: ["ELECTRONIC", "HISTORY", "TECHNOLOGY"],
      color: "#8b5cf6"
    },
    {
      id: 3,
      title: "AMBIENT SOUNDSCAPES: THE ART OF ATMOSPHERIC MUSIC",
      description: "Exploring the creation and impact of immersive ambient compositions",
      image: "/images/ALBUM-DEFAULT.png",
      date: "12.09.25",
      duration: "38m",
      plays: "1.7k",
      tags: ["AMBIENT", "ATMOSPHERIC", "EXPERIMENTAL"],
      color: "#10b981"
    },
    {
      id: 4,
      title: "DETROIT TECHNO: THE BIRTH OF A MOVEMENT",
      description: "How Detroit's underground scene revolutionized electronic dance music",
      image: "/images/ALBUM-DEFAULT.png",
      date: "10.09.25",
      duration: "41m",
      plays: "2.1k",
      tags: ["TECHNO", "DETROIT", "ELECTRONIC"],
      color: "#ec4899"
    },
    {
      id: 5,
      title: "JAZZ FUSION: WHERE GENRES COLLIDE",
      description: "The experimental blend of jazz with rock, funk, and electronic elements",
      image: "/images/ALBUM-DEFAULT.png",
      date: "08.09.25",
      duration: "47m",
      plays: "1.8k",
      tags: ["JAZZ", "FUSION", "EXPERIMENTAL"],
      color: "#f59e0b"
    },
    {
      id: 6,
      title: "THE PSYCHOLOGY OF MUSIC: HOW SOUND AFFECTS THE MIND",
      description: "Scientific exploration of music's impact on cognition and emotion",
      image: "/images/ALBUM-DEFAULT.png",
      date: "06.09.25",
      duration: "55m",
      plays: "2.7k",
      tags: ["PSYCHOLOGY", "SCIENCE", "NEUROSCIENCE"],
      color: "#b12e2e"
    }
  ]

  // Use dynamic content if available, otherwise fallback to static
  const featuredDives = hasDeepDives
    ? deepDives.filter(dive => dive.content?.featured === true)
    : fallbackDeepDives.slice(0, 2);
  const regularDives = hasDeepDives
    ? deepDives.filter(dive => dive.content?.featured !== true)
    : fallbackDeepDives.slice(2);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold nts-text-caps mb-2">Deep Dives</h1>
            <p className="text-muted-foreground">In-depth explorations of music, artists, and culture</p>
          </div>

          {error && (
            <div className="text-center py-12">
              <p className="text-red-500 text-lg">{error}</p>
            </div>
          )}

          {!error && !hasDeepDives && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No deep dives available yet. Check back soon for in-depth explorations!
              </p>
            </div>
          )}

          {/* Featured Deep Dives Section */}
          {featuredDives.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold nts-text-caps mb-6">Featured</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredDives.map((dive) => {
                const diveColor = hasDeepDives ? getPostColor(dive.id) : dive.color;
                return (
                <Card
                  key={dive.id}
                  className="bg-card/80 backdrop-blur-sm hover:shadow-lg hover:bg-card/90 transition-all duration-200 cursor-pointer overflow-hidden border border-border/30 rounded-xl"
                >
                  <Link href={hasDeepDives ? `/deep-dives/${dive.slug}` : '#'}>
                    <div className="aspect-[16/10] relative overflow-hidden">
                      {hasDeepDives ? (
                        dive.content?.featured_image?.filename ? (
                          <img
                            src={dive.content.featured_image.filename}
                            alt={dive.content.featured_image.alt || dive.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
                            style={{ backgroundColor: diveColor }}
                          >
                            {dive.content?.title || dive.content?.show_title || dive.name}
                          </div>
                        )
                      ) : (
                        <img
                          src={dive.image}
                          alt={dive.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        className="text-white text-sm px-4 py-2 rounded-full font-medium"
                        style={{ backgroundColor: diveColor }}
                      >
                        FEATURED
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">
                        {hasDeepDives
                          ? new Date(dive.published_at || dive.created_at).toLocaleDateString()
                          : dive.date
                        }
                      </span>
                    </div>
                    <Link href={hasDeepDives ? `/deep-dives/${dive.slug}` : '#'}>
                      <h3 className="text-foreground font-bold text-xl mb-3 leading-tight hover:text-primary transition-colors">
                        {hasDeepDives ? (dive.content?.title || dive.content?.show_title || dive.name) : dive.title}
                      </h3>
                    </Link>
                    <p className="text-muted-foreground text-base mb-4 leading-relaxed">
                      {hasDeepDives
                        ? (safeRenderText(dive.content?.intro) || safeRenderText(dive.content?.description) || 'Discover in-depth explorations of music, artists, and culture.')
                        : dive.description
                      }
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hasDeepDives ? (
                        (dive.content?.tags || []).slice(0, 3).map((tag: any, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-3 py-1 rounded-full font-medium"
                            style={{ borderColor: diveColor, color: diveColor }}
                          >
                            {safeRenderText(tag).toUpperCase()}
                          </Badge>
                        ))
                      ) : (
                        dive.tags.map((tag: string, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-3 py-1 rounded-full font-medium"
                            style={{ borderColor: diveColor, color: diveColor }}
                          >
                            {tag}
                          </Badge>
                        ))
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span>
                          {hasDeepDives
                            ? `${safeRenderText(dive.content?.duration) || '45m'} • ${safeRenderText(dive.content?.plays) || safeRenderText(dive.content?.play_count) || '1.2k'} plays`
                            : `${dive.duration} • ${dive.plays} plays`
                          }
                        </span>
                        {hasDeepDives && (
                          <FavoriteButton
                            content={{
                              id: dive.id,
                              title: dive.content?.title || dive.content?.show_title || dive.name,
                              type: 'deep_dive',
                              image: dive.content?.featured_image?.filename,
                              description: safeRenderText(dive.content?.intro) || safeRenderText(dive.content?.description)
                            }}
                            size="sm"
                          />
                        )}
                      </div>
                      <Link href={hasDeepDives ? `/deep-dives/${dive.slug}` : '#'}>
                        <Button
                          size="sm"
                          className="text-white text-sm px-6 py-2"
                          style={{ backgroundColor: diveColor }}
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

          {/* Regular Deep Dives Grid */}
          <div>
            <h2 className="text-2xl font-bold nts-text-caps mb-6">All Deep Dives</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularDives.map((dive) => {
                const diveColor = hasDeepDives ? getPostColor(dive.id) : dive.color;
                return (
                <Card
                  key={dive.id}
                  className="bg-card/80 backdrop-blur-sm hover:shadow-lg hover:bg-card/90 transition-all duration-200 cursor-pointer overflow-hidden border border-border/30 rounded-xl"
                >
                  <Link href={hasDeepDives ? `/deep-dives/${dive.slug}` : '#'}>
                    <div className="aspect-[16/9] relative overflow-hidden">
                      {hasDeepDives ? (
                        dive.content?.featured_image?.filename ? (
                          <img
                            src={dive.content.featured_image.filename}
                            alt={dive.content.featured_image.alt || dive.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white text-lg font-bold p-4 text-center"
                            style={{ backgroundColor: diveColor }}
                          >
                            {dive.content?.title || dive.content?.show_title || dive.name}
                          </div>
                        )
                      ) : (
                        <img
                          src={dive.image}
                          alt={dive.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        className="text-white text-xs px-3 py-1 rounded-full font-medium"
                        style={{ backgroundColor: diveColor }}
                      >
                        DEEP DIVE
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">
                        {hasDeepDives
                          ? new Date(dive.published_at || dive.created_at).toLocaleDateString()
                          : dive.date
                        }
                      </span>
                    </div>
                    <Link href={hasDeepDives ? `/deep-dives/${dive.slug}` : '#'}>
                      <h3 className="text-foreground font-bold text-base mb-2 leading-tight hover:text-primary transition-colors">
                        {hasDeepDives ? (dive.content?.title || dive.content?.show_title || dive.name) : dive.title}
                      </h3>
                    </Link>
                    {(hasDeepDives ? (safeRenderText(dive.content?.intro) || safeRenderText(dive.content?.description)) : dive.description) && (
                      <p className="text-muted-foreground text-sm mb-3 leading-relaxed line-clamp-3">
                        {hasDeepDives
                          ? (safeRenderText(dive.content?.intro) || safeRenderText(dive.content?.description))
                          : dive.description
                        }
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {hasDeepDives ? (
                        (dive.content?.tags || []).slice(0, 2).map((tag: any, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ borderColor: diveColor, color: diveColor }}
                          >
                            {safeRenderText(tag).toUpperCase()}
                          </Badge>
                        ))
                      ) : (
                        dive.tags.slice(0, 2).map((tag: string, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ borderColor: diveColor, color: diveColor }}
                          >
                            {tag}
                          </Badge>
                        ))
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="text-xs">
                        {hasDeepDives
                          ? `${safeRenderText(dive.content?.duration) || '45m'} • ${safeRenderText(dive.content?.plays) || safeRenderText(dive.content?.play_count) || '1.2k'} plays`
                          : `${dive.duration} • ${dive.plays} plays`
                        }
                      </span>
                      <Link href={hasDeepDives ? `/deep-dives/${dive.slug}` : '#'}>
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
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}