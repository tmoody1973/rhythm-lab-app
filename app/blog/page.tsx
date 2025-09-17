import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { sb } from "@/src/lib/storyblok"
import Link from "next/link"
import { Metadata } from 'next'

// Generate metadata for the blog page
export const metadata: Metadata = {
  title: 'Blog | Rhythm Lab Radio',
  description: 'Read the latest insights, reviews, and deep dives from Rhythm Lab Radio covering electronic music, culture, and sound exploration.',
  openGraph: {
    title: 'Blog | Rhythm Lab Radio',
    description: 'Read the latest insights, reviews, and deep dives from Rhythm Lab Radio covering electronic music, culture, and sound exploration.',
  },
}

// Helper function to generate consistent colors for posts
function getPostColor(id: number) {
  const colors = [
    "#8b5cf6", "#ec4899", "#00d4ff", "#f59e0b",
    "#10b981", "#ef4444", "#3b82f6", "#8b5a2b"
  ];
  return colors[id % colors.length];
}

// Helper function to extract all text from rich text content
function extractAllText(content: any): string {
  if (!content) return '';

  let text = '';

  if (Array.isArray(content)) {
    content.forEach(node => {
      text += extractAllText(node);
    });
  } else if (content.content) {
    text += extractAllText(content.content);
  } else if (content.text) {
    text += content.text + ' ';
  }

  return text;
}

// Helper function to calculate read time based on content length
function calculateReadTime(content: any): string {
  if (!content || !content.content) return '1 min read';

  const fullText = extractAllText(content.content);
  const wordCount = fullText.trim().split(/\s+/).length;
  const wordsPerMinute = 225; // Average reading speed
  const readTimeMinutes = Math.ceil(wordCount / wordsPerMinute);

  return `${readTimeMinutes} min read`;
}

