import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getYouTubeTrackData } from '@/lib/youtube/api'
import { verifyAdminAuth } from '@/lib/auth/admin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check admin auth using Clerk
    const authResult = await verifyAdminAuth(request)
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    console.log('🎥 Starting YouTube video caching process...')

    const { limit = 50, offset = 0, source = 'both' } = await request.json().catch(() => ({}))

    // We'll process both archive tracks and live songs
    const tracksToProcess = []

    if (source === 'archive' || source === 'both') {
      // Get archive tracks without YouTube data
      const { data: archiveTracks } = await supabase
        .from('mixcloud_tracks')
        .select('id, track, artist, youtube_url')
        .is('youtube_url', null) // Only tracks without YouTube data
        .range(offset, offset + Math.floor(limit / 2) - 1)
        .order('created_at', { ascending: false })

      if (archiveTracks) {
        tracksToProcess.push(...archiveTracks.map(track => ({
          ...track,
          table: 'mixcloud_tracks',
          song: track.track // Normalize field name
        })))
      }
    }

    if (source === 'live' || source === 'both') {
      // Get live songs without YouTube data
      const { data: liveSongs } = await supabase
        .from('songs')
        .select('id, song, artist, youtube_url')
        .is('youtube_url', null) // Only songs without YouTube data
        .range(offset, offset + Math.floor(limit / 2) - 1)
        .order('start_time', { ascending: false })

      if (liveSongs) {
        tracksToProcess.push(...liveSongs.map(track => ({
          ...track,
          table: 'songs'
        })))
      }
    }

    console.log(`Found ${tracksToProcess.length} tracks to cache YouTube data for`)

    let cachedCount = 0
    let failedCount = 0
    const results = []

    for (const track of tracksToProcess) {
      try {
        const artistName = track.artist || 'Unknown Artist'
        const trackName = (track as any).song || (track as any).track || 'Unknown Track'

        console.log(`🎵 Getting YouTube data for: ${artistName} - ${trackName}`)

        // Get YouTube data using our existing API
        const youtubeData = await getYouTubeTrackData(artistName, trackName)

        if (youtubeData && youtubeData.video) {
          // Update the appropriate table with YouTube data
          const updateData = {
            youtube_url: youtubeData.watchUrl,
            youtube_video_id: youtubeData.videoId,
            youtube_thumbnail: youtubeData.thumbnail,
            youtube_title: youtubeData.video.title,
            youtube_channel: youtubeData.video.channelTitle,
            youtube_duration: youtubeData.video.duration,
            youtube_view_count: youtubeData.video.viewCount,
            youtube_cached_at: new Date().toISOString()
          }

          const { error } = await supabase
            .from(track.table)
            .update(updateData)
            .eq('id', track.id)

          if (error) {
            console.error(`Error updating ${track.table} ${track.id}:`, error)
            failedCount++
          } else {
            console.log(`✅ Cached YouTube data for: ${artistName} - ${trackName}`)
            cachedCount++

            results.push({
              track_id: track.id,
              table: track.table,
              artist: artistName,
              song: trackName,
              youtube_url: youtubeData.watchUrl,
              cached: true
            })
          }
        } else {
          console.log(`❌ No YouTube video found for: ${artistName} - ${trackName}`)

          // Mark as attempted to avoid trying again soon
          const { error } = await supabase
            .from(track.table)
            .update({
              youtube_cached_at: new Date().toISOString()
              // youtube_url stays null to indicate no video found
            })
            .eq('id', track.id)

          if (!error) {
            results.push({
              track_id: track.id,
              table: track.table,
              artist: artistName,
              song: trackName,
              youtube_url: null,
              cached: false
            })
          }

          failedCount++
        }

        // Small delay to respect YouTube rate limits
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (err) {
        console.error(`Error processing track ${track.id}:`, err)
        failedCount++
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        tracks_processed: tracksToProcess.length,
        successfully_cached: cachedCount,
        failed_or_not_found: failedCount,
        offset,
        limit,
        source
      },
      next_batch: {
        offset: offset + limit,
        limit,
        source
      },
      sample_results: results.slice(0, 5),
      message: `Successfully cached YouTube data for ${cachedCount} out of ${tracksToProcess.length} tracks.`
    })

  } catch (error) {
    console.error('YouTube caching error:', error)
    return NextResponse.json({
      error: 'Failed to cache YouTube videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get counts from database
    const [
      { count: totalArchiveTracks },
      { count: archiveWithYoutube },
      { count: totalLiveSongs },
      { count: liveWithYoutube }
    ] = await Promise.all([
      supabase.from('mixcloud_tracks').select('*', { count: 'exact', head: true }),
      supabase.from('mixcloud_tracks').select('*', { count: 'exact', head: true }).not('youtube_url', 'is', null),
      supabase.from('songs').select('*', { count: 'exact', head: true }),
      supabase.from('songs').select('*', { count: 'exact', head: true }).not('youtube_url', 'is', null)
    ])

    return NextResponse.json({
      status: 'ready',
      current_data: {
        archive_tracks: {
          total: totalArchiveTracks || 0,
          with_youtube: archiveWithYoutube || 0,
          progress: `${archiveWithYoutube || 0}/${totalArchiveTracks || 0}`
        },
        live_songs: {
          total: totalLiveSongs || 0,
          with_youtube: liveWithYoutube || 0,
          progress: `${liveWithYoutube || 0}/${totalLiveSongs || 0}`
        },
        overall_progress: `${(archiveWithYoutube || 0) + (liveWithYoutube || 0)}/${(totalArchiveTracks || 0) + (totalLiveSongs || 0)}`
      },
      endpoints: {
        cache_archive_tracks: 'POST /api/cache-youtube-videos { source: "archive", limit: 50, offset: 0 }',
        cache_live_songs: 'POST /api/cache-youtube-videos { source: "live", limit: 50, offset: 0 }',
        cache_both: 'POST /api/cache-youtube-videos { source: "both", limit: 50, offset: 0 }'
      },
      features: [
        'Caches YouTube video data to avoid API rate limits',
        'Works with both archive tracks and live songs',
        'Stores video URL, thumbnail, title, channel, duration, and view count',
        'Respects YouTube rate limits with delays',
        'Marks attempted tracks to avoid re-processing failures'
      ],
      instructions: 'Use POST with admin token to cache YouTube data in batches. Run this regularly to build up your YouTube cache.'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get YouTube caching status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}