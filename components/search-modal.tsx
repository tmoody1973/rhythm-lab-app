"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, Filter } from "lucide-react"
import { AlgoliaSearchContainer, SearchProvider } from "@/components/algolia/algolia-search-container"
import { SearchInput } from "@/components/algolia/search-input"
import { SearchResults } from "@/components/algolia/search-results"
import { SearchFilters } from "@/components/algolia/search-filters"
import { FacetedSearch } from "@/components/algolia/faceted-search"

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [searchType, setSearchType] = useState<'songs' | 'content'>('songs')

  // Handle tab changes to switch between search types
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "tracks") {
      setSearchType('songs')
    } else if (value === "shows" || value === "ai") {
      setSearchType('content')
    }
  }

  // Handle result clicks
  const handleResultClick = (result: any) => {
    console.log('Result clicked:', result)
    // Implement result action logic here
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-6xl max-h-[90vh] md:max-h-[85vh] bg-[#1a1f2e] border-[#2a2f3e] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[#b12e2e]" />
            Advanced Search
          </DialogTitle>
        </DialogHeader>

        <SearchProvider initialIndex={searchType}>
          <div className="flex flex-col h-full">
            {/* Content Type Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-[#0a0e1a] mb-6">
                <TabsTrigger
                  value="all"
                  className="text-[#a1a1aa] data-[state=active]:text-[#b12e2e] data-[state=active]:bg-[#1e2332]"
                >
                  All Content
                </TabsTrigger>
                <TabsTrigger
                  value="tracks"
                  className="text-[#a1a1aa] data-[state=active]:text-[#b12e2e] data-[state=active]:bg-[#1e2332]"
                >
                  Live Tracks
                </TabsTrigger>
                <TabsTrigger
                  value="shows"
                  className="text-[#a1a1aa] data-[state=active]:text-[#b12e2e] data-[state=active]:bg-[#1e2332]"
                >
                  Archive Shows
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="text-[#a1a1aa] data-[state=active]:text-[#b12e2e] data-[state=active]:bg-[#1e2332]"
                >
                  AI Content
                </TabsTrigger>
              </TabsList>

              {/* Search Content */}
              <TabsContent value="all" className="flex-1 mt-0">
                <AlgoliaSearchContainer indexName="songs">
                  <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 h-full">
                    {/* Filter Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-4 w-4 text-[#b12e2e]" />
                        <h3 className="text-white font-medium">Filters</h3>
                      </div>
                      <FacetedSearch searchType="songs" />
                    </div>

                    {/* Search Results */}
                    <div className="lg:col-span-3 space-y-4 flex flex-col">
                      {/* Search Input */}
                      <SearchInput
                        placeholder="Search artists, tracks, shows, or AI content..."
                        autoFocus={open}
                      />

                      {/* Results */}
                      <div className="flex-1 overflow-hidden">
                        <SearchResults
                          resultType="mixed"
                          onResultClick={handleResultClick}
                          className="h-full"
                        />
                      </div>
                    </div>
                  </div>
                </AlgoliaSearchContainer>
              </TabsContent>

              <TabsContent value="tracks" className="flex-1 mt-0">
                <AlgoliaSearchContainer indexName="songs">
                  <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 h-full">
                    {/* Filter Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                      <SearchFilters searchType="songs" />
                    </div>

                    {/* Search Results */}
                    <div className="lg:col-span-3 space-y-4 flex flex-col">
                      <SearchInput
                        placeholder="Search tracks, artists, albums..."
                        autoFocus={open && activeTab === "tracks"}
                      />
                      <div className="flex-1 overflow-hidden">
                        <SearchResults
                          resultType="songs"
                          onResultClick={handleResultClick}
                          className="h-full"
                        />
                      </div>
                    </div>
                  </div>
                </AlgoliaSearchContainer>
              </TabsContent>

              <TabsContent value="shows" className="flex-1 mt-0">
                <AlgoliaSearchContainer indexName="content">
                  <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 h-full">
                    {/* Filter Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                      <SearchFilters searchType="content" />
                    </div>

                    {/* Search Results */}
                    <div className="lg:col-span-3 space-y-4 flex flex-col">
                      <SearchInput
                        placeholder="Search shows, episodes, playlists..."
                        autoFocus={open && activeTab === "shows"}
                      />
                      <div className="flex-1 overflow-hidden">
                        <SearchResults
                          resultType="content"
                          onResultClick={handleResultClick}
                          className="h-full"
                        />
                      </div>
                    </div>
                  </div>
                </AlgoliaSearchContainer>
              </TabsContent>

              <TabsContent value="ai" className="flex-1 mt-0">
                <AlgoliaSearchContainer indexName="content">
                  <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 h-full">
                    {/* Filter Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                      <SearchFilters searchType="content" />
                    </div>

                    {/* Search Results */}
                    <div className="lg:col-span-3 space-y-4 flex flex-col">
                      <SearchInput
                        placeholder="Search AI-generated content, blog posts, deep dives..."
                        autoFocus={open && activeTab === "ai"}
                      />
                      <div className="flex-1 overflow-hidden">
                        <SearchResults
                          resultType="content"
                          onResultClick={handleResultClick}
                          className="h-full"
                        />
                      </div>
                    </div>
                  </div>
                </AlgoliaSearchContainer>
              </TabsContent>
            </Tabs>
          </div>
        </SearchProvider>
      </DialogContent>
    </Dialog>
  )
}
