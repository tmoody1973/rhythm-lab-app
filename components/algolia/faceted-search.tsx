"use client"

import React, { useState } from 'react'
import { useRefinementList, useCurrentRefinements } from 'react-instantsearch'
import { Hash, X, ChevronDown, ChevronUp, Music2, Palette, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface FacetedSearchProps {
  searchType: 'songs' | 'content'
  className?: string
}

export function FacetedSearch({ searchType, className }: FacetedSearchProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Active Filters */}
      <ActiveFilters />

      {/* Faceted Filters */}
      {searchType === 'songs' ? <SongFacets /> : <ContentFacets />}
    </div>
  )
}

// Active filters display
function ActiveFilters() {
  const { items, refine } = useCurrentRefinements()

  if (items.length === 0) return null

  return (
    <Card className="p-3 bg-[#0a0e1a] border-[#2a2f3e]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">Active Filters</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => items.forEach(item => refine(item))}
          className="text-xs text-[#a1a1aa] hover:text-white h-auto p-1"
        >
          Clear All
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) =>
          item.refinements.map((refinement) => (
            <Badge
              key={`${item.attribute}-${refinement.label}`}
              variant="default"
              className="bg-[#b12e2e] text-white cursor-pointer"
              onClick={() => refine(refinement)}
            >
              {item.label}: {refinement.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))
        )}
      </div>
    </Card>
  )
}

// Song-specific facets
function SongFacets() {
  return (
    <div className="space-y-3">
      <GenreFacet />
      <MoodFacet />
      <AlbumFacet />
      <ArtistFacet />
      <YearFacet />
    </div>
  )
}

// Content-specific facets
function ContentFacets() {
  return (
    <div className="space-y-3">
      <ContentTypeFacet />
      <CategoryFacet />
      <TagsFacet />
      <AuthorFacet />
    </div>
  )
}

// Genre facet with search
function GenreFacet() {
  const {
    items,
    refine,
    searchForItems,
    isShowingMore,
    toggleShowMore,
    canToggleShowMore
  } = useRefinementList({
    attribute: 'genre',
    limit: 8,
    showMore: true,
    showMoreLimit: 20,
    searchable: true
  })

  const [isOpen, setIsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <FacetCard
      title="Genres"
      icon={Music2}
      isOpen={isOpen}
      onToggle={setIsOpen}
      itemCount={items.filter(item => item.isRefined).length}
    >
      <div className="space-y-3">
        {/* Search input */}
        <Input
          placeholder="Search genres..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            searchForItems(e.target.value)
          }}
          className="bg-[#1a1f2e] border-[#2a2f3e] text-white placeholder:text-[#a1a1aa] text-sm h-8"
        />

        {/* Genre list */}
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {items.map((item) => (
            <FacetItem
              key={item.value}
              label={item.label}
              count={item.count}
              isRefined={item.isRefined}
              onToggle={() => refine(item.value)}
            />
          ))}
        </div>

        {/* Show more button */}
        {canToggleShowMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShowMore}
            className="w-full text-xs text-[#a1a1aa] hover:text-white"
          >
            {isShowingMore ? 'Show Less' : 'Show More'}
          </Button>
        )}
      </div>
    </FacetCard>
  )
}

// Mood facet
function MoodFacet() {
  const { items, refine } = useRefinementList({
    attribute: 'mood',
    limit: 12
  })

  const [isOpen, setIsOpen] = useState(true)

  // Mood icons mapping
  const moodIcons = {
    energetic: '⚡',
    chill: '🧘',
    upbeat: '🎉',
    contemplative: '🤔',
    melancholic: '😢',
    euphoric: '🚀',
    ambient: '🌙',
    intense: '🔥',
    relaxed: '😌',
    mysterious: '🎭',
    nostalgic: '💭',
    dreamy: '☁️'
  }

  return (
    <FacetCard
      title="Moods"
      icon={Palette}
      isOpen={isOpen}
      onToggle={setIsOpen}
      itemCount={items.filter(item => item.isRefined).length}
    >
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const emoji = moodIcons[item.value.toLowerCase() as keyof typeof moodIcons] || '🎵'
          return (
            <Button
              key={item.value}
              variant={item.isRefined ? "default" : "outline"}
              size="sm"
              onClick={() => refine(item.value)}
              className={cn(
                "justify-start text-left h-auto py-2",
                item.isRefined
                  ? "bg-[#b12e2e] text-white border-[#b12e2e]"
                  : "border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e]"
              )}
            >
              <span className="text-base mr-2">{emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate">{item.label}</div>
                <div className="text-xs opacity-60">{item.count}</div>
              </div>
            </Button>
          )
        })}
      </div>
    </FacetCard>
  )
}

