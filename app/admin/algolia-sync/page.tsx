"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2, Database, RefreshCw } from "lucide-react"

export default function AlgoliaSyncPage() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    success: boolean
    message: string
    indexed_count?: number
  } | null>(null)

  const syncArchiveTracks = async () => {
    setIsSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/algolia/index-archive-tracks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setSyncResult({
          success: true,
          message: data.message || 'Sync completed successfully',
          indexed_count: data.indexed_count
        })
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Sync failed'
        })
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const syncLiveSongs = async () => {
    setIsSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/cron/sync-live-songs', {
        method: 'GET'
      })

      const data = await response.json()

      if (response.ok) {
        setSyncResult({
          success: true,
          message: data.message || 'Live songs synced successfully',
          indexed_count: data.synced_count
        })
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Sync failed'
        })
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Algolia Search Sync
        </h1>
        <p className="text-gray-600">
          Manually sync your database to Algolia search indices
        </p>
      </div>

      {/* Sync Results */}
      {syncResult && (
        <Alert className={syncResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
          <div className="flex items-start gap-3">
            {syncResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <AlertDescription className={syncResult.success ? "text-green-900" : "text-red-900"}>
                {syncResult.message}
                {syncResult.indexed_count && (
                  <div className="mt-2 text-sm font-medium">
                    Indexed {syncResult.indexed_count} records
                  </div>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Archive Tracks Sync */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Archive Tracks (Mixcloud)</CardTitle>
              <CardDescription className="mt-1">
                Sync all tracks from the mixcloud_tracks table to Algolia
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Data Source:</span>
              <span className="font-medium">mixcloud_tracks table</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Index Name:</span>
              <span className="font-medium">archive_tracks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Updates:</span>
              <span className="font-medium">All tracks (full reindex)</span>
            </div>
          </div>

          <Button
            onClick={syncArchiveTracks}
            disabled={isSyncing}
            className="w-full"
            size="lg"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing Archive Tracks...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Archive Tracks
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Use this when you add new shows or tracks from Mixcloud archives
          </p>
        </CardContent>
      </Card>

      {/* Live Songs Sync */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle>Live Songs (Spinitron)</CardTitle>
              <CardDescription className="mt-1">
                Sync recent live songs from Spinitron (last 24 hours)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Data Source:</span>
              <span className="font-medium">songs table (Spinitron)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Index Name:</span>
              <span className="font-medium">live_songs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Updates:</span>
              <span className="font-medium">Last 24 hours only</span>
            </div>
          </div>

          <Button
            onClick={syncLiveSongs}
            disabled={isSyncing}
            className="w-full"
            size="lg"
            variant="outline"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing Live Songs...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Live Songs
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            This runs automatically via cron job every hour
          </p>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">When to sync:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>After importing new shows from Mixcloud</li>
                <li>After adding tracks manually to the database</li>
                <li>If search results seem outdated</li>
                <li>After bulk updates to track metadata</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}