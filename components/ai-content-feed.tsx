import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AIContentFeed() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">Explore</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#10b981] rounded-full pulse-animation"></div>
              <span className="text-sm text-[#10b981]">Real-time</span>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted">
              <TabsTrigger
                value="all"
                className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="blog"
                className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background"
              >
                Blog
              </TabsTrigger>
              <TabsTrigger
                value="deep"
                className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background"
              >
                Deep Dives
              </TabsTrigger>
              <TabsTrigger
                value="profiles"
                className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background"
              >
                Profiles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Episode Card */}
                <Card className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl">
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src="/images/dj-blue-purple-lighting.png"
                      alt="Episode artwork"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-[#8b5cf6] text-white text-xs px-3 py-1 rounded-full font-medium">
                        EPISODE
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">18.09.25</span>
                    </div>
                    <h3 className="text-foreground font-bold text-lg mb-2 leading-tight text-balance">
                      FOR FOLKS: INTERNATIONAL ANTHEM IRL W/ CARLOS NIÑO & KING HIPPO
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                      A journey through international jazz and hip-hop collaborations
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="border-[#8b5cf6] text-[#8b5cf6] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        JAZZ
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-[#8b5cf6] text-[#8b5cf6] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        SOUL
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-[#8b5cf6] text-[#8b5cf6] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        ELECTRONIC
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-[#8b5cf6] text-[#8b5cf6] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        HIP HOP
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>1h 30m • 2.8k plays</span>
                      <Button size="sm" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm px-4 py-2">
                        ▶ Play
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Deep Dive Card */}
                <Card className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl">
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src="/miles-davis-trumpet-silhouette-jazz-atmosphere.jpg"
                      alt="Deep dive artwork"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-[#f59e0b] text-white text-xs px-3 py-1 rounded-full font-medium">
                        DEEP DIVE
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">17.09.25</span>
                    </div>
                    <h3 className="text-foreground font-bold text-lg mb-2 leading-tight text-balance">
                      MILES DAVIS: FROM BEBOP TO FUSION - A RHYTHM LAB PERSPECTIVE
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                      Exploring Miles Davis's revolutionary journey through jazz evolution
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="border-[#f59e0b] text-[#f59e0b] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        JAZZ
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-[#f59e0b] text-[#f59e0b] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        BEBOP
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-[#f59e0b] text-[#f59e0b] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        FUSION
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>45m • 1.9k plays</span>
                      <Button size="sm" className="bg-[#f59e0b] hover:bg-[#d97706] text-white text-sm px-4 py-2">
                        ▶ Play
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Artist Profile Card */}
                <Card className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl">
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src="/electronic-music-producer-in-studio-ambient-lighti.jpg"
                      alt="Artist profile artwork"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-[#10b981] text-white text-xs px-3 py-1 rounded-full font-medium">
                        PROFILE
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">16.09.25</span>
                    </div>
                    <h3 className="text-foreground font-bold text-lg mb-2 leading-tight text-balance">
                      FLOATING POINTS: NEUROSCIENCE MEETS ELECTRONIC MUSIC
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                      How Sam Shepherd bridges scientific research and musical innovation
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="border-[#10b981] text-[#10b981] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        ELECTRONIC
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-[#10b981] text-[#10b981] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        AMBIENT
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-[#10b981] text-[#10b981] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        JAZZ
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>35m • 1.5k plays</span>
                      <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white text-sm px-4 py-2">
                        ▶ Play
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Another Episode Card */}
                <Card className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl">
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src="/ambient-soundscape-visualization-with-ethereal-col.jpg"
                      alt="Episode artwork"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-[#ec4899] text-white text-xs px-3 py-1 rounded-full font-medium">
                        EPISODE
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">15.09.25</span>
                    </div>
                    <h3 className="text-foreground font-bold text-lg mb-2 leading-tight text-balance">
                      AMBIENT SOUNDSCAPES: THE ART OF ATMOSPHERIC MUSIC
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                      Exploring the creation and impact of immersive ambient compositions
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="border-[#ec4899] text-[#ec4899] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        AMBIENT
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-[#ec4899] text-[#ec4899] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        ELECTRONIC
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-[#ec4899] text-[#ec4899] text-xs px-3 py-1 rounded-full font-medium"
                      >
                        EXPERIMENTAL
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>2h 05m • 3.1k plays</span>
                      <Button size="sm" className="bg-[#ec4899] hover:bg-[#db2777] text-white text-sm px-4 py-2">
                        ▶ Play
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="blog" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Blog posts will be filtered here</p>
              </div>
            </TabsContent>

            <TabsContent value="deep" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Deep dives will be filtered here</p>
              </div>
            </TabsContent>

            <TabsContent value="profiles" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Artist profiles will be filtered here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
