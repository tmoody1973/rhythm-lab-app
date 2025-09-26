"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Activity,
  Youtube,
  Disc,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Database,
  Filter,
  Play
} from 'lucide-react'
import type { MixcloudShow, MixcloudTrack } from '@/lib/database/mixcloud-types'

interface ShowEnhancementStatus {
  show_id: string
  title: string
  total_tracks: number
  tracks_with_youtube: number
  tracks_with_discogs: number
  enhancement_percentage: number
  last_enhanced?: string
  needs_enhancement: boolean
}

interface EnhancementProgress {
  isRunning: boolean
  currentShow?: string
  currentTrack?: string
  completed: number
  total: number
  status: string
  errors: string[]
  warnings: string[]
}

export function TrackEnhancementInterface() {
  const [shows, setShows] = useState<ShowEnhancementStatus[]>([])
  const [selectedShows, setSelectedShows] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [progress, setProgress] = useState<EnhancementProgress>({
    isRunning: false,
    completed: 0,
    total: 0,
    status: '',
    errors: [],
    warnings: []
  })
  const [quotaStatus, setQuotaStatus] = useState({
    youtube: { available: true, remaining: 0, message: '' },
    discogs: { available: true, remaining: 0, message: '' }
  })

  // Load shows from database
  useEffect(() => {
    loadShows()
    checkQuotaStatus()
  }, [])

  const loadShows = async () => {
    setIsLoading(true)
    try {
      // This would call an API endpoint to get shows with their enhancement status
      const response = await fetch('/api/mixcloud/shows-enhancement-status')
      if (response.ok) {
        const data = await response.json()
        setShows(data.shows || [])
      } else {
        console.error('Failed to load shows')
      }
    } catch (error) {
      console.error('Error loading shows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkQuotaStatus = async () => {
    try {
      const response = await fetch('/api/mixcloud/quota-status')
      if (response.ok) {
        const data = await response.json()
        setQuotaStatus(data)
      }
    } catch (error) {
      console.error('Error checking quota status:', error)
    }
  }

  const enhanceShows = async (showIds: string[], options: {
    enable_youtube: boolean
    enable_discogs: boolean
    skip_existing: boolean
  }) => {
    setProgress({
      isRunning: true,
      completed: 0,
      total: showIds.length,
      status: 'Starting enhancement...',
      errors: [],
      warnings: []
    })

    try {
      for (let i = 0; i < showIds.length; i++) {
        const showId = showIds[i]
        const show = shows.find(s => s.show_id === showId)

        setProgress(prev => ({
          ...prev,
          completed: i,
          currentShow: show?.title || 'Unknown Show',
          status: `Enhancing ${show?.title || 'show'}...`
        }))

        const response = await fetch('/api/mixcloud/enhance-tracks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            show_id: showId,
            options
          })
        })

        const result = await response.json()

        if (!result.success) {
          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, `${show?.title}: ${result.message}`]
          }))
        }

        if (result.warnings?.length > 0) {
          setProgress(prev => ({
            ...prev,
            warnings: [...prev.warnings, ...result.warnings]
          }))
        }
      }

      setProgress(prev => ({
        ...prev,
        completed: showIds.length,
        status: 'Enhancement completed!'
      }))

      // Reload shows to reflect changes
      await loadShows()

    } catch (error) {
      setProgress(prev => ({
        ...prev,
        errors: [...prev.errors, `Enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }))
    } finally {
      setTimeout(() => {
        setProgress(prev => ({ ...prev, isRunning: false }))
      }, 2000)
    }
  }

  const filteredShows = shows.filter(show =>
    show.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalShows = shows.length
  const showsNeedingEnhancement = shows.filter(show => show.needs_enhancement).length
  const fullyEnhancedShows = shows.filter(show => show.enhancement_percentage >= 90).length

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Shows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShows}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Need Enhancement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{showsNeedingEnhancement}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Fully Enhanced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fullyEnhancedShows}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Quotas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Badge variant={quotaStatus.youtube.available ? "secondary" : "destructive"} className="text-xs">
                <Youtube className="h-3 w-3 mr-1" />
                YouTube: {quotaStatus.youtube.available ? 'OK' : 'Limited'}
              </Badge>
              <Badge variant={quotaStatus.discogs.available ? "secondary" : "destructive"} className="text-xs">
                <Disc className="h-3 w-3 mr-1" />
                Discogs: {quotaStatus.discogs.available ? 'OK' : 'Limited'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhancement Progress */}
      {progress.isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Enhancement in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{progress.status}</span>
                <span>{progress.completed}/{progress.total}</span>
              </div>
              <Progress value={(progress.completed / progress.total) * 100} />
            </div>
            {progress.currentShow && (
              <p className="text-sm text-muted-foreground">
                Current: {progress.currentShow}
              </p>
            )}
            {progress.errors.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-red-600">Errors:</h4>
                {progress.errors.map((error, index) => (
                  <p key={index} className="text-xs text-red-600">{error}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="shows" className="w-full">
        <TabsList>
          <TabsTrigger value="shows">Shows List</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="shows" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={loadShows} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Shows List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Shows Enhancement Status
              </CardTitle>
              <CardDescription>
                Click on individual shows to enhance their tracks, or use bulk actions below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : filteredShows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No shows found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredShows.map((show) => (
                    <div
                      key={show.show_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedShows.has(show.show_id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedShows)
                            if (checked) {
                              newSelected.add(show.show_id)
                            } else {
                              newSelected.delete(show.show_id)
                            }
                            setSelectedShows(newSelected)
                          }}
                        />
                        <div>
                          <h4 className="font-medium">{show.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{show.total_tracks} tracks</span>
                            <Badge variant="outline" className="text-xs">
                              <Youtube className="h-3 w-3 mr-1 text-red-500" />
                              {show.tracks_with_youtube}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Disc className="h-3 w-3 mr-1 text-purple-500" />
                              {show.tracks_with_discogs}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {Math.round(show.enhancement_percentage)}% enhanced
                          </div>
                          <Progress value={show.enhancement_percentage} className="w-20 h-2" />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => enhanceShows([show.show_id], {
                            enable_youtube: true,
                            enable_discogs: true,
                            skip_existing: true
                          })}
                          disabled={progress.isRunning}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Enhance
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Enhancement Options</CardTitle>
              <CardDescription>
                Enhance multiple shows at once. Select shows from the list and configure options below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Selected Shows</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedShows.size} show{selectedShows.size !== 1 ? 's' : ''} selected
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Enhancement Options</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="youtube" defaultChecked />
                    <label htmlFor="youtube" className="text-sm">
                      Enable YouTube enhancement
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="discogs" defaultChecked />
                    <label htmlFor="discogs" className="text-sm">
                      Enable Discogs enhancement
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="skip-existing" defaultChecked />
                    <label htmlFor="skip-existing" className="text-sm">
                      Skip tracks with existing links
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => enhanceShows(Array.from(selectedShows), {
                    enable_youtube: true,
                    enable_discogs: true,
                    skip_existing: true
                  })}
                  disabled={selectedShows.size === 0 || progress.isRunning}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Enhance Selected Shows
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedShows(new Set())}
                  disabled={selectedShows.size === 0}
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}