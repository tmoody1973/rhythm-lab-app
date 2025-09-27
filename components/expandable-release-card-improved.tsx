'use client'

import React, { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOutsideClick } from '@/hooks/use-outside-click'
import { ChevronRight, Music, Calendar, Tag, Disc, Globe, Clock, List, X } from 'lucide-react'

interface ReleaseData {
  id: number | string
  releaseType?: 'release' | 'master'
  title: string
  artist_name: string
  cover_image_url?: string
  year?: number
  label?: string
  catalog_no?: string
  discogs_url?: string
  detailed?: {
    tracklist: Array<{
      position: string
      title: string
      duration?: string
      artists?: Array<{ name: string }>
    }>
    labels: Array<{ name: string; catno: string }>
    formats: Array<{ name: string; descriptions?: string[] }>
    genres: string[]
    styles: string[]
    country?: string
    released?: string
    notes?: string
    images?: Array<{ type: string; uri: string }>
    data_quality?: string
  }
}

interface ExpandableReleaseCardProps {
  releases: ReleaseData[]
  children: React.ReactNode
}

/**
 * OPTION 1: Clean Tabbed Layout
 * Best for: Complex releases with lots of information
 * Mobile: Swipeable tabs, full-screen modal
 * Desktop: Sidebar layout with tabs
 */
