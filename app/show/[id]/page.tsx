import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Clock, Users, Share, Bookmark, Music, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"

export default function ShowDetailPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="text-[#a1a1aa] hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Show Header */}
            <Card className="bg-[#1e2332] border-[#2a2f3e]">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Show Artwork */}
                  <div className="w-48 h-48 bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Music className="h-24 w-24 text-white" />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-[#00d4ff] text-black">Enhanced Content Available</Badge>
                      </div>
                      <h1 className="text-3xl font-bold text-white mb-2">Ambient Soundscapes Vol. 12</h1>
                      <p className="text-[#a1a1aa] text-lg">
                        A journey through ethereal soundscapes and atmospheric textures
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-[#a1a1aa]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        2h 15m
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        3.2k plays
                      </span>
                      <span>December 15, 2024</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button className="bg-[#00d4ff] hover:bg-[#00b8e6] text-black">
                        <Play className="h-4 w-4 mr-2" />
                        Play Show
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#2a2f3e] text-white hover:bg-[#1e2332] bg-transparent"
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#2a2f3e] text-white hover:bg-[#1e2332] bg-transparent"
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Card className="bg-[#1e2332] border-[#2a2f3e]">
              <CardContent className="p-6">
                <Tabs defaultValue="tracklist" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-[#0a0e1a]">
                    <TabsTrigger
                      value="tracklist"
                      className="text-[#a1a1aa] data-[state=active]:text-[#00d4ff] data-[state=active]:bg-[#1e2332]"
                    >
                      Tracklist
                    </TabsTrigger>
                    <TabsTrigger
                      value="notes"
                      className="text-[#a1a1aa] data-[state=active]:text-[#00d4ff] data-[state=active]:bg-[#1e2332]"
                    >
                      Curator Notes
                    </TabsTrigger>
                    <TabsTrigger
                      value="analysis"
                      className="text-[#a1a1aa] data-[state=active]:text-[#00d4ff] data-[state=active]:bg-[#1e2332]"
                    >
                      AI Analysis
                    </TabsTrigger>
                    <TabsTrigger
                      value="related"
                      className="text-[#a1a1aa] data-[state=active]:text-[#00d4ff] data-[state=active]:bg-[#1e2332]"
                    >
                      Related Shows
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tracklist" className="mt-6">
                    <div className="space-y-3">
                      {[
                        {
                          time: "00:00",
                          artist: "Brian Eno",
                          track: "An Ending (Ascent)",
                          album: "Apollo: Atmospheres and Soundtracks",
                        },
                        {
                          time: "04:32",
                          artist: "Stars of the Lid",
                          track: "The Lonely People (Are Getting Lonelier)",
                          album: "And Their Refinement of the Decline",
                        },
                        { time: "12:45", artist: "Tim Hecker", track: "Ravedeath, 1972", album: "Ravedeath, 1972" },
                        {
                          time: "18:20",
                          artist: "William Basinski",
                          track: "dlp 1.1",
                          album: "The Disintegration Loops",
                        },
                        {
                          time: "25:15",
                          artist: "Grouper",
                          track: "Heavy Water/I'd Rather Be Sleeping",
                          album: "Dragging a Dead Deer Up a Hill",
                        },
                        { time: "32:40", artist: "Fennesz", track: "Rivers of Sand", album: "Venice" },
                        { time: "38:55", artist: "Eluvium", track: "Radio Ballet", album: "Talk Amongst the Trees" },
                        { time: "45:30", artist: "Loscil", track: "Estuarine", album: "Plume" },
                      ].map((track, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#0a0e1a] cursor-pointer transition-colors"
                        >
                          <span className="text-[#a1a1aa] text-sm font-mono w-12">{track.time}</span>
                          <div className="w-8 h-8 bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] rounded flex items-center justify-center">
                            <Music className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {track.artist} - {track.track}
                            </p>
                            <p className="text-[#a1a1aa] text-sm truncate">{track.album}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#00d4ff] hover:text-white hover:bg-[#00d4ff]"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-[#a1a1aa] leading-relaxed">
                        This carefully curated collection explores the deeper territories of ambient music, focusing on
                        pieces that create immersive sonic environments. Each track has been selected for its ability to
                        transport the listener into contemplative spaces.
                      </p>
                      <p className="text-[#a1a1aa] leading-relaxed mt-4">
                        The journey begins with Brian Eno's seminal "An Ending (Ascent)", setting the tone for an
                        exploration that moves through various approaches to ambient composition - from the drone-based
                        works of Stars of the Lid to the processed guitar textures of Fennesz.
                      </p>
                      <p className="text-[#a1a1aa] leading-relaxed mt-4">
                        Special attention has been paid to the flow between tracks, ensuring smooth transitions that
                        maintain the meditative quality throughout the entire listening experience.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="analysis" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-[#00d4ff]" />
                        <h3 className="text-white font-semibold">AI-Generated Analysis</h3>
                      </div>

                      <div className="prose prose-invert max-w-none">
                        <p className="text-[#a1a1aa] leading-relaxed">
                          This ambient compilation demonstrates a sophisticated understanding of atmospheric music
                          composition, featuring works that span three decades of the genre's evolution. The selection
                          showcases the transition from early ambient pioneers to contemporary practitioners.
                        </p>

                        <h4 className="text-white font-medium mt-6 mb-3">Musical Characteristics:</h4>
                        <ul className="text-[#a1a1aa] space-y-2">
                          <li>• Predominant use of sustained tones and gradual harmonic shifts</li>
                          <li>• Average track length of 7.5 minutes, allowing for deep immersion</li>
                          <li>• Consistent use of reverb and delay effects creating spatial depth</li>
                          <li>• Minimal rhythmic elements, focusing on texture over pulse</li>
                        </ul>

                        <h4 className="text-white font-medium mt-6 mb-3">Emotional Journey:</h4>
                        <p className="text-[#a1a1aa] leading-relaxed">
                          The compilation follows an arc from contemplative opening through introspective middle
                          sections, concluding with a sense of resolution and peace. This emotional trajectory makes it
                          particularly effective for meditation, study, or late-night listening.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="related" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          title: "Ambient Soundscapes Vol. 11",
                          date: "Nov 28, 2024",
                          duration: "1h 45m",
                          similarity: "92%",
                        },
                        {
                          title: "Deep Listening Sessions #3",
                          date: "Dec 8, 2024",
                          duration: "2h 30m",
                          similarity: "87%",
                        },
                        {
                          title: "Drone Explorations",
                          date: "Oct 15, 2024",
                          duration: "3h 00m",
                          similarity: "84%",
                        },
                        {
                          title: "Minimal Compositions",
                          date: "Dec 1, 2024",
                          duration: "1h 20m",
                          similarity: "79%",
                        },
                      ].map((show, index) => (
                        <Card
                          key={index}
                          className="bg-[#0a0e1a] border-[#2a2f3e] hover:border-[#00d4ff] cursor-pointer transition-colors"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] rounded flex items-center justify-center">
                                <Music className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{show.title}</h4>
                                <div className="flex items-center gap-3 text-xs text-[#a1a1aa] mt-1">
                                  <span>{show.date}</span>
                                  <span>{show.duration}</span>
                                  <Badge className="bg-[#10b981] text-white text-xs">{show.similarity} match</Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mixcloud Player Embed */}
            <Card className="bg-[#1e2332] border-[#2a2f3e]">
              <CardHeader>
                <CardTitle className="text-white">Listen on Mixcloud</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-[#0a0e1a] rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Music className="h-12 w-12 text-[#a1a1aa] mx-auto mb-2" />
                    <p className="text-[#a1a1aa] text-sm">Mixcloud Player</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Show Stats */}
            <Card className="bg-[#1e2332] border-[#2a2f3e]">
              <CardHeader>
                <CardTitle className="text-white">Show Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-[#0a0e1a] rounded-lg">
                    <div className="text-xl font-bold text-[#00d4ff] mb-1">3.2k</div>
                    <div className="text-xs text-[#a1a1aa]">Total Plays</div>
                  </div>
                  <div className="text-center p-3 bg-[#0a0e1a] rounded-lg">
                    <div className="text-xl font-bold text-[#8b5cf6] mb-1">8</div>
                    <div className="text-xs text-[#a1a1aa]">Tracks</div>
                  </div>
                  <div className="text-center p-3 bg-[#0a0e1a] rounded-lg">
                    <div className="text-xl font-bold text-[#10b981] mb-1">4.8</div>
                    <div className="text-xs text-[#a1a1aa]">Rating</div>
                  </div>
                  <div className="text-center p-3 bg-[#0a0e1a] rounded-lg">
                    <div className="text-xl font-bold text-[#f59e0b] mb-1">127</div>
                    <div className="text-xs text-[#a1a1aa]">Favorites</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
