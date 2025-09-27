'use client'

import React from 'react'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { EnhancedCitationDisplay } from '@/components/enhanced-citation-display'
import { extractTextFromRichText } from '@/lib/utils/rich-text'

interface EnhancedContentRendererProps {
  content: any
  sourcesReferences?: any[]  // Dedicated sources_references field from Storyblok
  searchResults?: any[]      // External search results (fallback)
  displayMode?: 'full' | 'compact' | 'minimal' | 'grid'
  maxVisible?: number
  autoCollapse?: boolean
  className?: string
}

export function EnhancedContentRenderer({
  content,
  sourcesReferences,
  searchResults,
  displayMode = 'compact',
  maxVisible = 5,
  autoCollapse = true,
  className = ''
}: EnhancedContentRendererProps) {
  // Extract text content from rich text
  const textContent = extractTextFromRichText(content)

  // Priority 1: Use dedicated sources_references field if provided
  if (sourcesReferences) {
    // Check if sourcesReferences is an array of objects (structured data)
    if (Array.isArray(sourcesReferences) && sourcesReferences.length > 0) {
      return (
        <div className={className}>
          <div className="prose prose-lg max-w-none">
            <RichTextRenderer content={content} />
          </div>
          <div className="mt-8">
            <EnhancedCitationDisplay
              content=""  // No need for content text since sources are separate
              searchResults={sourcesReferences}
              displayMode={displayMode}
              maxVisible={maxVisible}
              autoCollapse={autoCollapse}
            />
          </div>
        </div>
      )
    }

    // Check if sourcesReferences is rich text content (like what we're getting now)
    if (sourcesReferences && typeof sourcesReferences === 'object' && sourcesReferences.type === 'doc') {
      const sourcesText = extractTextFromRichText(sourcesReferences)
      return (
        <div className={className}>
          <div className="prose prose-lg max-w-none">
            <RichTextRenderer content={content} />
          </div>
          <div className="mt-8">
            <EnhancedCitationDisplay
              content={sourcesText}
              displayMode={displayMode}
              maxVisible={maxVisible}
              autoCollapse={autoCollapse}
            />
          </div>
        </div>
      )
    }
  }

  // Priority 2: Use external search results if provided
  if (searchResults && searchResults.length > 0) {
    return (
      <div className={className}>
        <div className="prose prose-lg max-w-none">
          <RichTextRenderer content={content} />
        </div>
        <div className="mt-8">
          <EnhancedCitationDisplay
            content=""  // No need for content text since sources are separate
            searchResults={searchResults}
            displayMode={displayMode}
            maxVisible={maxVisible}
            autoCollapse={autoCollapse}
          />
        </div>
      </div>
    )
  }

  // Priority 3: Check if content contains embedded sources section (legacy support)
  const hasSourcesSection = textContent && (
    textContent.includes('## Sources') ||
    textContent.includes('## References') ||
    textContent.includes('## Sources & References') ||
    textContent.includes('### Sources') ||
    textContent.includes('### References')
  )

  if (hasSourcesSection) {
    return (
      <div className={className}>
        <EnhancedCitationDisplay
          content={textContent}
          displayMode={displayMode}
          maxVisible={maxVisible}
          autoCollapse={autoCollapse}
        />
      </div>
    )
  }

  // Priority 4: Regular content without sources
  return (
    <div className={className}>
      <RichTextRenderer content={content} />
    </div>
  )
}