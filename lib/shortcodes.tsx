import React from 'react'

/**
 * Shortcode processor for rich text content
 * Converts [youtube=URL] and [bandcamp=URL] shortcodes into responsive embeds
 */

interface YouTubeEmbedProps {
  videoId: string
  title?: string
}

function YouTubeEmbed({ videoId, title = "YouTube video" }: YouTubeEmbedProps) {
  return (
    <div className="relative w-full aspect-video my-6 rounded-lg overflow-hidden shadow-lg">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        loading="lazy"
      />
    </div>
  )
}

interface BandcampEmbedProps {
  url: string
  title?: string
}

function BandcampEmbed({ url, title = "Bandcamp player" }: BandcampEmbedProps) {
  const [embedUrl, setEmbedUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchEmbedUrl() {
      try {
        const response = await fetch('/api/bandcamp/get-embed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch Bandcamp embed URL')
        }

        const data = await response.json()
        if (data.success && data.embedUrl) {
          setEmbedUrl(data.embedUrl)
        } else {
          throw new Error(data.error || 'Invalid response')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchEmbedUrl()
  }, [url])

  if (loading) {
    return (
      <div className="w-full h-[120px] my-6 rounded-lg bg-gray-100 animate-pulse flex items-center justify-center">
        <span className="text-sm text-gray-500">Loading Bandcamp player...</span>
      </div>
    )
  }

  if (error || !embedUrl) {
    return (
      <div className="w-full p-4 my-6 rounded-lg bg-red-50 border border-red-200">
        <span className="text-sm text-red-600">
          Failed to load Bandcamp player: {error || 'Invalid URL'}
        </span>
      </div>
    )
  }

  return (
    <div className="w-full my-6">
      <iframe
        style={{ border: 0, width: '100%', height: '120px' }}
        src={embedUrl}
        title={title}
        seamless
        loading="lazy"
      />
    </div>
  )
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Process shortcodes in rich text content
 * Currently supports: [youtube=URL], [bandcamp=URL]
 */
export function processShortcodes(content: string): React.ReactNode[] {
  const elements: React.ReactNode[] = []

  // Split content by both YouTube and Bandcamp shortcodes while preserving the matches
  const parts = content.split(/(\[(?:youtube|bandcamp)=[^\]]+\])/g)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    // Skip empty parts
    if (!part) continue

    // Check if this part is a YouTube shortcode
    const youtubeMatch = part.match(/^\[youtube=([^\]]+)\]$/)

    // Check if this part is a Bandcamp shortcode
    const bandcampMatch = part.match(/^\[bandcamp=([^\]]+)\]$/)

    if (youtubeMatch) {
      const url = youtubeMatch[1]
      const videoId = extractYouTubeId(url)

      if (videoId) {
        elements.push(
          <YouTubeEmbed
            key={`youtube-${i}-${videoId}`}
            videoId={videoId}
            title="Embedded YouTube video"
          />
        )
      } else {
        // If URL is invalid, show the original shortcode
        elements.push(
          <span key={`invalid-youtube-${i}`} className="text-red-500 bg-red-50 px-2 py-1 rounded">
            Invalid YouTube URL: {url}
          </span>
        )
      }
    } else if (bandcampMatch) {
      const url = bandcampMatch[1]

      elements.push(
        <BandcampEmbed
          key={`bandcamp-${i}-${url}`}
          url={url}
          title="Embedded Bandcamp player"
        />
      )
    } else if (part.trim()) {
      // Regular text content - preserve line breaks
      const textWithBreaks = part.split('\n').map((line, lineIndex) => (
        <React.Fragment key={`line-${i}-${lineIndex}`}>
          {line}
          {lineIndex < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ))
      elements.push(...textWithBreaks)
    }
  }

  return elements
}

/**
 * Hook to process rich text content with shortcodes
 */
export function useProcessedContent(content: string): React.ReactNode[] {
  return React.useMemo(() => {
    if (!content) return []
    return processShortcodes(content)
  }, [content])
}

/**
 * Component wrapper for rich text with shortcode processing
 */
interface RichTextWithShortcodesProps {
  content: string
  className?: string
}

export function RichTextWithShortcodes({ content, className = "" }: RichTextWithShortcodesProps) {
  const processedContent = useProcessedContent(content)

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      {processedContent}
    </div>
  )
}