'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface MixcloudOEmbedPlayerProps {
  mixcloudUrl: string
  showTitle: string
  className?: string
  maxWidth?: number
  maxHeight?: number
}

interface OEmbedResponse {
  type: string
  version: string
  provider_name: string
  provider_url: string
  title: string
  author_name: string
  author_url: string
  html: string
  width: number
  height: number
  thumbnail_url: string
  thumbnail_width: number
  thumbnail_height: number
}

export function MixcloudOEmbedPlayer({
  mixcloudUrl,
  showTitle,
  className = "",
  maxWidth = 400,
  maxHeight = 400
}: MixcloudOEmbedPlayerProps) {
  const [embedHtml, setEmbedHtml] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchOEmbedData()
  }, [mixcloudUrl, maxWidth, maxHeight])

  const fetchOEmbedData = async () => {
    try {
      setLoading(true)
      setError('')

      // Use Mixcloud's oEmbed endpoint with light mode
      const oEmbedUrl = new URL('https://app.mixcloud.com/oembed')
      oEmbedUrl.searchParams.set('url', mixcloudUrl)
      oEmbedUrl.searchParams.set('format', 'json')
      oEmbedUrl.searchParams.set('maxwidth', maxWidth.toString())
      oEmbedUrl.searchParams.set('maxheight', maxHeight.toString())
      oEmbedUrl.searchParams.set('light', '1')

      console.log('Fetching oEmbed data:', oEmbedUrl.toString())

      const response = await fetch(oEmbedUrl.toString())

      if (!response.ok) {
        throw new Error(`oEmbed API error: ${response.status}`)
      }

      const data: OEmbedResponse = await response.json()
      console.log('oEmbed response:', data)

      if (data.html) {
        // Modify the HTML to ensure light mode is applied
        let modifiedHtml = data.html

        // Add light=1 parameter to the iframe src if not already present
        if (modifiedHtml.includes('src="') && !modifiedHtml.includes('light=1')) {
          modifiedHtml = modifiedHtml.replace(
            /src="([^"]*)"/,
            (match, src) => {
              const separator = src.includes('?') ? '&' : '?'
              return `src="${src}${separator}light=1"`
            }
          )
        }

        setEmbedHtml(modifiedHtml)
      } else {
        throw new Error('No HTML content in oEmbed response')
      }
    } catch (err) {
      console.error('Error fetching oEmbed data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load player')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={`bg-[#ede3d3] border-[#d4c4a8] shadow-lg ${className}`}>
        <CardContent className="p-4">
          <div className="text-center py-8">
            <div className="animate-pulse text-[#6b4226] text-sm">Loading Mixcloud player...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`bg-[#ede3d3] border-[#d4c4a8] shadow-lg ${className}`}>
        <CardContent className="p-4">
          <div className="text-center py-8">
            <div className="text-[#c5533d] text-sm mb-4">Failed to load player</div>
            <a
              href={mixcloudUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#8b6914] hover:text-[#2f5233] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Play on Mixcloud
            </a>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-[#ede3d3] border-[#d4c4a8] shadow-lg ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Show Title */}
          <div className="text-center">
            <h3 className="text-[#2d1810] font-semibold text-lg truncate">{showTitle}</h3>
            <p className="text-[#6b4226] text-sm">Mixcloud Player</p>
          </div>

          {/* Embedded Player */}
          <div
            className="rounded-lg overflow-hidden bg-[#f5f1eb]"
            dangerouslySetInnerHTML={{ __html: embedHtml }}
          />

          {/* External Link */}
          <div className="text-center">
            <a
              href={mixcloudUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#6b4226] hover:text-[#8b6914] transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Mixcloud
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}