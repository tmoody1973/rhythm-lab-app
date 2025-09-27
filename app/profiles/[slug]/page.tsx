import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RichTextRenderer } from "@/components/RichTextRenderer"
import { ExpandableReleaseCard } from "@/components/expandable-release-card"
import { sb } from "@/src/lib/storyblok"
import Link from "next/link"
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface ArtistProfilePageProps {
  params: Promise<{
    slug: string
  }>
}

// Helper function to generate consistent colors for profiles
function getProfileColor(id: number) {
  const colors = [
    "#8b5cf6", "#ec4899", "#b12e2e", "#f59e0b",
    "#10b981", "#ef4444", "#b12e2e", "#8b5a2b"
  ];
  return colors[id % colors.length];
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArtistProfilePageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const storyblokApi = sb();
    const response = await storyblokApi.get(`cdn/stories/profiles/${slug}`, {
      version: 'published'
    });

    const story = response.data.story;

    return {
      title: story.name + ' | Rhythm Lab Radio',
      description: story.content?.short_bio || story.content?.bio || story.content?.description || 'Discover this artist on Rhythm Lab Radio',
      openGraph: {
        title: story.name,
        description: story.content?.short_bio || story.content?.bio || story.content?.description,
        images: story.content?.artist_photo?.filename ? [story.content.artist_photo.filename] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Artist Profile | Rhythm Lab Radio',
      description: 'Discover amazing artists on Rhythm Lab Radio',
    };
  }
}

