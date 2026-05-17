import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/favorite-button"
import { sanityFetch } from '@/lib/sanity/live'
import { ALL_POSTS_QUERY } from '@/lib/sanity/queries/posts'
import { urlForImage } from '@/lib/sanity/image'
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
function getPostColor(index: number) {
  const colors = [
    "#8b5cf6", "#ec4899", "#b12e2e", "#f59e0b",
    "#10b981", "#ef4444", "#b12e2e", "#8b5a2b"
  ];
  return colors[index % colors.length];
}

export default async function BlogPage() {
  let posts: any[] = []
  let fetchError = false
  try {
    const { data } = await sanityFetch({ query: ALL_POSTS_QUERY })
    posts = data ?? []
  } catch (err) {
    console.error('Failed to fetch blog posts from Sanity:', err)
    fetchError = true
  }
  const hasPosts = !fetchError && posts.length > 0

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

        {fetchError && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">Failed to load blog posts. Please try again later.</p>
          </div>
        )}

        {!hasPosts && !fetchError && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No blog posts available yet. Check back soon for fresh content!
            </p>
          </div>
        )}

        {hasPosts && (
          <section>
            <h2 className="text-2xl font-bold nts-text-caps mb-6">Latest Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, idx) => {
                const postColor = getPostColor(idx)
                const coverImageUrl = post.coverImage
                  ? urlForImage(post.coverImage).width(600).height(400).url()
                  : null
                const favoriteImageUrl = post.coverImage
                  ? urlForImage(post.coverImage).width(300).url()
                  : undefined
                const readingTime = post.readingTime
                  ? `${post.readingTime} min read`
                  : '1 min read'

                return (
                  <Card
                    key={post._id}
                    className="bg-card/80 backdrop-blur-sm hover:shadow-lg hover:bg-card/90 transition-all duration-200 cursor-pointer overflow-hidden border border-border/30 rounded-xl"
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <div className="aspect-[16/9] relative overflow-hidden">
                        {coverImageUrl ? (
                          <img
                            src={coverImageUrl}
                            alt={post.coverImage?.alt || post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white text-lg font-bold p-4 text-center"
                            style={{ backgroundColor: postColor }}
                          >
                            {post.title}
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
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString()
                            : ''}
                        </span>
                      </div>
                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="text-foreground font-bold text-base mb-2 leading-tight hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm mb-3 leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.tags?.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag.slug}
                            variant="outline"
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ borderColor: postColor, color: postColor }}
                          >
                            {tag.label.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{readingTime}</span>
                          <FavoriteButton
                            content={{
                              id: post._id,
                              title: post.title,
                              type: 'blog_post',
                              image: favoriteImageUrl,
                              description: post.excerpt ?? undefined
                            }}
                            size="sm"
                          />
                        </div>
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
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
