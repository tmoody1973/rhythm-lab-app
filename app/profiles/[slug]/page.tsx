import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RichTextRenderer } from "@/components/RichTextRenderer"
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
                <div className="text-xl text-muted-foreground mb-8 leading-relaxed font-medium">
                  {content.short_bio || content.bio || content.intro}
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