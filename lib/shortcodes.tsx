import React from 'react'

/**
 * YouTube shortcode processor for rich text content
 * Converts [youtube=URL] shortcodes into responsive YouTube embeds
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
 * Currently supports: [youtube=URL]
 */
export function processShortcodes(content: string): React.ReactNode[] {
  const elements: React.ReactNode[] = []

  // Split content by YouTube shortcodes while preserving the matches
  const parts = content.split(/(\[youtube=[^\]]+\])/g)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    // Skip empty parts
    if (!part) continue

    // Check if this part is a YouTube shortcode
    const youtubeMatch = part.match(/^\[youtube=([^\]]+)\]$/)

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