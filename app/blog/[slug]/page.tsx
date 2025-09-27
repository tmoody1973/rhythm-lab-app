import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EnhancedContentRenderer } from "@/components/enhanced-content-renderer"
import { sb, getStoryblokOptions } from "@/src/lib/storyblok"
import Link from "next/link"
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { safeRenderText } from '@/lib/utils/rich-text'

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

// Helper function to generate consistent colors for posts
function getPostColor(id: number) {
  const colors = [
    "#8b5cf6", "#ec4899", "#b12e2e", "#f59e0b",
    "#10b981", "#ef4444", "#b12e2e", "#8b5a2b"
  ];
  return colors[id % colors.length];
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const storyblokApi = sb();
    const response = await storyblokApi.get(`cdn/stories/blog/${slug}`, getStoryblokOptions());

    const story = response.data.story;

    return {
      title: story.name + ' | Rhythm Lab Radio Blog',
      description: safeRenderText(story.content?.intro) || safeRenderText(story.content?.description) || 'Read the latest from Rhythm Lab Radio',
      openGraph: {
        title: story.name,
        description: safeRenderText(story.content?.intro) || safeRenderText(story.content?.description),
        images: story.content?.featured_image?.filename ? [story.content.featured_image.filename] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Blog Post | Rhythm Lab Radio',
      description: 'Read the latest from Rhythm Lab Radio',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const { slug } = await params;
    // Try to fetch the specific story
    const storyblokApi = sb();
    let response;

    try {
      // First try with blog/ prefix
      response = await storyblokApi.get(`cdn/stories/blog/${slug}`, getStoryblokOptions());
    } catch (prefixError) {
      try {
        // If that fails, try without prefix
        response = await storyblokApi.get(`cdn/stories/${slug}`, getStoryblokOptions());
      } catch (error) {
        // If both fail, return 404
        notFound();
      }
    }

    const story = response.data.story;
    const content = story.content;
    const postColor = getPostColor(story.id);

    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back to Blog */}
          <div className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Blog
            </Link>
          </div>

          <article>
            {/* Featured Image */}
            {content?.featured_image?.filename && (
              <div className="aspect-video w-full overflow-hidden rounded-xl mb-8">
                <img
                  src={content.featured_image.filename}
                  alt={content.featured_image.alt || story.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Badge
                  className="text-white text-sm px-4 py-2 rounded-full font-medium"
                  style={{ backgroundColor: postColor }}
                >
                  {content?.category || 'BLOG POST'}
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

              {/* Intro */}
              {content?.intro && (
                <div className="text-xl text-muted-foreground mb-8 leading-relaxed font-medium">
                  {safeRenderText(content.intro)}
                </div>
              )}

              {/* Tags */}
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

            {/* Article Content */}
            <div className="mb-12">
              {content?.content && (
                <EnhancedContentRenderer
                  content={content.content}
                  sourcesReferences={content?.sources_references || content?.sources_refernces}
                  displayMode="compact"
                  maxVisible={5}
                  autoCollapse={true}
                  className=""
                />
              )}

              {content?.body && (
                <EnhancedContentRenderer
                  content={content.body}
                  sourcesReferences={content?.sources_references || content?.sources_refernces}
                  displayMode="compact"
                  maxVisible={5}
                  autoCollapse={true}
                  className=""
                />
              )}

              {/* Fallback for simple text content */}
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

            {/* Article Footer */}
            <footer className="border-t border-border pt-8">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span>Published on {new Date(story.published_at || story.created_at).toLocaleDateString()}</span>
                  {content?.read_time && (
                    <span className="mx-2">•</span>
                  )}
                  {content?.read_time && (
                    <span>{content.read_time}</span>
                  )}
                </div>

                <Link href="/blog">
                  <Button
                    className="text-white"
                    style={{ backgroundColor: postColor }}
                  >
                    Read More Posts
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