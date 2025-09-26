/**
 * Track Enhancement Service
 * Orchestrates YouTube and Discogs API calls to enhance track data
 */

import { searchYouTubeVideo, batchSearchYouTubeVideos, getYouTubeQuotaStatus, type YouTubeSearchResult } from './youtube'
import { searchDiscogsArtist, batchSearchDiscogsArtists, getDiscogsRateLimitStatus, normalizeArtistName, type DiscogsArtistResult } from './discogs'

export interface TrackData {
  id?: string
  artist: string
  trackName: string
  youtubeUrl?: string
  discogsUrl?: string
}

export interface EnhancedTrackData extends TrackData {
  youtubeResult?: YouTubeSearchResult | null
  discogsResult?: DiscogsArtistResult | null
  enhancementStatus: {
    youtube: 'success' | 'failed' | 'skipped'
    discogs: 'success' | 'failed' | 'skipped'
  }
}

export interface TrackEnhancementOptions {
  enableYouTube?: boolean
  enableDiscogs?: boolean
  skipExisting?: boolean // Skip tracks that already have YouTube/Discogs URLs
  maxConcurrent?: number
  onProgress?: (completed: number, total: number, currentTrack: string, status: string) => void
  onQuotaWarning?: (service: 'youtube' | 'discogs', status: any) => void
}

export interface TrackEnhancementResult {
  tracks: EnhancedTrackData[]
  summary: {
    total: number
    youtubeFound: number
    discogsFound: number
    youtubeSkipped: number
    discogsSkipped: number
    youtubeFailed: number
    discogsFailed: number
  }
  quotaUsage: {
    youtube: ReturnType<typeof getYouTubeQuotaStatus>
    discogs: ReturnType<typeof getDiscogsRateLimitStatus>
  }
}

/**
 * Enhance a single track with YouTube and Discogs data
 */
export async function enhanceTrack(
  track: TrackData,
  options: TrackEnhancementOptions = {}
): Promise<EnhancedTrackData> {
  const {
    enableYouTube = true,
    enableDiscogs = true,
    skipExisting = true
  } = options

  const enhancedTrack: EnhancedTrackData = {
    ...track,
    enhancementStatus: {
      youtube: 'skipped',
      discogs: 'skipped'
    }
  }

  // YouTube enhancement
  if (enableYouTube) {
    if (skipExisting && track.youtubeUrl) {
      enhancedTrack.enhancementStatus.youtube = 'skipped'
    } else {
      try {
        const youtubeResult = await searchYouTubeVideo(track.artist, track.trackName)
        if (youtubeResult) {
          enhancedTrack.youtubeResult = youtubeResult
          enhancedTrack.youtubeUrl = youtubeResult.videoUrl
          enhancedTrack.enhancementStatus.youtube = 'success'
        } else {
          enhancedTrack.enhancementStatus.youtube = 'failed'
        }
      } catch (error) {
        console.error(`[Track Enhancement] YouTube search failed for ${track.artist} - ${track.trackName}:`, error)
        enhancedTrack.enhancementStatus.youtube = 'failed'
      }
    }
  }

  // Discogs enhancement
  if (enableDiscogs) {
    if (skipExisting && track.discogsUrl) {
      enhancedTrack.enhancementStatus.discogs = 'skipped'
    } else {
      try {
        const normalizedArtist = normalizeArtistName(track.artist)
        const discogsResult = await searchDiscogsArtist(normalizedArtist)
        if (discogsResult) {
          enhancedTrack.discogsResult = discogsResult
          enhancedTrack.discogsUrl = discogsResult.discogsUrl
          enhancedTrack.enhancementStatus.discogs = 'success'
        } else {
          enhancedTrack.enhancementStatus.discogs = 'failed'
        }
      } catch (error) {
        console.error(`[Track Enhancement] Discogs search failed for ${track.artist}:`, error)
        enhancedTrack.enhancementStatus.discogs = 'failed'
      }
    }
  }

  return enhancedTrack
}

/**
 * Enhance multiple tracks with YouTube and Discogs data
 */
