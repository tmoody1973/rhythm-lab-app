import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/favorite-button"

export function ArchiveDiscoverySection() {
  return (
    <div className="space-y-6">
      {/* Archive Shows Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">📁 Weekly Show</h2>
          <div className="grid grid-cols-1 gap-4">
            {/* Featured Archive Show */}
            <Card className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl">
              <div className="aspect-[16/9] relative overflow-hidden">
                <img
                  src="/images/ALBUM-DEFAULT.png"
                  alt="Archive show artwork"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-[#8b5cf6] text-white text-xs px-3 py-1 rounded-full font-medium">ARCHIVE</Badge>
                  <span className="text-sm text-muted-foreground font-medium">15.12.24</span>
                </div>
                <h3 className="text-foreground font-bold text-lg mb-2 leading-tight text-balance">
                  AMBIENT SOUNDSCAPES VOL. 12
                </h3>
                <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                  A journey through ethereal soundscapes and atmospheric textures
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className="border-[#8b5cf6] text-[#8b5cf6] text-xs px-3 py-1 rounded-full font-medium"
                  >
                    AMBIENT
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
                    EXPERIMENTAL
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>2h 15m • 3.2k plays</span>
                    <FavoriteButton
                      content={{
                        id: "archive-ambient-vol-12",
                        title: "AMBIENT SOUNDSCAPES VOL. 12",
                        type: 'show',
                        image: "/images/ALBUM-DEFAULT.png",
                        description: "A journey through ethereal soundscapes and atmospheric textures"
                      }}
                      size="sm"
                    />
                  </div>
                  <Button size="sm" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm px-4 py-2">
                    ▶ Play
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Deep House Archive */}
            <Card className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl">
              <div className="aspect-[16/9] relative overflow-hidden">
                <img
                  src="/images/ALBUM-DEFAULT.png"
                  alt="Deep house archive artwork"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-[#00d4ff] text-black text-xs px-3 py-1 rounded-full font-medium">ARCHIVE</Badge>
                  <span className="text-sm text-muted-foreground font-medium">12.12.24</span>
                </div>
                <h3 className="text-foreground font-bold text-lg mb-2 leading-tight text-balance">
                  DEEP HOUSE SESSIONS #47
                </h3>
                <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                  Underground deep house selections from Detroit and Chicago
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className="border-cyan-700 text-cyan-700 text-xs px-3 py-1 rounded-full font-medium"
                  >
                    DEEP HOUSE
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-cyan-700 text-cyan-700 text-xs px-3 py-1 rounded-full font-medium"
                  >
                    TECHNO
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-cyan-700 text-cyan-700 text-xs px-3 py-1 rounded-full font-medium"
                  >
                    UNDERGROUND
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>1h 45m • 2.1k plays</span>
                    <FavoriteButton
                      content={{
                        id: "archive-deep-house-sessions-47",
                        title: "DEEP HOUSE SESSIONS #47",
                        type: 'show',
                        image: "/images/ALBUM-DEFAULT.png",
                        description: "Underground deep house selections from Detroit and Chicago"
                      }}
                      size="sm"
                    />
                  </div>
                  <Button size="sm" className="bg-[#00d4ff] hover:bg-[#00b8e6] text-black text-sm px-4 py-2">
                    ▶ Play
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jazz Fusion Archive */}
            <Card className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl">
              <div className="aspect-[16/9] relative overflow-hidden">
                <img
                  src="/images/ALBUM-DEFAULT.png"
                  alt="Jazz fusion archive artwork"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-[#f59e0b] text-white text-xs px-3 py-1 rounded-full font-medium">ARCHIVE</Badge>
                  <span className="text-sm text-muted-foreground font-medium">10.12.24</span>
                </div>
                <h3 className="text-foreground font-bold text-lg mb-2 leading-tight text-balance">
                  JAZZ FUSION EXPLORATIONS
                </h3>
                <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                  Electric jazz journeys from the 70s to contemporary fusion
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
                    FUSION
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#f59e0b] text-[#f59e0b] text-xs px-3 py-1 rounded-full font-medium"
                  >
                    ELECTRIC
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>2h 30m • 1.8k plays</span>
                    <FavoriteButton
                      content={{
                        id: "archive-jazz-fusion-explorations",
                        title: "JAZZ FUSION EXPLORATIONS",
                        type: 'show',
                        image: "/images/ALBUM-DEFAULT.png",
                        description: "Electric jazz journeys from the 70s to contemporary fusion"
                      }}
                      size="sm"
                    />
                  </div>
                  <Button size="sm" className="bg-[#f59e0b] hover:bg-[#d97706] text-white text-sm px-4 py-2">
                    ▶ Play
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Techno Underground Archive */}
            <Card className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl">
              <div className="aspect-[16/9] relative overflow-hidden">
                <img
                  src="/images/ALBUM-DEFAULT.png"
                  alt="Techno underground archive artwork"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-[#10b981] text-white text-xs px-3 py-1 rounded-full font-medium">ARCHIVE</Badge>
                  <span className="text-sm text-muted-foreground font-medium">08.12.24</span>
                </div>
                <h3 className="text-foreground font-bold text-lg mb-2 leading-tight text-balance">
                  TECHNO UNDERGROUND
                </h3>
                <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                  Raw techno from Berlin's underground scene and beyond
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className="border-[#10b981] text-[#10b981] text-xs px-3 py-1 rounded-full font-medium"
                  >
                    TECHNO
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#10b981] text-[#10b981] text-xs px-3 py-1 rounded-full font-medium"
                  >
                    UNDERGROUND
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#10b981] text-[#10b981] text-xs px-3 py-1 rounded-full font-medium"
                  >
                    BERLIN
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>3h 00m • 4.5k plays</span>
                    <FavoriteButton
                      content={{
                        id: "archive-techno-underground",
                        title: "TECHNO UNDERGROUND",
                        type: 'show',
                        image: "/images/ALBUM-DEFAULT.png",
                        description: "Raw techno from Berlin's underground scene and beyond"
                      }}
                      size="sm"
                    />
                  </div>
                  <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white text-sm px-4 py-2">
                    ▶ Play
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Search & Discovery */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">📈 Trending Searches</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { tag: "deep-house", count: 234 },
            { tag: "jazz", count: 189 },
            { tag: "electronic", count: 156 },
            { tag: "ambient", count: 143 },
            { tag: "techno", count: 128 },
            { tag: "fusion", count: 98 },
          ].map((item, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:border-[#00d4ff] hover:text-[#00d4ff] bg-transparent"
            >
              #{item.tag}
              <span className="ml-2 text-xs opacity-60">{item.count}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-[#00d4ff] mb-1">247</div>
            <div className="text-xs text-muted-foreground">Tracks Today</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-[#8b5cf6] mb-1">12</div>
            <div className="text-xs text-muted-foreground">Episodes This Week</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-[#10b981] mb-1">156</div>
            <div className="text-xs text-muted-foreground">Archive Shows</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-[#f59e0b] mb-1">89</div>
            <div className="text-xs text-muted-foreground">Your Discoveries</div>
          </div>
        </div>
      </div>
    </div>
  )
}
