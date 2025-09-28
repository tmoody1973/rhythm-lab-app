"use client"

import React, { useState } from 'react'
import { useRefinementList, useNumericMenu, useToggleRefinement, useRange } from 'react-instantsearch'
import { Filter, Calendar, Clock, Image, Music, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { cn } from '@/lib/utils'

interface SearchFiltersProps {
  searchType: 'songs' | 'content'
  onFilterChange?: (filters: any) => void
  className?: string
}

export function SearchFilters({
  searchType,
  onFilterChange,
  className
}: SearchFiltersProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-[#b12e2e]" />
        <h3 className="text-white font-medium">Filters</h3>
        <ClearAllFilters />
      </div>

      {searchType === 'songs' ? <SongFilters /> : <ContentFilters />}
    </div>
  )
}

// Clear all filters component
function ClearAllFilters() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="ml-auto text-xs text-[#a1a1aa] hover:text-white"
      onClick={() => {
        // This would clear all active filters
        // Implementation depends on how filters are managed
      }}
    >
      Clear All
    </Button>
  )
}

// Song-specific filters
function SongFilters() {
  return (
    <div className="space-y-4">
      {/* Genre Filter */}
      <GenreFilter />

      {/* Mood Filter */}
      <MoodFilter />

      {/* Year Filter */}
      <YearFilter />

      {/* Timeframe Filter */}
      <TimeframeFilter />

      {/* Has Artwork Filter */}
      <ArtworkFilter />

      {/* AI Enhanced Filter */}
      <AIEnhancedFilter />

      {/* Date Range Filter */}
      <DateRangeFilter />

      {/* Energy Level Filter */}
      <EnergyLevelFilter />

      {/* BPM Range Filter */}
      <BPMRangeFilter />
    </div>
  )
}

// Content-specific filters
function ContentFilters() {
  return (
    <div className="space-y-4">
      {/* Content Type Filter */}
      <ContentTypeFilter />

      {/* Category Filter */}
      <CategoryFilter />

      {/* Author Filter */}
      <AuthorFilter />

      {/* Tags Filter */}
      <TagsFilter />

      {/* AI Generated Filter */}
      <AIGeneratedFilter />

      {/* Date Range Filter */}
      <DateRangeFilter />

      {/* View Count Range */}
      <ViewCountFilter />
    </div>
  )
}

// Genre refinement filter
function GenreFilter() {
  const { items, refine } = useRefinementList({ attribute: 'genre', limit: 20 })
  const [isOpen, setIsOpen] = useState(true)

  return (
    <FilterSection title="Genre" isOpen={isOpen} onToggle={setIsOpen}>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <FilterCheckbox
            key={item.value}
            label={item.label}
            count={item.count}
            checked={item.isRefined}
            onChange={() => refine(item.value)}
          />
        ))}
      </div>
    </FilterSection>
  )
}

// Mood refinement filter
function MoodFilter() {
  const { items, refine } = useRefinementList({ attribute: 'mood', limit: 15 })
  const [isOpen, setIsOpen] = useState(true)

  return (
    <FilterSection title="Mood" isOpen={isOpen} onToggle={setIsOpen}>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {items.map((item) => (
          <FilterCheckbox
            key={item.value}
            label={item.label}
            count={item.count}
            checked={item.isRefined}
            onChange={() => refine(item.value)}
          />
        ))}
      </div>
    </FilterSection>
  )
}

// Year numeric filter
function YearFilter() {
  const { items, refine } = useNumericMenu({
    attribute: 'year',
    items: [
      { label: '2024', start: 2024, end: 2024 },
      { label: '2023', start: 2023, end: 2023 },
      { label: '2022', start: 2022, end: 2022 },
      { label: '2021', start: 2021, end: 2021 },
      { label: '2020', start: 2020, end: 2020 },
      { label: '2010s', start: 2010, end: 2019 },
      { label: '2000s', start: 2000, end: 2009 },
      { label: 'Before 2000', end: 1999 }
    ]
  })
  const [isOpen, setIsOpen] = useState(false)

  return (
    <FilterSection title="Year" isOpen={isOpen} onToggle={setIsOpen}>
      <div className="space-y-2">
        {items.map((item) => (
          <FilterCheckbox
            key={item.label}
            label={item.label}
            count={item.count}
            checked={item.isRefined}
            onChange={() => refine(item.value)}
          />
        ))}
      </div>
    </FilterSection>
  )
}

