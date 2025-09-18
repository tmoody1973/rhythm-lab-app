'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  Download,
  CheckSquare,
  Square,
  Calendar,
  Clock,
  ExternalLink,
  Archive,
  Upload,
  Edit,
  Save,
  X
} from 'lucide-react'
import { parsePlaylistText } from '@/lib/playlist-parser'

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
}

interface ArchiveResponse {
  success: boolean
  shows?: MixcloudShow[]
  total_count?: number
  has_more?: boolean
  message?: string
  errors?: string[]
}

interface ImportProgress {
  total: number
  completed: number
  failed: number
  current?: string
  errors: string[]
}

export function ArchiveImport() {
  const [username, setUsername] = useState('')
  const [shows, setShows] = useState<MixcloudShow[]>([])
  const [selectedShows, setSelectedShows] = useState<Set<string>>(new Set())
  const [isFetching, setIsFetching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null)
  const [playlistText, setPlaylistText] = useState('')
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)
  const [importedShows, setImportedShows] = useState<Map<string, string>>(new Map()) // mixcloud key -> database UUID

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const handleFetchArchive = async () => {
    if (!username.trim()) {
      setFetchError('Please enter a Mixcloud username')
      return
    }

    setIsFetching(true)
    setFetchError(null)
    setShows([])
    setSelectedShows(new Set())
    setImportProgress(null)

    try {
      // Start with a reasonable limit to get initial batch
      const response = await fetch(`/api/mixcloud/fetch-archive?username=${encodeURIComponent(username)}&limit=50`)
      const data: ArchiveResponse = await response.json()

      if (data.success && data.shows) {
        setShows(data.shows)
        setTotalCount(data.total_count || data.shows.length)
      } else {
        setFetchError(data.message || 'Failed to fetch archive')
      }
    } catch (error) {
      setFetchError('Network error while fetching archive')
      console.error('Archive fetch error:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSelectAll = useCallback(() => {
    if (selectedShows.size === shows.length) {
      setSelectedShows(new Set())
    } else {
      setSelectedShows(new Set(shows.map(show => show.key)))
    }
  }, [shows, selectedShows.size])

  const handleSelectShow = useCallback((showKey: string) => {
    const newSelected = new Set(selectedShows)
    if (newSelected.has(showKey)) {
      newSelected.delete(showKey)
    } else {
      newSelected.add(showKey)
    }
    setSelectedShows(newSelected)
  }, [selectedShows])

  const importShow = async (show: MixcloudShow): Promise<{ success: boolean; error?: string; show_id?: string; warning?: boolean }> => {
    try {
      // If description is empty from bulk API, fetch full details from single show API
      let fullShow = show
      if (!show.description || show.description.trim() === '') {
        console.log(`Fetching full details for "${show.name}" to get description...`)

        try {
          const detailResponse = await fetch(`/api/mixcloud/fetch-single`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: show.url })
          })

          const detailResult = await detailResponse.json()
          if (detailResult.success && detailResult.show) {
            fullShow = detailResult.show
            console.log(`Fetched full details: description length = ${fullShow.description?.length || 0}`)
          }
        } catch (error) {
          console.warn(`Failed to fetch details for ${show.name}:`, error)
          // Continue with original show data if fetch fails
        }
      }

      const importData = {
        title: fullShow.name,
        description: fullShow.description || '',
        date: fullShow.created_time,
        mixcloud_url: fullShow.url,
        embed_code: `<iframe width="100%" height="60" src="https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=%2F${fullShow.key.replace('/', '%2F')}%2F" frameborder="0"></iframe>`,
        cover_image: fullShow.picture.large || fullShow.picture.medium,
        playlist_text: '', // Archive imports typically won't have playlist data
        slug: `${fullShow.user.username}-${fullShow.slug}`,
        status: 'published'
      }

      const response = await fetch('/api/mixcloud/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData)
      })

      const result = await response.json()

      // Track imported show if successful OR if it already exists (409)
      if (result.show_id) {
        setImportedShows(prev => new Map(prev).set(show.key, result.show_id))
      }

      // Handle duplicate show case (409 conflict) as a warning, not error
      if (response.status === 409) {
        return {
          success: true, // Treat as success since show exists
          error: `Already imported: ${result.message}`,
          show_id: result.show_id,
          warning: true
        }
      }

      return { success: result.success, error: result.message, show_id: result.show_id }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const handleImportSelected = async () => {
    const showsToImport = shows.filter(show => selectedShows.has(show.key))
    if (showsToImport.length === 0) {
      return
    }

    setIsImporting(true)
    setImportProgress({
      total: showsToImport.length,
      completed: 0,
      failed: 0,
      errors: []
    })

    for (let i = 0; i < showsToImport.length; i++) {
      const show = showsToImport[i]
      setImportProgress(prev => prev ? { ...prev, current: show.name } : null)

      const result = await importShow(show)

      setImportProgress(prev => {
        if (!prev) return null

        const newProgress = {
          ...prev,
          completed: prev.completed + (result.success ? 1 : 0),
          failed: prev.failed + (result.success ? 0 : 1),
          current: undefined
        }

        if (!result.success) {
          newProgress.errors.push(`${show.name}: ${result.error}`)
        }

        return newProgress
      })

      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setIsImporting(false)
  }

  const handleImportAll = async () => {
    setSelectedShows(new Set(shows.map(show => show.key)))
    // Wait for state to update, then import
    setTimeout(() => handleImportSelected(), 100)
  }

  const handleEditPlaylist = (showKey: string) => {
    setEditingPlaylist(showKey)
    setPlaylistText('')
  }

  const handleCancelEdit = () => {
    setEditingPlaylist(null)
    setPlaylistText('')
  }

  const handleSavePlaylist = async (show: MixcloudShow) => {
    if (!playlistText.trim()) {
      return
    }

    // Get the database UUID for this show
    const showId = importedShows.get(show.key)
    if (!showId) {
      console.error('Show not imported yet - cannot update playlist')
      return
    }

    setIsSavingPlaylist(true)

    try {
      // Use the sync endpoint to update the show with playlist data
      const updateData = {
        show_id: showId,
        playlist_text: playlistText
      }

      const response = await fetch('/api/mixcloud/sync', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (result.success) {
        setEditingPlaylist(null)
        setPlaylistText('')
        // Could show success message here
      } else {
        console.error('Failed to update playlist:', result.message)
      }
    } catch (error) {
      console.error('Error updating playlist:', error)
    } finally {
      setIsSavingPlaylist(false)
    }
  }

  const progressPercentage = importProgress
    ? Math.round(((importProgress.completed + importProgress.failed) / importProgress.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Username Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Fetch User Archive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Mixcloud username (e.g., rhythmlab)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleFetchArchive}
              disabled={isFetching || !username.trim()}
            >
              {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Download className="mr-2 h-4 w-4" />
              Fetch Shows
            </Button>
          </div>

          {fetchError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {fetchError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shows List Section */}
      {shows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Shows Archive
                <Badge variant="outline">{shows.length} of {totalCount} shows</Badge>
              </CardTitle>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isImporting}
                >
                  {selectedShows.size === shows.length ? (
                    <>
                      <Square className="mr-2 h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Select All
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleImportSelected}
                  disabled={selectedShows.size === 0 || isImporting}
                  size="sm"
                >
                  {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Upload className="mr-2 h-4 w-4" />
                  Import Selected ({selectedShows.size})
                </Button>

                <Button
                  onClick={handleImportAll}
                  disabled={isImporting}
                  variant="secondary"
                  size="sm"
                >
                  Import All ({shows.length})
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Import Progress */}
            {importProgress && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Import Progress: {importProgress.completed + importProgress.failed} / {importProgress.total}
                  </span>
                  <span className="text-sm text-gray-600">{progressPercentage}%</span>
                </div>

                <Progress value={progressPercentage} className="mb-2" />

                <div className="flex justify-between text-xs text-gray-600">
                  <span>✅ Completed: {importProgress.completed}</span>
                  <span>❌ Failed: {importProgress.failed}</span>
                </div>

                {importProgress.current && (
                  <div className="text-sm text-blue-700 mt-2">
                    Currently importing: {importProgress.current}
                  </div>
                )}

                {importProgress.errors.length > 0 && (
                  <div className="mt-3 p-2 bg-red-50 rounded text-xs">
                    <details>
                      <summary className="cursor-pointer text-red-700 font-medium">
                        {importProgress.errors.length} errors occurred
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {importProgress.errors.map((error, i) => (
                          <li key={i} className="text-red-600">• {error}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
              </div>
            )}

            {/* Shows Table */}
            <div className="space-y-2">
              {shows.map((show) => (
                <div
                  key={show.key}
                  className={`flex items-center gap-4 p-3 border rounded-lg transition-colors ${
                    selectedShows.has(show.key) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={selectedShows.has(show.key)}
                    onCheckedChange={() => handleSelectShow(show.key)}
                    disabled={isImporting}
                  />

                  {/* Cover Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={show.picture.thumbnail || show.picture.medium}
                      alt={show.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>

                  {/* Show Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{show.name}</h3>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(show.created_time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(show.audio_length)}
                          </div>
                        </div>

                        {show.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {show.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {importedShows.has(show.key) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlaylist(show.key)}
                            disabled={isImporting || editingPlaylist === show.key}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit Playlist
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {selectedShows.has(show.key) ? 'Selected for Import' : 'Not Imported'}
                          </Badge>
                        )}

                        <a
                          href={show.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>

                    {/* Playlist Editor */}
                    {editingPlaylist === show.key && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border-t">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Add Playlist for "{show.name}"</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

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
                          {playlistText && (
                            <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                              {(() => {
                                const parseResult = parsePlaylistText(playlistText)
                                return (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                      <span className="font-medium">
                                        {parseResult.tracks.length} tracks parsed
                                      </span>
                                      {parseResult.errors.length > 0 && (
                                        <span className="text-red-600">
                                          {parseResult.errors.length} errors
                                        </span>
                                      )}
                                    </div>

                                    {parseResult.errors.length > 0 && (
                                      <div className="text-red-600">
                                        <strong>Errors:</strong> {parseResult.errors.join(', ')}
                                      </div>
                                    )}

                                    {parseResult.tracks.length > 0 && (
                                      <div>
                                        <strong>Preview:</strong> {parseResult.tracks.slice(0, 3).map(t => `${t.artist} - ${t.track}`).join(' • ')}
                                        {parseResult.tracks.length > 3 && ` ... +${parseResult.tracks.length - 3} more`}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSavePlaylist(show)}
                              disabled={!playlistText.trim() || isSavingPlaylist}
                              size="sm"
                            >
                              {isSavingPlaylist && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                              <Save className="mr-2 h-3 w-3" />
                              Save Playlist
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleCancelEdit}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalCount > shows.length && (
              <div className="text-center mt-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700">
                  Showing {shows.length} of {totalCount} total shows.
                  Additional pagination features coming soon.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}