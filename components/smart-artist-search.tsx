'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, User, ExternalLink } from 'lucide-react'
import { debounce } from 'lodash'

interface Artist {
  id: number
  name: string
  profile?: string
  images?: Array<{ type: string; uri: string }>
  resource_url: string
  uri: string
}

interface SmartArtistSearchProps {
  onSelect: (artist: Artist) => void
  placeholder?: string
  initialValue?: string
  className?: string
}

export default function SmartArtistSearch({
  onSelect,
  placeholder = "Search for an artist...",
  initialValue = "",
  className = ""
}: SmartArtistSearchProps) {
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Artist[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch('/api/discogs/search-artists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 8
          }),
        })
        const data = await response.json()

        if (data.success) {
          setSuggestions(data.artists || [])
          setIsOpen((data.artists || []).length > 0)
        }
      } catch (error) {
        console.error('Artist search error:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    []
  )

  // Effect for search query changes
  useEffect(() => {
    debouncedSearch(query)
    return () => debouncedSearch.cancel()
  }, [query, debouncedSearch])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelect = (artist: Artist) => {
    setQuery(artist.name)
    setIsOpen(false)
    setSelectedIndex(-1)
    onSelect(artist)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {suggestions.map((artist, index) => (
            <div
              key={artist.id}
              className={`flex items-center p-3 cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSelect(artist)}
            >
              {/* Artist Image */}
              <div className="flex-shrink-0 w-12 h-12 mr-3">
                {artist.images && artist.images.length > 0 ? (
                  <img
                    src={artist.images[0].uri}
                    alt={artist.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Artist Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {artist.name}
                </div>
                <div className="text-sm text-gray-500 line-clamp-1">
                  {artist.profile ? artist.profile.substring(0, 100) + (artist.profile.length > 100 ? '...' : '') : 'Discogs Artist'}
                </div>
              </div>

              {/* External Link Icon */}
              <ExternalLink className="w-4 h-4 text-gray-400 ml-2" />
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-3 text-gray-500 text-center">
            No artists found for "{query}"
          </div>
        </div>
      )}
    </div>
  )
}