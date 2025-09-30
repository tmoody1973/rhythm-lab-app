"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { YouTubeVideoGrid } from '@/components/youtube-video-embed';
import { YouTubeVideo } from '@/lib/youtube/api';

/**
 * EXPLANATION: These interfaces define the shape of our data
 * Think of them as contracts that ensure our data has the right structure
 */
interface ReleaseData {
  id: number | string
  title: string
  artist_name: string
  cover_image_url?: string
  year?: number
  label?: string
  discogs_url?: string
  releaseType?: 'release' | 'master'
  // These fields will be populated when we fetch detailed info
  detailed?: {
    artists: Array<{ name: string; role?: string }>
    labels: Array<{ name: string; catno: string }>
    formats: Array<{ name: string; descriptions?: string[] }>
    tracklist: Array<{
      position: string
      title: string
      duration?: string
      artists?: Array<{ name: string }>
    }>
    images: Array<{ type: string; uri: string; width: number; height: number }>
    notes?: string
    genres: string[]
    styles: string[]
    country?: string
    released?: string
    data_quality: string
  }
}

interface ExpandableReleaseCardProps {
  releases: ReleaseData[]
  children: React.ReactNode
}

/**
 * EXPLANATION: This is our main component that handles the expandable cards
 * It manages which card is open, fetches detailed data, and handles animations
 */
