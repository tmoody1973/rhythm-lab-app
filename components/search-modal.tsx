"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Music, Archive, Sparkles, Clock, Play, BookOpen, User } from "lucide-react"

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  const genres = [
    { name: "Deep House", count: 234 },
    { name: "Jazz", count: 189 },
    { name: "Electronic", count: 156 },
    { name: "Ambient", count: 143 },
    { name: "Techno", count: 128 },
    { name: "Fusion", count: 98 },
  ]

  const moods = ["Energetic", "Chill", "Upbeat", "Contemplative"]
  const timeFilters = ["Today", "This Week", "This Month", "All Time"]

  const searchResults = [
    {
      type: "track",
      title: "Kerri Chandler - Rain",
      subtitle: "Played 2 hours ago • Deep House Explorations",
      aiContent: true,
      icon: Music,
    },
    {
      type: "show",
      title: "Ambient Soundscapes Vol. 12",
      subtitle: "Dec 15, 2024 • 2h 15m • Enhanced with AI",
      aiContent: true,
      icon: Archive,
    },
    {
      type: "ai-content",
      title: "The Evolution of Detroit Techno",
      subtitle: "AI Generated Blog Post • 5 min read • 1.2k views",
      aiContent: true,
      icon: BookOpen,
    },
    {
      type: "track",
      title: "Maya Jane Coles - What They Say",
      subtitle: "Played 6 hours ago • Deep House Sessions",
      aiContent: false,
      icon: Music,
    },
    {
      type: "ai-content",
      title: "Miles Davis: From Bebop to Fusion",
      subtitle: "AI Generated Deep Dive • 12 min read • 47 related tracks",
      aiContent: true,
      icon: Sparkles,
    },
    {
      type: "artist",
      title: "Floating Points",
      subtitle: "First time on RLR • 3 tracks played • Last: 6 hours ago",
      aiContent: true,
      icon: User,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] md:max-h-[80vh] bg-[#1a1f2e] border-[#2a2f3e] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[#00d4ff]" />
            Advanced Search
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </h3>

              {/* Content Type */}
              <div className="space-y-3">
                <h4 className="text-sm text-[#a1a1aa] font-medium">Content Type</h4>
                <Tabs defaultValue="all" orientation="vertical" className="w-full">
                  <TabsList className="grid w-full grid-cols-1 bg-[#0a0e1a] h-auto">
                    <TabsTrigger
                      value="all"
                      className="text-[#a1a1aa] data-[state=active]:text-[#00d4ff] data-[state=active]:bg-[#1e2332] justify-start"
                    >
                      All Content
                    </TabsTrigger>
                    <TabsTrigger
                      value="tracks"
                      className="text-[#a1a1aa] data-[state=active]:text-[#00d4ff] data-[state=active]:bg-[#1e2332] justify-start"
                    >
                      Live Tracks
                    </TabsTrigger>
                    <TabsTrigger
                      value="shows"
                      className="text-[#a1a1aa] data-[state=active]:text-[#00d4ff] data-[state=active]:bg-[#1e2332] justify-start"
                    >
                      Archive Shows
                    </TabsTrigger>
                    <TabsTrigger
                      value="ai"
                      className="text-[#a1a1aa] data-[state=active]:text-[#00d4ff] data-[state=active]:bg-[#1e2332] justify-start"
                    >
                      AI Content
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Genre Tags - Collapsible on mobile */}
              <div className="space-y-3">
                <h4 className="text-sm text-[#a1a1aa] font-medium">Genres</h4>
                <div className="space-y-2 max-h-32 lg:max-h-none overflow-y-auto">
                  {genres.map((genre) => (
                    <Button
                      key={genre.name}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between text-[#a1a1aa] hover:text-[#00d4ff] hover:bg-[#1e2332]"
                    >
                      <span>{genre.name}</span>
                      <span className="text-xs opacity-60">{genre.count}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time Filters */}
              <div className="space-y-3">
                <h4 className="text-sm text-[#a1a1aa] font-medium">Time Range</h4>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                  {timeFilters.map((filter) => (
                    <Button
                      key={filter}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-[#a1a1aa] hover:text-[#00d4ff] hover:bg-[#1e2332]"
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Mood Filters */}
              <div className="space-y-3">
                <h4 className="text-sm text-[#a1a1aa] font-medium">Mood</h4>
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <Button
                      key={mood}
                      variant="outline"
                      size="sm"
                      className="border-[#2a2f3e] text-[#a1a1aa] hover:border-[#00d4ff] hover:text-[#00d4ff] bg-transparent text-xs"
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#a1a1aa]" />
              <Input
                placeholder="Search artists, tracks, shows, or AI content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0a0e1a] border-[#2a2f3e] text-white placeholder:text-[#a1a1aa] focus:border-[#00d4ff]"
              />
            </div>

            {/* Results Grid */}
            <div className="space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#0a0e1a] border border-[#2a2f3e] rounded-lg hover:border-[#00d4ff] cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] rounded-lg flex items-center justify-center flex-shrink-0">
                    <result.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate text-sm md:text-base">{result.title}</h3>
                      {result.aiContent && <Badge className="bg-[#8b5cf6] text-white text-xs">AI</Badge>}
                      <Badge
                        variant="outline"
                        className="border-[#2a2f3e] text-[#a1a1aa] text-xs capitalize hidden sm:inline-flex"
                      >
                        {result.type === "ai-content" ? "AI Content" : result.type}
                      </Badge>
                    </div>
                    <p className="text-[#a1a1aa] text-xs md:text-sm truncate">{result.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {result.type === "track" || result.type === "show" ? (
                      <Button size="sm" variant="ghost" className="text-[#00d4ff] hover:text-white hover:bg-[#00d4ff]">
                        <Play className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[#00d4ff] hover:text-white hover:bg-[#00d4ff] text-xs md:text-sm"
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Search Stats */}
            <div className="flex items-center justify-between text-xs md:text-sm text-[#a1a1aa] pt-4 border-t border-[#2a2f3e]">
              <span>Showing 6 of 247 results</span>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Search completed in 0.12s</span>
                <span className="sm:hidden">0.12s</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