export async function enhanceTracksBatch(
  tracks: TrackData[],
  options: TrackEnhancementOptions = {}
): Promise<TrackEnhancementResult> {
  const {
    enableYouTube = true,
    enableDiscogs = true,
    skipExisting = true,
    onProgress,
    onQuotaWarning
  } = options

  console.log(`[Track Enhancement] Starting batch enhancement for ${tracks.length} tracks`)
  console.log(`[Track Enhancement] YouTube: ${enableYouTube ? 'enabled' : 'disabled'}, Discogs: ${enableDiscogs ? 'enabled' : 'disabled'}`)

  const enhancedTracks: EnhancedTrackData[] = []

  // Initialize summary counters
  const summary = {
    total: tracks.length,
    youtubeFound: 0,
    discogsFound: 0,
    youtubeSkipped: 0,
    discogsSkipped: 0,
    youtubeFailed: 0,
    discogsFailed: 0
  }

  // Filter tracks based on skipExisting option
  const tracksToProcess = {
    youtube: enableYouTube ? tracks.filter(track => !skipExisting || !track.youtubeUrl) : [],
    discogs: enableDiscogs ? tracks.filter(track => !skipExisting || !track.discogsUrl) : []
  }

  // Count skipped tracks
  if (skipExisting) {
    summary.youtubeSkipped = enableYouTube ? tracks.filter(track => track.youtubeUrl).length : 0
    summary.discogsSkipped = enableDiscogs ? tracks.filter(track => track.discogsUrl).length : 0
  }

  let completed = 0

  // Process YouTube enhancements
  let youtubeResults: any[] = []
  if (enableYouTube && tracksToProcess.youtube.length > 0) {
    if (onProgress) {
      onProgress(completed, tracks.length, 'Starting YouTube search...', 'youtube')
    }

    youtubeResults = await batchSearchYouTubeVideos(
      tracksToProcess.youtube.map(track => ({
        artist: track.artist,
        trackName: track.trackName,
        id: track.id
      })),
      (ytCompleted, ytTotal, currentTrack) => {
        if (onProgress) {
          onProgress(completed + ytCompleted, tracks.length, currentTrack, 'youtube')
        }
      }
    )

    completed += tracksToProcess.youtube.length

    // Check quota and warn if getting low
    const youtubeQuota = getYouTubeQuotaStatus()
    if (youtubeQuota.percentageUsed > 80 && onQuotaWarning) {
      onQuotaWarning('youtube', youtubeQuota)
    }
  }

  // Process Discogs enhancements
  let discogsResults: any[] = []
  if (enableDiscogs && tracksToProcess.discogs.length > 0) {
    if (onProgress) {
      onProgress(completed, tracks.length, 'Starting Discogs search...', 'discogs')
    }

    // Get unique artists to avoid duplicate API calls
    const uniqueArtists = Array.from(new Set(tracksToProcess.discogs.map(track => track.artist.toLowerCase())))
    const artistsToSearch = uniqueArtists.map(artist => ({
      artist,
      id: undefined
    }))

    discogsResults = await batchSearchDiscogsArtists(
      artistsToSearch,
      (discogsCompleted, discogsTotal, currentArtist) => {
        if (onProgress) {
          onProgress(completed + discogsCompleted, tracks.length, currentArtist, 'discogs')
        }
      }
    )
  }

  // Combine results with original tracks
  for (const track of tracks) {
    const enhancedTrack: EnhancedTrackData = {
      ...track,
      enhancementStatus: {
        youtube: 'skipped',
        discogs: 'skipped'
      }
    }

    // Map YouTube results
    if (enableYouTube) {
      if (skipExisting && track.youtubeUrl) {
        enhancedTrack.enhancementStatus.youtube = 'skipped'
      } else {
        const youtubeResult = youtubeResults.find(result =>
          result.artist === track.artist && result.trackName === track.trackName
        )

        if (youtubeResult?.youtubeResult) {
          enhancedTrack.youtubeResult = youtubeResult.youtubeResult
          enhancedTrack.youtubeUrl = youtubeResult.youtubeResult.videoUrl
          enhancedTrack.enhancementStatus.youtube = 'success'
          summary.youtubeFound++
        } else {
          enhancedTrack.enhancementStatus.youtube = 'failed'
          summary.youtubeFailed++
        }
      }
    }

    // Map Discogs results
    if (enableDiscogs) {
      if (skipExisting && track.discogsUrl) {
        enhancedTrack.enhancementStatus.discogs = 'skipped'
      } else {
        const discogsResult = discogsResults.find(result =>
          result.artist.toLowerCase() === track.artist.toLowerCase()
        )

        // Debug logging to see what's happening
        console.log(`[Track Enhancement] Looking for artist: "${track.artist}"`)
        console.log(`[Track Enhancement] Found result:`, discogsResult ? 'YES' : 'NO')
        if (discogsResult) {
          console.log(`[Track Enhancement] Result has discogsResult property:`, discogsResult.discogsResult ? 'YES' : 'NO')
          if (discogsResult.discogsResult) {
            console.log(`[Track Enhancement] Discogs URL:`, discogsResult.discogsResult.discogsUrl)
          }
        }

        // FIX: Check discogsResult.discogsResult (not discogsResult.discogsResult.discogsResult)
        if (discogsResult && discogsResult.discogsResult) {
          enhancedTrack.discogsResult = discogsResult.discogsResult
          enhancedTrack.discogsUrl = discogsResult.discogsResult.discogsUrl
          enhancedTrack.enhancementStatus.discogs = 'success'
          summary.discogsFound++
        } else {
          enhancedTrack.enhancementStatus.discogs = 'failed'
          summary.discogsFailed++
        }
      }
    }

    enhancedTracks.push(enhancedTrack)
  }

  if (onProgress) {
    onProgress(tracks.length, tracks.length, 'Enhancement completed', 'completed')
  }

  const result: TrackEnhancementResult = {
    tracks: enhancedTracks,
    summary,
    quotaUsage: {
      youtube: getYouTubeQuotaStatus(),
      discogs: getDiscogsRateLimitStatus()
    }
  }

  console.log('[Track Enhancement] Batch enhancement completed:', {
    total: summary.total,
    youtubeSuccess: summary.youtubeFound,
    discogsSuccess: summary.discogsFound,
    youtubeQuota: result.quotaUsage.youtube.percentageUsed.toFixed(1) + '%'
  })

  return result
}

