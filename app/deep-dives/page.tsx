import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function DeepDivesPage() {
  const deepDives = [
    {
      id: 1,
      title: "MILES DAVIS: FROM BEBOP TO FUSION - A RHYTHM LAB PERSPECTIVE",
      description: "Exploring Miles Davis's revolutionary journey through jazz evolution",
      image: "/miles-davis-trumpet-silhouette-jazz-atmosphere.jpg",
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
      image: "/electronic-music-producer-in-studio-ambient-lighti.jpg",
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
      image: "/ambient-soundscape-visualization-with-ethereal-col.jpg",
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
      image: "/abstract-music-visualization-dark.jpg",
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
      image: "/placeholder-eqe3b.png",
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
      image: "/placeholder-yjpx3.png",
      date: "06.09.25",
      duration: "55m",
      plays: "2.7k",
      tags: ["PSYCHOLOGY", "SCIENCE", "NEUROSCIENCE"],
      color: "#00d4ff"
    }
  ]

  const featuredDives = deepDives.slice(0, 2)
  const regularDives = deepDives.slice(2)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold nts-text-caps mb-2">Deep Dives</h1>
            <p className="text-muted-foreground">In-depth explorations of music, artists, and culture</p>
          </div>

          {/* Featured Deep Dives Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold nts-text-caps mb-6">Featured</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredDives.map((dive) => (
                <Card
                  key={dive.id}
                  className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl"
                >
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img
                      src={dive.image}
                      alt={dive.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        className="text-white text-sm px-4 py-2 rounded-full font-medium"
                        style={{ backgroundColor: dive.color }}
                      >
                        FEATURED
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">{dive.date}</span>
                    </div>
                    <h3 className="text-foreground font-bold text-xl mb-3 leading-tight">
                      {dive.title}
                    </h3>
                    <p className="text-muted-foreground text-base mb-4 leading-relaxed">
                      {dive.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {dive.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs px-3 py-1 rounded-full font-medium"
                          style={{ borderColor: dive.color, color: dive.color }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{dive.duration} • {dive.plays} plays</span>
                      <Button
                        size="sm"
                        className="text-white text-sm px-6 py-2"
                        style={{ backgroundColor: dive.color }}
                      >
                        ▶ Play
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Regular Deep Dives Grid */}
          <div>
            <h2 className="text-2xl font-bold nts-text-caps mb-6">All Deep Dives</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regularDives.map((dive) => (
                <Card
                  key={dive.id}
                  className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl"
                >
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src={dive.image}
                      alt={dive.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        className="text-white text-xs px-3 py-1 rounded-full font-medium"
                        style={{ backgroundColor: dive.color }}
                      >
                        DEEP DIVE
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">{dive.date}</span>
                    </div>
                    <h3 className="text-foreground font-bold text-base mb-2 leading-tight">
                      {dive.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed line-clamp-3">
                      {dive.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {dive.tags.slice(0, 2).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ borderColor: dive.color, color: dive.color }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="text-xs">{dive.duration} • {dive.plays} plays</span>
                      <Button
                        size="sm"
                        className="text-white text-xs px-3 py-1"
                        style={{ backgroundColor: dive.color }}
                      >
                        ▶ Play
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