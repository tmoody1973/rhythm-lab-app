"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { searchClient, INDICES } from '@/lib/algolia/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Music,
  Calendar,
  Clock,
  ExternalLink,
  Radio,
  Disc3,
  PlayCircle,
  Users,
  Building2,
  Tag
} from 'lucide-react'
import Image from 'next/image'
import { Header } from '@/components/header'
import { UnifiedAIInsights } from '@/components/unified-ai-insights'

interface TrackData {
  objectID: string
  song?: string
  artist?: string
  track?: string
  release?: string
  label?: string
  episode_title?: string
  start_time?: string
  relative_time?: string
  content_type: string
  spotify_url?: string
  youtube_url?: string
  discogs_url?: string
  mixcloud_picture?: string
  show_title?: string
  show_description?: string
  mixcloud_url?: string
  duration?: number
  display_context?: string
  date_display?: string
  time_display?: string
  source?: string
  show_genres?: string[]
  show_tags?: string[]
  host_name?: string

  // Artist relationship fields
  featured_artists?: string[]
  remixers?: string[]
  producers?: string[]
  collaborators?: string[]
  related_artists?: string[]
  has_collaborations?: boolean
  collaboration_count?: number
}

export default function TrackPage() {
  const params = useParams()
  const trackId = params.id as string
  const [trackData, setTrackData] = useState<TrackData | null>(null)
  const [enhancedData, setEnhancedData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enhancedLoading, setEnhancedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTrackData() {
      if (!searchClient || !trackId) return

      try {
        setLoading(true)

        // Determine which index to search based on trackId prefix
        const indexName = trackId.startsWith('live_song_')
          ? INDICES.LIVE_SONGS
          : INDICES.ARCHIVE_TRACKS

        // Search for the specific track by objectID
        const response = await searchClient.search([{
          indexName,
          query: '',
          filters: `objectID:"${trackId}"`
        }])

        const hit = response.results[0]?.hits[0]

        if (hit) {
          setTrackData(hit as TrackData)
        } else {
          setError('Track not found')
        }
      } catch (err) {
        console.error('Error fetching track data:', err)
        setError('Failed to load track data')
      } finally {
        setLoading(false)
      }
    }

    fetchTrackData()
  }, [trackId])

  // Fetch enhanced data after basic data loads
  useEffect(() => {
    async function fetchEnhancedData() {
      if (!trackData || !trackId) return

      try {
        setEnhancedLoading(true)
        console.log('Fetching enhanced data for:', trackId)

        const response = await fetch(`/api/track-enhancements/${trackId}`)

        if (response.ok) {
          const data = await response.json()
          setEnhancedData(data.enhancedData)
          console.log('Enhanced data loaded:', data.enhancementSources)
        } else {
          console.log('Enhanced data not available')
        }
      } catch (err) {
        console.error('Error fetching enhanced data:', err)
        // Don't show error to user - enhanced data is optional
      } finally {
        setEnhancedLoading(false)
      }
    }

    fetchEnhancedData()
  }, [trackData, trackId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !trackData) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl text-center">
          <h1 className="text-2xl font-bold mb-4">Track Not Found</h1>
          <p className="text-muted-foreground mb-8">{error || 'This track could not be found.'}</p>
          <Button onClick={() => window.history.back()}>
            ← Go Back
          </Button>
        </div>
      </div>
    )
  }

  const getTrackTitle = () => {
    if (trackData.content_type === 'live_song') {
      return trackData.song && trackData.artist
        ? `${trackData.song} - ${trackData.artist}`
        : trackData.song || trackData.artist || 'Unknown Track'
    }

    if (trackData.content_type === 'archive_track') {
      return trackData.track && trackData.artist
        ? `${trackData.track} - ${trackData.artist}`
        : trackData.track || trackData.artist || 'Unknown Track'
    }

    return 'Unknown Track'
  }

  const getExternalLinks = () => {
    const links = []

    if (trackData.spotify_url) {
      links.push({
        name: 'Spotify',
        url: trackData.spotify_url,
        icon: <Music className="w-4 h-4" />,
        color: 'bg-green-600 hover:bg-green-700'
      })
    }

    if (trackData.youtube_url) {
      links.push({
        name: 'YouTube',
        url: trackData.youtube_url,
        icon: <PlayCircle className="w-4 h-4" />,
        color: 'bg-red-600 hover:bg-red-700'
      })
    }

    if (trackData.discogs_url) {
      links.push({
        name: 'Discogs',
        url: trackData.discogs_url,
        icon: <Disc3 className="w-4 h-4" />,
        color: 'bg-orange-600 hover:bg-orange-700'
      })
    }

    if (trackData.mixcloud_url) {
      links.push({
        name: 'Mixcloud',
        url: trackData.mixcloud_url,
        icon: <Radio className="w-4 h-4" />,
        color: 'bg-blue-600 hover:bg-blue-700'
      })
    }

    return links
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section with Album Art */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Album Artwork */}
            {enhancedData?.spotify?.albumArt && (
              <div className="flex-shrink-0">
                <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-lg overflow-hidden shadow-xl">
                  <Image
                    src={enhancedData.spotify.albumArt}
                    alt={`Album artwork for ${getTrackTitle()}`}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Track Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-6 h-6 text-primary" />
                <Badge variant="secondary" className="text-xs">
                  {trackData.content_type === 'live_song' ? 'Live Song' : 'Archive Track'}
                </Badge>
              </div>

              <h1 className="text-4xl font-bold mb-2">
                {getTrackTitle()}
              </h1>

              {trackData.display_context && (
                <p className="text-muted-foreground text-lg mb-4">
                  {trackData.display_context}
                </p>
              )}

              {/* Spotify metadata if available */}
              {enhancedData?.spotify && (
                <div className="flex flex-wrap gap-4 mt-4">
                  {enhancedData.spotify.track?.album?.name && (
                    <div>
                      <span className="text-sm text-muted-foreground">Album: </span>
                      <span className="text-sm font-medium">{enhancedData.spotify.track.album.name}</span>
                    </div>
                  )}
                  {enhancedData.spotify.track?.album?.release_date && (
                    <div>
                      <span className="text-sm text-muted-foreground">Released: </span>
                      <span className="text-sm font-medium">
                        {new Date(enhancedData.spotify.track.album.release_date).getFullYear()}
                      </span>
                    </div>
                  )}
                  {enhancedData.spotify.popularityLevel && (
                    <div>
                      <span className="text-sm text-muted-foreground">Popularity: </span>
                      <Badge variant="outline" className="text-xs">
                        {enhancedData.spotify.popularityLevel}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">

            {/* Track Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Disc3 className="w-5 h-5" />
                  Track Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(trackData.song || trackData.track) && (
                    <div>
                      <label className="text-sm text-muted-foreground">Title</label>
                      <p className="font-medium">{trackData.song || trackData.track}</p>
                    </div>
                  )}

                  {trackData.artist && (
                    <div>
                      <label className="text-sm text-muted-foreground">Artist</label>
                      <p className="font-medium">{trackData.artist}</p>
                    </div>
                  )}

                  {trackData.release && (
                    <div>
                      <label className="text-sm text-muted-foreground">Release/Album</label>
                      <p className="font-medium">{trackData.release}</p>
                    </div>
                  )}

                  {trackData.label && (
                    <div>
                      <label className="text-sm text-muted-foreground">Label</label>
                      <p className="font-medium">{trackData.label}</p>
                    </div>
                  )}

                  {trackData.duration && (
                    <div>
                      <label className="text-sm text-muted-foreground">Duration</label>
                      <p className="font-medium">
                        {Math.floor(trackData.duration / 60)}:{(trackData.duration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Unified AI Insights - Replaces both AI Musical Insights and AI-Enhanced Influence Graph */}
            {(trackData.artist && (trackData.song || trackData.track)) && (
              <UnifiedAIInsights
                trackData={{
                  track: trackData.track || trackData.song || '',
                  artist: trackData.artist || '',
                  featured_artists: trackData.featured_artists || [],
                  remixers: trackData.remixers || [],
                  producers: trackData.producers || [],
                  collaborators: trackData.collaborators || [],
                  related_artists: trackData.related_artists || [],
                  has_collaborations: trackData.has_collaborations || false,
                  collaboration_count: trackData.collaboration_count || 0
                }}
                onArtistClick={(artistName) => {
                  console.log('Artist clicked:', artistName)
                  // TODO: Navigate to artist page or search
                }}
              />
            )}

            {/* Show/Episode Context */}
            {(trackData.episode_title || trackData.show_title) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="w-5 h-5" />
                    Show Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(trackData.episode_title || trackData.show_title) && (
                    <div>
                      <label className="text-sm text-muted-foreground">Show</label>
                      <p className="font-medium">{trackData.episode_title || trackData.show_title}</p>
                    </div>
                  )}

                  {trackData.host_name && (
                    <div>
                      <label className="text-sm text-muted-foreground">Host</label>
                      <p className="font-medium">{trackData.host_name}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trackData.date_display && (
                      <div>
                        <label className="text-sm text-muted-foreground">Date</label>
                        <p className="font-medium">{trackData.date_display}</p>
                      </div>
                    )}

                    {trackData.time_display && (
                      <div>
                        <label className="text-sm text-muted-foreground">Time</label>
                        <p className="font-medium">{trackData.time_display}</p>
                      </div>
                    )}
                  </div>

                  {trackData.show_description && (
                    <div>
                      <label className="text-sm text-muted-foreground">About This Show</label>
                      <p className="text-sm text-muted-foreground">{trackData.show_description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Spotify Enhanced Data */}
            {enhancedData?.spotify && (
              <>
                {/* Audio Preview */}
                {enhancedData.spotify.hasPreview && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PlayCircle className="w-5 h-5" />
                        Audio Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <audio
                        controls
                        className="w-full"
                        preload="none"
                      >
                        <source src={enhancedData.spotify.track.preview_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                      <p className="text-sm text-muted-foreground mt-2">
                        30-second preview from Spotify
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Track Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Track Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Popularity</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${enhancedData.spotify.track.popularity}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {enhancedData.spotify.track.popularity}/100
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {enhancedData.spotify.popularityLevel}
                        </p>
                      </div>

                      {enhancedData.spotify.audioFeatures && (
                        <>
                          <div>
                            <label className="text-sm text-muted-foreground">Energy</label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full transition-all"
                                  style={{ width: `${enhancedData.spotify.audioFeatures.energy * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">
                                {Math.round(enhancedData.spotify.audioFeatures.energy * 100)}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm text-muted-foreground">Danceability</label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full transition-all"
                                  style={{ width: `${enhancedData.spotify.audioFeatures.danceability * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">
                                {Math.round(enhancedData.spotify.audioFeatures.danceability * 100)}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm text-muted-foreground">Tempo</label>
                            <p className="font-medium">
                              {Math.round(enhancedData.spotify.audioFeatures.tempo)} BPM
                            </p>
                          </div>
                        </>
                      )}

                      {!enhancedData.spotify.audioFeatures && (
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground italic">
                            Audio features not available for this track
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Similar Tracks */}
                {enhancedData.spotify.recommendations?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Similar Tracks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {enhancedData.spotify.recommendations.slice(0, 3).map((track: any, index: number) => (
                          <div key={track.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                            {track.album.images[0] && (
                              <div className="w-12 h-12 relative rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={track.album.images[0].url}
                                  alt={track.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1">{track.name}</p>
                              <p className="text-muted-foreground text-xs line-clamp-1">
                                {track.artists.map((a: any) => a.name).join(', ')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="flex-shrink-0"
                            >
                              <a
                                href={track.external_urls.spotify}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs"
                              >
                                Listen
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* YouTube Enhanced Data */}
            {enhancedData?.youtube && (
              <>
                {/* Video Player */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-red-500" />
                      Music Video
                      {enhancedData.youtube.isOfficialChannel && (
                        <Badge variant="outline" className="text-xs border-red-500 text-red-400">
                          Official
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* YouTube Embed */}
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800">
                        <iframe
                          src={enhancedData.youtube.embedUrl}
                          title={enhancedData.youtube.video.title}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>

                      {/* Video Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {enhancedData.youtube.video.title}
                        </h4>
                        <p className="text-muted-foreground text-xs">
                          {enhancedData.youtube.video.channelTitle}
                        </p>

                        {/* Video Stats */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {enhancedData.youtube.video.viewCount && (
                            <span>{enhancedData.youtube.video.viewCount}</span>
                          )}
                          {enhancedData.youtube.video.duration && (
                            <span>{enhancedData.youtube.video.duration}</span>
                          )}
                        </div>
                      </div>

                      {/* Video Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="text-xs border-red-500 text-red-400 hover:bg-red-500/10"
                        >
                          <a
                            href={enhancedData.youtube.watchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Watch on YouTube
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video Engagement (if we have view data) */}
                {enhancedData.youtube.video.viewCount && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-red-500" />
                        Video Engagement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Views</label>
                          <p className="font-medium text-lg">
                            {enhancedData.youtube.video.viewCount}
                          </p>
                          {enhancedData.youtube.hasHighViews && (
                            <Badge variant="outline" className="text-xs border-red-500 text-red-400 mt-1">
                              Popular Video
                            </Badge>
                          )}
                        </div>

                        <div>
                          <label className="text-sm text-muted-foreground">Channel</label>
                          <p className="font-medium">
                            {enhancedData.youtube.video.channelTitle}
                          </p>
                          {enhancedData.youtube.isOfficialChannel && (
                            <p className="text-xs text-muted-foreground mt-1">Official Artist Channel</p>
                          )}
                        </div>
                      </div>

                      {/* Quality Indicators */}
                      <div className="pt-2 border-t border-gray-800">
                        <div className="flex flex-wrap gap-2">
                          {enhancedData.youtube.isOfficialChannel && (
                            <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                              ✓ Official Content
                            </Badge>
                          )}
                          {enhancedData.youtube.hasHighViews && (
                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                              High Engagement
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Loading indicator for enhanced data */}
            {enhancedLoading && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                    <span className="text-muted-foreground">Loading enhanced data from Spotify and YouTube...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* External Links */}
            {getExternalLinks().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Listen & Explore
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {getExternalLinks().map((link) => (
                      <Button
                        key={link.name}
                        asChild
                        className={`${link.color} text-white hover:scale-105 transition-transform`}
                      >
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.icon}
                          {link.name}
                        </a>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Album/Show Artwork */}
            {trackData.mixcloud_picture && (
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-square relative overflow-hidden rounded-lg">
                    <Image
                      src={trackData.mixcloud_picture}
                      alt={getTrackTitle()}
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags & Genres */}
            {(trackData.show_genres?.length || trackData.show_tags?.length) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Tags & Genres
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trackData.show_genres?.length && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Genres</label>
                      <div className="flex flex-wrap gap-2">
                        {trackData.show_genres.map((genre, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {trackData.show_tags?.length && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {trackData.show_tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}