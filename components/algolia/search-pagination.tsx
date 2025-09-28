"use client"

import React, { useEffect, useRef, useCallback } from 'react'
import { usePagination, useInfiniteHits, useStats } from 'react-instantsearch'
import { ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchPaginationProps {
  className?: string
}

// Standard pagination component
export function SearchPagination({ className }: SearchPaginationProps) {
  const {
    pages,
    currentRefinement,
    nbPages,
    isFirstPage,
    isLastPage,
    refine,
    createURL
  } = usePagination()

  const { nbHits } = useStats()

  if (nbHits === 0) return null

  // Generate page numbers to show
  const getVisiblePages = () => {
    const current = currentRefinement
    const total = nbPages
    const maxVisible = 7

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i)
    }

    if (current <= 3) {
      return [0, 1, 2, 3, 4, -1, total - 1]
    }

    if (current >= total - 4) {
      return [0, -1, total - 5, total - 4, total - 3, total - 2, total - 1]
    }

    return [0, -1, current - 1, current, current + 1, -1, total - 1]
  }

  const visiblePages = getVisiblePages()

  return (
    <div className={cn("flex items-center justify-center gap-2 py-4", className)}>
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => refine(currentRefinement - 1)}
        disabled={isFirstPage}
        className="border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e] disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => {
          if (page === -1) {
            return (
              <div key={`ellipsis-${index}`} className="px-3 py-1">
                <MoreHorizontal className="h-4 w-4 text-[#a1a1aa]" />
              </div>
            )
          }

          const isActive = page === currentRefinement

          return (
            <Button
              key={page}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => refine(page)}
              className={cn(
                "w-8 h-8 p-0",
                isActive
                  ? "bg-[#b12e2e] text-white border-[#b12e2e]"
                  : "border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e]"
              )}
            >
              {page + 1}
            </Button>
          )
        })}
      </div>

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => refine(currentRefinement + 1)}
        disabled={isLastPage}
        className="border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e] disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  )
}

// Infinite scroll component
interface InfiniteScrollProps {
  children: React.ReactNode
  className?: string
  threshold?: number
}

export function InfiniteScrollResults({ children, className, threshold = 200 }: InfiniteScrollProps) {
  const { hits, isLastPage, showMore } = useInfiniteHits()
  const [isLoading, setIsLoading] = React.useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  // Handle infinite scroll
  const handleLoadMore = useCallback(async () => {
    if (isLastPage || isLoading) return

    setIsLoading(true)
    try {
      showMore()
    } finally {
      setIsLoading(false)
    }
  }, [isLastPage, isLoading, showMore])

  // Intersection Observer for automatic loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && !isLastPage && !isLoading) {
          handleLoadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: `${threshold}px`
      }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [handleLoadMore, isLastPage, isLoading, threshold])

  return (
    <div className={cn("space-y-4", className)}>
      {children}

      {/* Loading indicator and trigger */}
      <div ref={observerRef} className="flex justify-center py-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-[#a1a1aa]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading more results...</span>
          </div>
        ) : !isLastPage ? (
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e]"
          >
            Load More Results
          </Button>
        ) : hits.length > 0 ? (
          <div className="text-center text-[#a1a1aa] text-sm">
            You've reached the end of the results
          </div>
        ) : null}
      </div>
    </div>
  )
}

// Results per page selector
interface ResultsPerPageProps {
  className?: string
  options?: number[]
}

export function ResultsPerPage({ className, options = [10, 20, 50] }: ResultsPerPageProps) {
  const { items, refine } = usePagination()

  return (
    <div className={cn("flex items-center gap-2 text-sm text-[#a1a1aa]", className)}>
      <span>Show:</span>
      <div className="flex gap-1">
        {options.map((count) => (
          <Button
            key={count}
            variant="ghost"
            size="sm"
            onClick={() => refine(0)} // Reset to first page when changing page size
            className={cn(
              "h-8 px-2 text-xs",
              // You'd need to track current page size to highlight active option
              "text-[#a1a1aa] hover:text-[#b12e2e] hover:bg-[#2a2f3e]"
            )}
          >
            {count}
          </Button>
        ))}
      </div>
      <span>per page</span>
    </div>
  )
}

// Pagination info component
export function PaginationInfo({ className }: { className?: string }) {
  const { nbHits, processingTimeMS } = useStats()
  const { currentRefinement, nbPages } = usePagination()

  if (nbHits === 0) return null

  const startResult = currentRefinement * 20 + 1
  const endResult = Math.min((currentRefinement + 1) * 20, nbHits)

  return (
    <div className={cn("flex items-center justify-between text-sm text-[#a1a1aa]", className)}>
      <div>
        Showing {startResult.toLocaleString()}-{endResult.toLocaleString()} of{' '}
        {nbHits.toLocaleString()} results
      </div>
      <div className="flex items-center gap-2">
        <span>Page {currentRefinement + 1} of {nbPages}</span>
        <span>•</span>
        <span>{processingTimeMS}ms</span>
      </div>
    </div>
  )
}

// Combined pagination component with info and controls
export function CompletePagination({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 border-t border-[#2a2f3e] pt-4", className)}>
      <PaginationInfo />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <ResultsPerPage />
        <SearchPagination />
      </div>
    </div>
  )
}

// Hook for managing pagination state
export function usePaginationState() {
  const { currentRefinement, nbPages, isFirstPage, isLastPage, refine } = usePagination()
  const { nbHits } = useStats()

  const goToPage = useCallback((page: number) => {
    if (page >= 0 && page < nbPages) {
      refine(page)
    }
  }, [nbPages, refine])

  const nextPage = useCallback(() => {
    if (!isLastPage) {
      refine(currentRefinement + 1)
    }
  }, [isLastPage, currentRefinement, refine])

  const previousPage = useCallback(() => {
    if (!isFirstPage) {
      refine(currentRefinement - 1)
    }
  }, [isFirstPage, currentRefinement, refine])

  return {
    currentPage: currentRefinement,
    totalPages: nbPages,
    totalResults: nbHits,
    isFirstPage,
    isLastPage,
    goToPage,
    nextPage,
    previousPage
  }
}