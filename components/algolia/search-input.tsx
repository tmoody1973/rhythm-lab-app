"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchBox, useHits, useQuerySuggestions } from 'react-instantsearch'
import { Search, X, Clock, TrendingUp, Music, FileText, User, Hash } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  placeholder?: string
  showSuggestions?: boolean
  autoFocus?: boolean
  onQueryChange?: (query: string) => void
  className?: string
}

export function SearchInput({
  placeholder = "Search artists, tracks, shows, or AI content...",
  showSuggestions = true,
  autoFocus = false,
  onQueryChange,
  className
}: SearchInputProps) {
  const { query, refine, clear } = useSearchBox()
  const [inputValue, setInputValue] = useState(query)
  const [showDropdown, setShowDropdown] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rhythm-lab-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading recent searches:', e)
      }
    }
  }, [])

  // Save search to recent searches
  const saveToRecent = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5) // Keep only 5 recent searches

    setRecentSearches(updated)
    localStorage.setItem('rhythm-lab-recent-searches', JSON.stringify(updated))
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    refine(value)
    onQueryChange?.(value)
    setShowDropdown(value.length > 0 || recentSearches.length > 0)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      saveToRecent(inputValue.trim())
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    refine(suggestion)
    onQueryChange?.(suggestion)
    saveToRecent(suggestion)
    setShowDropdown(false)
    inputRef.current?.blur()
  }

  // Handle clear
  const handleClear = () => {
    setInputValue('')
    clear()
    onQueryChange?.('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  // Handle focus
  const handleFocus = () => {
    setShowDropdown(inputValue.length > 0 || recentSearches.length > 0)
  }

  // Handle blur with delay to allow for clicks
  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 150)
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#a1a1aa]" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoFocus={autoFocus}
            className={cn(
              "pl-10 pr-10 bg-[#0a0e1a] border-[#2a2f3e] text-white placeholder:text-[#a1a1aa] focus:border-[#b12e2e]",
              className
            )}
          />
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-[#a1a1aa] hover:text-white hover:bg-[#2a2f3e]"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {showDropdown && showSuggestions && (
        <SearchDropdown
          ref={dropdownRef}
          query={inputValue}
          recentSearches={recentSearches}
          onSuggestionClick={handleSuggestionClick}
          onClearRecent={() => {
            setRecentSearches([])
            localStorage.removeItem('rhythm-lab-recent-searches')
          }}
        />
      )}
    </div>
  )
}

// Search suggestions dropdown component
interface SearchDropdownProps {
  query: string
  recentSearches: string[]
  onSuggestionClick: (suggestion: string) => void
  onClearRecent: () => void
}

const SearchDropdown = React.forwardRef<HTMLDivElement, SearchDropdownProps>(
  ({ query, recentSearches, onSuggestionClick, onClearRecent }, ref) => {
    return (
      <div
        ref={ref}
        className="absolute top-full left-0 right-0 mt-1 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
      >
        {/* Query Suggestions */}
        {query && <QuerySuggestions query={query} onSuggestionClick={onSuggestionClick} />}

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="border-t border-[#2a2f3e]">
            <div className="flex items-center justify-between p-3 border-b border-[#2a2f3e]">
              <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
                <Clock className="h-4 w-4" />
                Recent Searches
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearRecent}
                className="text-xs text-[#a1a1aa] hover:text-white h-auto p-1"
              >
                Clear
              </Button>
            </div>
            <div className="p-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(search)}
                  className="w-full text-left px-3 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#2a2f3e] rounded flex items-center gap-2"
                >
                  <Clock className="h-3 w-3" />
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending/Popular Searches */}
        <TrendingSearches onSuggestionClick={onSuggestionClick} />
      </div>
    )
  }
)
SearchDropdown.displayName = 'SearchDropdown'