// Album facet
function AlbumFacet() {
  const {
    items,
    refine,
    searchForItems,
    isShowingMore,
    toggleShowMore,
    canToggleShowMore
  } = useRefinementList({
    attribute: 'album',
    limit: 6,
    showMore: true,
    showMoreLimit: 15,
    searchable: true
  })

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <FacetCard
      title="Albums"
      icon={Hash}
      isOpen={isOpen}
      onToggle={setIsOpen}
      itemCount={items.filter(item => item.isRefined).length}
    >
      <div className="space-y-3">
        <Input
          placeholder="Search albums..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            searchForItems(e.target.value)
          }}
          className="bg-[#1a1f2e] border-[#2a2f3e] text-white placeholder:text-[#a1a1aa] text-sm h-8"
        />

        <div className="space-y-1 max-h-40 overflow-y-auto">
          {items.map((item) => (
            <FacetItem
              key={item.value}
              label={item.label}
              count={item.count}
              isRefined={item.isRefined}
              onToggle={() => refine(item.value)}
            />
          ))}
        </div>

        {canToggleShowMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShowMore}
            className="w-full text-xs text-[#a1a1aa] hover:text-white"
          >
            {isShowingMore ? 'Show Less' : 'Show More'}
          </Button>
        )}
      </div>
    </FacetCard>
  )
}

// Artist facet
function ArtistFacet() {
  const {
    items,
    refine,
    searchForItems,
    isShowingMore,
    toggleShowMore,
    canToggleShowMore
  } = useRefinementList({
    attribute: 'artist',
    limit: 8,
    showMore: true,
    showMoreLimit: 20,
    searchable: true
  })

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <FacetCard
      title="Artists"
      icon={Hash}
      isOpen={isOpen}
      onToggle={setIsOpen}
      itemCount={items.filter(item => item.isRefined).length}
    >
      <div className="space-y-3">
        <Input
          placeholder="Search artists..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            searchForItems(e.target.value)
          }}
          className="bg-[#1a1f2e] border-[#2a2f3e] text-white placeholder:text-[#a1a1aa] text-sm h-8"
        />

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {items.map((item) => (
            <FacetItem
              key={item.value}
              label={item.label}
              count={item.count}
              isRefined={item.isRefined}
              onToggle={() => refine(item.value)}
            />
          ))}
        </div>

        {canToggleShowMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShowMore}
            className="w-full text-xs text-[#a1a1aa] hover:text-white"
          >
            {isShowingMore ? 'Show Less' : 'Show More'}
          </Button>
        )}
      </div>
    </FacetCard>
  )
}

