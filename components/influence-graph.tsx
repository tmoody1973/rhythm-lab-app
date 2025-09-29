"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Music, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'

interface InfluenceGraphProps {
  trackData: {
    track: string
    artist: string
    featured_artists?: string[]
    remixers?: string[]
    producers?: string[]
    collaborators?: string[]
    related_artists?: string[]
    has_collaborations?: boolean
    collaboration_count?: number
  }
}

export function InfluenceGraph({ trackData }: InfluenceGraphProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    track,
    artist,
    featured_artists = [],
    remixers = [],
    producers = [],
    collaborators = [],
    related_artists = [],
    has_collaborations = false,
    collaboration_count = 0
  } = trackData

  if (!has_collaborations) {
    return null
  }

  const relationshipTypes = [
    { type: 'Featured Artists', artists: featured_artists, icon: Users, color: 'bg-blue-100 text-blue-800' },
    { type: 'Remixers', artists: remixers, icon: Music, color: 'bg-purple-100 text-purple-800' },
    { type: 'Producers', artists: producers, icon: Music, color: 'bg-green-100 text-green-800' },
    { type: 'Collaborators', artists: collaborators, icon: Users, color: 'bg-orange-100 text-orange-800' }
  ].filter(rel => rel.artists.length > 0)

  return (
    <Card className="mt-4 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-sm text-purple-800">Artist Connections</CardTitle>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
              {collaboration_count} connections
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600 hover:text-purple-800"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
        <CardDescription className="text-xs text-purple-600">
          Discover the network of artists connected to "{track}"
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Simple Network Visualization */}
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="text-center mb-4">
              <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {artist}
              </div>
              <div className="text-xs text-gray-500 mt-1">Main Artist</div>
            </div>

            {/* Connection Lines (ASCII style) */}
            <div className="space-y-3">
              {relationshipTypes.map((relType, index) => (
                <div key={relType.type} className="flex items-center gap-3">
                  <div className="flex-1 border-t-2 border-dashed border-purple-300"></div>
                  <Badge className={relType.color}>
                    <relType.icon className="w-3 h-3 mr-1" />
                    {relType.type}
                  </Badge>
                  <div className="flex-1 border-t-2 border-dashed border-purple-300"></div>
                </div>
              ))}
            </div>

            {/* Connected Artists */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {related_artists.map((connectedArtist, index) => (
                <div
                  key={`${connectedArtist}-${index}`}
                  className="bg-gray-100 hover:bg-purple-100 transition-colors rounded px-3 py-2 text-center"
                >
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {connectedArtist}
                  </div>
                  {/* Show relationship type */}
                  {featured_artists.includes(connectedArtist) && (
                    <div className="text-xs text-blue-600">Featured</div>
                  )}
                  {remixers.includes(connectedArtist) && (
                    <div className="text-xs text-purple-600">Remix</div>
                  )}
                  {producers.includes(connectedArtist) && (
                    <div className="text-xs text-green-600">Producer</div>
                  )}
                  {collaborators.includes(connectedArtist) && (
                    <div className="text-xs text-orange-600">Collab</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Relationship Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relationshipTypes.map((relType) => (
              <div key={relType.type} className="space-y-2">
                <div className="flex items-center gap-2">
                  <relType.icon className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-800">{relType.type}</span>
                  <Badge variant="outline" className="text-xs">
                    {relType.artists.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {relType.artists.map((artistName, index) => (
                    <Badge
                      key={`${artistName}-${index}`}
                      variant="secondary"
                      className={`text-xs ${relType.color}`}
                    >
                      {artistName}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Influence Insights */}
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
            <div className="text-sm font-medium text-purple-800 mb-2">
              🔍 Connection Insights
            </div>
            <div className="text-xs text-purple-700 space-y-1">
              {featured_artists.length > 0 && (
                <div>• This track features {featured_artists.length} guest artist{featured_artists.length > 1 ? 's' : ''}</div>
              )}
              {remixers.length > 0 && (
                <div>• Remixed by {remixers.length} artist{remixers.length > 1 ? 's' : ''}</div>
              )}
              {producers.length > 0 && (
                <div>• {producers.length} producer{producers.length > 1 ? 's' : ''} involved in this track</div>
              )}
              {collaborators.length > 0 && (
                <div>• Part of {collaborators.length} collaboration{collaborators.length > 1 ? 's' : ''}</div>
              )}
              <div className="mt-2 pt-2 border-t border-purple-200">
                💡 <strong>Why this matters:</strong> These connections show the collaborative nature of electronic music and can help you discover similar artists and tracks.
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}