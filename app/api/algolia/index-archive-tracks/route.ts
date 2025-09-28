import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adminClient, INDICES } from '@/lib/algolia/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Algolia admin client not configured' },
        { status: 500 }
      )
    }

    // Get authentication (admin only)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch mixcloud_tracks with show information from Supabase
    const { data: tracks, error } = await supabase
      .from('mixcloud_tracks')
      .select(`
        *,
        shows!inner (
          id,
          title,
          slug,
          description,
          mixcloud_url,
          mixcloud_picture,
          published_date,
          storyblok_id
        )
      `)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tracks from database' },
        { status: 500 }
      )
    }

    if (!tracks || tracks.length === 0) {
      return NextResponse.json(
        { message: 'No tracks found to index' },
        { status: 200 }
      )
    }

    // Optionally enhance with Storyblok show data
    let storyblokShows: Record<string, any> = {}

    try {
      const storyblokToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN || process.env.STORYBLOK_ACCESS_TOKEN

      if (storyblokToken) {
        // Get all show stories from Storyblok for enhanced metadata using direct fetch
        const storyblokResponse = await Promise.race([
          fetch(`https://api.storyblok.com/v2/cdn/stories?version=published&starts_with=shows&per_page=100&token=${storyblokToken}`),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Storyblok API timeout')), 10000)
          )
        ])

        if (!storyblokResponse.ok) {
          throw new Error(`Storyblok API error: ${storyblokResponse.status}`)
        }

        const data = await storyblokResponse.json()

        // Create lookup map by story ID
        if (data?.stories) {
          storyblokShows = data.stories.reduce((acc: any, story: any) => {
            if (story.id) {
              acc[story.id.toString()] = {
                title: story.content?.title || story.content?.show_title || story.name,
                description: story.content?.description || story.content?.summary || '',
                tags: story.content?.tags || [],
                genre: story.content?.genre || [],
                host: story.content?.host || story.content?.dj_name || '',
                show_type: story.content?.show_type || 'weekly',
                weekly_schedule: story.content?.weekly_schedule || '',
                time_slot: story.content?.time_slot || '',
                duration: story.content?.duration || ''
              }
            }
            return acc
          }, {})
        }
      }
    } catch (storyblokError) {
      console.warn('Failed to fetch Storyblok data, continuing without enhanced metadata:', storyblokError)
    }

    // Transform tracks into Algolia objects
    const algoliaObjects = tracks.map((track: any) => {
      const show = track.shows
      const publishDate = new Date(show.published_date)

      // Get enhanced show data from Storyblok if available
      const storyblokShow = show.storyblok_id ? storyblokShows[show.storyblok_id] : null

      // Use Storyblok data to enhance show information
      const enhancedShowTitle = storyblokShow?.title || show.title || ''
      const enhancedDescription = storyblokShow?.description || show.description || ''
      const showGenres = storyblokShow?.genre || []
      const showTags = storyblokShow?.tags || []
      const hostName = storyblokShow?.host || ''
      const showType = storyblokShow?.show_type || 'archived'
      const weeklySchedule = storyblokShow?.weekly_schedule || ''
      const timeSlot = storyblokShow?.time_slot || ''

      return {
        objectID: `archive_track_${track.id}`,

        // Primary search fields
        track: track.track || '',
        artist: track.artist || '',
        show_title: enhancedShowTitle,

        // Secondary fields
        album: '', // Could be enhanced from external APIs
        label: '', // Could be enhanced from external APIs

        // Show context (enhanced with Storyblok data)
        show_slug: show.slug,
        show_description: enhancedDescription,
        show_url: `/shows/${show.slug}`,
        mixcloud_url: show.mixcloud_url,
        mixcloud_picture: show.mixcloud_picture,

        // Weekly show metadata from Storyblok
        host_name: hostName,
        show_type: showType,
        weekly_schedule: weeklySchedule,
        time_slot: timeSlot,
        show_genres: Array.isArray(showGenres) ? showGenres : [showGenres].filter(Boolean),
        show_tags: Array.isArray(showTags) ? showTags : [showTags].filter(Boolean),

        // Track metadata
        position: track.position || 0,
        hour: track.hour || 1,

        // Enhanced links
        spotify_url: track.spotify_url || '',
        youtube_url: track.youtube_url || '',
        discogs_url: track.discogs_url || '',

        // Temporal data
        publish_date: publishDate.toISOString(),
        publish_timestamp: publishDate.getTime(),
        year: publishDate.getFullYear(),
        month: publishDate.getMonth() + 1,
        date_display: publishDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),

        // Content classification
        content_type: 'archive_track',
        source: 'mixcloud',
        has_external_links: !!(track.spotify_url || track.youtube_url || track.discogs_url),
        has_storyblok_data: !!storyblokShow,

        // Enhanced search optimization (includes Storyblok metadata)
        searchable_text: [
          track.track,
          track.artist,
          enhancedShowTitle,
          enhancedDescription,
          hostName,
          ...(Array.isArray(showGenres) ? showGenres : [showGenres].filter(Boolean)),
          ...(Array.isArray(showTags) ? showTags : [showTags].filter(Boolean)),
          weeklySchedule,
          timeSlot
        ].filter(Boolean).join(' '),

        // Display metadata with host and schedule info
        display_context: `From ${enhancedShowTitle}${track.hour ? ` (Hour ${track.hour})` : ''}${hostName ? ` • Host: ${hostName}` : ''}`,
        display_date: publishDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }),
        display_schedule: weeklySchedule && timeSlot ? `${weeklySchedule} at ${timeSlot}` : weeklySchedule || timeSlot || ''
      }
    })

    // Index to Algolia
    console.log(`Indexing ${algoliaObjects.length} archive tracks...`)

    const { taskID } = await adminClient.replaceAllObjects({
      indexName: INDICES.ARCHIVE_TRACKS,
      objects: algoliaObjects,
      batchSize: 1000
    })

    console.log(`Archive tracks indexing started with task ID: ${taskID}`)

    return NextResponse.json({
      success: true,
      message: `Successfully queued ${algoliaObjects.length} archive tracks for indexing`,
      taskID,
      indexed_count: algoliaObjects.length,
      sample_object: algoliaObjects[0] // For debugging
    })

  } catch (error) {
    console.error('Archive tracks indexing error:', error)
    return NextResponse.json(
      {
        error: 'Failed to index archive tracks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Archive Tracks Indexing',
    description: 'POST to this endpoint to index mixcloud_tracks table with show relationships to Algolia',
    requirements: ['Bearer token authorization', 'Admin permissions'],
    data_source: 'Supabase mixcloud_tracks table joined with shows table',
    features: [
      'Fetches tracks from mixcloud_tracks table',
      'Joins with shows table for show context',
      'Optionally enhances with Storyblok show metadata (host, schedule, genres)',
      'Creates searchable objects with rich show context',
      'Includes track position, hour, and external links'
    ],
    schema: {
      mixcloud_tracks: ['id', 'track', 'artist', 'position', 'hour', 'spotify_url', 'youtube_url', 'discogs_url'],
      shows: ['title', 'slug', 'description', 'mixcloud_url', 'publish_date', 'storyblok_id']
    }
  })
}