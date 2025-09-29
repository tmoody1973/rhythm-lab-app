'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Users,
  Music,
  Zap,
  ExternalLink,
  Filter,
  Network,
  TrendingUp,
  Sparkles
} from 'lucide-react'

// Types
interface ArtistRelationship {
  id: string
  source_artist_name: string
  source_artist_slug: string
  target_artist_name: string
  target_artist_slug: string
  relationship_type: 'collaboration' | 'remix' | 'featured' | 'producer' | 'label_mate' | 'influence' | 'side_project' | 'group_member'
  strength: number
  collaboration_count: number
  first_collaboration_date?: string
  last_collaboration_date?: string
  verified: boolean
  evidence_tracks?: string[]
  evidence_releases?: string[]
  notes?: string
}

interface ArtistNode {
  id: string
  name: string
  slug: string
  collaboration_count: number
  influence_score: number
  relationship_types: Set<string>
  strength_sum: number
}

const RELATIONSHIP_TYPES = {
  collaboration: { label: 'Collaboration', color: 'bg-blue-500', icon: Users },
  remix: { label: 'Remix', color: 'bg-purple-500', icon: Music },
  featured: { label: 'Featured', color: 'bg-green-500', icon: Sparkles },
  producer: { label: 'Producer', color: 'bg-orange-500', icon: Zap },
  label_mate: { label: 'Label Mate', color: 'bg-yellow-500', icon: Network },
  influence: { label: 'Influence', color: 'bg-red-500', icon: TrendingUp },
  side_project: { label: 'Side Project', color: 'bg-indigo-500', icon: Users },
  group_member: { label: 'Group Member', color: 'bg-pink-500', icon: Users }
}