export default async function BlogPage() {
  let blogPosts: any[] = [];
  let error: string | null = null;

  try {
    // Fetch blog posts from Storyblok
    const storyblokApi = sb();
    const response = await storyblokApi.get('cdn/stories', {
      version: 'published',
      per_page: 100,
      sort_by: 'first_published_at:desc',
      starts_with: 'blog/'
    });

    blogPosts = response.data.stories || [];
    console.log('Found blog posts:', blogPosts.length, blogPosts.map(d => ({ slug: d.slug, name: d.name, full_slug: d.full_slug })));
  } catch (err) {
    console.error('Error fetching blog posts:', err);
    error = 'Failed to load blog posts. Please try again later.';
  }

  // If we have blog posts, use them; otherwise show friendly message
  const hasPosts = blogPosts.length > 0;
  const featuredPost = hasPosts ? blogPosts[0] : null;
  const regularPosts = hasPosts ? blogPosts.slice(1) : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            RHYTHM LAB BLOG
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Deep dives into electronic music culture, artist spotlights, genre explorations,
            and the stories behind the sounds that move us.
          </p>
        </div>

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        )}

        {!error && !hasPosts && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No blog posts available yet. Check back soon for fresh content!
            </p>
          </div>
        )}

        {!error && hasPosts && (
          <>
            {/* Featured Posts Section */}
            {blogPosts.filter(post => post.content?.featured === true).length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold nts-text-caps mb-6">Featured</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {blogPosts.filter(post => post.content?.featured === true).map((post) => {
                  const postColor = getPostColor(post.id);
                  return (
                    <Card
                      key={post.id}
                      className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl"
                    >
                      <Link href={`/blog/${post.slug}`}>
                        <div className="aspect-[16/10] relative overflow-hidden">
                          {post.content?.featured_image?.filename ? (
                            <img
                              src={post.content.featured_image.filename}
                              alt={post.content.featured_image.alt || post.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
                              style={{ backgroundColor: postColor }}
                            >
                              {post.name}
                            </div>
                          )}
                        </div>
                      </Link>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <Badge
                            className="text-white text-sm px-4 py-2 rounded-full font-medium"
                            style={{ backgroundColor: postColor }}
                          >
                            FEATURED
                          </Badge>
                          <span className="text-sm text-muted-foreground font-medium">
                            {new Date(post.published_at || post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Link href={`/blog/${post.slug}`}>
                          <h3 className="text-foreground font-bold text-xl mb-3 leading-tight hover:text-primary transition-colors">
                            {post.name}
                          </h3>
                        </Link>
                        {post.content?.intro ? (
                          <p className="text-muted-foreground text-base mb-4 leading-relaxed">
                            {post.content.intro}
                          </p>
                        ) : (
                          <p className="text-muted-foreground text-base mb-4 leading-relaxed">
                            Discover the latest insights and stories from the world of music, culture, and sound exploration.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.content?.categories && (
                            <Badge
                              variant="outline"
                              className="text-xs px-3 py-1 rounded-full font-medium"
                              style={{ borderColor: postColor, color: postColor }}
                            >
                              {String(post.content.categories).toUpperCase()}
                            </Badge>
                          )}
                          {(post.content?.tags || post.tag_list) && (
                            <>
                              {(post.content.tags || post.tag_list || []).slice(0, 2).map((tag: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs px-3 py-1 rounded-full font-medium"
                                  style={{ borderColor: postColor, color: postColor }}
                                >
                                  {String(tag).toUpperCase()}
                                </Badge>
                              ))}
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{calculateReadTime(post.content?.content || post.content?.body)}</span>
                          <Link href={`/blog/${post.slug}`}>
                            <Button
                              size="sm"
                              className="text-white text-sm px-6 py-2"
                              style={{ backgroundColor: postColor }}
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
              </section>
            )}

            {/* Regular Posts Grid */}
            <section>
              <h2 className="text-2xl font-bold nts-text-caps mb-6">Latest Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {blogPosts.filter(post => post.content?.featured !== true).map((post) => {
                    const postColor = getPostColor(post.id);
                    return (
                      <Card
                        key={post.id}
                        className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl"
                      >
                        <Link href={`/blog/${post.slug}`}>
                          <div className="aspect-[16/9] relative overflow-hidden">
                            {post.content?.featured_image?.filename ? (
                              <img
                                src={post.content.featured_image.filename}
                                alt={post.content.featured_image.alt || post.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center text-white text-lg font-bold p-4 text-center"
                                style={{ backgroundColor: postColor }}
                              >
                                {post.name}
                              </div>
                            )}
                          </div>
                        </Link>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge
                              className="text-white text-xs px-3 py-1 rounded-full font-medium"
                              style={{ backgroundColor: postColor }}
                            >
                              BLOG POST
                            </Badge>
                            <span className="text-sm text-muted-foreground font-medium">
                              {new Date(post.published_at || post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <Link href={`/blog/${post.slug}`}>
                            <h3 className="text-foreground font-bold text-base mb-2 leading-tight hover:text-primary transition-colors">
                              {post.name}
                            </h3>
                          </Link>
                          {post.content?.intro && (
                            <p className="text-muted-foreground text-sm mb-3 leading-relaxed line-clamp-3">
                              {post.content.intro}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {post.content?.categories && (
                              <Badge
                                variant="outline"
                                className="text-xs px-2 py-1 rounded-full font-medium"
                                style={{ borderColor: postColor, color: postColor }}
                              >
                                {String(post.content.categories).toUpperCase()}
                              </Badge>
                            )}
                            {(post.content?.tags || post.tag_list) && (
                              <>
                                {(post.content.tags || post.tag_list || []).slice(0, 1).map((tag: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs px-2 py-1 rounded-full font-medium"
                                    style={{ borderColor: postColor, color: postColor }}
                                  >
                                    {String(tag).toUpperCase()}
                                  </Badge>
                                ))}
                              </>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="text-xs">{calculateReadTime(post.content?.content || post.content?.body)}</span>
                            <Link href={`/blog/${post.slug}`}>
                              <Button
                                size="sm"
                                className="text-white text-xs px-3 py-1"
                                style={{ backgroundColor: postColor }}
                              >
                                Read
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
          </>
        )}
      </main>
    </div>
  );
}