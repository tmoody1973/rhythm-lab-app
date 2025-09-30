"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Users,
  Music,
  Brain,
  Sparkles,
  Network,
  TrendingUp,
  ExternalLink,
  PlayCircle,
  ArrowUpRight,
  Star
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

interface UnifiedAIInsightsProps {
  trackData: TrackData
  onArtistClick?: (artistName: string) => void
  className?: string
}

export function UnifiedAIInsights({
  trackData,
  onArtistClick,
  className = ""
}: UnifiedAIInsightsProps) {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [streamingStatus, setStreamingStatus] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)
  const [partialData, setPartialData] = useState<{
    recommended_artists?: AIAnalysis['recommended_artists']
    discovery_insights?: AIAnalysis['discovery_insights']
    connections?: AIAnalysis['connections']
  }>({})

  const { track, artist } = trackData

  // Streaming AI analysis fetch
  const fetchStreamingAIAnalysis = async () => {
    if (!artist) return

    setLoading(true)
    setError(null)
    setStreamingStatus('Initializing...')
    setProgress(0)
    setPartialData({})

    try {
      const response = await fetch('/api/ai-enhanced-discovery/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          artist_name: artist,
          track_name: track,
          force_refresh: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start streaming analysis')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get stream reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete messages
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              switch (data.type) {
                case 'status':
                  setStreamingStatus(data.data.message)
                  setProgress(data.data.progress || 0)
                  break

                case 'partial_result':
                  // Update partial data as it arrives
                  setPartialData(prev => ({
                    ...prev,
                    [data.data.type]: data.data.data
                  }))
                  break

                case 'final_result':
                  if (data.data.success && data.data.ai_recommendations) {
                    setAiAnalysis(data.data.ai_recommendations)
                    setStreamingStatus('Complete!')
                    setProgress(100)
                  }
                  break

                case 'error':
                  throw new Error(data.data.message)
              }
            } catch (parseError) {
              console.error('Failed to parse stream data:', parseError)
            }
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI analysis')
      setStreamingStatus('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isExpanded && !aiAnalysis && !loading && !error) {
      fetchStreamingAIAnalysis()
    }
  }, [isExpanded, artist, track])

  // Get top recommended artists for quick display
  const topRecommendedArtists = aiAnalysis?.recommended_artists
    ?.sort((a, b) => b.similarity_score - a.similarity_score)
    ?.slice(0, 6) || []

  if (!isExpanded) {
    return (
      <Card className={`border-purple-200 bg-gradient-to-r from-purple-50/50 to-blue-50/50 ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Musical Discovery</CardTitle>
                <CardDescription className="text-sm">
                  Discover connections, influences, and similar artists powered by AI
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setIsExpanded(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Explore Network
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-blue-50/50 mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Musical Discovery</CardTitle>
                <CardDescription>
                  Musical connections and influences for <strong>"{track}"</strong> by <strong>{artist}</strong>
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsExpanded(false)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              Collapse
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 animate-pulse text-purple-600" />
                <CardTitle>
                  {streamingStatus || 'Analyzing musical connections...'}
                </CardTitle>
              </div>
              {progress > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Show partial data as it arrives */}
              {partialData.recommended_artists && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    AI-Discovered Similar Artists (Loading...)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {partialData.recommended_artists.slice(0, 6).map((rec, index) => (
                      <div key={rec.artist_name} className="group">
                        <Card className="p-4 border border-gray-200 animate-fade-in">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-purple-600">
                                {rec.artist_name}
                              </h5>
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback skeleton if no partial data yet */}
              {!partialData.recommended_artists && (
                <>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <Brain className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-red-800">Failed to load AI insights</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={fetchStreamingAIAnalysis}
              className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && aiAnalysis && (
        <FullWidthAILayout
          trackData={trackData}
          aiAnalysis={aiAnalysis}
          onArtistClick={onArtistClick}
          onRetry={fetchStreamingAIAnalysis}
        />
      )}
    </div>
  )
}

// Full-width layout component that uses modern CSS Grid
function FullWidthAILayout({
  trackData,
  aiAnalysis,
  onArtistClick,
  onRetry
}: {
  trackData: TrackData
  aiAnalysis: AIAnalysis
  onArtistClick?: (artistName: string) => void
  onRetry?: () => void
}) {
  const topRecommendations = aiAnalysis.recommended_artists
    ?.sort((a, b) => b.similarity_score - a.similarity_score)
    ?.slice(0, 6) || []

  return (
    <div className="w-full space-y-6">
      {/* Main Grid Layout - Desktop: 3 columns, Tablet: 2 columns, Mobile: 1 column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column - Artist Network Visualization (Main Focus) */}
        <div className="lg:col-span-8 space-y-6">
          <NetworkVisualization
            artist={trackData.artist}
            trackData={trackData}
            aiAnalysis={aiAnalysis}
            onArtistClick={onArtistClick}
          />

          {/* Musical Insights */}
          {aiAnalysis.discovery_insights && (
            <InsightsSection insights={aiAnalysis.discovery_insights} onRetry={onRetry} />
          )}
        </div>

        {/* Right Sidebar - Similar Artists & Quick Info */}
        <div className="lg:col-span-4 space-y-6">
          <SimilarArtistsSidebar
            artists={topRecommendations}
            onArtistClick={onArtistClick}
          />

          {/* Connection Types Summary */}
          <ConnectionTypesSummary connections={aiAnalysis.connections || []} />
        </div>
      </div>
    </div>
  )
}

// Network visualization - the main centerpiece
function NetworkVisualization({
  artist,
  trackData,
  aiAnalysis,
  onArtistClick
}: {
  artist: string
  trackData: TrackData
  aiAnalysis: AIAnalysis
  onArtistClick?: (artistName: string) => void
}) {
  const topRecommendations = aiAnalysis.recommended_artists?.slice(0, 6) || []

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5 text-purple-600" />
          Musical Network
        </CardTitle>
        <CardDescription>
          AI-discovered connections and traditional collaborations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Center Artist */}
          <div className="text-center">
            <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg">
              {artist}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Primary Artist</p>
          </div>

          {/* AI-Discovered Similar Artists */}
          {topRecommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                AI-Discovered Similar Artists
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topRecommendations.map((rec, index) => (
                  <div key={rec.artist_name} className="group">
                    <Card className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-purple-300"
                          onClick={() => onArtistClick?.(rec.artist_name)}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-purple-600 group-hover:text-purple-800 transition-colors">
                            {rec.artist_name}
                          </h5>
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Traditional Collaborations */}
          <TraditionalCollaborations trackData={trackData} onArtistClick={onArtistClick} />
        </div>
      </CardContent>
    </Card>
  )
}

// Traditional collaborations section
function TraditionalCollaborations({
  trackData,
  onArtistClick
}: {
  trackData: TrackData
  onArtistClick?: (artistName: string) => void
}) {
  const collaborations = [
    { type: 'Featured Artists', artists: trackData.featured_artists || [], color: 'bg-blue-100 text-blue-800' },
    { type: 'Remixers', artists: trackData.remixers || [], color: 'bg-purple-100 text-purple-800' },
    { type: 'Producers', artists: trackData.producers || [], color: 'bg-green-100 text-green-800' },
    { type: 'Collaborators', artists: trackData.collaborators || [], color: 'bg-orange-100 text-orange-800' }
  ].filter(rel => rel.artists.length > 0)

  if (collaborations.length === 0) return null

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
        <Music className="w-4 h-4" />
        Direct Collaborations
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collaborations.map((collab) => (
          <div key={collab.type} className="space-y-2">
            <Badge className={`${collab.color} text-xs`}>
              {collab.type}
            </Badge>
            <div className="space-y-1">
              {collab.artists.map((artistName, index) => (
                <Button
                  key={`${artistName}-${index}`}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 text-left w-full justify-start hover:bg-purple-50"
                  onClick={() => onArtistClick?.(artistName)}
                >
                  <span className="text-sm font-medium truncate">{artistName}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Similar artists sidebar
function SimilarArtistsSidebar({
  artists,
  onArtistClick
}: {
  artists: AIAnalysis['recommended_artists']
  onArtistClick?: (artistName: string) => void
}) {
  if (!artists || artists.length === 0) return null

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Similar Artists
        </CardTitle>
        <CardDescription>AI-powered recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {artists.map((artist, index) => (
          <div key={artist.artist_name} className="group">
            <Button
              variant="ghost"
              className="w-full p-4 h-auto justify-start hover:bg-purple-50 text-left"
              onClick={() => onArtistClick?.(artist.artist_name)}
            >
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-purple-600 group-hover:text-purple-800">
                    {artist.artist_name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(artist.similarity_score * 100)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs truncate max-w-[120px]">
                    {artist.connection_type.replace(/_/g, ' ')}
                  </Badge>
                  {artist.genres && artist.genres.slice(0, 2).map((genre, i) => (
                    <Badge key={i} variant="outline" className="text-xs truncate max-w-[100px]">
                      {genre}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {artist.description}
                </p>
              </div>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Connection types summary
function ConnectionTypesSummary({
  connections
}: {
  connections: AIAnalysis['connections']
}) {
  if (!connections || connections.length === 0) return null

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Connection Types
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {connections.map((connection, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              {getConnectionIcon(connection.type)}
              <span className="text-sm font-medium">{connection.type.replace(/_/g, ' ')}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {connection.details.length}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Musical insights section
function InsightsSection({
  insights,
  onRetry
}: {
  insights: AIAnalysis['discovery_insights']
  onRetry?: () => void
}) {
  // Check if insights contain error messages
  const hasError =
    insights.musical_lineage?.includes('Unable to analyze') ||
    insights.scene_connections?.includes('Error occurred') ||
    insights.musical_lineage?.includes('error') ||
    insights.scene_connections?.includes('error')

  if (hasError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Sparkles className="w-5 h-5 text-red-600" />
            Musical Insights
          </CardTitle>
          <CardDescription className="text-red-700">AI analysis temporarily unavailable</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <Brain className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-800">Analysis failed</h3>
              <p className="text-sm text-red-600 mt-1">
                We couldn't generate insights for this artist. This may be due to API rate limits or temporary service issues.
              </p>
            </div>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              Retry Analysis
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Musical Insights
        </CardTitle>
        <CardDescription>AI analysis of musical context and influence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {insights.musical_lineage && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-800">Musical Lineage</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{insights.musical_lineage}</p>
          </div>
        )}

        {insights.scene_connections && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-800">Scene Connections</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{insights.scene_connections}</p>
          </div>
        )}

        {insights.sampling_potential && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-800">Sampling Potential</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{insights.sampling_potential}</p>
          </div>
        )}

        {insights.remix_culture && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-800">Remix Culture</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{insights.remix_culture}</p>
          </div>
        )}
      </CardContent>
    </Card>
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