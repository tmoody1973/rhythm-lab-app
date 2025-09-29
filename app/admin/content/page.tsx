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
import { Loader2, Sparkles, FileText, Mic, Upload, Eye, ExternalLink, Settings, Image, Disc3, CheckCircle2, XCircle, Music, Clock, Calendar, Filter, ChevronDown, ChevronRight, Play, Edit, Save, Volume2, Download } from 'lucide-react'
import { ContentType } from '@/lib/ai/content-generator'
import { ImageSelector } from '@/components/admin/image-selector'
import { CitationDisplay } from '@/components/admin/citation-display'
import { EnhancedCitationDisplay } from '@/components/enhanced-citation-display'
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
  const [citationDisplayMode, setCitationDisplayMode] = useState<'classic' | 'enhanced'>('enhanced')
  const [enhancedCitationMode, setEnhancedCitationMode] = useState<'full' | 'compact' | 'minimal' | 'grid'>('compact')

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


  // Sound Refinery podcast state
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [podcastScript, setPodcastScript] = useState<Array<{ speaker: 'Samara' | 'Carl', text: string }> | null>(null)
  const [isEditingScript, setIsEditingScript] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioResult, setAudioResult] = useState<{
    data?: string;
    url?: string;
    mimeType: string;
    size: number;
    duration: number;
    uploadedToStorage?: boolean;
    fileName?: string;
    path?: string;
    storage?: string;
  } | null>(null)
  const [scriptGenerationError, setScriptGenerationError] = useState<string | null>(null)
  const [audioGenerationError, setAudioGenerationError] = useState<string | null>(null)
  const [isUploadingToStoryblok, setIsUploadingToStoryblok] = useState(false)
  const [storyblokUploadResult, setStoryblokUploadResult] = useState<any>(null)
  const [isPublishingToPodbean, setIsPublishingToPodbean] = useState(false)
  const [podbeanPublishResult, setPodbeanPublishResult] = useState<any>(null)
  const [currentPodcastId, setCurrentPodcastId] = useState<string | null>(null)

  // Sound Refinery script generation
  const handleGenerateScript = async () => {
    if (!generatedContent || request.type !== 'deep-dive') return

    setIsGeneratingScript(true)
    setScriptGenerationError(null)
    setPodcastScript(null)

    try {
      // Create podcast history entry
      const historyResponse = await fetch('/api/admin/podcast-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: generatedContent.title,
          sourceType: 'deep-dive',
          sourceId: publishResult?.storyId,
          status: 'processing',
          script: null,
          audio: null,
          storyblok: null,
          podbean: null,
          metadata: {
            generatedBy: 'admin-ui'
          }
        }),
      })

      let podcastId = null
      if (historyResponse.ok) {
        const historyResult = await historyResponse.json()
        podcastId = historyResult.entry?.id
        setCurrentPodcastId(podcastId)
      }

      const response = await fetch('/api/podcast/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: generatedContent.content,
          additionalContext: request.additionalContext || ''
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate script')
      }

      const result = await response.json()
      if (result.success && result.script) {
        setPodcastScript(result.script)

        // Update podcast history with script
        if (podcastId) {
          await fetch('/api/admin/podcast-history', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: podcastId,
              script: result.script,
              metadata: {
                scriptGeneratedAt: new Date().toISOString(),
                scriptLineCount: result.script.length,
                estimatedDuration: Math.round(result.script.length * 0.8),
                generatedBy: 'admin-ui'
              }
            }),
          })
        }
      } else {
        throw new Error(result.error || 'Invalid script response')
      }
    } catch (error) {
      console.error('Script generation error:', error)
      setScriptGenerationError(error instanceof Error ? error.message : 'Failed to generate script')

      // Update podcast history with error
      if (currentPodcastId) {
        await fetch('/api/admin/podcast-history', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentPodcastId,
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Script generation failed'
          }),
        })
      }
    } finally {
      setIsGeneratingScript(false)
    }
  }

  // Sound Refinery audio generation
  const handleGenerateAudio = async () => {
    if (!podcastScript) return

    setIsGeneratingAudio(true)
    setAudioGenerationError(null)
    setAudioResult(null)

    try {
      const response = await fetch('/api/podcast/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: podcastScript
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate audio')
      }

      const result = await response.json()
      if (result.success && result.audio) {
        setAudioResult(result.audio)

        // Update podcast history with audio
        if (currentPodcastId) {
          await fetch('/api/admin/podcast-history', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: currentPodcastId,
              status: 'completed',
              audio: {
                duration: result.audio.duration,
                fileSize: result.audio.size,
                mimeType: result.audio.mimeType
              },
              metadata: {
                audioGeneratedAt: new Date().toISOString(),
                generatedBy: 'admin-ui'
              }
            }),
          })
        }
      } else {
        throw new Error(result.error || 'Invalid audio response')
      }
    } catch (error) {
      console.error('Audio generation error:', error)
      setAudioGenerationError(error instanceof Error ? error.message : 'Failed to generate audio')
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  // Save edited script
  const handleSaveScript = () => {
    setIsEditingScript(false)
  }

  // Download audio file
  const handleDownloadAudio = () => {
    if (!audioResult || !generatedContent) return

    try {
      const fileName = audioResult.fileName || `sound-refinery-${generatedContent.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp3`

      if (audioResult.url) {
        // Audio is stored in cloud storage - use direct link
        const a = document.createElement('a')
        a.href = audioResult.url
        a.download = fileName
        a.target = '_blank' // Open in new tab for cloud storage URLs
        a.click()
      } else if (audioResult.data) {
        // Audio is base64 encoded - create blob
        const audioBlob = new Blob([
          Uint8Array.from(atob(audioResult.data), c => c.charCodeAt(0))
        ], { type: audioResult.mimeType })

        const url = URL.createObjectURL(audioBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  // Upload audio to Supabase Storage
  const handleUploadToSupabase = async () => {
    if (!audioResult || !generatedContent) return

    setIsUploadingToStoryblok(true)
    setStoryblokUploadResult(null)

    try {
      // If audio is already uploaded to storage, update existing Storyblok story if available
      if (audioResult.uploadedToStorage && audioResult.url) {
        // Try to update existing Storyblok story with audio URL if story ID is available
        if (publishResult?.storyId) {
          try {
            console.log(`Updating existing Storyblok story ${publishResult.storyId} with audio URL`)

            const updateResponse = await fetch('/api/storyblok/update-audio', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                storyId: publishResult.storyId,
                audioUrl: audioResult.url,
                audioTitle: `Sound Refinery: ${generatedContent.title}`
              }),
            })

            const updateResult = await updateResponse.json()

            if (updateResult.success) {
              setStoryblokUploadResult({
                success: true,
                audio: {
                  url: audioResult.url,
                  fileName: audioResult.fileName || `sound-refinery-${generatedContent.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp3`,
                  size: audioResult.size,
                  storage: audioResult.storage || 'supabase'
                },
                storyUpdate: {
                  success: true,
                  storyId: publishResult.storyId,
                  updatedAt: new Date().toISOString()
                },
                message: 'Audio synced to existing Storyblok story'
              })
            } else {
              throw new Error(updateResult.message || 'Failed to update Storyblok story')
            }
          } catch (storyUpdateError) {
            console.error('Failed to update Storyblok story with audio:', storyUpdateError)
            // Still show success for storage, but note the Storyblok sync issue
            setStoryblokUploadResult({
              success: true,
              audio: {
                url: audioResult.url,
                fileName: audioResult.fileName || `sound-refinery-${generatedContent.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp3`,
                size: audioResult.size,
                storage: audioResult.storage || 'supabase'
              },
              message: 'Audio uploaded to storage, but failed to sync to Storyblok',
              warning: storyUpdateError instanceof Error ? storyUpdateError.message : 'Storyblok sync failed'
            })
          }
        } else {
          // No story ID available, just show storage success
          setStoryblokUploadResult({
            success: true,
            audio: {
              url: audioResult.url,
              fileName: audioResult.fileName || `sound-refinery-${generatedContent.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp3`,
              size: audioResult.size,
              storage: audioResult.storage || 'supabase'
            },
            message: 'Audio already uploaded to storage (no Storyblok story to update)'
          })
        }

        setIsUploadingToStoryblok(false)
        return
      }

      // Only upload if we have base64 data
      if (!audioResult.data) {
        throw new Error('No audio data available for upload')
      }

      const fileName = `sound-refinery-${generatedContent.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp3`
      const title = `Sound Refinery: ${generatedContent.title}`

      const response = await fetch('/api/podcast/upload-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: audioResult.data,
          audioMimeType: audioResult.mimeType,
          fileName: fileName,
          title: title,
          storyId: publishResult?.storyId // Include story ID if content was published to Storyblok
        }),
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || ''
        let errorMessage = 'Failed to upload to Supabase Storage'

        try {
          if (contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData?.message || errorData?.error || errorMessage
          } else {
            const textError = await response.text()
            errorMessage = textError?.slice(0, 400) || errorMessage
          }
        } catch {
          // Keep default message if parsing fails
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      setStoryblokUploadResult(result)

      // Update podcast history with Storyblok upload
      if (currentPodcastId && result.success) {
        await fetch('/api/admin/podcast-history', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentPodcastId,
            audio: {
              audioUrl: result.asset?.url
            },
            storyblok: {
              assetId: result.asset?.id,
              storyId: result.storyUpdate?.storyId,
              assetUrl: result.asset?.url
            },
            metadata: {
              uploadedToStoryblokAt: new Date().toISOString(),
              generatedBy: 'admin-ui'
            }
          }),
        })
      }
    } catch (error) {
      console.error('Storyblok upload error:', error)
      setStoryblokUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload to Storyblok'
      })
    } finally {
      setIsUploadingToStoryblok(false)
    }
  }

  // Publish audio to Podbean
  const handlePublishToPodbean = async () => {
    if (!audioResult || !generatedContent) return
    setIsPublishingToPodbean(true)
    setPodbeanPublishResult(null)

    try {
      const fileName = `sound-refinery-${generatedContent.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp3`
      const title = `Sound Refinery: ${generatedContent.title}`

      const response = await fetch('/api/podcast/publish-to-podbean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: audioResult.data,
          audioMimeType: audioResult.mimeType,
          fileName: fileName,
          title: title,
          description: generatedContent.content,
          storyId: publishResult?.storyId,
          episodeType: 'public',
          status: 'draft' // Start as draft
        }),
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || ''
        let errorMessage = 'Failed to publish to Podbean'

        try {
          if (contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData?.message || errorData?.error || errorMessage
          } else {
            const textError = await response.text()
            errorMessage = textError?.slice(0, 400) || errorMessage
          }
        } catch {
          // Keep default message if parsing fails
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      setPodbeanPublishResult(result)

      // Update podcast history with Podbean publication
      if (currentPodcastId && result.success) {
        await fetch('/api/admin/podcast-history', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentPodcastId,
            podbean_episode_url: result.episode.url,
            podbean_episode_id: result.episode.id,
            podbean_status: result.episode.status,
            status: 'published_to_podbean'
          }),
        })
      }

    } catch (error: any) {
      console.error('Podbean publish error:', error)
      setPodbeanPublishResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish to Podbean'
      })
    } finally {
      setIsPublishingToPodbean(false)
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
          <TabsTrigger value="podcast" disabled={!generatedContent || request.type !== 'deep-dive'}>
            <Volume2 className="w-4 h-4 mr-2" />
            Generate Podcast
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

                    {/* Citation Display Controls */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Citation Display Settings</h3>
                        <div className="flex items-center gap-4">
                          <Select value={citationDisplayMode} onValueChange={(value: 'classic' | 'enhanced') => setCitationDisplayMode(value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="classic">Classic</SelectItem>
                              <SelectItem value="enhanced">Enhanced</SelectItem>
                            </SelectContent>
                          </Select>
                          {citationDisplayMode === 'enhanced' && (
                            <Select value={enhancedCitationMode} onValueChange={(value: 'full' | 'compact' | 'minimal' | 'grid') => setEnhancedCitationMode(value)}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">Full</SelectItem>
                                <SelectItem value="compact">Compact</SelectItem>
                                <SelectItem value="minimal">Minimal</SelectItem>
                                <SelectItem value="grid">Grid</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {citationDisplayMode === 'enhanced' && (
                          <>
                            <strong>{enhancedCitationMode}:</strong> {
                              enhancedCitationMode === 'full' ? 'Best for academic/research content with detailed source info' :
                              enhancedCitationMode === 'compact' ? 'Ideal for blog posts and articles with moderate detail' :
                              enhancedCitationMode === 'minimal' ? 'Perfect for social media and mobile-first content' :
                              'Great for visual browsing and resource collections'
                            }
                          </>
                        )}
                        {citationDisplayMode === 'classic' && (
                          <>
                            <strong>Classic:</strong> Original design with simple numbered references
                          </>
                        )}
                      </div>
                    </div>

                    {/* Citation Display */}
                    {citationDisplayMode === 'classic' ? (
                      <CitationDisplay
                        content={generatedContent.content}
                        searchResults={generatedContent.searchResults}
                        className="prose max-w-none"
                      />
                    ) : (
                      <EnhancedCitationDisplay
                        content={generatedContent.content}
                        searchResults={generatedContent.searchResults}
                        displayMode={enhancedCitationMode}
                        maxVisible={5}
                        autoCollapse={true}
                        className="prose max-w-none"
                      />
                    )}
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

        <TabsContent value="podcast" className="space-y-4">
          {generatedContent && request.type === 'deep-dive' && (
            <div className="space-y-6">
              {/* Sound Refinery Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                      <Volume2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Sound Refinery Podcast Generator</CardTitle>
                      <CardDescription>
                        Convert your deep-dive article into a BBC/NPR-style conversational podcast with Samara and Carl
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Step 1: Generate Script */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">1</span>
                    Generate Conversational Script
                  </CardTitle>
                  <CardDescription>
                    Create a natural dialogue between Samara and Carl based on your article content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript}
                    className="w-full"
                  >
                    {isGeneratingScript ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Script with Perplexity...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Generate Podcast Script
                      </>
                    )}
                  </Button>

                  {scriptGenerationError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-900 font-medium">Script Generation Error</p>
                      <p className="text-red-700 text-sm">{scriptGenerationError}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Review & Edit Script */}
              {podcastScript && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-sm font-bold">2</span>
                          Review & Edit Script
                        </CardTitle>
                        <CardDescription>
                          {podcastScript.length} dialogue exchanges • Est. {Math.round(podcastScript.length * 0.8)} minutes
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditingScript ? (
                          <Button onClick={handleSaveScript} size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        ) : (
                          <Button onClick={() => setIsEditingScript(true)} variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg border">
                      {podcastScript.map((line, index) => (
                        <div key={index} className="flex gap-3">
                          <div className={`w-16 text-xs font-medium px-2 py-1 rounded ${
                            line.speaker === 'Samara'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {line.speaker}
                          </div>
                          {isEditingScript ? (
                            <Textarea
                              value={line.text}
                              onChange={(e) => {
                                const newScript = [...podcastScript]
                                newScript[index].text = e.target.value
                                setPodcastScript(newScript)
                              }}
                              className="flex-1 min-h-[60px]"
                            />
                          ) : (
                            <p className="flex-1 text-sm leading-relaxed">{line.text}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Generate Audio */}
              {podcastScript && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-sm font-bold">3</span>
                      Generate Audio with ElevenLabs
                    </CardTitle>
                    <CardDescription>
                      Create high-quality audio using Samara and Carl's voices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio}
                      className="w-full"
                    >
                      {isGeneratingAudio ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Audio...
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Generate Audio
                        </>
                      )}
                    </Button>

                    {audioGenerationError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-900 font-medium">Audio Generation Error</p>
                        <p className="text-red-700 text-sm">{audioGenerationError}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Download & Use */}
              {audioResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-sm font-bold">✓</span>
                      Podcast Ready!
                    </CardTitle>
                    <CardDescription>
                      Your Sound Refinery podcast has been generated successfully
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-900">Audio Generated Successfully</p>
                          <div className="text-sm text-green-700 mt-1">
                            <p>Size: {(audioResult.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p>Duration: ~{audioResult.duration} minutes</p>
                            <p>Format: {audioResult.mimeType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button onClick={handleDownloadAudio} size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Download MP3
                          </Button>
                          <Button
                            onClick={handleUploadToSupabase}
                            size="sm"
                            disabled={isUploadingToStoryblok || audioResult.uploadedToStorage}
                            variant={audioResult.uploadedToStorage ? "secondary" : "default"}
                          >
                            {isUploadingToStoryblok ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : audioResult.uploadedToStorage ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Already Uploaded
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload to Cloud Storage
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handlePublishToPodbean}
                            size="sm"
                            disabled={isPublishingToPodbean}
                            variant="secondary"
                          >
                            {isPublishingToPodbean ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Publishing...
                              </>
                            ) : (
                              <>
                                <Mic className="w-4 h-4 mr-2" />
                                Publish to Podbean
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Audio Preview */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Label className="text-sm font-medium text-blue-900">Audio Preview</Label>
                      <audio
                        controls
                        className="w-full mt-2"
                        src={
                          audioResult.url
                            ? audioResult.url
                            : audioResult.data
                            ? `data:${audioResult.mimeType};base64,${audioResult.data}`
                            : ''
                        }
                      >
                        Your browser does not support the audio element.
                      </audio>
                      {audioResult.uploadedToStorage && (
                        <p className="text-xs text-blue-700 mt-1">
                          ✓ Audio uploaded to {audioResult.storage || 'cloud storage'}
                        </p>
                      )}
                    </div>

                    {/* Cloud Storage Upload Results */}
                    {storyblokUploadResult && (
                      <div className={`p-4 rounded-lg border ${
                        storyblokUploadResult.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${
                              storyblokUploadResult.success ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {storyblokUploadResult.success
                                ? 'Audio Uploaded to Cloud Storage Successfully!'
                                : 'Cloud Storage Upload Failed'
                              }
                            </p>
                            {storyblokUploadResult.success ? (
                              <div className="text-sm text-green-700 mt-1">
                                <p>Storage: {storyblokUploadResult.audio?.storage || 'Supabase'}</p>
                                <p>File: {storyblokUploadResult.audio?.fileName}</p>
                                {storyblokUploadResult.storyUpdate && (
                                  <p>✅ Deep-dive article updated with podcast audio URL</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-red-700 mt-1">
                                {storyblokUploadResult.error}
                              </p>
                            )}
                          </div>
                          {storyblokUploadResult.success && storyblokUploadResult.audio?.url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={storyblokUploadResult.audio.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Listen
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Podbean Publish Results */}
                    {podbeanPublishResult && (
                      <div className={`p-4 rounded-lg border ${
                        podbeanPublishResult.success
                          ? 'bg-purple-50 border-purple-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${
                              podbeanPublishResult.success ? 'text-purple-900' : 'text-red-900'
                            }`}>
                              {podbeanPublishResult.success
                                ? 'Episode Published to Podbean Successfully!'
                                : 'Podbean Publication Failed'
                              }
                            </p>
                            {podbeanPublishResult.success ? (
                              <div className="text-sm text-purple-700 mt-1">
                                <p>Platform: {podbeanPublishResult.episode?.platform || 'Podbean'}</p>
                                <p>Episode ID: {String(podbeanPublishResult.episode?.id || 'N/A')}</p>
                                <p>Status: {String(podbeanPublishResult.episode?.status || 'Unknown')}</p>
                                {podbeanPublishResult.storyUpdate && (
                                  <p>✅ Deep-dive article updated with Podbean episode details</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-red-700 mt-1">
                                {String(podbeanPublishResult.error || 'Unknown error occurred')}
                              </p>
                            )}
                          </div>
                          {podbeanPublishResult.success && podbeanPublishResult.episode?.url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={podbeanPublishResult.episode.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Episode
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <div className="text-center">
                          <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                          <p className="text-sm font-medium">Upload to Cloud</p>
                          <p className="text-xs text-muted-foreground">Store in Supabase & link to article</p>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-center">
                          <Mic className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                          <p className="text-sm font-medium">Publish to Podbean</p>
                          <p className="text-xs text-muted-foreground">Create podcast episode</p>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-center">
                          <Play className="w-6 h-6 mx-auto mb-2 text-green-600" />
                          <p className="text-sm font-medium">Add Play Button</p>
                          <p className="text-xs text-muted-foreground">Embed in article</p>
                        </div>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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