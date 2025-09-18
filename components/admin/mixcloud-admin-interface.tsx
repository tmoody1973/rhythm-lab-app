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
  Settings,
  TestTube
} from 'lucide-react'
import { PlaylistParserTest } from './playlist-parser-test'
import { ImportByUrl } from './import-by-url'
import { ArchiveImport } from './archive-import'
import { UploadNewShow } from './upload-new-show'

export function MixcloudAdminInterface() {
  const [activeTab, setActiveTab] = useState('archive')

  return (
    <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 min-h-screen p-6 rounded-xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Navigation Tabs */}
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200/50 shadow-sm rounded-xl p-1">
          <TabsTrigger value="archive" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-amber-800 data-[state=inactive]:hover:bg-amber-200/50 transition-all duration-200 rounded-lg">
            <Archive className="h-4 w-4" />
            Archive Import
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-amber-800 data-[state=inactive]:hover:bg-amber-200/50 transition-all duration-200 rounded-lg">
            <Link className="h-4 w-4" />
            Import by URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-amber-800 data-[state=inactive]:hover:bg-amber-200/50 transition-all duration-200 rounded-lg">
            <Upload className="h-4 w-4" />
            Upload New Show
          </TabsTrigger>
          <TabsTrigger value="enrichment" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-amber-800 data-[state=inactive]:hover:bg-amber-200/50 transition-all duration-200 rounded-lg">
            <Activity className="h-4 w-4" />
            Track Enrichment
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-amber-800 data-[state=inactive]:hover:bg-amber-200/50 transition-all duration-200 rounded-lg">
            <TestTube className="h-4 w-4" />
            Parser Test
          </TabsTrigger>
        </TabsList>

        {/* Archive Import Tab */}
        <TabsContent value="archive" className="space-y-6 mt-6">
          <ArchiveImport />
        </TabsContent>

        {/* Import by URL Tab */}
        <TabsContent value="url" className="space-y-6 mt-6">
          <ImportByUrl />
        </TabsContent>

        {/* Upload New Show Tab */}
        <TabsContent value="upload" className="space-y-6 mt-6">
          <UploadNewShow />
        </TabsContent>

        {/* Track Enrichment Tab */}
        <TabsContent value="enrichment" className="space-y-6 mt-6">
          <Card className="border border-amber-200/50 shadow-md bg-white/70 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-t-lg border-b border-teal-100">
              <CardTitle className="flex items-center gap-2 text-teal-900">
                <Activity className="h-5 w-5 text-teal-600" />
                Track Enrichment
              </CardTitle>
              <CardDescription className="text-teal-700">
                Monitor and manage background jobs that enrich track data with Spotify, YouTube, and Discogs links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-lg p-6 text-center border border-teal-200/30">
                <Activity className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-teal-900">Track Enrichment Dashboard</h3>
                <p className="text-teal-700 mb-4">
                  This section will allow you to:
                </p>
                <ul className="text-sm text-teal-700 space-y-1 text-left max-w-md mx-auto">
                  <li>• View enrichment job progress</li>
                  <li>• See success/failure statistics</li>
                  <li>• Retry failed lookups</li>
                  <li>• Monitor Spotify/YouTube/Discogs APIs</li>
                  <li>• Real-time updates via WebSocket</li>
                </ul>
                <Badge variant="outline" className="mt-4 border-teal-300 text-teal-700 bg-teal-50">
                  Coming Soon - Implement enrichment system first
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Parser Test Tab */}
        <TabsContent value="test" className="space-y-6 mt-6">
          <PlaylistParserTest />
        </TabsContent>

      </Tabs>

      {/* Status Bar */}
      <div className="mt-8 p-4 bg-gradient-to-r from-amber-100/80 to-orange-100/80 rounded-xl border border-amber-200/50 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-amber-700" />
            <span className="text-amber-800 font-medium">Mixcloud Import System v1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm">
              Database: Connected
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 shadow-sm">
              Storyblok: Connected
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm">
              Mixcloud API: Ready
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}