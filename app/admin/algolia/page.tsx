"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Music, Users, FileText, Search, Loader2, CheckCircle, AlertCircle, Database } from 'lucide-react'

interface IndexingResult {
  success: boolean
  message: string
  indexed_count?: number
  taskID?: string
  error?: string
}

export default function AlgoliaAdminPage() {
  const [indexingStatus, setIndexingStatus] = useState<{
    archiveTracks: 'idle' | 'loading' | 'success' | 'error'
    liveSongs: 'idle' | 'loading' | 'success' | 'error'
    content: 'idle' | 'loading' | 'success' | 'error'
  }>({
    archiveTracks: 'idle',
    liveSongs: 'idle',
    content: 'idle'
  })

  const [results, setResults] = useState<{
    archiveTracks?: IndexingResult
    liveSongs?: IndexingResult
    content?: IndexingResult
  }>({})

  const indexArchiveTracks = async () => {
    setIndexingStatus(prev => ({ ...prev, archiveTracks: 'loading' }))

    try {
      const response = await fetch('/api/algolia/index-archive-tracks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-token'}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        setIndexingStatus(prev => ({ ...prev, archiveTracks: 'success' }))
        setResults(prev => ({ ...prev, archiveTracks: result }))
      } else {
        setIndexingStatus(prev => ({ ...prev, archiveTracks: 'error' }))
        setResults(prev => ({ ...prev, archiveTracks: result }))
      }
    } catch (error) {
      setIndexingStatus(prev => ({ ...prev, archiveTracks: 'error' }))
      setResults(prev => ({
        ...prev,
        archiveTracks: {
          success: false,
          message: 'Network error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    }
  }

  const indexLiveSongs = async () => {
    setIndexingStatus(prev => ({ ...prev, liveSongs: 'loading' }))

    try {
      const response = await fetch('/api/algolia/index-live-songs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-token'}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        setIndexingStatus(prev => ({ ...prev, liveSongs: 'success' }))
        setResults(prev => ({ ...prev, liveSongs: result }))
      } else {
        setIndexingStatus(prev => ({ ...prev, liveSongs: 'error' }))
        setResults(prev => ({ ...prev, liveSongs: result }))
      }
    } catch (error) {
      setIndexingStatus(prev => ({ ...prev, liveSongs: 'error' }))
      setResults(prev => ({
        ...prev,
        liveSongs: {
          success: false,
          message: 'Network error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    }
  }

  const indexContent = async () => {
    setIndexingStatus(prev => ({ ...prev, content: 'loading' }))

    try {
      const response = await fetch('/api/algolia/index-content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-token'}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        setIndexingStatus(prev => ({ ...prev, content: 'success' }))
        setResults(prev => ({ ...prev, content: result }))
      } else {
        setIndexingStatus(prev => ({ ...prev, content: 'error' }))
        setResults(prev => ({ ...prev, content: result }))
      }
    } catch (error) {
      setIndexingStatus(prev => ({ ...prev, content: 'error' }))
      setResults(prev => ({
        ...prev,
        content: {
          success: false,
          message: 'Network error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    }
  }

  const indexAllContent = async () => {
    await indexArchiveTracks()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Small delay
    await indexLiveSongs()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await indexContent()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Database className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'loading':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Indexing...</Badge>
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
      case 'error':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Ready</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Algolia Search Management
          </h1>
          <p className="text-gray-400 text-lg">
            Index your content to make it searchable across Rhythm Lab Radio
          </p>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Search className="w-6 h-6" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-400">
              Index all your content types at once or individually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={indexAllContent}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={Object.values(indexingStatus).some(status => status === 'loading')}
            >
              {Object.values(indexingStatus).some(status => status === 'loading') ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Indexing All Content...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5 mr-2" />
                  Index All Content
                </>
              )}
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Archive Tracks */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-orange-400" />
                      <CardTitle className="text-sm text-white">Archive Tracks</CardTitle>
                    </div>
                    {getStatusIcon(indexingStatus.archiveTracks)}
                  </div>
                  <CardDescription className="text-xs text-gray-400">
                    Mixcloud tracks with show context
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getStatusBadge(indexingStatus.archiveTracks)}
                  <Button
                    onClick={indexArchiveTracks}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={indexingStatus.archiveTracks === 'loading'}
                  >
                    {indexingStatus.archiveTracks === 'loading' ? 'Indexing...' : 'Index Now'}
                  </Button>

                  {results.archiveTracks && (
                    <Alert className={`text-xs ${results.archiveTracks.success ? 'border-green-500' : 'border-red-500'}`}>
                      <AlertDescription>
                        {results.archiveTracks.success
                          ? `✅ Indexed ${results.archiveTracks.indexed_count} tracks`
                          : `❌ ${results.archiveTracks.error || results.archiveTracks.message}`
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Live Songs */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <CardTitle className="text-sm text-white">Live Songs</CardTitle>
                    </div>
                    {getStatusIcon(indexingStatus.liveSongs)}
                  </div>
                  <CardDescription className="text-xs text-gray-400">
                    Spinitron live stream tracks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getStatusBadge(indexingStatus.liveSongs)}
                  <Button
                    onClick={indexLiveSongs}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={indexingStatus.liveSongs === 'loading'}
                  >
                    {indexingStatus.liveSongs === 'loading' ? 'Indexing...' : 'Index Now'}
                  </Button>

                  {results.liveSongs && (
                    <Alert className={`text-xs ${results.liveSongs.success ? 'border-green-500' : 'border-red-500'}`}>
                      <AlertDescription>
                        {results.liveSongs.success
                          ? `✅ Indexed ${results.liveSongs.indexed_count} songs`
                          : `❌ ${results.liveSongs.error || results.liveSongs.message}`
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Content */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-400" />
                      <CardTitle className="text-sm text-white">Content</CardTitle>
                    </div>
                    {getStatusIcon(indexingStatus.content)}
                  </div>
                  <CardDescription className="text-xs text-gray-400">
                    Storyblok blogs, deep dives, profiles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getStatusBadge(indexingStatus.content)}
                  <Button
                    onClick={indexContent}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={indexingStatus.content === 'loading'}
                  >
                    {indexingStatus.content === 'loading' ? 'Indexing...' : 'Index Now'}
                  </Button>

                  {results.content && (
                    <Alert className={`text-xs ${results.content.success ? 'border-green-500' : 'border-red-500'}`}>
                      <AlertDescription>
                        {results.content.success
                          ? `✅ Indexed ${results.content.indexed_count} items`
                          : `❌ ${results.content.error || results.content.message}`
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">🎯 When to Index:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Archive Tracks:</strong> After importing new Mixcloud shows or updating show information</li>
                <li><strong>Live Songs:</strong> After Spinitron sync or adding manual songs (recommended: daily)</li>
                <li><strong>Content:</strong> After publishing new blog posts, deep dives, or artist profiles in Storyblok</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white">⚡ What Happens:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Data is fetched from your database and Storyblok</li>
                <li>Content is transformed into rich, searchable objects</li>
                <li>Objects are sent to Algolia for instant search</li>
                <li>Your search page automatically reflects the new content</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white">🔍 Next Steps:</h4>
              <p className="text-sm">
                After indexing, visit your{' '}
                <a href="/search" className="text-purple-400 hover:text-purple-300 underline">
                  search page
                </a>{' '}
                to see the improved results with proper titles, context, and metadata.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}