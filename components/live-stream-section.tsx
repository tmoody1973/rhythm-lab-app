import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function LiveStreamSection() {
  return (
    <div className="space-y-6 py-8">
      <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-0 overflow-hidden">
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 relative">
          <img src="/abstract-music-visualization-dark.jpg" alt="Current show" className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-800 text-white text-sm font-medium uppercase tracking-widest px-3 py-1">
              LIVE
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/60 backdrop-blur-sm p-4 rounded">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight text-balance text-white mb-1">
                KERRI CHANDLER - RAIN
              </h2>
              <p className="text-sm font-medium uppercase tracking-widest text-white/90">NOW PLAYING FROM DEEP HOUSE EXPLORATIONS</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">TRACK DETAILS</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                  <span className="text-sm">▶️</span>
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                  <span className="text-sm">🔊</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted border-2 border-border/50 overflow-hidden flex-shrink-0 rounded">
                <img
                  src="/deep-house-album-cover-kerri-chandler-rain.jpg"
                  alt="Album artwork"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">KERRI CHANDLER</h3>
                <p className="text-base font-medium text-foreground/90 truncate">Rain</p>
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground truncate">
                  DEEP HOUSE CLASSICS • 2019
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-4 space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-widest text-foreground mb-4">RECENT TRACKS</h3>
        <div className="space-y-3">
          {[
            { time: "14:32", artist: "MAYA JANE COLES", track: "WHAT THEY SAY" },
            { time: "14:28", artist: "DISCLOSURE", track: "LATCH" },
            { time: "14:24", artist: "BONOBO", track: "KIARA" },
            { time: "14:19", artist: "THIEVERY CORPORATION", track: "LEBANESE BLONDE" },
          ].map((track, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b-2 border-border/30 hover:bg-muted/30 cursor-pointer transition-colors duration-200"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{track.artist}</p>
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground truncate">
                  {track.track}
                </p>
              </div>
              <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground ml-4">
                {track.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-4 space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-widest text-foreground mb-4">CURRENT SHOW</h3>
        <div className="space-y-3">
          <div>
            <h4 className="font-bold text-lg mb-1">Deep House Explorations</h4>
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">WITH DJ MARCUS CHEN</p>
          </div>
          <p className="text-base leading-relaxed text-foreground/90">
            Journey through the deeper side of house music, featuring underground gems and classic cuts.
          </p>
          <div className="flex justify-between pt-2 border-t-2 border-border/30">
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              ⏱️ 2 HOURS
            </span>
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              👥 1,247 LISTENERS
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