export function ExpandableReleaseCard({ releases, children }: ExpandableReleaseCardProps) {
  const [activeRelease, setActiveRelease] = useState<ReleaseData | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'tracks' | 'notes'>('info')
  const id = useRef(Math.random()).current
  const ref = useRef<HTMLDivElement>(null)

  useOutsideClick(ref, () => setActiveRelease(null))

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveRelease(null)
    }

    if (activeRelease) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'auto'
    }
  }, [activeRelease])

  const handleReleaseClick = async (release: ReleaseData) => {
    setActiveRelease(release)
    setError(null)
    setActiveTab('info')

    if (release.detailed) return

    const releaseId = release.id
    const isValidDiscogsId = releaseId &&
      (typeof releaseId === 'number' && releaseId > 100) ||
      (typeof releaseId === 'string' && releaseId.trim() !== '' && !isNaN(parseInt(releaseId)) && parseInt(releaseId) > 100)

    if (!isValidDiscogsId) {
      setError('Release details unavailable')
      return
    }

    setLoadingDetails(true)

    try {
      const response = await fetch('/api/discogs/release-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseId: String(releaseId),
          releaseType: release.releaseType || 'release'
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch release details: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch release details')
      }

      const updatedRelease = { ...release, detailed: data.release }
      setActiveRelease(updatedRelease)

      const releaseIndex = releases.findIndex(r => r.id === release.id)
      if (releaseIndex !== -1) {
        releases[releaseIndex] = updatedRelease
      }
    } catch (error: any) {
      console.error('[ExpandableCard] Error:', error)
      setError(error.message || 'Failed to load details')
    } finally {
      setLoadingDetails(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {activeRelease ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              layoutId={`card-${activeRelease.title}-${id}`}
              ref={ref}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-5xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveRelease(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Side - Album Art & Basic Info */}
              <div className="md:w-2/5 bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <div className="p-6 space-y-4">
                  {/* Album Cover */}
                  <div className="aspect-square rounded-xl overflow-hidden shadow-xl">
                    <img
                      src={activeRelease.cover_image_url || '/placeholder-album.svg'}
                      alt={activeRelease.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title & Artist */}
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activeRelease.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      {activeRelease.artist_name}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {activeRelease.year && (
                      <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{activeRelease.year}</span>
                      </div>
                    )}
                    {activeRelease.label && (
                      <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium truncate">{activeRelease.label}</span>
                      </div>
                    )}
                  </div>

                  {/* View on Discogs Button */}
                  <a
                    href={activeRelease.discogs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Globe className="w-4 h-4" />
                    View on Discogs
                  </a>
                </div>
              </div>

              {/* Right Side - Detailed Info with Tabs */}
              <div className="md:w-3/5 flex flex-col">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'info'
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Disc className="w-4 h-4" />
                      <span>Release Info</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('tracks')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'tracks'
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <List className="w-4 h-4" />
                      <span>Tracklist</span>
                    </div>
                  </button>
                  {activeRelease.detailed?.notes && (
                    <button
                      onClick={() => setActiveTab('notes')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'notes'
                          ? 'text-green-600 border-b-2 border-green-600'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      Notes
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingDetails ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading details...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <p className="text-red-600">{error}</p>
                      <button
                        onClick={() => handleReleaseClick(activeRelease)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      {activeTab === 'info' && (
                        <motion.div
                          key="info"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          {activeRelease.detailed ? (
                            <>
                              {/* Format */}
                              {activeRelease.detailed.formats.length > 0 && (
                                <div className="space-y-2">
                                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    Format
                                  </h3>
                                  <p className="text-gray-900 dark:text-white">
                                    {activeRelease.detailed.formats.map(f =>
                                      f.descriptions?.length
                                        ? `${f.name} (${f.descriptions.join(', ')})`
                                        : f.name
                                    ).join(', ')}
                                  </p>
                                </div>
                              )}

                              {/* Genre & Style */}
                              {(activeRelease.detailed.genres.length > 0 || activeRelease.detailed.styles.length > 0) && (
                                <div className="space-y-2">
                                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    Genre / Style
                                  </h3>
                                  <div className="flex flex-wrap gap-2">
                                    {[...activeRelease.detailed.genres, ...activeRelease.detailed.styles].map((tag, i) => (
                                      <span
                                        key={i}
                                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Country & Released */}
                              {(activeRelease.detailed.country || activeRelease.detailed.released) && (
                                <div className="grid grid-cols-2 gap-4">
                                  {activeRelease.detailed.country && (
                                    <div className="space-y-2">
                                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                        Country
                                      </h3>
                                      <p className="text-gray-900 dark:text-white">
                                        {activeRelease.detailed.country}
                                      </p>
                                    </div>
                                  )}
                                  {activeRelease.detailed.released && (
                                    <div className="space-y-2">
                                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                        Released
                                      </h3>
                                      <p className="text-gray-900 dark:text-white">
                                        {activeRelease.detailed.released}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Label Info */}
                              {activeRelease.detailed.labels.length > 0 && (
                                <div className="space-y-2">
                                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    Label
                                  </h3>
                                  {activeRelease.detailed.labels.map((label, i) => (
                                    <p key={i} className="text-gray-900 dark:text-white">
                                      {label.name}
                                      {label.catno && (
                                        <span className="ml-2 text-gray-500">({label.catno})</span>
                                      )}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <p>Click to load detailed information</p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {activeTab === 'tracks' && (
                        <motion.div
                          key="tracks"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                        >
                          {activeRelease.detailed?.tracklist && activeRelease.detailed.tracklist.length > 0 ? (
                            <div className="space-y-2">
                              {activeRelease.detailed.tracklist.map((track, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                                >
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm font-mono text-gray-500 w-8">
                                      {track.position || index + 1}
                                    </span>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {track.title}
                                      </p>
                                      {track.artists && track.artists.length > 0 && (
                                        <p className="text-sm text-gray-500">
                                          {track.artists.map(a => a.name).join(', ')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {track.duration && (
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      <span className="text-sm font-mono text-gray-500">
                                        {track.duration}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No tracklist available</p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {activeTab === 'notes' && activeRelease.detailed?.notes && (
                        <motion.div
                          key="notes"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="prose prose-gray dark:prose-invert max-w-none"
                        >
                          <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                            {activeRelease.detailed.notes}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Release List */}
      <div className="space-y-3">
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child) && releases[index]) {
            return React.cloneElement(child, {
              onClick: () => handleReleaseClick(releases[index]),
              style: { cursor: 'pointer' },
              ...child.props
            } as any)
          }
          return child
        })}
      </div>
    </>
  )
}

/**
 * OPTION 2: Compact Accordion Style
 * Best for: Quick scanning of multiple releases
 * Mobile: Full-width cards with better touch targets
 * Desktop: Two-column layout with expanded details
 */
export function ExpandableReleaseCardAccordion({ releases, children }: ExpandableReleaseCardProps) {
  // Implementation would go here...
  return <></>
}

/**
 * OPTION 3: Spotify-Style Side Panel
 * Best for: Music-focused interfaces
 * Mobile: Bottom sheet that slides up
 * Desktop: Right sidebar that slides in
 */
export function ExpandableReleaseCardSidePanel({ releases, children }: ExpandableReleaseCardProps) {
  // Implementation would go here...
  return <></>
}