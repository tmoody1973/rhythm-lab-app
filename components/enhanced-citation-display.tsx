'use client'

import React, { useState } from 'react'
import { ExternalLink, BookOpen, Link2, ChevronDown, ChevronUp, Globe, Calendar, User } from 'lucide-react'

interface Citation {
  number: number
  title: string
  url: string
  domain?: string
  author?: string
  date?: string
  type?: 'article' | 'video' | 'podcast' | 'book' | 'website' | 'social'
}

interface SearchResult {
  title: string
  url: string
  date?: string
  author?: string
  type?: string
}

interface EnhancedCitationDisplayProps {
  content: string
  searchResults?: SearchResult[]
  className?: string
  displayMode?: 'full' | 'compact' | 'minimal' | 'grid'
  maxVisible?: number
  autoCollapse?: boolean
}

const getSourceIcon = (url: string, type?: string) => {
  try {
    const domain = new URL(url).hostname.toLowerCase()

    // Check for specific domains/types
    if (domain.includes('youtube') || domain.includes('youtu.be')) return '🎥'
    if (domain.includes('spotify') || domain.includes('soundcloud') || type === 'podcast') return '🎵'
    if (domain.includes('wikipedia')) return '📚'
    if (domain.includes('twitter') || domain.includes('x.com')) return '🐦'
    if (domain.includes('instagram')) return '📷'
    if (domain.includes('linkedin')) return '💼'
    if (domain.includes('github')) return '👨‍💻'
    if (domain.includes('medium') || domain.includes('substack')) return '✍️'
    if (type === 'book') return '📖'
    if (type === 'article') return '📰'

    return '🌐'
  } catch {
    // If URL is invalid (like #source-1), return default icon based on type
    if (type === 'podcast') return '🎵'
    if (type === 'book') return '📖'
    if (type === 'article') return '📰'

    return '🌐'
  }
}

const getDomainFromUrl = (url: string): string => {
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch {
    return 'Unknown source'
  }
}