// Timeframe filter for songs
function TimeframeFilter() {
  const { items, refine } = useRefinementList({
    attribute: 'timeframe',
    limit: 10
  })
  const [isOpen, setIsOpen] = useState(false)

  const timeframeIcons = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌆',
    late_night: '🌙'
  }

  return (
    <FilterSection title="Time of Day" isOpen={isOpen} onToggle={setIsOpen}>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <Button
            key={item.value}
            variant={item.isRefined ? "default" : "outline"}
            size="sm"
            onClick={() => refine(item.value)}
            className={cn(
              "justify-start text-left",
              item.isRefined
                ? "bg-[#b12e2e] text-white border-[#b12e2e]"
                : "border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e]"
            )}
          >
            <span className="mr-2">
              {timeframeIcons[item.value as keyof typeof timeframeIcons] || <Clock className="h-4 w-4" />}
            </span>
            <span className="truncate">{item.label}</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {item.count}
            </Badge>
          </Button>
        ))}
      </div>
    </FilterSection>
  )
}

// Artwork toggle filter
function ArtworkFilter() {
  const { value, refine } = useToggleRefinement({
    attribute: 'has_artwork',
    on: true
  })

  return (
    <FilterSection title="Artwork" isOpen={true} onToggle={() => {}}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="has-artwork"
          checked={value.isRefined}
          onCheckedChange={() => refine(value)}
        />
        <label
          htmlFor="has-artwork"
          className="text-sm text-[#a1a1aa] hover:text-white cursor-pointer flex items-center gap-2"
        >
          <Image className="h-4 w-4" />
          Show only tracks with artwork
        </label>
      </div>
    </FilterSection>
  )
}

// AI Enhanced filter for songs
function AIEnhancedFilter() {
  const { value, refine } = useToggleRefinement({
    attribute: 'ai_enhanced',
    on: true
  })

  return (
    <FilterSection title="AI Enhanced" isOpen={true} onToggle={() => {}}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="ai-enhanced"
          checked={value.isRefined}
          onCheckedChange={() => refine(value)}
        />
        <label
          htmlFor="ai-enhanced"
          className="text-sm text-[#a1a1aa] hover:text-white cursor-pointer flex items-center gap-2"
        >
          <Music className="h-4 w-4" />
          AI enhanced tracks only
        </label>
      </div>
    </FilterSection>
  )
}

// Content type filter
function ContentTypeFilter() {
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
    <FilterSection title="Content Type" isOpen={isOpen} onToggle={setIsOpen}>
      <div className="space-y-2">
        {items.map((item) => (
          <FilterCheckbox
            key={item.value}
            label={contentTypeLabels[item.value as keyof typeof contentTypeLabels] || item.label}
            count={item.count}
            checked={item.isRefined}
            onChange={() => refine(item.value)}
          />
        ))}
      </div>
    </FilterSection>
  )
}

// Category filter for content
function CategoryFilter() {
  const { items, refine } = useRefinementList({
    attribute: 'category',
    limit: 15
  })
  const [isOpen, setIsOpen] = useState(false)

  return (
    <FilterSection title="Category" isOpen={isOpen} onToggle={setIsOpen}>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {items.map((item) => (
          <FilterCheckbox
            key={item.value}
            label={item.label}
            count={item.count}
            checked={item.isRefined}
            onChange={() => refine(item.value)}
          />
        ))}
      </div>
    </FilterSection>
  )
}

// Author filter
function AuthorFilter() {
  const { items, refine } = useRefinementList({
    attribute: 'author',
    limit: 20
  })
  const [isOpen, setIsOpen] = useState(false)

  return (
    <FilterSection title="Author" isOpen={isOpen} onToggle={setIsOpen}>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <FilterCheckbox
            key={item.value}
            label={item.label}
            count={item.count}
            checked={item.isRefined}
            onChange={() => refine(item.value)}
          />
        ))}
      </div>
    </FilterSection>
  )
}

// Tags filter
function TagsFilter() {
  const { items, refine } = useRefinementList({
    attribute: 'tags',
    limit: 30
  })
  const [isOpen, setIsOpen] = useState(false)

  return (
    <FilterSection title="Tags" isOpen={isOpen} onToggle={setIsOpen}>
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
    </FilterSection>
  )
}