/**
 * Convert enhanced track data back to the format expected by the database/Storyblok
 */
export function formatEnhancedTracksForStorage(enhancedTracks: EnhancedTrackData[]): Array<{
  id?: string
  artist: string
  trackName: string
  youtubeUrl: string | null
  discogsUrl: string | null
}> {
  return enhancedTracks.map(track => ({
    id: track.id,
    artist: track.artist,
    trackName: track.trackName,
    youtubeUrl: track.youtubeUrl || null,
    discogsUrl: track.discogsUrl || null
  }))
}

/**
 * Get enhancement statistics for a set of tracks
 */
export function getEnhancementStats(enhancedTracks: EnhancedTrackData[]): {
  total: number
  withYouTube: number
  withDiscogs: number
  withBoth: number
  enhancementPercentage: number
} {
  const total = enhancedTracks.length
  const withYouTube = enhancedTracks.filter(track => track.youtubeUrl).length
  const withDiscogs = enhancedTracks.filter(track => track.discogsUrl).length
  const withBoth = enhancedTracks.filter(track => track.youtubeUrl && track.discogsUrl).length

  const enhancementPercentage = total > 0 ? ((withYouTube + withDiscogs) / (total * 2)) * 100 : 0

  return {
    total,
    withYouTube,
    withDiscogs,
    withBoth,
    enhancementPercentage: Math.round(enhancementPercentage * 100) / 100
  }
}

/**
 * Check if API quotas are available for enhancement
 */
export async function checkEnhancementQuotas(): Promise<{
  youtube: { available: boolean; remaining: number; message: string }
  discogs: { available: boolean; remaining: number; message: string }
}> {
  const youtubeQuota = getYouTubeQuotaStatus()
  const discogsStatus = getDiscogsRateLimitStatus()

  return {
    youtube: {
      available: youtubeQuota.estimatedRequestsRemaining > 0,
      remaining: youtubeQuota.estimatedRequestsRemaining,
      message: youtubeQuota.estimatedRequestsRemaining > 0
        ? `${youtubeQuota.estimatedRequestsRemaining} searches remaining today`
        : 'Daily quota exceeded. Reset at midnight PT.'
    },
    discogs: {
      available: discogsStatus.requestCount < discogsStatus.maxRequestsPerMinute,
      remaining: discogsStatus.maxRequestsPerMinute - discogsStatus.requestCount,
      message: discogsStatus.requestCount < discogsStatus.maxRequestsPerMinute
        ? `${discogsStatus.maxRequestsPerMinute - discogsStatus.requestCount} requests remaining this minute`
        : 'Rate limit reached. Please wait a moment.'
    }
  }
}