export function EnhancedCitationDisplay({
  content,
  searchResults,
  className = '',
  displayMode = 'full',
  maxVisible = 5,
  autoCollapse = true
}: EnhancedCitationDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(!autoCollapse)

  // Ensure content is a string
  const contentStr = typeof content === 'string'
    ? content
    : (typeof content === 'object' && content !== null && 'content' in content)
      ? String((content as any).content)
      : String(content || '')

  // Extract citations from the content
  const extractCitations = (text: string): { mainContent: string; citations: Citation[] } => {
    const citations: Citation[] = []
    let mainContent = text

    // First, let's look for the Sources section in the raw HTML
    const sourcesMatch = text.match(/(?:##\s*)?Sources?\s*(?:&\s*References?)?\s*:?\s*([\s\S]*?)(?:$|Sources automatically gathered)/i)

    if (sourcesMatch) {
      const sourcesHtml = sourcesMatch[1]

      // Extract hyperlinks from HTML: <a href="URL">Text</a> or variations
      const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi
      const htmlCitations: { url: string; title: string }[] = []
      let linkMatch

      while ((linkMatch = linkRegex.exec(sourcesHtml)) !== null) {
        htmlCitations.push({
          url: linkMatch[1],
          title: linkMatch[2].trim()
        })
      }

      // Convert HTML entities and clean up HTML for text-based parsing
      const cleanText = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim()

      const cleanSourcesMatch = cleanText.match(/(?:##\s*)?Sources?\s*(?:&\s*References?)?\s*:?\s*([\s\S]*?)(?:$|Sources automatically gathered)/i)

      if (cleanSourcesMatch) {
        mainContent = cleanText.substring(0, cleanText.indexOf(cleanSourcesMatch[0]))
        const citationText = cleanSourcesMatch[1]

        // Parse the format: [1]Title with … → and match with HTML links
        const newFormatRegex = /\[(\d+)\]([^→[\n]+?)(?:\s*…)?\s*→/g
        let match

        while ((match = newFormatRegex.exec(citationText)) !== null) {
          const number = parseInt(match[1])
          let title = match[2].trim()

          // Clean up the title
          title = title.replace(/\s+/g, ' ').trim()

          // Try to find matching HTML link by title similarity
          let url = `#source-${number}`
          let domain = 'External Source'

          if (htmlCitations[number - 1]) {
            url = htmlCitations[number - 1].url
            domain = getDomainFromUrl(url)
          }

          citations.push({
            number,
            title,
            url,
            domain
          })
        }

        // Fallback: Parse markdown links format: [1] [Title](URL)
        if (citations.length === 0) {
          const citationRegex = /\[(\d+)\]\s*\[([^\]]+)\]\(([^)]+)\)/g
          while ((match = citationRegex.exec(citationText)) !== null) {
            const url = match[3]
            citations.push({
              number: parseInt(match[1]),
              title: match[2],
              url,
              domain: getDomainFromUrl(url)
            })
          }
        }

        // Also try to parse plain text format with URLs
        if (citations.length === 0) {
          const plainRegex = /\[(\d+)\]\s*([^-\n]+)\s*-?\s*(https?:\/\/[^\s\n]+)/g
          while ((match = plainRegex.exec(citationText)) !== null) {
            const url = match[3]
            citations.push({
              number: parseInt(match[1]),
              title: match[2].trim().replace(/[-–]$/, '').trim(),
              url,
              domain: getDomainFromUrl(url)
            })
          }
        }
      }
    }

    return { mainContent, citations }
  }

  // Use search results if available, otherwise extract from content
  const citations: Citation[] = searchResults ?
    searchResults.map((result, index) => ({
      number: index + 1,
      title: result.title,
      url: result.url,
      domain: getDomainFromUrl(result.url),
      author: result.author,
      date: result.date,
      type: result.type as Citation['type']
    })) :
    extractCitations(contentStr).citations

  const mainContent = searchResults ? contentStr : extractCitations(contentStr).mainContent

  if (citations.length === 0) {
    return (
      <div className={className}>
        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {contentStr}
          </div>
        </div>
      </div>
    )
  }

  const visibleCitations = isExpanded ? citations : citations.slice(0, maxVisible)
  const hasMoreCitations = citations.length > maxVisible

  const renderMinimalCitation = (citation: Citation) => (
    <a
      key={citation.number}
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-full transition-colors border border-blue-200 hover:border-blue-300"
      title={citation.title}
    >
      <span className="font-medium">[{citation.number}]</span>
      <span className="max-w-[120px] truncate">{citation.title}</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  )

  const renderCompactCitation = (citation: Citation) => {
    const isValidUrl = citation.url && !citation.url.startsWith('#source-')

    if (isValidUrl) {
      return (
        <a
          key={citation.number}
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300"
        >
          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {citation.number}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs">{getSourceIcon(citation.url, citation.type)}</span>
              <span className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                {citation.title}
              </span>
            </div>
            <div className="text-xs text-gray-500 truncate">
              {citation.domain}
            </div>
          </div>
          <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
        </a>
      )
    }

    return (
      <div
        key={citation.number}
        className="group flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300"
      >
        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
          {citation.number}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs">{getSourceIcon(citation.url, citation.type)}</span>
            <span className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
              {citation.title}
            </span>
          </div>
          <div className="text-xs text-gray-500 truncate">
            {citation.domain}
          </div>
        </div>
      </div>
    )
  }

  const renderGridCitation = (citation: Citation) => (
    <a
      key={citation.number}
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative p-3 rounded-lg bg-white hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:border-blue-300 hover:shadow-sm"
    >
      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
        {citation.number}
      </div>
      <div className="pr-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{getSourceIcon(citation.url, citation.type)}</span>
          <span className="text-xs font-medium text-blue-600">{citation.domain}</span>
        </div>
        <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-tight">
          {citation.title}
        </h4>
        {citation.author && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <User className="w-3 h-3" />
            <span>{citation.author}</span>
          </div>
        )}
        {citation.date && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{citation.date}</span>
          </div>
        )}
      </div>
    </a>
  )

  const renderFullCitation = (citation: Citation) => (
    <a
      key={citation.number}
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border border-blue-200 hover:border-blue-300"
    >
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold group-hover:bg-blue-700 transition-colors">
        {citation.number}
      </div>
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{getSourceIcon(citation.url, citation.type)}</span>
          <span className="text-sm font-medium text-blue-600">{citation.domain}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-900 font-medium group-hover:text-blue-700 transition-colors">
            {citation.title}
          </span>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          {citation.author && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{citation.author}</span>
            </div>
          )}
          {citation.date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{citation.date}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Link2 className="w-3 h-3" />
            <span className="truncate max-w-xs">{citation.url}</span>
          </div>
        </div>
      </div>
    </a>
  )

  return (
    <div className={className}>
      {/* Main content */}
      <div className="prose prose-lg max-w-none">
        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {mainContent}
        </div>
      </div>

      {/* Citations section */}
      {citations.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">
                Sources & References
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({citations.length})
                </span>
              </h3>
            </div>
            {hasMoreCitations && displayMode !== 'minimal' && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-full transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show All ({citations.length})
                  </>
                )}
              </button>
            )}
          </div>

          {displayMode === 'minimal' && (
            <div className="flex flex-wrap gap-2">
              {citations.map(renderMinimalCitation)}
            </div>
          )}

          {displayMode === 'compact' && (
            <div className="space-y-2">
              {visibleCitations.map(renderCompactCitation)}
            </div>
          )}

          {displayMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleCitations.map(renderGridCitation)}
            </div>
          )}

          {displayMode === 'full' && (
            <div className="space-y-3">
              {visibleCitations.map(renderFullCitation)}
            </div>
          )}

          {!isExpanded && hasMoreCitations && displayMode !== 'minimal' && (
            <div className="text-center mt-4">
              <button
                onClick={() => setIsExpanded(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                +{citations.length - maxVisible} more sources
              </button>
            </div>
          )}

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Note:</span> Sources automatically gathered from web search.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}