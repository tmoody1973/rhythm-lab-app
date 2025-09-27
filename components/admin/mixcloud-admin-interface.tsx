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
import { MixcloudConnectionStatus } from './mixcloud-connection-status'
import { TrackEnhancementInterface } from './track-enhancement-interface'

export function MixcloudAdminInterface() {
  const [activeTab, setActiveTab] = useState('archive')

  return (
    <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 min-h-screen p-6 rounded-xl">
      {/* Connection Status Header */}
      <div className="mb-6">
        <MixcloudConnectionStatus />
      </div>

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
          <TrackEnhancementInterface />
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