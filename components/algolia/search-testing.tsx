"use client"

import React, { useState } from 'react'
import { AlgoliaSearchContainer } from './algolia-search-container'
import { SearchInput } from './search-input'
import { SearchResults } from './search-results'
import { SearchFilters } from './search-filters'
import { FacetedSearch } from './faceted-search'
import { configureSearchIndices, getIndexStats } from '@/lib/algolia/indices'
import { indexSongs, indexContent } from '@/lib/algolia/indexing'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, TestTube, Database, Settings, BarChart3 } from 'lucide-react'

// Test data for songs
const testSongs = [
  {
    objectID: 'test-song-1',
    title: 'Deep House Vibes',
    artist: 'DJ Test',
    album: 'Test Album',
    genre: ['deep house', 'electronic'],
    mood: ['chill', 'contemplative'],
    year: 2024,
    duration: 240,
    show_title: 'Deep House Explorations',
    show_date: '2024-01-15',
    timeframe: 'evening',
    play_time: '2024-01-15T20:30:00Z',
    has_artwork: true,
    energy_level: 7,
    bpm: 120,
    ai_enhanced: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    objectID: 'test-song-2',
    title: 'Jazz Fusion Experiment',
    artist: 'The Fusion Collective',
    album: 'Modern Jazz',
    genre: ['jazz', 'fusion'],
    mood: ['energetic', 'contemplative'],
    year: 2023,
    duration: 320,
    show_title: 'Jazz Sessions',
    show_date: '2024-01-10',
    timeframe: 'afternoon',
    play_time: '2024-01-10T15:45:00Z',
    has_artwork: false,
    energy_level: 8,
    bpm: 140,
    ai_enhanced: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Test data for content
const testContent = [
  {
    objectID: 'test-content-1',
    title: 'The Evolution of Electronic Music',
    content_type: 'blog_post' as const,
    slug: 'evolution-electronic-music',
    excerpt: 'A deep dive into how electronic music has evolved over the decades',
    content: 'Electronic music has undergone tremendous changes since its inception...',
    author: 'Music Historian',
    category: 'Music History',
    tags: ['electronic', 'history', 'evolution'],
    publish_date: '2024-01-20',
    url: '/blog/evolution-electronic-music',
    ai_generated: true,
    view_count: 1250,
    genre: ['electronic'],
    mood: ['educational'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    objectID: 'test-content-2',
    title: 'Artist Profile: Floating Points',
    content_type: 'artist_profile' as const,
    slug: 'floating-points-profile',
    excerpt: 'Exploring the innovative sound of Sam Shepherd, aka Floating Points',
    content: 'Sam Shepherd, known professionally as Floating Points, is a British...',
    author: 'AI Assistant',
    category: 'Artist Profiles',
    tags: ['floating points', 'electronic', 'ambient'],
    publish_date: '2024-01-18',
    url: '/profiles/floating-points',
    ai_generated: true,
    view_count: 890,
    genre: ['electronic', 'ambient'],
    mood: ['contemplative', 'dreamy'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export function SearchTesting() {
  const [indexStats, setIndexStats] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Configure indices
  const handleConfigureIndices = async () => {
    setIsLoading(true)
    try {
      const result = await configureSearchIndices()
      setTestResults(prev => [...prev, {
        test: 'Configure Indices',
        success: result.success,
        message: result.message || result.error,
        timestamp: new Date().toISOString()
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Configure Indices',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }])
    }
    setIsLoading(false)
  }

  // Index test data
  const handleIndexTestData = async () => {
    setIsLoading(true)
    try {
      // Index songs
      const songsResult = await indexSongs(testSongs as any)

      // Index content
      const contentResult = await indexContent(testContent as any)

      setTestResults(prev => [...prev, {
        test: 'Index Test Data',
        success: songsResult.success && contentResult.success,
        message: `Indexed ${songsResult.indexed} songs and ${contentResult.indexed} content items`,
        timestamp: new Date().toISOString()
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Index Test Data',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }])
    }
    setIsLoading(false)
  }

  // Get index statistics
  const handleGetStats = async () => {
    setIsLoading(true)
    try {
      const stats = await getIndexStats()
      setIndexStats(stats)
      setTestResults(prev => [...prev, {
        test: 'Get Index Stats',
        success: true,
        message: `Songs: ${stats.songs.records} records, Content: ${stats.content.records} records`,
        timestamp: new Date().toISOString()
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Get Index Stats',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }])
    }
    setIsLoading(false)
  }

  // Test search functionality
  const handleTestSearch = () => {
    setTestResults(prev => [...prev, {
      test: 'Search Functionality',
      success: true,
      message: 'Search components loaded successfully. Try searching below.',
      timestamp: new Date().toISOString()
    }])
  }

  return (
    <div className="space-y-6 p-6 bg-[#1a1f2e] text-white">
      <div className="flex items-center gap-2 mb-6">
        <TestTube className="h-6 w-6 text-[#b12e2e]" />
        <h1 className="text-2xl font-bold">Algolia Search Testing</h1>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#0a0e1a]">
          <TabsTrigger value="setup" className="data-[state=active]:bg-[#b12e2e]">
            <Settings className="h-4 w-4 mr-2" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="data" className="data-[state=active]:bg-[#b12e2e]">
            <Database className="h-4 w-4 mr-2" />
            Data
          </TabsTrigger>
          <TabsTrigger value="test" className="data-[state=active]:bg-[#b12e2e]">
            <Play className="h-4 w-4 mr-2" />
            Test
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-[#b12e2e]">
            <BarChart3 className="h-4 w-4 mr-2" />
            Stats
          </TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4">
          <Card className="p-6 bg-[#0a0e1a] border-[#2a2f3e]">
            <h3 className="text-lg font-semibold mb-4">Index Configuration</h3>
            <p className="text-[#a1a1aa] mb-4">
              Configure your Algolia search indices with the proper settings for optimal search performance.
            </p>
            <Button
              onClick={handleConfigureIndices}
              disabled={isLoading}
              className="bg-[#b12e2e] hover:bg-[#8b1e1e]"
            >
              Configure Indices
            </Button>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card className="p-6 bg-[#0a0e1a] border-[#2a2f3e]">
            <h3 className="text-lg font-semibold mb-4">Test Data</h3>
            <p className="text-[#a1a1aa] mb-4">
              Index sample data to test search functionality. This includes sample songs and content.
            </p>
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <strong>Sample Songs:</strong> {testSongs.length} items
              </div>
              <div className="text-sm">
                <strong>Sample Content:</strong> {testContent.length} items
              </div>
            </div>
            <Button
              onClick={handleIndexTestData}
              disabled={isLoading}
              className="bg-[#b12e2e] hover:bg-[#8b1e1e]"
            >
              Index Test Data
            </Button>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card className="p-6 bg-[#0a0e1a] border-[#2a2f3e]">
            <h3 className="text-lg font-semibold mb-4">Search Testing</h3>
            <Button
              onClick={handleTestSearch}
              className="bg-[#b12e2e] hover:bg-[#8b1e1e] mb-4"
            >
              Initialize Search Test
            </Button>

            {/* Search Interface Test */}
            <div className="border border-[#2a2f3e] rounded-lg p-4">
              <AlgoliaSearchContainer indexName="songs">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1">
                    <FacetedSearch searchType="songs" />
                  </div>
                  <div className="lg:col-span-3 space-y-4">
                    <SearchInput placeholder="Test search functionality..." />
                    <SearchResults
                      resultType="songs"
                      usePagination={true}
                      useInfiniteScroll={false}
                    />
                  </div>
                </div>
              </AlgoliaSearchContainer>
            </div>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <Card className="p-6 bg-[#0a0e1a] border-[#2a2f3e]">
            <h3 className="text-lg font-semibold mb-4">Index Statistics</h3>
            <Button
              onClick={handleGetStats}
              disabled={isLoading}
              className="bg-[#b12e2e] hover:bg-[#8b1e1e] mb-4"
            >
              Refresh Stats
            </Button>

            {indexStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1a1f2e] p-4 rounded-lg border border-[#2a2f3e]">
                  <h4 className="font-medium mb-2">Songs Index</h4>
                  <div className="space-y-1 text-sm text-[#a1a1aa]">
                    <div>Records: {indexStats.songs.records}</div>
                    <div>Size: {indexStats.songs.size} bytes</div>
                    <div>File Size: {indexStats.songs.fileSize} bytes</div>
                  </div>
                </div>
                <div className="bg-[#1a1f2e] p-4 rounded-lg border border-[#2a2f3e]">
                  <h4 className="font-medium mb-2">Content Index</h4>
                  <div className="space-y-1 text-sm text-[#a1a1aa]">
                    <div>Records: {indexStats.content.records}</div>
                    <div>Size: {indexStats.content.size} bytes</div>
                    <div>File Size: {indexStats.content.fileSize} bytes</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="p-6 bg-[#0a0e1a] border-[#2a2f3e]">
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#1a1f2e] rounded border border-[#2a2f3e]">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={result.success ? "default" : "destructive"}
                    className={result.success ? "bg-green-600" : "bg-red-600"}
                  >
                    {result.success ? "PASS" : "FAIL"}
                  </Badge>
                  <span className="font-medium">{result.test}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#a1a1aa]">{result.message}</div>
                  <div className="text-xs text-[#6b7280]">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}