export function ArtistInfluenceGraph({
  artistId,
  artistName,
  initialData = []
}: {
  artistId?: string
  artistName?: string
  initialData?: ArtistRelationship[]
}) {
  const [relationships, setRelationships] = useState<ArtistRelationship[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [minStrength, setMinStrength] = useState(0)
  const [selectedArtist, setSelectedArtist] = useState<string>(artistName || '')

  // Fetch relationships
  const fetchRelationships = async (targetArtistId?: string) => {
    if (!targetArtistId) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        artist_id: targetArtistId,
        limit: '100'
      })

      if (filterType !== 'all') {
        params.set('type', filterType)
      }

      if (minStrength > 0) {
        params.set('min_strength', minStrength.toString())
      }

      const response = await fetch(`/api/artist-relationships?${params}`)
      const data = await response.json()

      if (data.relationships) {
        setRelationships(data.relationships)
      }
    } catch (error) {
      console.error('Error fetching relationships:', error)
    } finally {
      setLoading(false)
    }
  }

  // Process relationships into artist nodes
  const processRelationships = (relationships: ArtistRelationship[]): Map<string, ArtistNode> => {
    const nodes = new Map<string, ArtistNode>()

    relationships.forEach(rel => {
      // Add source artist
      if (!nodes.has(rel.source_artist_name)) {
        nodes.set(rel.source_artist_name, {
          id: rel.source_artist_name,
          name: rel.source_artist_name,
          slug: rel.source_artist_slug,
          collaboration_count: 0,
          influence_score: 0,
          relationship_types: new Set(),
          strength_sum: 0
        })
      }

      // Add target artist
      if (!nodes.has(rel.target_artist_name)) {
        nodes.set(rel.target_artist_name, {
          id: rel.target_artist_name,
          name: rel.target_artist_name,
          slug: rel.target_artist_slug,
          collaboration_count: 0,
          influence_score: 0,
          relationship_types: new Set(),
          strength_sum: 0
        })
      }

      // Update statistics
      const sourceNode = nodes.get(rel.source_artist_name)!
      const targetNode = nodes.get(rel.target_artist_name)!

      sourceNode.collaboration_count += rel.collaboration_count
      sourceNode.relationship_types.add(rel.relationship_type)
      sourceNode.strength_sum += rel.strength

      targetNode.collaboration_count += rel.collaboration_count
      targetNode.relationship_types.add(rel.relationship_type)
      targetNode.strength_sum += rel.strength
    })

    // Calculate influence scores
    nodes.forEach(node => {
      node.influence_score = Math.round(
        (node.collaboration_count * 0.4 +
         node.strength_sum * 0.4 +
         node.relationship_types.size * 0.2) * 10
      ) / 10
    })

    return nodes
  }

  // Filter relationships based on search and filters
  const filteredRelationships = relationships.filter(rel => {
    const matchesSearch = searchQuery === '' ||
      rel.source_artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rel.target_artist_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filterType === 'all' || rel.relationship_type === filterType
    const matchesStrength = rel.strength >= minStrength

    return matchesSearch && matchesType && matchesStrength
  })

  const artistNodes = processRelationships(filteredRelationships)
  const topArtists = Array.from(artistNodes.values())
    .sort((a, b) => b.influence_score - a.influence_score)
    .slice(0, 10)

  // Group relationships by type
  const relationshipsByType = filteredRelationships.reduce((acc, rel) => {
    if (!acc[rel.relationship_type]) {
      acc[rel.relationship_type] = []
    }
    acc[rel.relationship_type].push(rel)
    return acc
  }, {} as Record<string, ArtistRelationship[]>)

  useEffect(() => {
    if (artistId) {
      fetchRelationships(artistId)
    }
  }, [artistId, filterType, minStrength])

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Artist Influence Graph
          </CardTitle>
          <CardDescription>
            Explore artist collaborations, influences, and musical connections
            {selectedArtist && ` for ${selectedArtist}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(RELATIONSHIP_TYPES).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">Min Strength:</span>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={minStrength}
                onChange={(e) => setMinStrength(parseFloat(e.target.value) || 0)}
                className="w-20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span>Loading relationships...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Collaborators */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Top Collaborators
                  </CardTitle>
                  <CardDescription>
                    Artists ranked by influence score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {topArtists.map((artist, index) => (
                        <div key={artist.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <div>
                              <p className="font-medium">{artist.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {artist.collaboration_count} collaborations
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{artist.influence_score}</p>
                            <p className="text-xs text-muted-foreground">influence</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Relationship Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Relationship Types
                  </CardTitle>
                  <CardDescription>
                    Distribution of collaboration types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(relationshipsByType).map(([type, rels]) => {
                      const typeInfo = RELATIONSHIP_TYPES[type as keyof typeof RELATIONSHIP_TYPES]
                      const Icon = typeInfo?.icon || Users
                      const percentage = (rels.length / filteredRelationships.length) * 100

                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="font-medium">{typeInfo?.label || type}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {rels.length} ({Math.round(percentage)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network">
            <Card>
              <CardHeader>
                <CardTitle>Network Visualization</CardTitle>
                <CardDescription>
                  Text-based representation of artist connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4 font-mono text-sm">
                    {Array.from(artistNodes.values())
                      .sort((a, b) => b.influence_score - a.influence_score)
                      .slice(0, 20)
                      .map((artist, index) => {
                        const connections = filteredRelationships.filter(
                          rel => rel.source_artist_name === artist.name || rel.target_artist_name === artist.name
                        )

                        return (
                          <div key={artist.id} className="p-3 border rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={index < 5 ? 'default' : 'secondary'}>
                                #{index + 1}
                              </Badge>
                              <span className="font-bold">{artist.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {artist.influence_score} influence
                              </Badge>
                            </div>
                            <div className="ml-6 space-y-1">
                              {connections.slice(0, 5).map((rel, i) => {
                                const connectedArtist = rel.source_artist_name === artist.name
                                  ? rel.target_artist_name
                                  : rel.source_artist_name

                                const typeInfo = RELATIONSHIP_TYPES[rel.relationship_type]

                                return (
                                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                                    <span>├─</span>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${typeInfo?.color} text-white`}
                                    >
                                      {typeInfo?.label}
                                    </Badge>
                                    <span>{connectedArtist}</span>
                                    <span className="text-xs">({rel.strength}/10)</span>
                                  </div>
                                )
                              })}
                              {connections.length > 5 && (
                                <div className="text-xs text-muted-foreground ml-4">
                                  └─ +{connections.length - 5} more connections
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships">
            <Card>
              <CardHeader>
                <CardTitle>All Relationships</CardTitle>
                <CardDescription>
                  Detailed view of all artist connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {filteredRelationships.map((rel) => {
                      const typeInfo = RELATIONSHIP_TYPES[rel.relationship_type]
                      const Icon = typeInfo?.icon || Users

                      return (
                        <div key={rel.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className="h-4 w-4" />
                                <Badge
                                  variant="outline"
                                  className={`${typeInfo?.color} text-white`}
                                >
                                  {typeInfo?.label}
                                </Badge>
                                {rel.verified && (
                                  <Badge variant="outline" className="text-xs">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium">
                                {rel.source_artist_name} ↔ {rel.target_artist_name}
                              </p>
                              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Strength: {rel.strength}/10</span>
                                <span>Collaborations: {rel.collaboration_count}</span>
                                {rel.evidence_tracks && rel.evidence_tracks.length > 0 && (
                                  <span>Tracks: {rel.evidence_tracks.length}</span>
                                )}
                              </div>
                              {rel.notes && (
                                <p className="mt-2 text-sm text-muted-foreground italic">
                                  {rel.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Relationships:</span>
                      <span className="font-medium">{relationships.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique Artists:</span>
                      <span className="font-medium">{artistNodes.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified Relationships:</span>
                      <span className="font-medium">
                        {relationships.filter(r => r.verified).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Strength:</span>
                      <span className="font-medium">
                        {relationships.length > 0
                          ? (relationships.reduce((sum, r) => sum + r.strength, 0) / relationships.length).toFixed(1)
                          : '0'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Strength Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Weak (1-3)', min: 1, max: 3 },
                      { label: 'Medium (4-6)', min: 4, max: 6 },
                      { label: 'Strong (7-8)', min: 7, max: 8 },
                      { label: 'Very Strong (9-10)', min: 9, max: 10 }
                    ].map(({ label, min, max }) => {
                      const count = relationships.filter(r => r.strength >= min && r.strength <= max).length
                      const percentage = relationships.length > 0 ? (count / relationships.length) * 100 : 0

                      return (
                        <div key={label} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{label}</span>
                            <span>{count} ({Math.round(percentage)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {!loading && filteredRelationships.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No relationships found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== 'all' || minStrength > 0
                ? 'Try adjusting your search filters.'
                : 'No artist relationships have been discovered yet.'
              }
            </p>
            {artistId && (
              <Button onClick={() => fetchRelationships(artistId)}>
                Refresh
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}