// Year facet
function YearFacet() {
  const { items, refine } = useRefinementList({
    attribute: 'year',
    limit: 10,
    sortBy: ['name:desc'] // Show newest years first
  })

  const [isOpen, setIsOpen] = useState(false)

  return (
    <FacetCard
      title="Years"
      icon={Calendar}
      isOpen={isOpen}
      onToggle={setIsOpen}
      itemCount={items.filter(item => item.isRefined).length}
    >
      <div className="grid grid-cols-3 gap-1">
        {items.map((item) => (
          <Button
            key={item.value}
            variant={item.isRefined ? "default" : "outline"}
            size="sm"
            onClick={() => refine(item.value)}
            className={cn(
              "h-8 text-xs",
              item.isRefined
                ? "bg-[#b12e2e] text-white border-[#b12e2e]"
                : "border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e]"
            )}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </FacetCard>
  )
}

// Content type facet
function ContentTypeFacet() {
  const { items, refine } = useRefinementList({
    attribute: 'content_type',
    limit: 10
  })

  const [isOpen, setIsOpen] = useState(true)

  const contentTypeLabels = {
    show: 'Shows',
    artist_profile: 'Artist Profiles',
    blog_post: 'Blog Posts',
    deep_dive: 'Deep Dives',
    playlist: 'Playlists',
    episode: 'Episodes'
  }

  return (
    <FacetCard
      title="Content Types"
      icon={Hash}
      isOpen={isOpen}
      onToggle={setIsOpen}
      itemCount={items.filter(item => item.isRefined).length}
    >
      <div className="space-y-1">
        {items.map((item) => (
          <FacetItem
            key={item.value}
            label={contentTypeLabels[item.value as keyof typeof contentTypeLabels] || item.label}
            count={item.count}
            isRefined={item.isRefined}
            onToggle={() => refine(item.value)}
          />
        ))}
      </div>
    </FacetCard>
  )
}

// Category facet for content
function CategoryFacet() {
  const { items, refine } = useRefinementList({
    attribute: 'category',
    limit: 15
  })

  const [isOpen, setIsOpen] = useState(false)

  return (
    <FacetCard
      title="Categories"
      icon={Hash}
      isOpen={isOpen}
      onToggle={setIsOpen}
      itemCount={items.filter(item => item.isRefined).length}
    >
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {items.map((item) => (
          <FacetItem
            key={item.value}
            label={item.label}
            count={item.count}
            isRefined={item.isRefined}
            onToggle={() => refine(item.value)}
          />
        ))}
      </div>
    </FacetCard>
  )
}

// Tags facet for content
function TagsFacet() {
  const {
    items,
    refine,
    searchForItems,
    isShowingMore,
    toggleShowMore,
    canToggleShowMore
  } = useRefinementList({
    attribute: 'tags',
    limit: 12,
    showMore: true,
    showMoreLimit: 30,
    searchable: true
  })

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <FacetCard
      title="Tags"
      icon={Hash}
      isOpen={isOpen}
      onToggle={setIsOpen}
      itemCount={items.filter(item => item.isRefined).length}
    >
      <div className="space-y-3">
        <Input
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            searchForItems(e.target.value)
          }}
          className="bg-[#1a1f2e] border-[#2a2f3e] text-white placeholder:text-[#a1a1aa] text-sm h-8"
        />

        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          {items.map((item) => (
            <Badge
              key={item.value}
              variant={item.isRefined ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs",
                item.isRefined
                  ? "bg-[#b12e2e] text-white"
                  : "border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e]"
              )}
              onClick={() => refine(item.value)}
            >
              {item.label} ({item.count})
            </Badge>
          ))}
        </div>

        {canToggleShowMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShowMore}
            className="w-full text-xs text-[#a1a1aa] hover:text-white"
          >
            {isShowingMore ? 'Show Less' : 'Show More'}
          </Button>
        )}
      </div>
    </FacetCard>
  )
}

// Author facet for content
function AuthorFacet() {
  const { items, refine } = useRefinementList({
    attribute: 'author',
    limit: 15
  })

  const [isOpen, setIsOpen] = useState(false)

  return (
    <FacetCard
      title="Authors"
      icon={Hash}
      isOpen={isOpen}
      onToggle={setIsOpen}
      itemCount={items.filter(item => item.isRefined).length}
    >
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {items.map((item) => (
          <FacetItem
            key={item.value}
            label={item.label}
            count={item.count}
            isRefined={item.isRefined}
            onToggle={() => refine(item.value)}
          />
        ))}
      </div>
    </FacetCard>
  )
}

// Reusable facet card component
interface FacetCardProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  isOpen: boolean
  onToggle: (open: boolean) => void
  itemCount?: number
}

function FacetCard({ title, icon: Icon, children, isOpen, onToggle, itemCount = 0 }: FacetCardProps) {
  return (
    <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-3 text-left text-[#a1a1aa] hover:text-white"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="font-medium">{title}</span>
              {itemCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {itemCount}
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// Reusable facet item component
interface FacetItemProps {
  label: string
  count: number
  isRefined: boolean
  onToggle: () => void
}

function FacetItem({ label, count, isRefined, onToggle }: FacetItemProps) {
  return (
    <Button
      variant="ghost"
      onClick={onToggle}
      className={cn(
        "w-full justify-between text-left h-auto py-2 px-2",
        isRefined
          ? "bg-[#b12e2e]/10 text-[#b12e2e] border border-[#b12e2e]/20"
          : "text-[#a1a1aa] hover:text-white hover:bg-[#2a2f3e]"
      )}
    >
      <span className="text-sm truncate">{label}</span>
      <Badge
        variant={isRefined ? "default" : "secondary"}
        className={cn(
          "text-xs ml-2",
          isRefined ? "bg-[#b12e2e] text-white" : ""
        )}
      >
        {count}
      </Badge>
    </Button>
  )
}