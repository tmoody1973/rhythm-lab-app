import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RichTextRenderer } from "@/components/RichTextRenderer"
import { sb } from "@/src/lib/storyblok"
import Link from "next/link"
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface DeepDivePageProps {
  params: Promise<{
    slug: string
  }>
}

function getPostColor(id: number) {
  const colors = [
    "#8b5cf6", "#ec4899", "#00d4ff", "#f59e0b",
    "#10b981", "#ef4444", "#3b82f6", "#8b5a2b"
  ];
  return colors[id % colors.length];
}

export async function generateMetadata({ params }: DeepDivePageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const storyblokApi = sb();
    let response;

    try {
      response = await storyblokApi.get(`cdn/stories/deep-dive/${slug}`, {
        version: 'published'
      });
    } catch (prefixError) {
      try {
        response = await storyblokApi.get(`cdn/stories/deep-dives/${slug}`, {
          version: 'published'
        });
      } catch (secondError) {
        response = await storyblokApi.get(`cdn/stories/${slug}`, {
          version: 'published'
        });
      }
    }

    const story = response.data.story;

    return {
      title: story.name + ' | Rhythm Lab Radio Deep Dives',
      description: story.content?.intro || story.content?.description || 'In-depth exploration from Rhythm Lab Radio',
      openGraph: {
        title: story.name,
        description: story.content?.intro || story.content?.description,
        images: story.content?.featured_image?.filename ? [story.content.featured_image.filename] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Deep Dive | Rhythm Lab Radio',
      description: 'In-depth exploration from Rhythm Lab Radio',
    };
  }
}

export default async function DeepDivePage({ params }: DeepDivePageProps) {
  try {
    const { slug } = await params;
    const storyblokApi = sb();
    let response;

    try {
      // Try deep-dive/ path first (singular)
      response = await storyblokApi.get(`cdn/stories/deep-dive/${slug}`, {
        version: 'published'
      });
    } catch (prefixError) {
      try {
        // Fallback to deep-dives/ path (plural)
        response = await storyblokApi.get(`cdn/stories/deep-dives/${slug}`, {
          version: 'published'
        });
      } catch (secondError) {
        try {
          // Final fallback to direct path
          response = await storyblokApi.get(`cdn/stories/${slug}`, {
            version: 'published'
          });
        } catch (error) {
          notFound();
        }
      }
    }

    const story = response.data.story;
    const content = story.content;
    const postColor = getPostColor(story.id);

    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Link
              href="/deep-dives"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Deep Dives
            </Link>
          </div>

          <article>
            {content?.featured_image?.filename && (
              <div className="aspect-video w-full overflow-hidden rounded-xl mb-8">
                <img
                  src={content.featured_image.filename}
                  alt={content.featured_image.alt || story.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <header className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Badge
                  className="text-white text-sm px-4 py-2 rounded-full font-medium"
                  style={{ backgroundColor: postColor }}
                >
                  {content?.category || 'DEEP DIVE'}
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

              {content?.intro && (
                <div className="text-xl text-muted-foreground mb-8 leading-relaxed font-medium">
                  {content.intro}
                </div>
              )}

              {content?.duration && (
                <div className="bg-muted/20 border border-border rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        size="lg"
                        className="text-white text-lg px-8 py-4 rounded-full"
                        style={{ backgroundColor: postColor }}
                      >
                        ▶ Play Deep Dive
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        <div className="font-medium">{content.duration}</div>
                        <div>{content.plays || content.play_count || '1.2k'} plays</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(content?.tags || story.tag_list) && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {(content.tags || story.tag_list || []).map((tag: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-sm px-3 py-1 rounded-full"
                      style={{ borderColor: postColor, color: postColor }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </header>

            <div className="prose prose-lg max-w-none mb-12">
              {content?.content && (
                <RichTextRenderer content={content.content} />
              )}

              {content?.body && (
                <RichTextRenderer content={content.body} />
              )}

              {content && !content.content && !content.body && (
                <div className="text-foreground leading-relaxed">
                  {typeof content === 'string' ? content : (
                    <pre className="whitespace-pre-wrap font-sans">
                      {JSON.stringify(content, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <footer className="border-t border-border pt-8">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span>Published on {new Date(story.published_at || story.created_at).toLocaleDateString()}</span>
                  {content?.read_time && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{content.read_time}</span>
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
    );

  } catch (error) {
    console.error('Error fetching deep dive:', error);
    notFound();
  }
}