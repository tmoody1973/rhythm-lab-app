'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Sparkles, FileText, Mic, Upload, Eye, ExternalLink, Settings, Image, Disc3, CheckCircle2, XCircle, Music, Clock, Calendar, Filter, ChevronDown, ChevronRight } from 'lucide-react'
import { ContentType } from '@/lib/ai/content-generator'
import { ImageSelector } from '@/components/admin/image-selector'
import { CitationDisplay } from '@/components/admin/citation-display'
import { ImageResult } from '@/lib/serpapi/image-search'
import SmartArtistSearch from '@/components/smart-artist-search'

interface GenerationRequest {
  type: ContentType
  topic: string
  additionalContext: string
  targetLength: 'short' | 'medium' | 'long'
}

interface GeneratedContent {
  title: string
  seoTitle: string
  subtitle?: string
  metaDescription: string
  content: string
  tags: string[]
  category: string
  wordCount: number
  seoBlock?: any
  searchResults?: Array<{
    title: string
    url: string
    date?: string
  }>
}

interface DiscographyOptions {
  includeDiscography: boolean
  maxReleases: number
  includeReleaseDetails: boolean
}

interface GeneratedProfile extends GeneratedContent {
  discography?: any[]
  artistInfo?: any
}

interface Artist {
  id: number
  name: string
  profile?: string
  images?: Array<{ type: string; uri: string }>
  resource_url: string
  uri: string
}

