'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { parsePlaylistText } from '@/lib/playlist-parser'
import { Loader2, ExternalLink, Calendar, Clock, User, Tag } from 'lucide-react'

interface MixcloudShow {
  key: string
  name: string
  slug: string
  url: string
  created_time: string
  updated_time: string
  description: string
  picture: {
    medium: string
    large: string
    thumbnail: string
  }
  audio_length: number
  user: {
    username: string
    name: string
  }
  tags: Array<{
    name: string
    url: string
  }>
  sections?: Array<{
    start_time: number
    track?: {
      name: string
      artist: {
        name: string
      }
    }
  }>
  embed_code?: string
  formatted_duration?: string
}

interface FetchResponse {
  success: boolean
  show?: MixcloudShow
  message?: string
  errors?: string[]
}

interface ImportResponse {
  success: boolean
  show_id?: string
  storyblok_id?: string
  tracks_imported?: number
  message?: string
  errors?: string[]
}

export function ImportByUrl() {
  const [url, setUrl] = useState('')
  const [fetchedShow, setFetchedShow] = useState<MixcloudShow | null>(null)
  const [playlistText, setPlaylistText] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  // Parse playlist text in real-time
  const parseResult = playlistText ? parsePlaylistText(playlistText) : null

  const handleFetchShow = async () => {
    if (!url.trim()) {
      setFetchError('Please enter a Mixcloud URL')
      return
    }

    setIsFetching(true)
    setFetchError(null)
    setFetchedShow(null)
    setPlaylistText('')
    setImportStatus(null)

    try {
      const response = await fetch(`/api/mixcloud/fetch-single?url=${encodeURIComponent(url)}`)
      const data: FetchResponse = await response.json()

      if (data.success && data.show) {
        setFetchedShow(data.show)
        // Auto-populate playlist from sections if available
        if (data.show.sections && data.show.sections.length > 0) {
          const autoPlaylist = data.show.sections
            .filter(section => section.track)
            .map(section => `${section.track!.artist.name} - ${section.track!.name}`)
            .join('\n')
          setPlaylistText(autoPlaylist)
        }
      } else {
        setFetchError(data.message || 'Failed to fetch show')
      }
    } catch (error) {
      setFetchError('Network error while fetching show')
      console.error('Fetch error:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleImportShow = async () => {
    if (!fetchedShow || !playlistText.trim()) {
      setImportStatus({
        success: false,
        message: 'Show data and playlist text are required'
      })
      return
    }

    setIsImporting(true)
    setImportStatus(null)

    try {
      const importData = {
        title: fetchedShow.name,
        description: fetchedShow.description,
        date: fetchedShow.created_time,
        mixcloud_url: fetchedShow.url,
        embed_code: fetchedShow.embed_code || '',
        cover_image: fetchedShow.picture.large || fetchedShow.picture.medium,
        duration: fetchedShow.audio_length,
        playlist_text: playlistText,
        slug: `${fetchedShow.user.username}-${fetchedShow.slug}`,
        status: 'published'
      }

      const response = await fetch('/api/mixcloud/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData)
      })

      const result: ImportResponse = await response.json()

      if (result.success) {
        setImportStatus({
          success: true,
          message: `Successfully imported: ${fetchedShow.name}`,
          details: {
            show_id: result.show_id,
            storyblok_id: result.storyblok_id,
            tracks_imported: result.tracks_imported
          }
        })
        // Reset form after successful import
        setUrl('')
        setFetchedShow(null)
        setPlaylistText('')
      } else {
        setImportStatus({
          success: false,
          message: result.message || 'Import failed',
          details: result.errors
        })
      }
    } catch (error) {
      setImportStatus({
        success: false,
        message: 'Network error during import'
      })
      console.error('Import error:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Import Single Show</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://www.mixcloud.com/username/show-name/"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleFetchShow}
              disabled={isFetching || !url.trim()}
            >
              {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch Show
            </Button>
          </div>

          {fetchError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {fetchError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show Preview Section */}
      {fetchedShow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Show Preview
              <a
                href={fetchedShow.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-[200px,1fr] gap-4">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                <img
                  src={fetchedShow.picture.medium || fetchedShow.picture.thumbnail}
                  alt={fetchedShow.name}
                  className="w-full aspect-square object-cover rounded-md"
                />
              </div>

              {/* Show Details */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">{fetchedShow.name}</h3>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{fetchedShow.user.name} (@{fetchedShow.user.username})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{fetchedShow.formatted_duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(fetchedShow.created_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>{fetchedShow.tags.length} tags</span>
                  </div>
                </div>

                {fetchedShow.description && (
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {fetchedShow.description}
                  </p>
                )}

                {fetchedShow.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {fetchedShow.tags.slice(0, 6).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {fetchedShow.tags.length > 6 && (
                      <span className="text-xs text-gray-500">+{fetchedShow.tags.length - 6} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Playlist Input Section */}
      {fetchedShow && (
        <Card>
          <CardHeader>
            <CardTitle>Playlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter playlist tracks, one per line or with hour markers:

HOUR 1
Artist Name - Track Title
Another Artist - Another Track

HOUR 2
More Artist - More Track"
              value={playlistText}
              onChange={(e) => setPlaylistText(e.target.value)}
              className="min-h-32 font-mono text-sm"
            />

            {/* Live Parse Preview */}
            {parseResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Parsed: {parseResult.tracks.length} tracks
                  </span>
                  {parseResult.errors.length > 0 && (
                    <span className="text-red-600">
                      {parseResult.errors.length} errors
                    </span>
                  )}
                  {parseResult.warnings.length > 0 && (
                    <span className="text-amber-600">
                      {parseResult.warnings.length} warnings
                    </span>
                  )}
                </div>

                {/* Show errors/warnings */}
                {parseResult.errors.length > 0 && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    <div className="font-medium">Errors:</div>
                    <ul className="list-disc list-inside">
                      {parseResult.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {parseResult.warnings.length > 0 && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                    <div className="font-medium">Warnings:</div>
                    <ul className="list-disc list-inside">
                      {parseResult.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Show first few parsed tracks */}
                {parseResult.tracks.length > 0 && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
                    <div className="font-medium mb-2">Preview (first 3 tracks):</div>
                    {parseResult.tracks.slice(0, 3).map((track, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-6 text-gray-400">{track.position}.</span>
                        {track.hour && (
                          <span className="text-blue-600 text-xs px-1">H{track.hour}</span>
                        )}
                        <span>{track.artist} - {track.track}</span>
                      </div>
                    ))}
                    {parseResult.tracks.length > 3 && (
                      <div className="text-gray-400 mt-1">...and {parseResult.tracks.length - 3} more</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Import Button */}
            <Button
              onClick={handleImportShow}
              disabled={isImporting || !fetchedShow || !playlistText.trim() || (parseResult && parseResult.errors.length > 0)}
              className="w-full"
              size="lg"
            >
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Show to Database
            </Button>

            {/* Import Status */}
            {importStatus && (
              <div className={`p-4 rounded-md text-sm ${
                importStatus.success
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="font-medium">{importStatus.message}</div>
                {importStatus.details && (
                  <div className="mt-2 space-y-1">
                    {importStatus.success ? (
                      <>
                        <div>Show ID: {importStatus.details.show_id}</div>
                        <div>Storyblok ID: {importStatus.details.storyblok_id}</div>
                        <div>Tracks Imported: {importStatus.details.tracks_imported}</div>
                      </>
                    ) : (
                      <div>
                        {Array.isArray(importStatus.details) ? (
                          <ul className="list-disc list-inside">
                            {importStatus.details.map((error: string, i: number) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        ) : (
                          JSON.stringify(importStatus.details)
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}