// AI Generated filter for content
function AIGeneratedFilter() {
  const { value, refine } = useToggleRefinement({
    attribute: 'ai_generated',
    on: true
  })

  return (
    <FilterSection title="AI Generated" isOpen={true} onToggle={() => {}}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="ai-generated"
          checked={value.isRefined}
          onCheckedChange={() => refine(value)}
        />
        <label
          htmlFor="ai-generated"
          className="text-sm text-[#a1a1aa] hover:text-white cursor-pointer"
        >
          AI generated content only
        </label>
      </div>
    </FilterSection>
  )
}

// Date range filter
function DateRangeFilter() {
  const [isOpen, setIsOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()

  return (
    <FilterSection title="Date Range" isOpen={isOpen} onToggle={setIsOpen}>
      <div className="space-y-3">
        <DatePickerWithRange
          date={dateRange}
          onSelect={setDateRange}
          className="w-full"
        />
        {dateRange && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#a1a1aa]">
              {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange(undefined)}
              className="h-auto p-1 text-xs text-[#a1a1aa] hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </FilterSection>
  )
}

// Energy level filter for songs
function EnergyLevelFilter() {
  const { start, range, refine } = useRange({ attribute: 'energy_level' })
  const [isOpen, setIsOpen] = useState(false)

  return (
    <FilterSection title="Energy Level" isOpen={isOpen} onToggle={setIsOpen}>
      <div className="space-y-3">
        <Slider
          value={[start || 1, range.max || 10]}
          onValueChange={([min, max]) => refine({ min, max })}
          max={10}
          min={1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-[#a1a1aa]">
          <span>Low (1)</span>
          <span>High (10)</span>
        </div>
      </div>
    </FilterSection>
  )
}

// BPM range filter
function BPMRangeFilter() {
  const { start, range, refine } = useRange({ attribute: 'bpm' })
  const [isOpen, setIsOpen] = useState(false)

  return (
    <FilterSection title="BPM Range" isOpen={isOpen} onToggle={setIsOpen}>
      <div className="space-y-3">
        <Slider
          value={[start || 60, range.max || 200]}
          onValueChange={([min, max]) => refine({ min, max })}
          max={200}
          min={60}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-[#a1a1aa]">
          <span>{start || 60} BPM</span>
          <span>{range.max || 200} BPM</span>
        </div>
      </div>
    </FilterSection>
  )
}

// View count filter for content
function ViewCountFilter() {
  const { items, refine } = useNumericMenu({
    attribute: 'view_count',
    items: [
      { label: '1000+ views', start: 1000 },
      { label: '5000+ views', start: 5000 },
      { label: '10000+ views', start: 10000 },
      { label: '50000+ views', start: 50000 }
    ]
  })
  const [isOpen, setIsOpen] = useState(false)

  return (
    <FilterSection title="Popularity" isOpen={isOpen} onToggle={setIsOpen}>
      <div className="space-y-2">
        {items.map((item) => (
          <FilterCheckbox
            key={item.label}
            label={item.label}
            count={item.count}
            checked={item.isRefined}
            onChange={() => refine(item.value)}
          />
        ))}
      </div>
    </FilterSection>
  )
}

// Reusable filter section component
interface FilterSectionProps {
  title: string
  children: React.ReactNode
  isOpen: boolean
  onToggle: (open: boolean) => void
}

function FilterSection({ title, children, isOpen, onToggle }: FilterSectionProps) {
  return (
    <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-3 text-left text-[#a1a1aa] hover:text-white"
          >
            <span className="font-medium">{title}</span>
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

// Reusable filter checkbox component
interface FilterCheckboxProps {
  label: string
  count?: number
  checked: boolean
  onChange: () => void
}

function FilterCheckbox({ label, count, checked, onChange }: FilterCheckboxProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`filter-${label}`}
          checked={checked}
          onCheckedChange={onChange}
        />
        <label
          htmlFor={`filter-${label}`}
          className="text-sm text-[#a1a1aa] hover:text-white cursor-pointer"
        >
          {label}
        </label>
      </div>
      {count !== undefined && (
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      )}
    </div>
  )
}