"use client"

import React from 'react'
import { UnifiedAIInsights } from '@/components/unified-ai-insights'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Music, Clock, User } from 'lucide-react'

export default function AIInsightsDemoPage() {
  const handleArtistClick = (artistName: string) => {
    console.log('Artist clicked:', artistName)
    // You can implement navigation to artist page here
    alert(`Navigate to artist: ${artistName}`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Unified AI Musical Discovery</h1>
        <p className="text-muted-foreground">
          Experience our new unified interface that combines AI insights with network visualization in a modern, full-width layout
        </p>
      </div>

      <div className="space-y-6">
        {/* Mock Song Card */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Lions of Juda</CardTitle>
                <CardDescription className="text-base">Steve Reid</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-1">
                  <Music className="h-4 w-4" />
                  Play
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                1976
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Spiritual Jazz
              </div>
              <Badge variant="secondary">Archive Track</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* AI Insights Panel */}
        <UnifiedAIInsights
          trackData={{
            track: "Lions of Juda",
            artist: "Steve Reid",
            has_collaborations: true,
            collaboration_count: 2,
            featured_artists: [],
            producers: ["Steve Reid"],
            collaborators: ["Mustafa Kandirali", "Hasan Gürsoy"],
            related_artists: ["Pharoah Sanders", "Alice Coltrane"]
          }}
          onArtistClick={handleArtistClick}
        />

        {/* Separator */}
        <div className="my-12 border-t border-gray-200"></div>

        {/* Second Example */}
        <UnifiedAIInsights
          trackData={{
            track: "Protection",
            artist: "Massive Attack",
            has_collaborations: true,
            collaboration_count: 5,
            featured_artists: ["Tracey Thorn"],
            producers: ["Andrew 'Mushroom' Vowles", "Grant 'Daddy G' Marshall", "Robert '3D' Del Naja"],
            collaborators: ["Everything But The Girl"],
            related_artists: ["Portishead", "Tricky", "Smith & Mighty"]
          }}
          onArtistClick={handleArtistClick}
        />

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Click <strong>"Explore Network"</strong> to expand the AI discovery interface</p>
              <p>• Experience our new unified layout that uses full screen width effectively</p>
              <p>• The first time you click, it will generate a comprehensive musical analysis (takes ~30 seconds)</p>
              <p>• Subsequent clicks will be instant thanks to caching</p>
              <p>• The left column shows the main network visualization with AI-discovered similar artists</p>
              <p>• The right sidebar shows similar artists and connection types summary</p>
              <p>• Click on any artist name to navigate to their profile</p>
              <p>• The layout automatically adapts to your screen size (desktop/tablet/mobile)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}