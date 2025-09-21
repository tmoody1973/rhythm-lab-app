'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Sparkles, FileText, Mic, Upload, Eye, ExternalLink, Settings, Image } from 'lucide-react'
import { ContentType } from '@/lib/ai/content-generator'
import { ImageSelector } from '@/components/admin/image-selector'
import { CitationDisplay } from '@/components/admin/citation-display'
import { ImageResult } from '@/lib/serpapi/image-search'

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

  const handleGenerate = async () => {
    if (!request.topic.trim()) return

    setIsGenerating(true)
    setGeneratedContent(null)
    setPublishResult(null)

    try {
      const response = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Response Error:', errorText)
        throw new Error(`Failed to generate content: ${response.status}`)
      }

      const result = await response.json()
      setGeneratedContent(result.content)
      setActiveTab('preview')
    } catch (error) {
      console.error('Generation error:', error)
      alert(`Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
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
          selectedImage: selectedImage // Include selected image data
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
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Miles Davis, The Evolution of Jazz Fusion, Hip-Hop in the 90s"
                  value={request.topic}
                  onChange={(e) => setRequest(prev => ({ ...prev, topic: e.target.value }))}
                />
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
                      className="prose max-w-none"
                    />
                  </div>
                </CardContent>
              </Card>

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
          <Card>
            <CardHeader>
              <CardTitle>Generation History</CardTitle>
              <CardDescription>
                View previously generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Content generation history will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}