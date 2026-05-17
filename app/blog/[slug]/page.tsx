import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PortableTextRenderer } from "@/components/portable-text-renderer"
import { sanityFetch } from '@/lib/sanity/live'
import { client } from '@/lib/sanity/client'
import { POST_BY_SLUG_QUERY, ALL_POST_SLUGS_QUERY } from '@/lib/sanity/queries/posts'
import { urlForImage } from '@/lib/sanity/image'
import Link from "next/link"
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

// Helper function to generate consistent colors for posts based on slug
function getPostColor(slug: string) {
  const colors = [
    "#8b5cf6", "#ec4899", "#b12e2e", "#f59e0b",
    "#10b981", "#ef4444", "#b12e2e", "#8b5a2b"
  ]
  const hash = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

// Pre-render known post slugs at build time
// Use base client (not sanityFetch) — generateStaticParams runs outside a request
// context and draftMode() cannot be called there
export async function generateStaticParams() {
  const data = await client.fetch<Array<{ slug: string }>>(ALL_POST_SLUGS_QUERY)
  return (data ?? []).map(({ slug }) => ({ slug }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const { data: post } = await sanityFetch({ query: POST_BY_SLUG_QUERY, params: { slug } })
    if (!post) return { title: 'Blog Post | Rhythm Lab Radio' }
    return {
      title: post.seo?.seoTitle || `${post.title} | Rhythm Lab Radio Blog`,
      description: post.seo?.metaDescription || post.excerpt || 'Read the latest from Rhythm Lab Radio',
      openGraph: {
        title: post.seo?.seoTitle || post.title,
        description: post.seo?.metaDescription || post.excerpt || '',
        images: post.coverImage
          ? [urlForImage(post.coverImage).width(1200).height(630).url()]
          : [],
      },
    }
  } catch {
    return { title: 'Blog Post | Rhythm Lab Radio' }
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const { data: post } = await sanityFetch({ query: POST_BY_SLUG_QUERY, params: { slug } })
  if (!post) return notFound()

  const postColor = getPostColor(slug)

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
          {post.coverImage && (
            <div className="aspect-video w-full overflow-hidden rounded-xl mb-8">
              <img
                src={urlForImage(post.coverImage).width(1200).height(675).url()}
                alt={post.coverImage.alt || post.title}
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
                {post.tags?.[0]?.label?.toUpperCase() || 'BLOG POST'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : ''}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt / Intro */}
            {post.excerpt && (
              <div className="text-xl text-muted-foreground mb-8 leading-relaxed font-medium">
                {post.excerpt}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag) => (
                  <Badge
                    key={tag.slug}
                    variant="outline"
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ borderColor: postColor, color: postColor }}
                  >
                    {tag.label.toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Article Content */}
          <div className="mb-12">
            {post.body && (
              <PortableTextRenderer value={post.body} className="prose prose-invert max-w-none" />
            )}
          </div>

          {/* Article Footer */}
          <footer className="border-t border-border pt-8">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {post.publishedAt && (
                  <span>
                    Published on {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                )}
                {post.readingTime && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{post.readingTime} min read</span>
                  </>
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
  )
}
