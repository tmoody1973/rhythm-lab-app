'use client'

import React from 'react'
import { ExternalLink, BookOpen, Link2 } from 'lucide-react'

interface Citation {
  number: number
  title: string
  url: string
}

interface SearchResult {
  title: string
  url: string
  date?: string
}

interface CitationDisplayProps {
  content: string
  searchResults?: SearchResult[]
  className?: string
}

export function CitationDisplay({ content, searchResults, className = '' }: CitationDisplayProps) {
  // Extract citations from the content
  const extractCitations = (text: string): { mainContent: string; citations: Citation[] } => {
    const citations: Citation[] = []
    let mainContent = text

    // Look for ## Sources section
    const sourcesMatch = text.match(/##\s*Sources?\s*\n([\s\S]*?)($|\n##)/i)

    if (sourcesMatch) {
      mainContent = text.substring(0, text.indexOf(sourcesMatch[0]))
      const citationText = sourcesMatch[1]

      // Parse markdown links format: [1] [Title](URL)
      const citationRegex = /\[(\d+)\]\s*\[([^\]]+)\]\(([^)]+)\)/g
      let match

      while ((match = citationRegex.exec(citationText)) !== null) {
        citations.push({
          number: parseInt(match[1]),
          title: match[2],
          url: match[3]
        })
      }

      // Also try to parse plain text format with URLs
      if (citations.length === 0) {
        const plainRegex = /\[(\d+)\]\s*([^-\n]+)\s*-?\s*(https?:\/\/[^\s\n]+)/g
        while ((match = plainRegex.exec(citationText)) !== null) {
          citations.push({
            number: parseInt(match[1]),
            title: match[2].trim().replace(/[-–]$/, '').trim(),
            url: match[3]
          })
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
      url: result.url
    })) :
    extractCitations(content).citations

  const mainContent = searchResults ? content : extractCitations(content).mainContent

  if (citations.length === 0) {
    return (
      <div className={className}>
        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {content}
          </div>
        </div>
      </div>
    )
  }

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
        <div className="mt-12 pt-8 border-t-2 border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-900">Sources & References</h3>
          </div>

          <div className="space-y-3">
            {citations.map((citation) => (
              <a
                key={citation.number}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition-all duration-200 border border-indigo-200 hover:border-indigo-300"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold group-hover:bg-indigo-700 transition-colors">
                  {citation.number}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium group-hover:text-indigo-700 transition-colors">
                      {citation.title}
                    </span>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Link2 className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500 truncate max-w-md">
                      {citation.url}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Note:</span> These sources were automatically gathered and should be verified for accuracy and relevance.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

