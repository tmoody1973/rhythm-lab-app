"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Youtube, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CacheStatus {
  current_data: {
    archive_tracks: {
      total: number
      with_youtube: number
      progress: string
    }
    live_songs: {
      total: number
      with_youtube: number
      progress: string
    }
  }
}

interface CacheResult {
  success: boolean
  message?: string
  processed?: number
  cached?: number
  failed?: number
  skipped?: number
  error?: string
}

export default function YouTubeCachePage() {
  const [status, setStatus] = useState<CacheStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [caching, setCaching] = useState(false)
  const [result, setResult] = useState<CacheResult | null>(null)
  const [batchSize, setBatchSize] = useState(50)

  // Fetch cache status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/cache-youtube-videos')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch cache status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Run caching process
  const runCache = async () => {
    setCaching(true)
    setResult(null)

    try {
      const response = await fetch('/api/cache-youtube-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          source: 'both',
          limit: batchSize,
          offset: 0
        })
      })

      const data = await response.json()
      setResult(data)

      // Refresh status after caching
      await fetchStatus()
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to run caching process'
      })
    } finally {
      setCaching(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const getProgressPercentage = (current: number, total: number) => {
    return total > 0 ? Math.round((current / total) * 100) : 0
  }

  const archiveProgress = status
    ? getProgressPercentage(status.current_data.archive_tracks.with_youtube, status.current_data.archive_tracks.total)
    : 0

  const liveProgress = status
    ? getProgressPercentage(status.current_data.live_songs.with_youtube, status.current_data.live_songs.total)
    : 0

  const totalCached = status
    ? status.current_data.archive_tracks.with_youtube + status.current_data.live_songs.with_youtube
    : 0

  const totalTracks = status
    ? status.current_data.archive_tracks.total + status.current_data.live_songs.total
    : 0

  const overallProgress = getProgressPercentage(totalCached, totalTracks)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Youtube className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            YouTube Video Cache Manager
          </h1>
        </div>
        <p className="text-gray-600">
          Cache YouTube videos to avoid API rate limits and ensure consistent video availability
        </p>
      </div>

      {/* Overall Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Cache Status</CardTitle>
          <CardDescription>
            Total videos cached across archive tracks and live songs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading status...</div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Total Progress</span>
                  <span className="text-gray-600">{totalCached} / {totalTracks} tracks</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{overallProgress}% Complete</span>
                  <span>{totalTracks - totalCached} remaining</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium mb-1">Cached Videos</div>
                  <div className="text-2xl font-bold text-blue-900">{totalCached}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm text-orange-600 font-medium mb-1">Remaining</div>
                  <div className="text-2xl font-bold text-orange-900">{totalTracks - totalCached}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium mb-1">Progress</div>
                  <div className="text-2xl font-bold text-green-900">{overallProgress}%</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detailed Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Archive Tracks</CardTitle>
            <CardDescription>Mixcloud archive show tracks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {status && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span>Cached</span>
                  <Badge variant="outline">
                    {status.current_data.archive_tracks.with_youtube} / {status.current_data.archive_tracks.total}
                  </Badge>
                </div>
                <Progress value={archiveProgress} />
                <div className="text-xs text-gray-500">{archiveProgress}% Complete</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Songs</CardTitle>
            <CardDescription>Currently playing live tracks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {status && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span>Cached</span>
                  <Badge variant="outline">
                    {status.current_data.live_songs.with_youtube} / {status.current_data.live_songs.total}
                  </Badge>
                </div>
                <Progress value={liveProgress} />
                <div className="text-xs text-gray-500">{liveProgress}% Complete</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Caching Control */}
      <Card>
        <CardHeader>
          <CardTitle>Run Caching Process</CardTitle>
          <CardDescription>
            Cache YouTube videos in batches to stay within API quota limits (100 searches/day)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommended:</strong> Cache 50 tracks per day to leave quota for live searches.
              YouTube API allows 100 searches per day (10,000 quota ÷ 100 points per search).
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Batch Size</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
                disabled={caching}
              >
                <option value={25}>25 tracks (conservative)</option>
                <option value={50}>50 tracks (recommended)</option>
                <option value={75}>75 tracks (aggressive)</option>
                <option value={100}>100 tracks (use full quota)</option>
              </select>
            </div>

            <div className="flex-1 flex items-end">
              <Button
                onClick={runCache}
                disabled={caching || loading}
                className="w-full"
                size="lg"
              >
                {caching ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Caching...
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4 mr-2" />
                    Cache {batchSize} Videos
                  </>
                )}
              </Button>
            </div>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.success ? (
                  <div className="space-y-1">
                    <div className="font-medium">{result.message}</div>
                    <div className="text-sm">
                      Processed: {result.processed} | Cached: {result.cached} |
                      Failed: {result.failed} | Skipped: {result.skipped}
                    </div>
                  </div>
                ) : (
                  <div className="font-medium">{result.error || result.message}</div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
            <div>
              <strong>Search Once:</strong> The system searches YouTube for each track and saves the video details in the database
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
            <div>
              <strong>Avoid Rate Limits:</strong> Cached videos are read from the database without hitting the YouTube API
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
            <div>
              <strong>Stay Within Quota:</strong> Run caching in batches over multiple days to conserve your daily 10,000 API quota
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
            <div>
              <strong>Refresh Status:</strong> Click the refresh button to see updated cache statistics
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
