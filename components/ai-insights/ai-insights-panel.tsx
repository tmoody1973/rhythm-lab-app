"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Users, Music, Sparkles, ExternalLink, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AIAnalysis {
  song: string
  artist: string
  reasoning: string
  connections: Array<{
    type: string
    details: Array<{
      artist?: string
      group_affiliation?: string
      role?: string
      influence?: string
      name?: string
      sampled_artist?: string
      sampled_track?: string
      sampled_elements?: string[]
    }>
  }>
  recommended_artists: Array<{
    artist_name: string
    similarity_score: number
    connection_type: string
    description: string
    evidence?: string
    time_period?: string
    genres?: string[]
    key_albums?: string[]
    discogs_search_priority?: number
  }>
  discovery_insights: {
    musical_lineage: string
    scene_connections: string
    sampling_potential?: string
    remix_culture?: string
  }
}

interface AIInsightsPanelProps {
  artistName: string
  trackName: string
  className?: string
  onArtistClick?: (artistName: string) => void
}

export function AIInsightsPanel({
  artistName,
  trackName,
  className,
  onArtistClick
}: AIInsightsPanelProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const fetchAIAnalysis = async () => {
    if (!artistName) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai-enhanced-discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          artist_name: artistName,
          track_name: trackName,
          discovery_type: 'full_analysis',
          auto_enhance: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI analysis')
      }

      const data = await response.json()

      if (data.success && data.results?.ai_recommendations) {
        setAnalysis(data.results.ai_recommendations)
      } else {
        throw new Error('No analysis data received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (expanded && !analysis && !loading) {
      fetchAIAnalysis()
    }
  }, [expanded, artistName, trackName])

  if (!expanded) {
    return (
      <Card className={cn("border-purple-200/50 bg-gradient-to-br from-purple-50/30 to-blue-50/30", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">AI Musical Insights</CardTitle>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by AI
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(true)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              Explore Connections
            </Button>
          </div>
          <CardDescription>
            Discover musical connections, collaborations, and influences for this track
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={cn("border-purple-200/50 bg-gradient-to-br from-purple-50/30 to-blue-50/30", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-xl">AI Musical Insights</CardTitle>
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by AI
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
            className="text-muted-foreground"
          >
            Collapse
          </Button>
        </div>
        <CardDescription>
          Musical connections and influences for <strong>{trackName}</strong> by <strong>{artistName}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4 animate-pulse" />
              Analyzing musical connections...
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">
              Failed to load AI insights: {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAIAnalysis}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {analysis && (
          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connections" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Connections</span>
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-1">
                <Music className="h-4 w-4" />
                <span className="hidden sm:inline">Similar Artists</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="space-y-4 mt-4">
              <ConnectionsGrid
                connections={analysis.connections || []}
                onArtistClick={onArtistClick}
              />
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4 mt-4">
              <RecommendedArtists
                artists={analysis.recommended_artists || []}
                onArtistClick={onArtistClick}
              />
            </TabsContent>

            <TabsContent value="insights" className="space-y-4 mt-4">
              <InsightsPanel insights={analysis.discovery_insights} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

// Helper components
function ConnectionsGrid({
  connections,
  onArtistClick
}: {
  connections: AIAnalysis['connections']
  onArtistClick?: (artistName: string) => void
}) {
  if (!connections || connections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No connections found for this track.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {connections.map((connection, index) => (
        <Card key={index} className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {getConnectionIcon(connection.type)}
              {connection.type.replace(/_/g, ' ')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {connection.details.map((detail, detailIndex) => (
                <div key={detailIndex} className="border-l-2 border-purple-200 pl-3 space-y-1">
                  {detail.artist && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium text-purple-600 hover:text-purple-800"
                        onClick={() => onArtistClick?.(detail.artist!)}
                      >
                        {detail.artist}
                      </Button>
                      {detail.group_affiliation && (
                        <Badge variant="outline" className="text-xs">
                          {detail.group_affiliation}
                        </Badge>
                      )}
                    </div>
                  )}
                  {detail.role && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Role:</strong> {detail.role}
                    </p>
                  )}
                  {detail.influence && (
                    <p className="text-sm">{detail.influence}</p>
                  )}
                  {detail.sampled_artist && (
                    <p className="text-sm">
                      <strong>Sampled:</strong> {detail.sampled_track} by {detail.sampled_artist}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function RecommendedArtists({
  artists,
  onArtistClick
}: {
  artists: AIAnalysis['recommended_artists']
  onArtistClick?: (artistName: string) => void
}) {
  if (!artists || artists.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No similar artists found for this track.</p>
      </div>
    )
  }

  const sortedArtists = artists.sort((a, b) => b.similarity_score - a.similarity_score)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sortedArtists.map((artist, index) => (
        <Card key={index} className="border-slate-200 hover:border-purple-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Button
                  variant="ghost"
                  className="h-auto p-0 text-left font-semibold text-purple-600 hover:text-purple-800"
                  onClick={() => onArtistClick?.(artist.artist_name)}
                >
                  {artist.artist_name}
                </Button>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(artist.similarity_score * 100)}% match
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {artist.connection_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-2">
              {artist.description}
            </p>
            {artist.evidence && (
              <p className="text-xs text-slate-600 italic">
                {artist.evidence}
              </p>
            )}
            {artist.genres && artist.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {artist.genres.slice(0, 3).map((genre, genreIndex) => (
                  <Badge key={genreIndex} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function InsightsPanel({ insights }: { insights: AIAnalysis['discovery_insights'] }) {
  if (!insights) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No insights available for this track.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {insights.musical_lineage && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Musical Lineage</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{insights.musical_lineage}</p>
          </CardContent>
        </Card>
      )}

      {insights.scene_connections && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Scene Connections</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{insights.scene_connections}</p>
          </CardContent>
        </Card>
      )}

      {insights.sampling_potential && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sampling Potential</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{insights.sampling_potential}</p>
          </CardContent>
        </Card>
      )}

      {insights.remix_culture && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Remix Culture</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{insights.remix_culture}</p>
          </CardContent>
        </Card>
      )}

      {!insights.musical_lineage && !insights.scene_connections && !insights.sampling_potential && !insights.remix_culture && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No insights available for this track.</p>
        </div>
      )}
    </div>
  )
}

function getConnectionIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'core collaboration':
      return <Users className="h-4 w-4 text-blue-500" />
    case 'production & sampling':
      return <Music className="h-4 w-4 text-green-500" />
    case 'scene connections':
      return <ExternalLink className="h-4 w-4 text-purple-500" />
    case 'influence & legacy':
      return <Sparkles className="h-4 w-4 text-yellow-500" />
    default:
      return <Music className="h-4 w-4 text-gray-500" />
  }
}