// Spinitron sync service to update database with live data

import { createClient } from '@supabase/supabase-js'
import { spinitronClient } from './client'
import type { TransformedSong } from './types'
import type { Song } from '@/lib/database/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class SpinitrondSyncService {
  private supabase

  constructor() {
    this.supabase = supabase
  }

  // Sync current playing song
  async syncCurrentSong(): Promise<Song | null> {
    if (!spinitronClient) {
      console.warn('Spinitron client not available')
      return null
    }

    try {
      const transformedSong = await spinitronClient.getTransformedCurrentSpin()

      if (!transformedSong) {
        console.log('No current song from Spinitron')
        return null
      }

      // Check if song already exists
      const { data: existingSong } = await this.supabase
        .from('songs')
        .select('*')
        .eq('spinitron_id', transformedSong.spinitron_id)
        .single()

      if (existingSong) {
        console.log('Song already exists in database:', existingSong.song)
        return existingSong as Song
      }

      // Insert new song
      const { data: newSong, error } = await this.supabase
        .from('songs')
        .insert([{
          spinitron_id: transformedSong.spinitron_id,
          song: transformedSong.song,
          artist: transformedSong.artist,
          release: transformedSong.release,
          label: transformedSong.label,
          image: transformedSong.image,
          start_time: transformedSong.start_time,
          duration: transformedSong.duration,
          episode_title: transformedSong.episode_title,
          station_id: transformedSong.station_id,
          enhanced_metadata: transformedSong.enhanced_metadata,
          is_manual: false
        }])
        .select()
        .single()

      if (error) {
        console.error('Failed to insert song:', error)
        return null
      }

      console.log('Synced new song:', newSong.song, 'by', newSong.artist)
      return newSong as Song
    } catch (error) {
      console.error('Failed to sync current song:', error)
      return null
    }
  }

  // Sync recent songs (batch sync)
  async syncRecentSongs(hours: number = 24): Promise<Song[]> {
    if (!spinitronClient) {
      console.warn('Spinitron client not available')
      return []
    }

    try {
      const transformedSongs = await spinitronClient.getTransformedRecentSpins(50, hours)

      if (transformedSongs.length === 0) {
        console.log('No recent songs from Spinitron')
        return []
      }

      const syncedSongs: Song[] = []

      // Process songs in batches to avoid overwhelming the database
      for (const transformedSong of transformedSongs) {
        try {
          // Check if song already exists
          const { data: existingSong } = await this.supabase
            .from('songs')
            .select('*')
            .eq('spinitron_id', transformedSong.spinitron_id)
            .single()

          if (existingSong) {
            syncedSongs.push(existingSong as Song)
            continue
          }

          // Insert new song
          const { data: newSong, error } = await this.supabase
            .from('songs')
            .insert([{
              spinitron_id: transformedSong.spinitron_id,
              song: transformedSong.song,
              artist: transformedSong.artist,
              release: transformedSong.release,
              label: transformedSong.label,
              image: transformedSong.image,
              start_time: transformedSong.start_time,
              duration: transformedSong.duration,
              episode_title: transformedSong.episode_title,
              station_id: transformedSong.station_id,
              enhanced_metadata: transformedSong.enhanced_metadata,
              is_manual: false
            }])
            .select()
            .single()

          if (!error && newSong) {
            syncedSongs.push(newSong as Song)
            console.log('Synced song:', newSong.song, 'by', newSong.artist)
          }
        } catch (songError) {
          console.error('Failed to sync individual song:', songError)
        }
      }

      console.log(`Synced ${syncedSongs.length} songs from Spinitron`)
      return syncedSongs
    } catch (error) {
      console.error('Failed to sync recent songs:', error)
      return []
    }
  }

  // Update live stream status with current song
  async updateLiveStreamStatus(): Promise<void> {
    try {
      const currentSong = await this.syncCurrentSong()

      if (!currentSong) {
        console.log('No current song to update live stream status')
        return
      }

      // Get current playlist info if available
      let currentShowTitle = currentSong.episode_title || 'Live Show'

      if (spinitronClient) {
        const playlist = await spinitronClient.getCurrentPlaylist()
        if (playlist) {
          currentShowTitle = playlist.episode_name || currentShowTitle
        }
      }

      // Update live stream table
      const { error } = await this.supabase
        .from('live_stream')
        .update({
          current_track_title: currentSong.song,
          current_track_artist: currentSong.artist,
          current_show_title: currentShowTitle,
          is_live: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await this.supabase.from('live_stream').select('id').limit(1).single()).data?.id)

      if (error) {
        console.error('Failed to update live stream status:', error)
      } else {
        console.log('Updated live stream status:', currentSong.song, 'by', currentSong.artist)
      }
    } catch (error) {
      console.error('Failed to update live stream status:', error)
    }
  }

  // Full sync operation
  async performFullSync(): Promise<{
    currentSong: Song | null
    recentSongs: Song[]
    liveStreamUpdated: boolean
  }> {
    console.log('Starting Spinitron full sync...')

    const [currentSong, recentSongs] = await Promise.all([
      this.syncCurrentSong(),
      this.syncRecentSongs(24)
    ])

    let liveStreamUpdated = false
    try {
      await this.updateLiveStreamStatus()
      liveStreamUpdated = true
    } catch (error) {
      console.error('Failed to update live stream during full sync:', error)
    }

    console.log('Spinitron full sync completed:', {
      currentSong: currentSong ? `${currentSong.song} by ${currentSong.artist}` : 'None',
      recentSongsCount: recentSongs.length,
      liveStreamUpdated
    })

    return {
      currentSong,
      recentSongs,
      liveStreamUpdated
    }
  }

  // Clean up old songs (optional - to prevent database bloat)
  async cleanupOldSongs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await this.supabase
        .from('songs')
        .delete()
        .lt('start_time', cutoffDate)
        .eq('is_manual', false) // Only delete auto-synced songs, keep manual ones
        .select('id')

      if (error) {
        console.error('Failed to cleanup old songs:', error)
        return 0
      }

      const deletedCount = data?.length || 0
      console.log(`Cleaned up ${deletedCount} old songs`)
      return deletedCount
    } catch (error) {
      console.error('Failed to cleanup old songs:', error)
      return 0
    }
  }
}

// Export singleton instance
export const spinitronSync = new SpinitrondSyncService()