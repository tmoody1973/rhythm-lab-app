"use client"

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  File,
  Music,
  CheckCircle,
  AlertCircle,
  Clock,
  Link as LinkIcon,
  Sparkles,
  Eye,
  X
} from 'lucide-react'
import { parsePlaylistText } from '@/lib/playlist-parser'
import { useDropzone } from 'react-dropzone'
import { uploadToMixcloudDirect, getMixcloudAccessToken } from '@/lib/mixcloud/client-upload-v2'

interface UploadState {
  status: 'idle' | 'uploading' | 'uploaded' | 'queued' | 'failed'
  progress: number
  message: string
  mixcloudUrl?: string
  jobId?: string
  errors?: string[]
}

interface FormData {
  showTitle: string
  showDescription: string
  showTags: string[]
  publishDate: string
  playlistText: string
  audioFile: File | null
  coverImage: File | null
}

export function UploadNewShow() {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: ''
  })

  const [formData, setFormData] = useState<FormData>({
    showTitle: '',
    showDescription: '',
    showTags: [],
    publishDate: new Date().toISOString().split('T')[0],
    playlistText: '',
    audioFile: null,
    coverImage: null
  })

  const [playlistPreview, setPlaylistPreview] = useState<any>(null)
  const [tagInput, setTagInput] = useState('')

  // Audio file dropzone
  const onAudioDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFormData(prev => ({ ...prev, audioFile: file }))
    }
  }, [])

  const { getRootProps: getAudioRootProps, getInputProps: getAudioInputProps, isDragActive: isAudioDragActive } = useDropzone({
    onDrop: onAudioDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav']
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024 // 500MB
  })

  // Cover image dropzone
  const onCoverDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFormData(prev => ({ ...prev, coverImage: file }))
    }
  }, [])

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps, isDragActive: isCoverDragActive } = useDropzone({
    onDrop: onCoverDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  // Parse playlist text
  const handlePlaylistChange = (text: string) => {
    setFormData(prev => ({ ...prev, playlistText: text }))

    if (text.trim()) {
      const parseResult = parsePlaylistText(text)
      setPlaylistPreview(parseResult)
    } else {
      setPlaylistPreview(null)
    }
  }

  // Handle tag input
  const addTag = () => {
    if (tagInput.trim() && !formData.showTags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        showTags: [...prev.showTags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      showTags: prev.showTags.filter(tag => tag !== tagToRemove)
    }))
  }

  // Generate AI description
  const generateAIDescription = async () => {
    if (!playlistPreview || playlistPreview.tracks.length === 0) {
      alert('Please add playlist data first')
      return
    }

    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.showTitle,
          tracks: playlistPreview.tracks
        })
      })

      const data = await response.json()
      if (data.success) {
        setFormData(prev => ({ ...prev, showDescription: data.description }))
      }
    } catch (error) {
      console.error('Failed to generate AI description:', error)
    }
  }

  // Submit upload
  const handleUpload = async () => {
    if (!formData.audioFile || !formData.showTitle) {
      alert('Please provide at least an audio file and title')
      return
    }

    setUploadState({
      status: 'uploading',
      progress: 0,
      message: 'Getting authentication token...'
    })

    try {
      // Step 1: Get access token from server (secure)
      const accessToken = await getMixcloudAccessToken()
      if (!accessToken) {
        throw new Error('Failed to get Mixcloud access token. Please reconnect your account.')
      }

      setUploadState({
        status: 'uploading',
        progress: 10,
        message: 'Uploading directly to Mixcloud...'
      })

      // Step 2: Parse playlist if provided
      const parsedPlaylist = formData.playlistText
        ? parsePlaylistText(formData.playlistText)
        : { tracks: [], errors: [] }

      // Step 3: Upload directly to Mixcloud from browser (bypasses server limits)
      const uploadResult = await uploadToMixcloudDirect(
        accessToken,
        {
          file: formData.audioFile,
          title: formData.showTitle,
          description: formData.showDescription,
          tags: formData.showTags,
          tracks: parsedPlaylist.tracks,
          coverImage: formData.coverImage || undefined
        },
        // Progress callback - update the UI as upload progresses
        (percent) => {
          setUploadState(prev => ({
            ...prev,
            progress: percent,
            message: percent < 90 ? 'Uploading to Mixcloud...' : 'Processing response...'
          }))
        }
      )

      console.log('Upload result:', uploadResult)

      // Check if upload failed
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload to Mixcloud failed')
      }

      setUploadState({
        status: 'uploading',
        progress: 90,
        message: 'Saving to database...'
      })

      // Step 4: Save upload record to our database (lightweight call)
      const recordResponse = await fetch('/api/mixcloud/record-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          showTitle: formData.showTitle,
          showDescription: formData.showDescription,
          showTags: formData.showTags,
          publishDate: formData.publishDate,
          playlistText: formData.playlistText,
          parsedTracks: parsedPlaylist.tracks,
          mixcloudUrl: uploadResult.url,
          uploadDetails: uploadResult.details
        })
      })

      const recordResult = await recordResponse.json()

      // Upload was successful
      setUploadState({
        status: 'uploaded',
        progress: 100,
        message: 'Show uploaded successfully to Mixcloud!',
        mixcloudUrl: uploadResult.url,
        jobId: recordResult.jobId,
        errors: []
      })
    } catch (error) {
      console.error('Upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      setUploadState({
        status: 'failed',
        progress: 0,
        message: 'Upload failed',
        errors: [errorMessage]
      })

      // Also show alert for immediate feedback
      alert(`Upload failed: ${errorMessage}`);
    }
  }

  const isFormValid = formData.audioFile && formData.showTitle

  return (
    <div className="space-y-6">
{/* OAuth Connection Status is now shown at the top of the admin interface */}

      {/* Upload Form */}
      <Card className="border border-amber-200/50 shadow-md bg-white/70 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg border-b border-amber-100">
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Upload className="h-5 w-5 text-orange-600" />
            Upload New Show
          </CardTitle>
          <CardDescription className="text-amber-700">
            Upload a new radio show directly to Mixcloud with playlist data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="audio">Audio & Cover</TabsTrigger>
              <TabsTrigger value="playlist">Playlist</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="showTitle">Show Title *</Label>
                  <Input
                    id="showTitle"
                    value={formData.showTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, showTitle: e.target.value }))}
                    placeholder="Enter show title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publishDate">Publish Date *</Label>
                  <Input
                    id="publishDate"
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="showDescription">Description</Label>
                <Textarea
                  id="showDescription"
                  value={formData.showDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, showDescription: e.target.value }))}
                  placeholder="Enter show description"
                  rows={4}
                />
                {playlistPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAIDescription}
                    className="mt-2"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Description
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.showTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.showTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Audio & Cover Tab */}
            <TabsContent value="audio" className="space-y-4">
              {/* Audio File Upload */}
              <div className="space-y-2">
                <Label>Audio File * (MP3/WAV, max 500MB)</Label>
                <div
                  {...getAudioRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isAudioDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'
                  }`}
                >
                  <input {...getAudioInputProps()} />
                  {formData.audioFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <File className="h-5 w-5 text-green-600" />
                      <span className="text-green-700">{formData.audioFile.name}</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {(formData.audioFile.size / (1024 * 1024)).toFixed(1)}MB
                      </Badge>
                    </div>
                  ) : (
                    <div>
                      <Music className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">
                        {isAudioDragActive ? 'Drop audio file here' : 'Drag & drop audio file or click to select'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2">
                <Label>Cover Image (JPG/PNG, max 10MB)</Label>
                <div
                  {...getCoverRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isCoverDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'
                  }`}
                >
                  <input {...getCoverInputProps()} />
                  {formData.coverImage ? (
                    <div className="flex items-center justify-center gap-2">
                      <File className="h-5 w-5 text-green-600" />
                      <span className="text-green-700">{formData.coverImage.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">
                        {isCoverDragActive ? 'Drop cover image here' : 'Drag & drop cover image or click to select'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Playlist Tab */}
            <TabsContent value="playlist" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playlistText">Playlist (Track List)</Label>
                <Textarea
                  id="playlistText"
                  value={formData.playlistText}
                  onChange={(e) => handlePlaylistChange(e.target.value)}
                  placeholder="Enter playlist in format:
Artist - Track Title
Artist - Track Title

HOUR 2
Artist - Track Title"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {/* Playlist Preview */}
              {playlistPreview && (
                <Card className="border border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-blue-900 text-sm">
                      <Eye className="h-4 w-4" />
                      Playlist Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-4 text-sm">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {playlistPreview.totalTracks} tracks
                      </Badge>
                      {playlistPreview.hours.length > 0 && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {playlistPreview.hours.length} hours
                        </Badge>
                      )}
                    </div>

                    {playlistPreview.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-red-800 font-medium text-sm mb-1">Parsing Errors:</p>
                        <ul className="text-red-700 text-xs space-y-1">
                          {playlistPreview.errors.map((error: string, idx: number) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="max-h-40 overflow-y-auto">
                      <div className="grid gap-1 text-xs">
                        {playlistPreview.tracks.slice(0, 10).map((track: any, idx: number) => (
                          <div key={idx} className="flex gap-2 py-1">
                            <span className="text-blue-600 font-medium w-6">{track.position}</span>
                            <span className="text-gray-700">{track.artist} - {track.track}</span>
                            {track.hour && (
                              <Badge variant="outline" className="text-xs">H{track.hour}</Badge>
                            )}
                          </div>
                        ))}
                        {playlistPreview.tracks.length > 10 && (
                          <div className="text-gray-500 text-center py-2">
                            ... and {playlistPreview.tracks.length - 10} more tracks
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Upload Progress */}
          {uploadState.status === 'uploading' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-500">{uploadState.progress}%</span>
              </div>
              <Progress value={uploadState.progress} className="h-2" />
              <p className="text-sm text-gray-600">{uploadState.message}</p>
            </div>
          )}

          {/* Upload Status */}
          {uploadState.status !== 'idle' && uploadState.status !== 'uploading' && (
            <Card className={`border ${
              uploadState.status === 'uploaded' ? 'border-green-200 bg-green-50' :
              uploadState.status === 'queued' ? 'border-blue-200 bg-blue-50' :
              'border-red-200 bg-red-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {uploadState.status === 'uploaded' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {uploadState.status === 'queued' && <Clock className="h-5 w-5 text-blue-600" />}
                  {uploadState.status === 'failed' && <AlertCircle className="h-5 w-5 text-red-600" />}
                  <span className={`font-medium ${
                    uploadState.status === 'uploaded' ? 'text-green-800' :
                    uploadState.status === 'queued' ? 'text-blue-800' :
                    'text-red-800'
                  }`}>
                    {uploadState.message}
                  </span>
                </div>

                {uploadState.mixcloudUrl && (
                  <div className="mt-3">
                    <Button asChild variant="outline" size="sm">
                      <a href={uploadState.mixcloudUrl} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        View on Mixcloud
                      </a>
                    </Button>
                  </div>
                )}

                {uploadState.errors && uploadState.errors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-medium text-red-800">Issues:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {uploadState.errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!isFormValid || uploadState.status === 'uploading'}
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            {uploadState.status === 'uploading' ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload to Mixcloud
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}