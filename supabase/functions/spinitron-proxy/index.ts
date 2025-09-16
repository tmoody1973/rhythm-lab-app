import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const spinitronApiKey = Deno.env.get('SPINITRON_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !spinitronApiKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request parameters
    let body;
    if (req.method === 'POST') {
      body = await req.json();
    } else {
      const url = new URL(req.url);
      body = Object.fromEntries(url.searchParams);
    }

    const endpoint = body.endpoint || 'spins';
    const count = body.count || '20';
    const start = body.start || '';
    const end = body.end || '';
    const search = body.search || '';
    const useCache = body.use_cache !== 'false'; // Default to true

    console.log('Request parameters:', { endpoint, search, useCache, count, start, end });

    // Get station configuration
    const { data: stationConfig, error: configError } = await supabase
      .from('station_config')
      .select('*')
      .single();

    if (configError || !stationConfig) {
      console.error('Station config not found:', configError);
      return new Response(
        JSON.stringify({ error: 'Station configuration not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const stationId = stationConfig.station_id; // 'rlr-main'

    // If search is provided, search the database first
    if (search) {
      console.log('Searching database for:', search);

      let query = supabase
        .from('songs')
        .select('*')
        .eq('station_id', stationId)
        .order('start_time', { ascending: false });

      // Apply date filters
      if (start) {
        query = query.gte('start_time', start);
      }
      if (end) {
        query = query.lte('start_time', end);
      }

      // Search in song, artist, and release fields
      const searchTerm = `%${search}%`;
      query = query.or(`song.ilike.${searchTerm},artist.ilike.${searchTerm},release.ilike.${searchTerm}`);

      const countNum = parseInt(count);
      query = query.limit(countNum);

      const { data: cachedSongs, error: dbError } = await query;

      if (!dbError && cachedSongs && cachedSongs.length > 0) {
        console.log('Found cached songs:', cachedSongs.length);

        const transformedSongs = cachedSongs.map(song => ({
          id: song.spinitron_id,
          start: song.start_time,
          duration: song.duration || 180,
          song: song.song,
          artist: song.artist,
          release: song.release,
          label: song.label,
          image: song.image,
          episode: song.episode_title ? { title: song.episode_title } : undefined
        }));

        return new Response(
          JSON.stringify({ items: transformedSongs }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        );
      }

      console.log('No search results in database, trying Spinitron API');
    }

    // Check database cache first (if not searching and cache is enabled)
    if (useCache && !search) {
      console.log('Checking database cache');

      let query = supabase
        .from('songs')
        .select('*')
        .eq('station_id', stationId)
        .order('start_time', { ascending: false });

      // Apply date filters
      if (start) {
        query = query.gte('start_time', start);
      }
      if (end) {
        query = query.lte('start_time', end);
      }

      const countNum = parseInt(count);
      query = query.limit(countNum);

      const { data: cachedSongs, error: dbError } = await query;

      if (!dbError && cachedSongs && cachedSongs.length > 0) {
        console.log('Returning cached data:', cachedSongs.length, 'songs');

        const transformedSongs = cachedSongs.map(song => ({
          id: song.spinitron_id,
          start: song.start_time,
          duration: song.duration || 180,
          song: song.song,
          artist: song.artist,
          release: song.release,
          label: song.label,
          image: song.image,
          episode: song.episode_title ? { title: song.episode_title } : undefined
        }));

        return new Response(
          JSON.stringify({ items: transformedSongs }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=30'
            }
          }
        );
      }
    }

    // Fetch from Spinitron API
    let spinitronUrl = `${stationConfig.spinitron_base_url}/${endpoint}`;
    const apiParams = new URLSearchParams();

    apiParams.append('station', stationId);
    apiParams.append('count', count);
    if (start) apiParams.append('start', start);
    if (end) apiParams.append('end', end);
    if (search) apiParams.append('search', search);

    spinitronUrl += `?${apiParams.toString()}`;

    console.log('Fetching from Spinitron API:', spinitronUrl);

    const response = await fetch(spinitronUrl, {
      headers: {
        'Authorization': `Bearer ${spinitronApiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Spinitron API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch from Spinitron API',
          status: response.status
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('Fetched from API:', data.items?.length || 0, 'items');

    // Store new songs in database (upsert to avoid duplicates)
    if (data.items && data.items.length > 0) {
      console.log('Storing songs in database');

      const songsToStore = data.items.map((item: any) => ({
        spinitron_id: item.id,
        song: item.song || 'Unknown Song',
        artist: item.artist || 'Unknown Artist',
        release: item.release || null,
        label: item.label || null,
        image: item.image || null,
        start_time: item.start,
        duration: item.duration || 180,
        episode_title: item.episode?.title || null,
        station_id: stationId
      }));

      const { error: insertError } = await supabase
        .from('songs')
        .upsert(songsToStore, {
          onConflict: 'spinitron_id',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('Error storing songs:', insertError);
      } else {
        console.log('Successfully stored', songsToStore.length, 'songs');
      }
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60'
        }
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});