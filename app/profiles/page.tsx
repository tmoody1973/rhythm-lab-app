import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ProfilesPage() {
  const profiles = [
    {
      id: 1,
      title: "FLOATING POINTS: NEUROSCIENCE MEETS ELECTRONIC MUSIC",
      description: "How Sam Shepherd bridges scientific research and musical innovation",
      image: "/electronic-music-producer-in-studio-ambient-lighti.jpg",
      date: "16.09.25",
      duration: "35m",
      plays: "1.5k",
      tags: ["ELECTRONIC", "AMBIENT", "JAZZ"],
      color: "#10b981",
      artist: "Floating Points"
    },
    {
      id: 2,
      title: "KERRI CHANDLER: THE SOUL OF DEEP HOUSE",
      description: "Exploring the legendary producer's influence on house music culture",
      image: "/deep-house-album-cover-kerri-chandler-rain.jpg",
      date: "14.09.25",
      duration: "42m",
      plays: "2.1k",
      tags: ["HOUSE", "DEEP HOUSE", "SOUL"],
      color: "#00d4ff",
      artist: "Kerri Chandler"
    },
    {
      id: 3,
      title: "APHEX TWIN: THE ENIGMA OF ELECTRONIC EXPERIMENTATION",
      description: "Decoding Richard D. James's impact on experimental electronic music",
      image: "/abstract-music-visualization-dark.jpg",
      date: "12.09.25",
      duration: "48m",
      plays: "2.8k",
      tags: ["ELECTRONIC", "EXPERIMENTAL", "IDM"],
      color: "#8b5cf6",
      artist: "Aphex Twin"
    },
    {
      id: 4,
      title: "NINA KRAVIZ: FROM DENTIST TO TECHNO ICON",
      description: "The journey of Russia's most influential techno ambassador",
      image: "/placeholder-eqe3b.png",
      date: "10.09.25",
      duration: "39m",
      plays: "1.9k",
      tags: ["TECHNO", "ELECTRONIC", "UNDERGROUND"],
      color: "#ec4899",
      artist: "Nina Kraviz"
    },
    {
      id: 5,
      title: "ROBERT GLASPER: REDEFINING MODERN JAZZ",
      description: "How the pianist revolutionized jazz with hip-hop and R&B influences",
      image: "/placeholder-yjpx3.png",
      date: "08.09.25",
      duration: "44m",
      plays: "1.7k",
      tags: ["JAZZ", "HIP HOP", "R&B"],
      color: "#f59e0b",
      artist: "Robert Glasper"
    },
    {
      id: 6,
      title: "JAMIE XX: THE EVOLUTION OF UK ELECTRONIC",
      description: "From The xx to solo success: a journey through UK's electronic landscape",
      image: "/placeholder-ptd6l.png",
      date: "06.09.25",
      duration: "41m",
      plays: "2.3k",
      tags: ["ELECTRONIC", "UK", "INDIE"],
      color: "#10b981",
      artist: "Jamie xx"
    },
    {
      id: 7,
      title: "KAMASI WASHINGTON: THE MODERN JAZZ RENAISSANCE",
      description: "Leading the new wave of spiritual jazz and cosmic consciousness",
      image: "/ambient-ethereal-soundscape-with-floating-particle.jpg",
      date: "04.09.25",
      duration: "52m",
      plays: "2.0k",
      tags: ["JAZZ", "SPIRITUAL", "FUSION"],
      color: "#f59e0b",
      artist: "Kamasi Washington"
    },
    {
      id: 8,
      title: "BURIAL: GHOST IN THE UK GARAGE MACHINE",
      description: "The mysterious producer who redefined underground electronic music",
      image: "/ambient-soundscape-visualization-with-ethereal-col.jpg",
      date: "02.09.25",
      duration: "46m",
      plays: "2.5k",
      tags: ["UK GARAGE", "DUBSTEP", "AMBIENT"],
      color: "#8b5cf6",
      artist: "Burial"
    }
  ]

  const featuredProfiles = profiles.slice(0, 2)
  const regularProfiles = profiles.slice(2)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold nts-text-caps mb-2">Artist Profiles</h1>
            <p className="text-muted-foreground">Deep conversations with music's most innovative creators</p>
          </div>

          {/* Featured Profiles Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold nts-text-caps mb-6">Featured</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredProfiles.map((profile) => (
                <Card
                  key={profile.id}
                  className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl"
                >
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img
                      src={profile.image}
                      alt={profile.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        className="text-white text-sm px-4 py-2 rounded-full font-medium"
                        style={{ backgroundColor: profile.color }}
                      >
                        FEATURED
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">{profile.date}</span>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm text-muted-foreground nts-text-caps">
                        {profile.artist}
                      </span>
                    </div>
                    <h3 className="text-foreground font-bold text-xl mb-3 leading-tight">
                      {profile.title}
                    </h3>
                    <p className="text-muted-foreground text-base mb-4 leading-relaxed">
                      {profile.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs px-3 py-1 rounded-full font-medium"
                          style={{ borderColor: profile.color, color: profile.color }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{profile.duration} • {profile.plays} plays</span>
                      <Button
                        size="sm"
                        className="text-white text-sm px-6 py-2"
                        style={{ backgroundColor: profile.color }}
                      >
                        ▶ Play
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Regular Profiles Grid */}
          <div>
            <h2 className="text-2xl font-bold nts-text-caps mb-6">All Profiles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regularProfiles.map((profile) => (
                <Card
                  key={profile.id}
                  className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl"
                >
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src={profile.image}
                      alt={profile.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        className="text-white text-xs px-3 py-1 rounded-full font-medium"
                        style={{ backgroundColor: profile.color }}
                      >
                        PROFILE
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">{profile.date}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground nts-text-caps">
                        {profile.artist}
                      </span>
                    </div>
                    <h3 className="text-foreground font-bold text-base mb-2 leading-tight">
                      {profile.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed line-clamp-3">
                      {profile.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {profile.tags.slice(0, 2).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ borderColor: profile.color, color: profile.color }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="text-xs">{profile.duration} • {profile.plays} plays</span>
                      <Button
                        size="sm"
                        className="text-white text-xs px-3 py-1"
                        style={{ backgroundColor: profile.color }}
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