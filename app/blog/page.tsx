import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: "FOR FOLKS: INTERNATIONAL ANTHEM IRL W/ CARLOS NIÑO & KING HIPPO",
      description: "A journey through international jazz and hip-hop collaborations featuring exclusive tracks and deep conversations about cross-cultural musical fusion.",
      image: "/images/dj-blue-purple-lighting.png",
      date: "18.09.25",
      duration: "1h 30m",
      plays: "2.8k",
      tags: ["JAZZ", "SOUL", "ELECTRONIC", "HIP HOP"],
      color: "#8b5cf6",
      type: "EPISODE"
    },
    {
      id: 2,
      title: "AMBIENT SOUNDSCAPES: THE ART OF ATMOSPHERIC MUSIC",
      description: "Exploring the creation and impact of immersive ambient compositions with field recordings and live ambient performances.",
      image: "/ambient-soundscape-visualization-with-ethereal-col.jpg",
      date: "15.09.25",
      duration: "2h 05m",
      plays: "3.1k",
      tags: ["AMBIENT", "ELECTRONIC", "EXPERIMENTAL"],
      color: "#ec4899",
      type: "EPISODE"
    },
    {
      id: 3,
      title: "DEEP HOUSE EXPLORATIONS: UNDERGROUND GEMS",
      description: "Diving deep into the underground house scene with rare tracks, exclusive mixes, and interviews with emerging producers.",
      image: "/deep-house-album-cover-kerri-chandler-rain.jpg",
      date: "13.09.25",
      duration: "1h 45m",
      plays: "2.4k",
      tags: ["DEEP HOUSE", "UNDERGROUND", "ELECTRONIC"],
      color: "#00d4ff",
      type: "EPISODE"
    },
    {
      id: 4,
      title: "JAZZ FUSION FRIDAY: ELECTRIC EXPLORATIONS",
      description: "Weekly exploration of jazz fusion's evolution from the 70s to today, featuring rare live recordings and artist interviews.",
      image: "/placeholder-yjpx3.png",
      date: "11.09.25",
      duration: "1h 55m",
      plays: "2.0k",
      tags: ["JAZZ", "FUSION", "ELECTRIC"],
      color: "#f59e0b",
      type: "EPISODE"
    },
    {
      id: 5,
      title: "TECHNO UNDERGROUND: BERLIN AFTER HOURS",
      description: "Live from Berlin's underground scene - raw techno sets, club culture insights, and the sounds shaping the future.",
      image: "/abstract-music-visualization-dark.jpg",
      date: "09.09.25",
      duration: "2h 15m",
      plays: "3.5k",
      tags: ["TECHNO", "UNDERGROUND", "BERLIN"],
      color: "#10b981",
      type: "EPISODE"
    },
    {
      id: 6,
      title: "WORLD MUSIC WEDNESDAYS: GLOBAL RHYTHMS",
      description: "Celebrating global music traditions and contemporary world fusion, with guest artists sharing their cultural musical heritage.",
      image: "/placeholder-eqe3b.png",
      date: "07.09.25",
      duration: "1h 40m",
      plays: "1.8k",
      tags: ["WORLD MUSIC", "GLOBAL", "TRADITIONAL"],
      color: "#8b5cf6",
      type: "EPISODE"
    },
    {
      id: 7,
      title: "EXPERIMENTAL ELECTRONIC: PUSHING BOUNDARIES",
      description: "Showcasing the most innovative electronic music that challenges conventional sound design and composition techniques.",
      image: "/electronic-music-producer-in-studio-ambient-lighti.jpg",
      date: "05.09.25",
      duration: "1h 25m",
      plays: "1.9k",
      tags: ["EXPERIMENTAL", "ELECTRONIC", "AVANT-GARDE"],
      color: "#ec4899",
      type: "EPISODE"
    },
    {
      id: 8,
      title: "SOUL SESSIONS: VINTAGE VIBES AND MODERN INTERPRETATIONS",
      description: "Bridging classic soul with contemporary interpretations, featuring rare vinyl finds and modern soul artists.",
      image: "/placeholder-ptd6l.png",
      date: "03.09.25",
      duration: "1h 50m",
      plays: "2.2k",
      tags: ["SOUL", "R&B", "VINTAGE"],
      color: "#f59e0b",
      type: "EPISODE"
    }
  ]

  const featuredPosts = posts.slice(0, 2)
  const regularPosts = posts.slice(2)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold nts-text-caps mb-2">Blog</h1>
            <p className="text-muted-foreground">Stories, insights, and deep dives into music culture</p>
          </div>

          {/* Featured Posts Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold nts-text-caps mb-6">Featured</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Card
                  key={post.id}
                  className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl"
                >
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        className="text-white text-sm px-4 py-2 rounded-full font-medium"
                        style={{ backgroundColor: post.color }}
                      >
                        FEATURED
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">{post.date}</span>
                    </div>
                    <h3 className="text-foreground font-bold text-xl mb-3 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-base mb-4 leading-relaxed">
                      {post.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs px-3 py-1 rounded-full font-medium"
                          style={{ borderColor: post.color, color: post.color }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{post.duration} • {post.plays} reads</span>
                      <Button
                        size="sm"
                        className="text-white text-sm px-6 py-2"
                        style={{ backgroundColor: post.color }}
                      >
                        Read More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Regular Posts Grid */}
          <div>
            <h2 className="text-2xl font-bold nts-text-caps mb-6">All Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regularPosts.map((post) => (
                <Card
                  key={post.id}
                  className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl"
                >
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        className="text-white text-xs px-3 py-1 rounded-full font-medium"
                        style={{ backgroundColor: post.color }}
                      >
                        BLOG POST
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">{post.date}</span>
                    </div>
                    <h3 className="text-foreground font-bold text-base mb-2 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed line-clamp-3">
                      {post.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 2).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ borderColor: post.color, color: post.color }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="text-xs">{post.duration} • {post.plays} reads</span>
                      <Button
                        size="sm"
                        className="text-white text-xs px-3 py-1"
                        style={{ backgroundColor: post.color }}
                      >
                        Read
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}