export function ExpandableReleaseCard({ releases, children }: ExpandableReleaseCardProps) {
  // EXPLANATION: State to track which release card is currently expanded (if any)
  const [activeRelease, setActiveRelease] = useState<ReleaseData | null>(null)

  // EXPLANATION: State to track if we're currently loading detailed data
  const [loadingDetails, setLoadingDetails] = useState(false)

  // EXPLANATION: State to store any error messages
  const [error, setError] = useState<string | null>(null)

  // EXPLANATION: State to track which tab is active (details, tracklist, or videos)
  const [activeTab, setActiveTab] = useState<'details' | 'tracklist' | 'videos'>('details')

  // EXPLANATION: State for YouTube videos
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)

  // EXPLANATION: Reference to the expanded card DOM element (for outside click detection)
  const ref = useRef<HTMLDivElement>(null)

  // EXPLANATION: Unique ID for this component instance (prevents conflicts with multiple instances)
  const id = useId()

  /**
   * EXPLANATION: This effect handles keyboard shortcuts and body scroll prevention
   * - Escape key closes the expanded card
   * - When card is open, prevent page scrolling behind it
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveRelease(null)
      }
    }

    if (activeRelease) {
      // EXPLANATION: When a card is open, prevent the page from scrolling
      document.body.style.overflow = "hidden"
    } else {
      // EXPLANATION: When no card is open, allow normal page scrolling
      document.body.style.overflow = "auto"
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [activeRelease])

  // EXPLANATION: Use our custom hook to close card when clicking outside
  useOutsideClick(ref, () => setActiveRelease(null))

  /**
   * EXPLANATION: Function to fetch YouTube videos for the current release
   */
  const fetchYouTubeVideos = async (artist: string, album: string) => {
    setLoadingVideos(true)
    setVideoError(null)

    try {
      const response = await fetch('/api/youtube/search-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist, album, maxResults: 6 }),
      })

      if (!response.ok) {
        throw new Error(`Failed to search videos: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setYoutubeVideos(data.videos)
      } else {
        throw new Error(data.error || 'Failed to search videos')
      }
    } catch (error: any) {
      console.error('[ExpandableCard] YouTube video search error:', error)
      setVideoError(error.message || 'Failed to load videos')
    } finally {
      setLoadingVideos(false)
    }
  }

  /**
   * EXPLANATION: This function handles when someone clicks to expand a release card
   * It fetches detailed information from our API and updates the state
   */
  const handleReleaseClick = async (release: ReleaseData) => {
    console.log('[ExpandableCard] Opening release:', release.title)

    // EXPLANATION: Set the active release immediately so the card starts expanding
    setActiveRelease(release)
    setError(null)
    setActiveTab('details') // Reset to details tab when opening
    setYoutubeVideos([]) // Clear previous videos
    setVideoError(null)

    // EXPLANATION: If we already have detailed data, don't fetch it again
    if (release.detailed) {
      return
    }

    // EXPLANATION: Check if we have a valid release ID to fetch details
    // Only proceed if we have a valid Discogs ID (not a fallback like array index)
    const releaseId = release.id
    const isValidDiscogsId = releaseId &&
      (typeof releaseId === 'number' && releaseId > 100) || // Discogs IDs are typically large numbers
      (typeof releaseId === 'string' && releaseId.trim() !== '' && !isNaN(parseInt(releaseId)) && parseInt(releaseId) > 100)

    if (!isValidDiscogsId) {
      console.log('[ExpandableCard] Skipping API call - invalid Discogs ID (likely placeholder):', releaseId)
      setError('Release details unavailable: This release needs a valid Discogs ID to fetch detailed information')
      setLoadingDetails(false)
      return
    }

    // EXPLANATION: Start loading and fetch detailed information
    setLoadingDetails(true)

    try {
      console.log('[ExpandableCard] Fetching detailed data:', {
        id: release.id,
        releaseType: release.releaseType,
        title: release.title,
        discogs_url: release.discogs_url
      })

      const requestBody = {
        releaseId: String(releaseId), // Use the extracted releaseId, not release.id
        releaseType: release.releaseType || 'release' // Use the detected release type
      }

      console.log('[ExpandableCard] API Request:', requestBody)

      const response = await fetch('/api/discogs/release-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch release details: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch release details')
      }

      console.log('[ExpandableCard] Successfully fetched detailed data')

      // EXPLANATION: Update the release with detailed information
      const updatedRelease = {
        ...release,
        detailed: data.release
      }

      setActiveRelease(updatedRelease)

    } catch (err) {
      console.error('[ExpandableCard] Error fetching details:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load release details'

      // Check if this is a missing Discogs URL issue
      if (!release.discogs_url || errorMessage.includes('404')) {
        setError('This release needs a Discogs URL to view details. Please add the discogs_url field in Storyblok.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoadingDetails(false)
    }
  }

  return (
    <>
      {/* EXPLANATION: Background overlay that appears when a card is expanded */}
      <AnimatePresence>
        {activeRelease && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>

      {/* EXPLANATION: The expanded card modal */}
      <AnimatePresence>
        {activeRelease ? (
          <div className="fixed inset-0 grid place-items-center z-[100]">
            {/* EXPLANATION: Close button for mobile (hidden on desktop) */}
            <motion.button
              key={`button-${activeRelease.title}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6"
              onClick={() => setActiveRelease(null)}
            >
              <CloseIcon />
            </motion.button>

            {/* EXPLANATION: The main expanded card */}
            <motion.div
              layoutId={`card-${activeRelease.title}-${id}`}
              ref={ref}
              className="w-full max-w-[600px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden"
            >
              {/* EXPLANATION: Album cover image at the top */}
              <motion.div layoutId={`image-${activeRelease.title}-${id}`}>
                <img
                  width={200}
                  height={200}
                  src={activeRelease.cover_image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAzMkMxMS4xNjMgMzIgNCAyNC44MzcgNCAyMEM0IDE1LjE2MyAxMS4xNjMgOCAyMCA4QzI4LjgzNyA4IDM2IDE1LjE2MyAzNiAyMEMzNiAyNC44MzcgMjguODM3IDMyIDIwIDMyWk0yMCAzMEMyNy43MzIgMzAgMzQgMjMuNzMyIDM0IDIwQzM0IDE2LjI2OCAyNy43MzIgMTAgMjAgMTBDMTIuMjY4IDEwIDYgMTYuMjY4IDYgMjBDNiAyMy43MzIgMTIuMjY4IDMwIDIwIDMwWk0yMCAyNkMxNi42ODYzIDI2IDE0IDIzLjMxMzcgMTQgMjBDMTQgMTYuNjg2MyAxNi42ODYzIDE0IDIwIDE0QzIzLjMxMzcgMTQgMjYgMTYuNjg2MyAyNiAyMEMyNiAyMy4zMTM3IDIzLjMxMzcgMjYgMjAgMjZaTTIwIDI0QzIyLjIwOTEgMjQgMjQgMjIuMjA5MSAyNCAyMEMyNCAyMC43OTA5IDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNy43OTA5IDE2IDIwQzE2IDIyLjIwOTEgMTcuNzkwOSAyNCAyMCAyNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg=='}
                  alt={activeRelease.title}
                  className="w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
                />
              </motion.div>

              <div>
                {/* EXPLANATION: Header with title, artist, and main action button */}
                <div className="flex justify-between items-start p-4">
                  <div className="">
                    <motion.h3
                      layoutId={`title-${activeRelease.title}-${id}`}
                      className="font-bold text-neutral-700 dark:text-neutral-200"
                    >
                      {activeRelease.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`artist-${activeRelease.artist_name}-${id}`}
                      className="text-neutral-600 dark:text-neutral-400"
                    >
                      {activeRelease.artist_name}
                    </motion.p>
                  </div>

                  <motion.a
                    layoutId={`button-${activeRelease.title}-${id}`}
                    href={activeRelease.discogs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 text-sm rounded-full font-bold bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    View on Discogs
                  </motion.a>
                </div>

                {/* Tab Navigation - Only show if we have detailed data */}
                {activeRelease.detailed && activeRelease.detailed.tracklist && activeRelease.detailed.tracklist.length > 0 && (
                  <div className="flex border-b border-neutral-200 dark:border-neutral-700 mx-4">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`flex-1 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        activeTab === 'details'
                          ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 -mb-[1px]'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setActiveTab('tracklist')}
                      className={`flex-1 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        activeTab === 'tracklist'
                          ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 -mb-[1px]'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      Tracklist ({activeRelease.detailed.tracklist.length})
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('videos')
                        if (youtubeVideos.length === 0 && !loadingVideos) {
                          // Clean the artist name by removing "Artist Profile: " prefix
                          const cleanArtistName = activeRelease.artist_name.replace(/^Artist Profile:\s*/i, '')
                          fetchYouTubeVideos(cleanArtistName, activeRelease.title)
                        }
                      }}
                      className={`flex-1 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        activeTab === 'videos'
                          ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 -mb-[1px]'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      Videos
                    </button>
                  </div>
                )}

                {/* EXPLANATION: Scrollable content area with detailed information */}
                <div className="relative px-4 pb-4 pt-4">
                  <div className="text-neutral-600 text-xs md:text-sm lg:text-base max-h-[300px] md:max-h-[400px] overflow-auto dark:text-neutral-400 [scrollbar-width:thin] [scrollbar-color:rgb(229,231,235)_transparent] pr-2">
                    {/* EXPLANATION: Show loading, error, or content based on current state */}
                    {loadingDetails ? (
                      <div className="flex items-center justify-center w-full p-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                        <span className="ml-2">Loading details...</span>
                      </div>
                    ) : error ? (
                      <div className="text-red-500 p-4 text-center">
                        <p>Error loading details: {error}</p>
                        <button
                          onClick={() => handleReleaseClick(activeRelease)}
                          className="mt-2 text-blue-500 underline"
                        >
                          Try again
                        </button>
                      </div>
                    ) : activeRelease.detailed ? (
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: activeTab === 'details' ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: activeTab === 'details' ? 10 : -10 }}
                        transition={{ duration: 0.15 }}
                      >
                        {activeTab === 'details' ? (
                          <ReleaseDetailsContent release={activeRelease} showTracklist={false} />
                        ) : activeTab === 'tracklist' ? (
                          <TracklistTab tracklist={activeRelease.detailed.tracklist} />
                        ) : (
                          <YouTubeVideoGrid
                            videos={youtubeVideos}
                            loading={loadingVideos}
                            error={videoError}
                          />
                        )}
                      </motion.div>
                    ) : (
                      <BasicReleaseInfo release={activeRelease} />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* EXPLANATION: Render the children with click handlers */}
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
 * EXPLANATION: Component that displays detailed release information
 * This shows when we've successfully loaded data from the Discogs API
 */
function ReleaseDetailsContent({ release, showTracklist = true }: { release: ReleaseData; showTracklist?: boolean }) {
  const detailed = release.detailed!

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="space-y-3">
        {/* Year and Country Pills */}
        <div className="flex flex-wrap gap-2">
          {release.year && (
            <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium">{release.year}</span>
          )}
          {detailed.country && (
            <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium">{detailed.country}</span>
          )}
        </div>

        {/* Label Information */}
        {detailed.labels.length > 0 && (
          <div className="text-sm">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Label:</span>
            <span className="ml-2 text-neutral-600 dark:text-neutral-400">
              {detailed.labels[0].name}
              {detailed.labels[0].catno && ` (${detailed.labels[0].catno})`}
            </span>
          </div>
        )}

        {/* Format Information */}
        {detailed.formats.length > 0 && (
          <div className="text-sm">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Format:</span>
            <span className="ml-2 text-neutral-600 dark:text-neutral-400">
              {detailed.formats.map(f =>
                f.descriptions?.length ? `${f.name} (${f.descriptions.join(', ')})` : f.name
              ).join(', ')}
            </span>
          </div>
        )}

        {/* Genre and Style Tags */}
        {(detailed.genres.length > 0 || detailed.styles.length > 0) && (
          <div>
            <p className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm mb-2">Genre/Style:</p>
            <div className="flex flex-wrap gap-2">
              {[...detailed.genres, ...detailed.styles].map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tracklist - only show if showTracklist is true */}
      {showTracklist && detailed.tracklist.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Tracklist</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {detailed.tracklist.map((track, index) => (
              <div key={index} className="text-sm flex justify-between">
                <span>
                  {track.position && <span className="font-mono mr-2">{track.position}</span>}
                  {track.title}
                </span>
                {track.duration && (
                  <span className="font-mono text-gray-500">{track.duration}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Release Notes */}
      {detailed.notes && (
        <div>
          <h4 className="font-semibold mb-2">Notes</h4>
          <p className="text-sm whitespace-pre-wrap">{detailed.notes}</p>
        </div>
      )}
    </div>
  )
}

/**
 * EXPLANATION: Dedicated component for the tracklist tab
 * Shows a clean, scannable list of tracks with durations
 */
function TracklistTab({ tracklist }: { tracklist: Array<{ position: string; title: string; duration?: string; artists?: Array<{ name: string }> }> }) {
  if (!tracklist || tracklist.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <p>No tracklist available</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {tracklist.map((track, index) => (
        <div
          key={index}
          className="flex items-start justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
        >
          <div className="flex items-start gap-3 flex-1">
            {/* Track Number */}
            <span className="font-mono text-sm text-neutral-500 dark:text-neutral-500 min-w-[2rem]">
              {track.position || `${index + 1}.`}
            </span>

            {/* Track Title and Artists */}
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {track.title}
              </p>
              {track.artists && track.artists.length > 0 && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {track.artists.map(a => a.name).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Duration */}
          {track.duration && (
            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-500 ml-4">
              {track.duration}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * EXPLANATION: Component that displays basic release information
 * This shows when we haven't loaded detailed data yet
 */
function BasicReleaseInfo({ release }: { release: ReleaseData }) {
  return (
    <div className="space-y-2">
      {release.year && <p><strong>Year:</strong> {release.year}</p>}
      {release.label && <p><strong>Label:</strong> {release.label}</p>}
      {release.discogs_url ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Click to load detailed information from Discogs...</p>
          <a
            href={release.discogs_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
            View on Discogs
          </a>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No additional details available for this release.</p>
      )}
    </div>
  )
}

/**
 * EXPLANATION: Simple close icon component for the mobile close button
 */
export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  )
}