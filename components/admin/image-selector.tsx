'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Search, Download, Check, ExternalLink, RefreshCw } from 'lucide-react'
import { ImageResult } from '@/lib/serpapi/image-search'

interface ImageSelectorProps {
  onImageSelect: (image: ImageResult & { uploadedAsset?: any }) => void
  contentTitle: string
  contentType: 'artist-profile' | 'deep-dive' | 'blog-post'
  suggestedQueries?: string[]
  selectedImage?: ImageResult | null
}

export function ImageSelector({
  onImageSelect,
  contentTitle,
  contentType,
  suggestedQueries = [],
  selectedImage
}: ImageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ImageResult[]>([])
  const [isUploading, setIsUploading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('search')

  // Generate automatic queries based on content
  useEffect(() => {
    if (suggestedQueries.length > 0 && !searchQuery) {
      setSearchQuery(suggestedQueries[0])
    }
  }, [suggestedQueries, searchQuery])

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return

    setIsSearching(true)
    setSearchResults([])

    try {
      const response = await fetch('/api/admin/search-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          contentType,
          maxResults: 24
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to search images')
      }

      const result = await response.json()

      if (result.success) {
        setSearchResults(result.images)
        setActiveTab('results')
      } else {
        throw new Error(result.error || 'Search failed')
      }
    } catch (error) {
      console.error('Image search error:', error)
      alert(`Error searching images: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSearching(false)
    }
  }

  const handleImageSelect = async (image: ImageResult) => {
    setIsUploading(image.original)

    try {
      const response = await fetch('/api/admin/upload-image-to-storyblok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: image.original,
          title: image.title,
          alt: `${contentTitle} - ${image.title}`,
          contentType
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const result = await response.json()

      if (result.success) {
        onImageSelect({
          ...image,
          uploadedAsset: result.asset
        })
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert(`Error uploading image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className=\"flex items-center\">
          <Search className=\"w-5 h-5 mr-2\" />
          Image Selection
        </CardTitle>
        <CardDescription>
          Search and select images for your {contentType.replace('-', ' ')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className=\"space-y-4\">
          <TabsList>
            <TabsTrigger value=\"search\">Search</TabsTrigger>
            <TabsTrigger value=\"results\" disabled={searchResults.length === 0}>
              Results ({searchResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value=\"search\" className=\"space-y-4\">
            <div className=\"space-y-4\">
              <div className=\"space-y-2\">
                <Label htmlFor=\"search-query\">Search Query</Label>
                <div className=\"flex space-x-2\">
                  <Input
                    id=\"search-query\"
                    placeholder=\"e.g., Miles Davis trumpet photo\"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    onClick={() => handleSearch()}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? (
                      <Loader2 className=\"w-4 h-4 animate-spin\" />
                    ) : (
                      <Search className=\"w-4 h-4\" />
                    )}
                  </Button>
                </div>
              </div>

              {suggestedQueries.length > 0 && (
                <div className=\"space-y-2\">
                  <Label>Suggested Searches</Label>
                  <div className=\"flex flex-wrap gap-2\">
                    {suggestedQueries.map((query, index) => (
                      <Button
                        key={index}
                        variant=\"outline\"
                        size=\"sm\"
                        onClick={() => {
                          setSearchQuery(query)
                          handleSearch(query)
                        }}
                        disabled={isSearching}
                      >
                        {query}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value=\"results\" className=\"space-y-4\">
            {selectedImage && (
              <div className=\"p-4 bg-green-50 rounded-lg border border-green-200\">
                <div className=\"flex items-center space-x-2 mb-2\">
                  <Check className=\"w-4 h-4 text-green-600\" />
                  <span className=\"font-medium text-green-900\">Selected Image</span>
                </div>
                <div className=\"flex items-center space-x-4\">
                  <img
                    src={selectedImage.thumbnail}
                    alt={selectedImage.title}
                    className=\"w-16 h-16 object-cover rounded\"
                  />
                  <div>
                    <p className=\"text-sm font-medium\">{selectedImage.title}</p>
                    <p className=\"text-xs text-muted-foreground\">{selectedImage.source}</p>
                  </div>
                </div>
              </div>
            )}

            <div className=\"flex items-center justify-between\">
              <h3 className=\"text-lg font-semibold\">Search Results</h3>
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={() => handleSearch()}
                disabled={isSearching}
              >
                <RefreshCw className=\"w-4 h-4 mr-2\" />
                Refresh
              </Button>
            </div>

            <div className=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4\">
              {searchResults.map((image, index) => (
                <Card key={index} className=\"overflow-hidden hover:shadow-lg transition-shadow\">
                  <div className=\"aspect-square relative\">
                    <img
                      src={image.thumbnail}
                      alt={image.title}
                      className=\"w-full h-full object-cover\"
                    />
                    <div className=\"absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center\">
                      <div className=\"opacity-0 hover:opacity-100 transition-opacity space-x-2\">
                        <Button
                          size=\"sm\"
                          onClick={() => handleImageSelect(image)}
                          disabled={isUploading === image.original}
                        >
                          {isUploading === image.original ? (
                            <Loader2 className=\"w-4 h-4 animate-spin\" />
                          ) : (
                            <Download className=\"w-4 h-4\" />
                          )}
                        </Button>
                        <Button
                          size=\"sm\"
                          variant=\"outline\"
                          asChild
                        >
                          <a href={image.original} target=\"_blank\" rel=\"noopener noreferrer\">
                            <ExternalLink className=\"w-4 h-4\" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className=\"p-3\">
                    <p className=\"text-sm font-medium line-clamp-2\">{image.title}</p>
                    <div className=\"flex items-center justify-between mt-2\">
                      <Badge variant=\"secondary\" className=\"text-xs\">
                        {image.source}
                      </Badge>
                      {image.is_product && (
                        <Badge variant=\"outline\" className=\"text-xs\">
                          Product
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {searchResults.length === 0 && !isSearching && (
              <div className=\"text-center py-8 text-muted-foreground\">
                No images found. Try a different search query.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}