export default function ContentGenerationPage() {
  const [activeTab, setActiveTab] = useState('generate')
  const [request, setRequest] = useState<GenerationRequest>({
    type: 'artist-profile',
    topic: '',
    additionalContext: '',
    targetLength: 'medium'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<{ success: boolean; url?: string; storyId?: string; error?: string } | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageResult & { uploadedAsset?: any } | null>(null)
  const [discographyOptions, setDiscographyOptions] = useState<DiscographyOptions>({
    includeDiscography: true,
    maxReleases: 15,
    includeReleaseDetails: true
  })
  const [discographyData, setDiscographyData] = useState<any[] | null>(null)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [isGeneratingDiscography, setIsGeneratingDiscography] = useState(false)

  // Content History State
  const [contentHistory, setContentHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('all')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyStats, setHistoryStats] = useState<any>(null)

  const handleGenerate = async () => {
    if (!request.topic.trim()) return

    setIsGenerating(true)
    setGeneratedContent(null)
    setDiscographyData(null)
    setPublishResult(null)

    try {
      let endpoint = '/api/admin/generate-content'
      let requestBody: any = request

      // Always use regular content generation for the biography
      // We'll handle discography separately if needed

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Response Error:', errorText)
        throw new Error(`Failed to generate content: ${response.status}`)
      }

      const result = await response.json()
      setGeneratedContent(result.content)

      // If it's an artist profile with a selected artist, automatically fetch discography
      if (request.type === 'artist-profile' && selectedArtist && discographyOptions.includeDiscography) {
        console.log('[Admin] Auto-fetching discography for selected artist...')
        try {
          const discographyResponse = await fetch('/api/ai/generate-artist-profile-with-discography', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              artistName: request.topic,
              includeDiscography: true,
              maxReleases: discographyOptions.maxReleases,
              includeReleaseDetails: discographyOptions.includeReleaseDetails,
              discogsId: selectedArtist.id.toString(),
              discogsUrl: `https://www.discogs.com${selectedArtist.uri}`
            })
          })

          if (discographyResponse.ok) {
            const discographyResult = await discographyResponse.json()
            if (discographyResult.success && discographyResult.discography) {
              setDiscographyData(discographyResult.discography)
              console.log('[Admin] Discography fetched successfully:', discographyResult.discography.length, 'releases')
            }
          }
        } catch (discographyError) {
          console.warn('[Admin] Failed to fetch discography:', discographyError)
        }
      }

      setActiveTab('preview')
    } catch (error) {
      console.error('Generation error:', error)
      alert(`Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGetDiscography = async (artistName: string) => {
    if (!artistName.trim()) return

    setIsGeneratingDiscography(true)

    try {
      const response = await fetch('/api/ai/generate-artist-profile-with-discography', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistName,
          includeDiscography: true,
          maxReleases: discographyOptions.maxReleases,
          includeReleaseDetails: discographyOptions.includeReleaseDetails
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch discography')
      }

      const result = await response.json()
      if (result.success && result.discography) {
        setDiscographyData(result.discography)
      } else {
        throw new Error(result.error || 'Failed to fetch discography')
      }
    } catch (error) {
      console.error('Discography fetch error:', error)
      alert(`Error fetching discography: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGeneratingDiscography(false)
    }
  }

  const handlePublishToStoryblok = async () => {
    if (!generatedContent) return

    setIsPublishing(true)
    setPublishResult(null)

    try {
      const response = await fetch('/api/admin/publish-to-storyblok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: generatedContent,
          contentType: request.type,
          selectedImage: selectedImage, // Include selected image data
          discography: discographyData, // Include discography data for artist profiles
          selectedArtist: selectedArtist // Include selected artist with discogs ID/URL
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish to Storyblok')
      }

      const result = await response.json()
      setPublishResult(result)
    } catch (error) {
      console.error('Publish error:', error)
      setPublishResult({ success: false, error: 'Failed to publish content' })
    } finally {
      setIsPublishing(false)
    }
  }

  // Content History Functions
  const loadContentHistory = async (page = 1, type = 'all') => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch(`/api/admin/content-history?page=${page}&limit=10&type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setContentHistory(data.entries)
      }
    } catch (error) {
      console.error('Failed to load content history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const loadHistoryStats = async () => {
    try {
      const response = await fetch('/api/admin/content-history?stats=true')
      if (response.ok) {
        const data = await response.json()
        setHistoryStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load history stats:', error)
    }
  }

  // Load content history when History tab is opened
  useEffect(() => {
    if (activeTab === 'history') {
      loadContentHistory(historyPage, historyFilter)
      loadHistoryStats()
    }
  }, [activeTab, historyPage, historyFilter])

  // Refresh history after successful publish
  useEffect(() => {
    if (publishResult?.success && activeTab === 'history') {
      loadContentHistory(historyPage, historyFilter)
      loadHistoryStats()
    }
  }, [publishResult])

  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false)
  const [podcastResult, setPodcastResult] = useState<{ success: boolean; podcast?: any; storyblok?: any; error?: string } | null>(null)

  const handleGeneratePodcast = async () => {
    if (!generatedContent || request.type !== 'deep-dive') return

    setIsGeneratingPodcast(true)
    setPodcastResult(null)

    try {
      const response = await fetch('/api/admin/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: generatedContent.content,
          voice: 'professional_male', // Default voice
          storyId: publishResult?.storyId // Include story ID if content was published
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate podcast')
      }

      const result = await response.json()
      setPodcastResult(result)

      // If audio is returned as base64, create download link
      if (result.podcast?.audioBase64) {
        const audioBlob = new Blob([
          Uint8Array.from(atob(result.podcast.audioBase64), c => c.charCodeAt(0))
        ], { type: 'audio/mpeg' })

        const url = URL.createObjectURL(audioBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `podcast-${generatedContent.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp3`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Podcast generation error:', error)
      setPodcastResult({ success: false, error: 'Failed to generate podcast' })
    } finally {
      setIsGeneratingPodcast(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Content Generator</h1>
          <p className="text-muted-foreground">
            Generate high-quality content for artist profiles, deep dives, and blog posts using AI
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/admin/prompts">
            <Settings className="w-4 h-4 mr-2" />
            Customize Prompts
          </a>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedContent}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="images" disabled={!generatedContent}>
            <Image className="w-4 h-4 mr-2" />
            Images
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Generation</CardTitle>
              <CardDescription>
                Configure your content generation request below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select
                    value={request.type}
                    onValueChange={(value) => setRequest(prev => ({ ...prev, type: value as ContentType }))}
                  >
                    <SelectTrigger id="content-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artist-profile">Artist Profile</SelectItem>
                      <SelectItem value="deep-dive">Deep Dive</SelectItem>
                      <SelectItem value="blog-post">Blog Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-length">Target Length</Label>
                  <Select
                    value={request.targetLength}
                    onValueChange={(value) => setRequest(prev => ({ ...prev, targetLength: value as any }))}
                  >
                    <SelectTrigger id="target-length">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (~500 words)</SelectItem>
                      <SelectItem value="medium">Medium (~1000 words)</SelectItem>
                      <SelectItem value="long">Long (~2000 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                {request.type === 'artist-profile' ? (
                  <>
                    <Label htmlFor="artist">Artist Name</Label>
                    <SmartArtistSearch
                      onSelect={(artist) => {
                        setSelectedArtist(artist)
                        setRequest(prev => ({ ...prev, topic: artist.name }))
                      }}
                      placeholder="Search for an artist (e.g., Miles Davis, Flying Lotus)..."
                      initialValue={request.topic}
                      className="w-full"
                    />
                    {selectedArtist && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
                        <CheckCircle2 className="w-4 h-4" />
                        Selected: {selectedArtist.name} (ID: {selectedArtist.id})
                        <a
                          href={`https://www.discogs.com${selectedArtist.uri}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View on Discogs
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., The Evolution of Jazz Fusion, Hip-Hop in the 90s"
                      value={request.topic}
                      onChange={(e) => setRequest(prev => ({ ...prev, topic: e.target.value }))}
                    />
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="context">Additional Context (Optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Any specific focus, angle, or additional information you want to include..."
                  value={request.additionalContext}
                  onChange={(e) => setRequest(prev => ({ ...prev, additionalContext: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Discography Options for Artist Profiles */}
              {request.type === 'artist-profile' && (
                <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                  <div className="flex items-center gap-2">
                    <Disc3 className="h-5 w-5 text-purple-600" />
                    <Label className="text-base font-semibold text-purple-900">Discography Integration</Label>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-discography"
                        checked={discographyOptions.includeDiscography}
                        onCheckedChange={(checked) =>
                          setDiscographyOptions(prev => ({ ...prev, includeDiscography: checked as boolean }))
                        }
                      />
                      <Label htmlFor="include-discography" className="text-sm font-medium">
                        Include Discogs discography
                      </Label>
                    </div>

                    {discographyOptions.includeDiscography && (
                      <div className="ml-6 space-y-3 p-3 bg-white/50 rounded border">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="max-releases" className="text-sm">Max Releases</Label>
                            <Select
                              value={discographyOptions.maxReleases.toString()}
                              onValueChange={(value) =>
                                setDiscographyOptions(prev => ({ ...prev, maxReleases: parseInt(value) }))
                              }
                            >
                              <SelectTrigger id="max-releases" className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10 releases</SelectItem>
                                <SelectItem value="15">15 releases</SelectItem>
                                <SelectItem value="20">20 releases</SelectItem>
                                <SelectItem value="25">25 releases</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Release Details</Label>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="include-details"
                                checked={discographyOptions.includeReleaseDetails}
                                onCheckedChange={(checked) =>
                                  setDiscographyOptions(prev => ({ ...prev, includeReleaseDetails: checked as boolean }))
                                }
                              />
                              <Label htmlFor="include-details" className="text-xs">
                                Fetch detailed info
                              </Label>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-purple-700">
                          Discography will be automatically fetched from Discogs and added as release_item blocks in Storyblok.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={!request.topic.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>

              {/* Get Discography Button - Only show for artist profiles after content is generated */}
              {request.type === 'artist-profile' && generatedContent && !discographyData && (
                <Button
                  onClick={() => handleGetDiscography(request.topic)}
                  disabled={isGeneratingDiscography}
                  className="w-full mt-2"
                  variant="outline"
                >
                  {isGeneratingDiscography ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Discography...
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4 mr-2" />
                      Get Discography
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {generatedContent && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{generatedContent.title}</CardTitle>
                      {generatedContent.subtitle && (
                        <CardDescription className="mt-2">
                          {generatedContent.subtitle}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {generatedContent.wordCount} words
                      </Badge>
                      <Badge variant="outline">
                        {generatedContent.category}
                      </Badge>
                    </div>
                  </div>

                  {/* SEO Preview */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">SEO Preview</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Title Tag:</span>
                        <p className="text-sm font-medium text-blue-600">{generatedContent.seoTitle}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Meta Description:</span>
                        <p className="text-sm text-gray-600">{generatedContent.metaDescription}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <CitationDisplay
                      content={generatedContent.content}
                      searchResults={generatedContent.searchResults}
                      className="prose max-w-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Discography Preview for Artist Profiles */}
              {request.type === 'artist-profile' && discographyData && discographyData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Disc3 className="h-5 w-5 text-purple-600" />
                      Discography ({discographyData.length} releases)
                    </CardTitle>
                    <CardDescription>
                      Releases fetched from Discogs that will be added to the Storyblok profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {discographyData.slice(0, 12).map((release: any, index: number) => (
                        <div key={release._uid} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                          {release.cover_image_url && (
                            <img
                              src={release.cover_image_url}
                              alt={release.title}
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm truncate">{release.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{release.year || 'Unknown Year'}</span>
                              <span>•</span>
                              <span className="truncate">{release.label || 'Unknown Label'}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {release.type}
                              </Badge>
                              {release.formats && release.formats.length > 0 && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  {release.formats[0]}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {discographyData.length > 12 && (
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        Showing first 12 of {discographyData.length} releases. All will be included in Storyblok.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-4">
                <Button
                  onClick={handlePublishToStoryblok}
                  disabled={isPublishing}
                  className="flex-1"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Publish to Storyblok
                    </>
                  )}
                </Button>

                {request.type === 'deep-dive' && (
                  <Button
                    onClick={handleGeneratePodcast}
                    disabled={isGeneratingPodcast}
                    variant="outline"
                    className="flex-1"
                  >
                    {isGeneratingPodcast ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Podcast...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Generate Podcast
                      </>
                    )}
                  </Button>
                )}
              </div>

              {publishResult && (
                <Card>
                  <CardContent className="pt-6">
                    {publishResult.success ? (
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-900">Successfully published to Storyblok!</p>
                          <p className="text-sm text-green-700">Content has been created as a draft in your Storyblok space.</p>
                        </div>
                        {publishResult.url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={publishResult.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View in Storyblok
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="font-medium text-red-900">Failed to publish content</p>
                        <p className="text-sm text-red-700">{publishResult.error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {podcastResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mic className="w-5 h-5 mr-2" />
                      Podcast Generation Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {podcastResult.success ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="font-medium text-green-900">Podcast generated successfully!</p>
                          {podcastResult.podcast && (
                            <div className="mt-2 text-sm text-green-700">
                              <p>Audio size: {(podcastResult.podcast.audioSize / 1024 / 1024).toFixed(2)} MB</p>
                              <p>Estimated duration: ~{podcastResult.podcast.duration} minutes</p>
                            </div>
                          )}
                        </div>

                        {podcastResult.storyblok && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="font-medium text-blue-900">Storyblok Integration:</p>
                            <div className="mt-1 text-sm text-blue-700">
                              <p>Audio uploaded: {podcastResult.storyblok.audioUploaded ? '✅ Yes' : '❌ No'}</p>
                              <p>Story updated: {podcastResult.storyblok.storyUpdated ? '✅ Yes' : '❌ No'}</p>
                              {podcastResult.storyblok.error && (
                                <p className="text-red-600">Error: {podcastResult.storyblok.error}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {podcastResult.podcast?.script && (
                          <div>
                            <Label>Generated Podcast Script:</Label>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm whitespace-pre-wrap">{podcastResult.podcast.script}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="font-medium text-red-900">Failed to generate podcast</p>
                        <p className="text-sm text-red-700">{podcastResult.error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="images">
          {generatedContent && (
            <ImageSelector
              onImageSelect={setSelectedImage}
              contentTitle={generatedContent.title}
              contentType={request.type}
              selectedImage={selectedImage}
            />
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-6">
            {/* Stats Cards */}
            {historyStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Content</p>
                        <p className="text-2xl font-bold">{historyStats.totalContent}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Published</p>
                        <p className="text-2xl font-bold">{historyStats.publishedContent}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Drafts</p>
                        <p className="text-2xl font-bold">{historyStats.draftContent}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Errors</p>
                        <p className="text-2xl font-bold">{historyStats.errorContent}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* History List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Content History</CardTitle>
                    <CardDescription>
                      All generated and published content
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Select value={historyFilter} onValueChange={setHistoryFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="artist-profile">Artist Profiles</SelectItem>
                        <SelectItem value="deep-dive">Deep Dives</SelectItem>
                        <SelectItem value="blog-post">Blog Posts</SelectItem>
                        <SelectItem value="show-description">Show Descriptions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : contentHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No content generated yet</p>
                    <p className="text-sm">Start by generating some content in the Generate tab!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contentHistory.map((entry: any) => (
                      <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-lg">{entry.title}</h3>
                              <Badge variant={
                                entry.status === 'published' ? 'default' :
                                entry.status === 'draft' ? 'secondary' : 'destructive'
                              }>
                                {entry.status}
                              </Badge>
                              <Badge variant="outline">
                                {entry.contentType.replace('-', ' ')}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString()}
                              </div>
                              {entry.metadata.wordCount && (
                                <div className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {entry.metadata.wordCount} words
                                </div>
                              )}
                              {entry.metadata.hasDiscography && (
                                <div className="flex items-center gap-1">
                                  <Disc3 className="w-3 h-3" />
                                  {entry.metadata.discographyCount} releases
                                </div>
                              )}
                            </div>

                            {entry.errorMessage && (
                              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm mb-3">
                                Error: {entry.errorMessage}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {entry.storyblokUrl && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={entry.storyblokUrl} target="_blank" rel="noopener noreferrer">
                                  <Settings className="w-3 h-3 mr-1" />
                                  Edit in Storyblok
                                </a>
                              </Button>
                            )}
                            {entry.liveUrl && entry.status === 'published' && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={entry.liveUrl} target="_blank" rel="noopener noreferrer">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Live
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}