// Enhanced query suggestions with multiple data sources
function QuerySuggestions({
  query,
  onSuggestionClick
}: {
  query: string
  onSuggestionClick: (suggestion: string) => void
}) {
  const [suggestions, setSuggestions] = useState<{
    artists: string[]
    genres: string[]
    tracks: string[]
    content: string[]
  }>({
    artists: [],
    genres: [],
    tracks: [],
    content: []
  })

  // Generate intelligent suggestions based on query
  const generateSuggestions = useCallback((searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions({ artists: [], genres: [], tracks: [], content: [] })
      return
    }

    const lowerQuery = searchQuery.toLowerCase()

    // Genre suggestions
    const genres = [
      'deep house', 'techno', 'jazz', 'ambient', 'electronic', 'fusion',
      'drum and bass', 'experimental', 'minimal', 'progressive', 'trance',
      'hip hop', 'funk', 'soul', 'disco', 'breakbeat', 'downtempo'
    ]
    const genreSuggestions = genres
      .filter(genre => genre.includes(lowerQuery))
      .slice(0, 4)

    // Artist suggestions (you would fetch these from your search index)
    const commonArtists = [
      'Floating Points', 'Four Tet', 'Caribou', 'Jon Hopkins', 'Bonobo',
      'Moderat', 'Apparat', 'Kiasmos', 'Nils Frahm', 'Max Richter',
      'Thom Yorke', 'Aphex Twin', 'Boards of Canada', 'Burial'
    ]
    const artistSuggestions = commonArtists
      .filter(artist => artist.toLowerCase().includes(lowerQuery))
      .slice(0, 4)

    // Track suggestions based on patterns
    const trackSuggestions = []
    if (lowerQuery.includes('mix') || lowerQuery.includes('set')) {
      trackSuggestions.push('live mix sessions', 'DJ sets', 'radio mixes')
    }
    if (lowerQuery.includes('deep')) {
      trackSuggestions.push('deep house classics', 'deep ambient tracks')
    }
    if (lowerQuery.includes('chill') || lowerQuery.includes('ambient')) {
      trackSuggestions.push('chill electronic', 'ambient soundscapes')
    }

    // Content suggestions
    const contentSuggestions = []
    if (lowerQuery.includes('interview') || lowerQuery.includes('profile')) {
      contentSuggestions.push('artist interviews', 'artist profiles')
    }
    if (lowerQuery.includes('review') || lowerQuery.includes('analysis')) {
      contentSuggestions.push('album reviews', 'music analysis')
    }
    if (lowerQuery.includes('guide') || lowerQuery.includes('how')) {
      contentSuggestions.push('music guides', 'production tips')
    }

    setSuggestions({
      artists: artistSuggestions,
      genres: genreSuggestions,
      tracks: trackSuggestions.slice(0, 3),
      content: contentSuggestions.slice(0, 3)
    })
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      generateSuggestions(query)
    }, 150)

    return () => clearTimeout(debounceTimer)
  }, [query, generateSuggestions])

  const hasAnySuggestions = suggestions.artists.length > 0 ||
                          suggestions.genres.length > 0 ||
                          suggestions.tracks.length > 0 ||
                          suggestions.content.length > 0

  if (!hasAnySuggestions) return null

  const highlightMatch = (text: string) => {
    if (!query) return text
    return text.replace(
      new RegExp(query, 'gi'),
      `<mark class="bg-[#b12e2e]/20 text-[#b12e2e]">$&</mark>`
    )
  }

  return (
    <div className="p-2">
      <div className="text-xs text-[#a1a1aa] px-3 py-2 border-b border-[#2a2f3e] mb-2">
        Suggestions
      </div>

      {/* Artists */}
      {suggestions.artists.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-[#666] px-3 py-1 flex items-center gap-1">
            <User className="h-3 w-3" />
            Artists
          </div>
          {suggestions.artists.map((artist, index) => (
            <button
              key={`artist-${index}`}
              onClick={() => onSuggestionClick(artist)}
              className="w-full text-left px-3 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#2a2f3e] rounded flex items-center gap-2"
            >
              <User className="h-3 w-3" />
              <span dangerouslySetInnerHTML={{ __html: highlightMatch(artist) }} />
            </button>
          ))}
        </div>
      )}

      {/* Genres */}
      {suggestions.genres.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-[#666] px-3 py-1 flex items-center gap-1">
            <Hash className="h-3 w-3" />
            Genres
          </div>
          {suggestions.genres.map((genre, index) => (
            <button
              key={`genre-${index}`}
              onClick={() => onSuggestionClick(genre)}
              className="w-full text-left px-3 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#2a2f3e] rounded flex items-center gap-2"
            >
              <Hash className="h-3 w-3" />
              <span dangerouslySetInnerHTML={{ __html: highlightMatch(genre) }} />
            </button>
          ))}
        </div>
      )}

      {/* Tracks */}
      {suggestions.tracks.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-[#666] px-3 py-1 flex items-center gap-1">
            <Music className="h-3 w-3" />
            Tracks & Shows
          </div>
          {suggestions.tracks.map((track, index) => (
            <button
              key={`track-${index}`}
              onClick={() => onSuggestionClick(track)}
              className="w-full text-left px-3 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#2a2f3e] rounded flex items-center gap-2"
            >
              <Music className="h-3 w-3" />
              <span dangerouslySetInnerHTML={{ __html: highlightMatch(track) }} />
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {suggestions.content.length > 0 && (
        <div>
          <div className="text-xs text-[#666] px-3 py-1 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Content
          </div>
          {suggestions.content.map((content, index) => (
            <button
              key={`content-${index}`}
              onClick={() => onSuggestionClick(content)}
              className="w-full text-left px-3 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#2a2f3e] rounded flex items-center gap-2"
            >
              <FileText className="h-3 w-3" />
              <span dangerouslySetInnerHTML={{ __html: highlightMatch(content) }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Trending searches component
function TrendingSearches({
  onSuggestionClick
}: {
  onSuggestionClick: (suggestion: string) => void
}) {
  // This would typically come from analytics or a trending API
  const trendingSearches = [
    'deep house vibes',
    'jazz fusion',
    'electronic ambient',
    'techno sets',
    'AI generated content'
  ]

  return (
    <div className="border-t border-[#2a2f3e] p-2">
      <div className="flex items-center gap-2 text-xs text-[#a1a1aa] px-3 py-2 border-b border-[#2a2f3e]">
        <TrendingUp className="h-4 w-4" />
        Trending
      </div>
      {trendingSearches.map((search, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(search)}
          className="w-full text-left px-3 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#2a2f3e] rounded flex items-center gap-2"
        >
          <TrendingUp className="h-3 w-3" />
          {search}
          <Badge variant="outline" className="ml-auto text-xs border-[#b12e2e] text-[#b12e2e]">
            Hot
          </Badge>
        </button>
      ))}
    </div>
  )
}