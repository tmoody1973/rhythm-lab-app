"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Archive,
  Link,
  Upload,
  Activity,
  Database,
  Music,
  Settings
} from 'lucide-react'

export function MixcloudAdminInterface() {
  const [activeTab, setActiveTab] = useState('archive')

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Navigation Tabs */}
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="archive" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archive Import
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Import by URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload New Show
          </TabsTrigger>
          <TabsTrigger value="enrichment" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Track Enrichment
          </TabsTrigger>
        </TabsList>

        {/* Archive Import Tab */}
        <TabsContent value="archive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Archive Import
              </CardTitle>
              <CardDescription>
                Import all shows from a Mixcloud user's archive. Enter a username to fetch their complete show history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Archive Import Feature</h3>
                <p className="text-muted-foreground mb-4">
                  This section will allow you to:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                  <li>• Enter Mixcloud username</li>
                  <li>• Fetch all shows from user's archive</li>
                  <li>• Preview shows in a table format</li>
                  <li>• Select shows for bulk import</li>
                  <li>• Import to Supabase and Storyblok</li>
                </ul>
                <Badge variant="outline" className="mt-4">
                  Coming Soon - Implement API endpoint first
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import by URL Tab */}
        <TabsContent value="url" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Import by URL
              </CardTitle>
              <CardDescription>
                Import a specific Mixcloud show by pasting its URL. Perfect for importing individual episodes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">URL Import Feature</h3>
                <p className="text-muted-foreground mb-4">
                  This section will allow you to:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                  <li>• Paste Mixcloud show URL</li>
                  <li>• Fetch show metadata automatically</li>
                  <li>• Preview show details</li>
                  <li>• Add playlist manually</li>
                  <li>• Import single show</li>
                </ul>
                <Badge variant="outline" className="mt-4">
                  Coming Soon - Implement fetch endpoint first
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload New Show Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload New Show
              </CardTitle>
              <CardDescription>
                Upload a new radio show directly to Mixcloud, then import it with playlist data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload New Show Feature</h3>
                <p className="text-muted-foreground mb-4">
                  This section will allow you to:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                  <li>• Upload audio file (MP3/WAV)</li>
                  <li>• Add show metadata (title, description, cover)</li>
                  <li>• Upload directly to Mixcloud</li>
                  <li>• Add playlist data</li>
                  <li>• Generate AI description from playlist</li>
                </ul>
                <Badge variant="outline" className="mt-4">
                  Coming Soon - Requires Mixcloud upload API
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Track Enrichment Tab */}
        <TabsContent value="enrichment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Track Enrichment
              </CardTitle>
              <CardDescription>
                Monitor and manage background jobs that enrich track data with Spotify, YouTube, and Discogs links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Track Enrichment Dashboard</h3>
                <p className="text-muted-foreground mb-4">
                  This section will allow you to:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                  <li>• View enrichment job progress</li>
                  <li>• See success/failure statistics</li>
                  <li>• Retry failed lookups</li>
                  <li>• Monitor Spotify/YouTube/Discogs APIs</li>
                  <li>• Real-time updates via WebSocket</li>
                </ul>
                <Badge variant="outline" className="mt-4">
                  Coming Soon - Implement enrichment system first
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Bar */}
      <div className="mt-8 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Mixcloud Import System v1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Database: Connected
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Storyblok: Connected
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              Mixcloud API: Pending Setup
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}