export default async function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  try {
    const { slug } = await params;
    // Try to fetch the specific story
    const storyblokApi = sb();
    let response;

    try {
      // First try with profiles/ prefix
      response = await storyblokApi.get(`cdn/stories/profiles/${slug}`, {
        version: 'published'
      });
    } catch (prefixError) {
      try {
        // If that fails, try without prefix
        response = await storyblokApi.get(`cdn/stories/${slug}`, {
          version: 'published'
        });
      } catch (error) {
        // If both fail, return 404
        notFound();
      }
    }

    const story = response.data.story;
    const content = story.content;
    const profileColor = getProfileColor(story.id);

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
              ← Back to Profiles
            </Link>
          </div>

          <article>
            {/* Artist Photo */}
            {content?.artist_photo?.filename && (
              <div className="aspect-video w-full overflow-hidden rounded-xl mb-8">
                <img
                  src={content.artist_photo.filename}
                  alt={content.artist_photo.alt || story.name}
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
                  {content?.category || 'ARTIST PROFILE'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(story.published_at || story.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                {story.name}
              </h1>

              {/* Short Bio/Intro */}
              {(content?.short_bio || content?.bio || content?.intro) && (
                <div className="relative">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-20" style={{ color: profileColor }} />
                  <div className="text-xl text-muted-foreground mb-8 leading-relaxed font-medium pl-8">
                    {content.short_bio || content.bio || content.intro}
                  </div>
                </div>
              )}

              {/* Genres/Tags */}
              {(content?.genre || content?.genres || content?.tags || story.tag_list) && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {(content.genre || content.genres || content.tags || story.tag_list || []).map((tag: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-sm px-3 py-1 rounded-full"
                      style={{ borderColor: profileColor, color: profileColor }}
                    >
                      {tag.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              )}
            </header>


            {/* Profile Content */}
            <div className="prose prose-lg max-w-none mb-12">
              {/* Full Biography Rich Text */}
              {content?.full_biography && (
                <RichTextRenderer content={content.full_biography} />
              )}

              {/* Fallback to other content fields */}
              {!content?.full_biography && content?.content && (
                <RichTextRenderer content={content.content} />
              )}

              {!content?.full_biography && !content?.content && content?.body && (
                <RichTextRenderer content={content.body} />
              )}
            </div>

            {/* Discography Section */}
            {(content?.discography || content?.releases) && (content?.discography?.length > 0 || content?.releases?.length > 0) && (() => {
              // EXPLANATION: Transform our release data into the format expected by ExpandableReleaseCard
              // This ensures our component gets the ID and URL needed to fetch detailed information
              const releases = (content.discography || content.releases)?.map((release: any, index: number) => {
                // Try to extract the ID and type from the discogs_url if it exists
                let releaseId = null
                let releaseType = 'release'

                if (release.discogs_url && typeof release.discogs_url === 'string') {
                  // Extract ID and type from the URL
                  const urlMatch = release.discogs_url.match(/discogs\.com\/(master|release)\/(\d+)/)
                  if (urlMatch) {
                    releaseType = urlMatch[1] // 'master' or 'release'
                    releaseId = urlMatch[2] // The numeric ID

                    console.log(`[Discogs URL Parse] ${release.title}: type=${releaseType}, id=${releaseId}, url=${release.discogs_url}`)
                  }
                }

                // Fallback to using the fields if URL parsing didn't work
                if (!releaseId) {
                  releaseId = release.discogs_release_id || release.discogs_master_id || release.discogs_id || release.id || index

                  // Determine type based on which field has the ID
                  if (release.discogs_master_id) {
                    releaseType = 'master'
                  }
                }

                // Use the original URL if we have it and it's valid, otherwise generate one
                const correctDiscogsUrl = release.discogs_url ||
                  (releaseId && releaseId !== index && releaseId > 0
                    ? `https://www.discogs.com/${releaseType}/${releaseId}`
                    : null)

                return {
                  id: releaseId,
                  releaseType: releaseType,
                  title: release.title || 'Unknown Title',
                  artist_name: release.artist_name || content.artist_name || story.name.replace('Artist Profile: ', ''),
                  cover_image_url: release.cover_image_url,
                  year: release.year,
                  label: release.label || release.labels?.[0]?.name,
                  catalog_no: release.catalog_no,
                  discogs_url: correctDiscogsUrl
                }
              }) || []

              return (
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: profileColor }}>
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">DISCOGRAPHY</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                  </div>

                  {/* EXPLANATION: Wrap our release rows with ExpandableReleaseCard
                      This makes each row clickable and enables the expandable functionality */}
                  <ExpandableReleaseCard releases={releases}>
                    {(content.discography || content.releases)?.map((release: any, index: number) => (
                      <div
                        key={release._uid || index}
                        className="group flex items-center gap-4 p-3 bg-card rounded-lg border border-border hover:border-foreground/20 transition-all duration-300 hover:shadow-md"
                      >
                        {/* Album Cover */}
                        <div className="flex-shrink-0 w-16 h-16 bg-muted relative overflow-hidden rounded-lg">
                          {release.cover_image_url ? (
                            <img
                              src={release.cover_image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAzMkMxMS4xNjMgMzIgNCAyNC44MzcgNCAyMEM0IDE1LjE2MyAxMS4xNjMgOCAyMCA4QzI4LjgzNyA4IDM2IDE1LjE2MyAzNiAyMEMzNiAyNC44MzcgMjguODM3IDMyIDIwIDMyWk0yMCAzMEMyNy43MzIgMzAgMzQgMjMuNzMyIDM0IDIwQzM0IDE2LjI2OCAyNy43MzIgMTAgMjAgMTBDMTIuMjY4IDEwIDYgMTYuMjY4IDYgMjBDNiAyMy43MzIgMTIuMjY4IDMwIDIwIDMwWk0yMCAyNkMxNi42ODYzIDI2IDE0IDIzLjMxMzcgMTQgMjBDMTQgMTYuNjg2MyAxNi42ODYzIDE0IDIwIDE0QzIzLjMxMzcgMTQgMjYgMTYuNjg2MyAyNiAyMEMyNiAyMy4zMTM3IDIzLjMxMzcgMjYgMjAgMjZaTTIwIDI0QzIyLjIwOTEgMjQgMjQgMjIuMjA5MSAyNCAyMEMyNCAyMC43OTA5IDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNy43OTA5IDE2IDIwQzE2IDIyLjIwOTEgMTcuNzkwOSAyNCAyMCAyNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg=='}
                              alt={release.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-muted-foreground/50" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Release Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-1">
                            {release.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {release.artist_name}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            {release.year && (
                              <span>{release.year}</span>
                            )}
{(release.label && release.label !== 'Unknown Label') ? (
                              <>
                                {release.year && <span>•</span>}
                                <span className="line-clamp-1">{release.label}</span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        {/* View Discogs Button - Now acts as visual indicator, clicking anywhere on row expands */}
                        <div className="flex-shrink-0">
                          <div className="px-4 py-2 rounded-full bg-white text-black hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg text-sm font-medium">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                            </svg>
                            View Details
                          </div>
                        </div>
                      </div>
                    ))}
                  </ExpandableReleaseCard>

                  {/* Show More/Less for large discographies */}
                  {(content.discography || content.releases)?.length > 12 && (
                    <div className="text-center mt-6">
                      <button className="text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-full px-6 py-2 hover:border-foreground/20">
                        View All {(content.discography || content.releases)?.length} Releases
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Sources/References Section */}
            {(content?.sources || content?.searchResults) && ((content?.sources && content.sources.length > 0) || (content?.searchResults && content.searchResults.length > 0)) && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: profileColor }}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">SOURCES & REFERENCES</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(content.sources || content.searchResults)?.map((source: any, index: number) => (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-4 border border-border rounded-lg hover:border-foreground/20 transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-foreground/10 transition-colors">
                          <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {source.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {source.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}
                          </p>
                          {source.date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(source.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Artist Details */}
            {(content?.origin_city || content?.origin_country || content?.website_url || content?.spotify_url || content?.youtube_url || content?.bandcamp_url || content?.discogs_url || content?.soundcloud_url) && (
              <div className="bg-muted/30 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Artist Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {(content.origin_city || content.origin_country) && (
                    <div>
                      <span className="font-medium text-foreground">Origin:</span>
                      <span className="ml-2 text-muted-foreground">
                        {[content.origin_city, content.origin_country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {content.website_url && (
                    <div>
                      <span className="font-medium text-foreground">Website:</span>
                      <a
                        href={content.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  {content.spotify_url && (
                    <div>
                      <span className="font-medium text-foreground">Spotify:</span>
                      <a
                        href={content.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        Listen on Spotify
                      </a>
                    </div>
                  )}
                  {content.youtube_url && (
                    <div>
                      <span className="font-medium text-foreground">YouTube:</span>
                      <a
                        href={content.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        Watch on YouTube
                      </a>
                    </div>
                  )}
                  {content.bandcamp_url && (
                    <div>
                      <span className="font-medium text-foreground">Bandcamp:</span>
                      <a
                        href={content.bandcamp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        Listen on Bandcamp
                      </a>
                    </div>
                  )}
                  {content.discogs_url && (
                    <div>
                      <span className="font-medium text-foreground">Discogs:</span>
                      <a
                        href={content.discogs_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        View Discography
                      </a>
                    </div>
                  )}
                  {content.soundcloud_url && (
                    <div>
                      <span className="font-medium text-foreground">SoundCloud:</span>
                      <a
                        href={content.soundcloud_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        Listen on SoundCloud
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Footer */}
            <footer className="border-t border-border pt-8">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span>Published on {new Date(story.published_at || story.created_at).toLocaleDateString()}</span>
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
    );

  } catch (error) {
    console.error('Error fetching story:', error);
    notFound();
  }
}