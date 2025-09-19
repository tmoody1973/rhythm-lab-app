import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Sparkles, Clock, Eye, Share, Bookmark, Music, BookOpen } from "lucide-react"
import Link from "next/link"

export default function AIContentDetailPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="text-[#a1a1aa] hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="space-y-8">
          {/* Content Header */}
          <Card className="bg-[#1e2332] border-[#2a2f3e]">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#8b5cf6] text-white">AI Generated</Badge>
                  <Badge variant="outline" className="border-[#2a2f3e] text-[#a1a1aa]">
                    Blog Post
                  </Badge>
                  <span className="text-[#a1a1aa] text-sm">Generated from: "Kerri Chandler - Rain"</span>
                </div>

                <h1 className="text-4xl font-bold text-white leading-tight">
                  The Evolution of Detroit Techno: A Journey Through Rhythm Lab Radio
                </h1>

                <p className="text-xl text-[#a1a1aa] leading-relaxed">
                  Explore how Detroit's underground techno scene shaped electronic music culture, featuring tracks and
                  artists discovered through our AI-powered curation system.
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-[#a1a1aa]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />5 min read
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      1.2k views
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-[#b12e2e]" />
                      Generated 2 hours ago
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#2a2f3e] text-white hover:bg-[#1e2332] bg-transparent"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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

          {/* Main Content */}
          <Card className="bg-[#1e2332] border-[#2a2f3e]">
            <CardContent className="p-8">
              <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-[#a1a1aa] leading-relaxed text-lg">
                  Detroit techno emerged in the mid-1980s as a revolutionary force in electronic music, born from the
                  industrial landscape of Motor City and the creative vision of three pioneering artists: Juan Atkins,
                  Derrick May, and Kevin Saunderson. This triumvirate, known as the "Belleville Three," would lay the
                  foundation for a genre that continues to influence electronic music worldwide.
                </p>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">The Birth of a Movement</h2>

                <p className="text-[#a1a1aa] leading-relaxed">
                  The story begins in the suburbs of Detroit, where young African American musicians were experimenting
                  with synthesizers, drum machines, and the futuristic sounds of Kraftwerk and Giorgio Moroder. Unlike
                  the house music emerging from Chicago, Detroit techno was characterized by its mechanical precision,
                  futuristic themes, and the stark beauty of industrial decay.
                </p>

                <p className="text-[#a1a1aa] leading-relaxed">
                  Juan Atkins, often called the "Godfather of Techno," released tracks under various aliases including
                  Cybotron and Model 500. His 1985 track "No UFOs" perfectly encapsulated the Detroit sound: cold,
                  mechanical, yet deeply soulful. This duality would become a hallmark of the genre.
                </p>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">The Underground Network</h2>

                <p className="text-[#a1a1aa] leading-relaxed">
                  What made Detroit techno special wasn't just the music—it was the community. Underground parties in
                  abandoned warehouses, the legendary Music Institute, and pirate radio stations created a network of
                  dedicated followers. DJs like Jeff Mills and Carl Craig pushed the boundaries further, creating
                  increasingly complex and experimental sounds.
                </p>

                <div className="bg-[#0a0e1a] border border-[#2a2f3e] rounded-lg p-6 my-8">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Music className="h-5 w-5 text-[#b12e2e]" />
                    Featured Tracks from Our Archive
                  </h3>
                  <div className="space-y-2">
                    {[
                      "Juan Atkins - No UFOs (Model 500)",
                      "Derrick May - Strings of Life",
                      "Kevin Saunderson - Good Life (Inner City)",
                      "Jeff Mills - The Bells",
                      "Carl Craig - Bug in the Bassbin",
                    ].map((track, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#b12e2e] rounded-full"></div>
                        <span className="text-[#a1a1aa]">{track}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">Global Influence and Evolution</h2>

                <p className="text-[#a1a1aa] leading-relaxed">
                  By the early 1990s, Detroit techno had found its way to Europe, where it was embraced by underground
                  scenes in Berlin, London, and beyond. The genre evolved, spawning subgenres like minimal techno, acid
                  techno, and industrial techno, each carrying the DNA of those original Detroit productions.
                </p>

                <p className="text-[#a1a1aa] leading-relaxed">
                  Today, through platforms like Rhythm Lab Radio, we can trace these connections in real-time. Our AI
                  curation system identifies the threads that connect a contemporary deep house track like Kerri
                  Chandler's "Rain" back to those foundational Detroit techno records, revealing the ongoing influence
                  of this revolutionary movement.
                </p>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">The Legacy Continues</h2>

                <p className="text-[#a1a1aa] leading-relaxed">
                  Detroit techno's influence extends far beyond electronic music. Its themes of technological optimism
                  mixed with urban decay, its DIY ethos, and its vision of music as a form of resistance continue to
                  resonate with artists worldwide. From the minimal techno of Berlin to the experimental electronics of
                  contemporary producers, the spirit of Detroit lives on.
                </p>

                <p className="text-[#a1a1aa] leading-relaxed">
                  As we continue to explore these connections through Rhythm Lab Radio's archive and live programming,
                  we're reminded that electronic music is not just about beats and synthesizers—it's about community,
                  innovation, and the endless possibility of sound.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Related Content */}
          <Card className="bg-[#1e2332] border-[#2a2f3e]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#b12e2e]" />
                Related AI Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: "The Chicago House Connection",
                    type: "Deep Dive",
                    readTime: "8 min read",
                    views: "892",
                  },
                  {
                    title: "Underground Resistance: Music as Activism",
                    type: "Blog Post",
                    readTime: "6 min read",
                    views: "1.1k",
                  },
                  {
                    title: "Jeff Mills: The Wizard's Journey",
                    type: "Artist Profile",
                    readTime: "12 min read",
                    views: "2.3k",
                  },
                  {
                    title: "Berlin Techno: The Second Wave",
                    type: "Deep Dive",
                    readTime: "15 min read",
                    views: "1.8k",
                  },
                ].map((content, index) => (
                  <Card
                    key={index}
                    className="bg-[#0a0e1a] border-[#2a2f3e] hover:border-[#b12e2e] cursor-pointer transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#8b5cf6] text-white text-xs">AI Generated</Badge>
                          <Badge variant="outline" className="border-[#2a2f3e] text-[#a1a1aa] text-xs">
                            {content.type}
                          </Badge>
                        </div>
                        <h3 className="text-white font-medium">{content.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
                          <span>{content.readTime}</span>
                          <span>{content.views} views</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
