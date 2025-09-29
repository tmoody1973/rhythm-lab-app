"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Music,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  PlayCircle,
  GitBranch,
  Network,
  Zap
} from 'lucide-react'

interface AIAnalysis {
  connections: Array<{
    type: string
    details: Array<{
      artist?: string
      group_affiliation?: string
      role?: string
      influence?: string
      sampled_artist?: string
      sampled_track?: string
    }>
  }>
  recommended_artists: Array<{
    artist_name: string
    similarity_score: number
    connection_type: string
    description: string
    evidence?: string
    genres?: string[]
  }>
  discovery_insights: {
    musical_lineage: string
    scene_connections: string
    sampling_potential?: string
    remix_culture?: string
  }
}

interface TrackData {
  track: string
  artist: string
  featured_artists?: string[]
  remixers?: string[]
  producers?: string[]
  collaborators?: string[]
  related_artists?: string[]
  has_collaborations?: boolean
  collaboration_count?: number
}

interface AIEnhancedInfluenceGraphProps {
  trackData: TrackData
  onArtistClick?: (artistName: string) => void
}

export function AIEnhancedInfluenceGraph({
  trackData,
  onArtistClick
}: AIEnhancedInfluenceGraphProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { track, artist, has_collaborations = false, collaboration_count = 0 } = trackData

  // Fetch AI analysis when expanded
  const fetchAIAnalysis = async () => {
    if (!artist) return

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
          artist_name: artist,
          track_name: track,
          discovery_type: 'full_analysis',
          auto_enhance: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch AI analysis')
      }

      const data = await response.json()

      if (data.success && data.results?.ai_recommendations) {
        setAiAnalysis(data.results.ai_recommendations)
      } else {
        throw new Error('No AI analysis available')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI analysis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isExpanded && !aiAnalysis && !loading && !error) {
      fetchAIAnalysis()
    }
  }, [isExpanded, artist, track])

  // Combine traditional collaborations with AI recommendations
  const getAllConnectedArtists = () => {
    const traditional = [
      ...(trackData.featured_artists || []),
      ...(trackData.remixers || []),
      ...(trackData.producers || []),
      ...(trackData.collaborators || []),
      ...(trackData.related_artists || [])
    ]

    const aiRecommended = aiAnalysis?.recommended_artists?.map(rec => rec.artist_name) || []

    // Get unique artists
    const allArtists = [...new Set([...traditional, ...aiRecommended])]
    return allArtists.filter(name => name !== artist) // Exclude main artist
  }

  const getConnectionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'core collaboration':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'production & sampling':
        return <Music className="h-4 w-4 text-green-500" />
      case 'scene connections':
        return <Network className="h-4 w-4 text-purple-500" />
      case 'influence & legacy':
        return <Sparkles className="h-4 w-4 text-yellow-500" />
      default:
        return <GitBranch className="h-4 w-4 text-gray-500" />
    }
  }

  const getConnectionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'collaboration': return 'bg-blue-500'
      case 'scene_mate': return 'bg-purple-500'
      case 'influence': return 'bg-yellow-500'
      case 'remix': return 'bg-green-500'
      case 'production': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  if (!has_collaborations && !artist) {
    return null
  }

  const totalConnections = getAllConnectedArtists().length

  return (
    <Card className="mt-4 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg text-purple-800">AI-Enhanced Artist Network</CardTitle>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              {totalConnections} connections
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600 hover:text-purple-800"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
        <CardDescription className="text-sm text-purple-600">
          Discover traditional collaborations and AI-powered musical connections for "{track}"
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4 animate-pulse" />
                Analyzing musical connections...
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">Failed to load AI analysis: {error}</p>
              <Button variant="outline" size="sm" onClick={fetchAIAnalysis} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && (
            <Tabs defaultValue="network" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="network" className="flex items-center gap-1">
                  <Network className="h-4 w-4" />
                  <span className="hidden sm:inline">Network</span>
                </TabsTrigger>
                <TabsTrigger value="connections" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Connections</span>
                </TabsTrigger>
                <TabsTrigger value="recommendations" className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Similar Artists</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="network" className="space-y-4 mt-4">
                <NetworkVisualization
                  artist={artist}
                  trackData={trackData}
                  aiAnalysis={aiAnalysis}
                  onArtistClick={onArtistClick}
                />
              </TabsContent>

              <TabsContent value="connections" className="space-y-4 mt-4">
                {aiAnalysis?.connections ? (
                  <AIConnectionsGrid
                    connections={aiAnalysis.connections}
                    onArtistClick={onArtistClick}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>AI analysis not available. Click Try Again above to load connections.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4 mt-4">
                {aiAnalysis?.recommended_artists ? (
                  <AIRecommendationsGrid
                    artists={aiAnalysis.recommended_artists}
                    onArtistClick={onArtistClick}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>AI recommendations not available. Click Try Again above to load similar artists.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Network visualization component
function NetworkVisualization({
  artist,
  trackData,
  aiAnalysis,
  onArtistClick
}: {
  artist: string
  trackData: TrackData
  aiAnalysis: AIAnalysis | null
  onArtistClick?: (artistName: string) => void
}) {
  // Combine traditional and AI-powered connections
  const traditionalConnections = [
    { type: 'Featured Artists', artists: trackData.featured_artists || [], color: 'bg-blue-100 text-blue-800' },
    { type: 'Remixers', artists: trackData.remixers || [], color: 'bg-purple-100 text-purple-800' },
    { type: 'Producers', artists: trackData.producers || [], color: 'bg-green-100 text-green-800' },
    { type: 'Collaborators', artists: trackData.collaborators || [], color: 'bg-orange-100 text-orange-800' }
  ].filter(rel => rel.artists.length > 0)

  const aiRecommendations = aiAnalysis?.recommended_artists?.slice(0, 6) || []

  return (
    <div className="space-y-6">
      {/* Network Center */}
      <div className="bg-white rounded-lg p-6 border border-purple-100">
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-semibold">
            {artist}
          </div>
          <div className="text-xs text-gray-500 mt-2">Primary Artist</div>
        </div>

        {/* Traditional Connections */}
        {traditionalConnections.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Music className="w-4 h-4" />
              Direct Collaborations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {traditionalConnections.map((relType) => (
                <div key={relType.type} className="space-y-2">
                  <Badge className={`${relType.color} text-xs`}>
                    {relType.type}
                  </Badge>
                  <div className="space-y-1">
                    {relType.artists.map((artistName, index) => (
                      <Button
                        key={`${artistName}-${index}`}
                        variant="ghost"
                        size="sm"
                        className="h-auto p-2 text-left w-full justify-start"
                        onClick={() => onArtistClick?.(artistName)}
                      >
                        <div className="text-sm font-medium truncate">{artistName}</div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {aiRecommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              AI-Discovered Connections
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiRecommendations.map((rec, index) => (
                <Card key={rec.artist_name} className="p-3 hover:shadow-md transition-shadow border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium text-purple-600 hover:text-purple-800 text-left"
                        onClick={() => onArtistClick?.(rec.artist_name)}
                      >
                        {rec.artist_name}
                      </Button>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(rec.similarity_score * 100)}%
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {rec.connection_type.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {rec.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {aiAnalysis?.discovery_insights && (
          <div className="mt-6 bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="text-sm font-medium text-purple-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Network Insights
            </div>
            <div className="text-xs text-purple-700 space-y-2">
              {aiAnalysis.discovery_insights.musical_lineage && (
                <div>
                  <strong>Musical Lineage:</strong> {aiAnalysis.discovery_insights.musical_lineage.slice(0, 150)}...
                </div>
              )}
              {aiAnalysis.discovery_insights.scene_connections && (
                <div>
                  <strong>Scene Connections:</strong> {aiAnalysis.discovery_insights.scene_connections.slice(0, 150)}...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// AI Connections component
function AIConnectionsGrid({
  connections,
  onArtistClick
}: {
  connections: AIAnalysis['connections']
  onArtistClick?: (artistName: string) => void
}) {
  if (!connections || connections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No AI connections found for this track.</p>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium text-purple-600 hover:text-purple-800"
                      onClick={() => onArtistClick?.(detail.artist!)}
                    >
                      {detail.artist}
                    </Button>
                  )}
                  {detail.role && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Role:</strong> {detail.role}
                    </p>
                  )}
                  {detail.influence && (
                    <p className="text-sm">{detail.influence}</p>
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

// AI Recommendations component
function AIRecommendationsGrid({
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

// Helper function for connection icons
function getConnectionIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'core collaboration':
      return <Users className="h-4 w-4 text-blue-500" />
    case 'production & sampling':
      return <Music className="h-4 w-4 text-green-500" />
    case 'scene connections':
      return <Network className="h-4 w-4 text-purple-500" />
    case 'influence & legacy':
      return <Sparkles className="h-4 w-4 text-yellow-500" />
    default:
      return <Music className="h-4 w-4 text-gray-500" />
  }
}