/**
 * Playlist Parser for Mixcloud Importer
 *
 * Parses playlist text input from radio shows and extracts structured track data.
 * Handles hour markers, artist-track separation, and various edge cases.
 */

export interface ParsedTrack {
  position: number;
  hour: number | null;
  artist: string;
  track: string;
  raw: string; // Original line for debugging
}

export interface PlaylistParseResult {
  tracks: ParsedTrack[];
  totalTracks: number;
  hours: number[];
  errors: string[];
  warnings: string[];
}

export interface ParserOptions {
  /** Whether to skip lines that don't contain " - " separator */
  skipInvalidLines?: boolean;
  /** Whether to treat single words as artist names (track will be empty) */
  allowMissingTrack?: boolean;
  /** Custom hour marker regex pattern */
  hourPattern?: RegExp;
  /** Whether to trim whitespace from artist/track names */
  trimWhitespace?: boolean;
}

const DEFAULT_OPTIONS: Required<ParserOptions> = {
  skipInvalidLines: true,
  allowMissingTrack: false,
  hourPattern: /^HOUR\s+(\d+)/i,
  trimWhitespace: true
};

/**
 * Parse playlist text into structured track data
 */
export function parsePlaylistText(
  playlistText: string,
  options: ParserOptions = {}
): PlaylistParseResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines = playlistText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const tracks: ParsedTrack[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const hours: Set<number> = new Set();

  let currentHour: number | null = null;
  let position = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check for hour markers
    const hourMatch = line.match(opts.hourPattern);
    if (hourMatch) {
      const hourNumber = parseInt(hourMatch[1], 10);
      if (isNaN(hourNumber) || hourNumber < 1) {
        errors.push(`Invalid hour number "${hourMatch[1]}" on line ${lineNumber}`);
      } else {
        currentHour = hourNumber;
        hours.add(hourNumber);
      }
      continue;
    }

    // Skip empty lines and comments (lines starting with #)
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Parse track line
    const trackResult = parseTrackLine(line, position, currentHour, opts);

    if (trackResult.error) {
      errors.push(`Line ${lineNumber}: ${trackResult.error}`);
      if (!opts.skipInvalidLines) {
        // Still add the track but mark it as problematic
        tracks.push({
          position,
          hour: currentHour,
          artist: 'PARSE_ERROR',
          track: line,
          raw: line
        });
        position++;
      }
    } else if (trackResult.warning) {
      warnings.push(`Line ${lineNumber}: ${trackResult.warning}`);
      if (trackResult.track) {
        tracks.push(trackResult.track);
        position++;
      }
    } else if (trackResult.track) {
      tracks.push(trackResult.track);
      position++;
    }
  }

  return {
    tracks,
    totalTracks: tracks.length,
    hours: Array.from(hours).sort((a, b) => a - b),
    errors,
    warnings
  };
}

interface TrackParseResult {
  track?: ParsedTrack;
  error?: string;
  warning?: string;
}

/**
 * Parse a single track line
 */
function parseTrackLine(
  line: string,
  position: number,
  hour: number | null,
  options: Required<ParserOptions>
): TrackParseResult {
  // Find the first occurrence of " - " to split artist and track
  const separatorIndex = line.indexOf(' - ');

  if (separatorIndex === -1) {
    if (options.allowMissingTrack) {
      // Treat the entire line as the artist name
      return {
        track: {
          position,
          hour,
          artist: options.trimWhitespace ? line.trim() : line,
          track: '',
          raw: line
        },
        warning: `No track separator found, treating as artist name only`
      };
    } else {
      return {
        error: `Missing track separator " - " in line: "${line}"`
      };
    }
  }

  let artist = line.substring(0, separatorIndex);
  let track = line.substring(separatorIndex + 3); // Skip " - "

  if (options.trimWhitespace) {
    artist = artist.trim();
    track = track.trim();
  }

  // Validation
  if (!artist) {
    return {
      error: `Empty artist name in line: "${line}"`
    };
  }

  if (!track) {
    if (options.allowMissingTrack) {
      return {
        track: {
          position,
          hour,
          artist,
          track: '',
          raw: line
        },
        warning: `Empty track name after separator`
      };
    } else {
      return {
        error: `Empty track name in line: "${line}"`
      };
    }
  }

  return {
    track: {
      position,
      hour,
      artist,
      track,
      raw: line
    }
  };
}

/**
 * Convert parsed tracks to database format
 */
export function tracksToDbFormat(tracks: ParsedTrack[]): Array<{
  position: number;
  hour: number | null;
  artist: string;
  track: string;
}> {
  return tracks.map(track => ({
    position: track.position,
    hour: track.hour,
    artist: track.artist,
    track: track.track
  }));
}

/**
 * Convert parsed tracks to Storyblok blocks format
 */
export function tracksToStoryblokFormat(tracks: ParsedTrack[]) {
  return tracks.map(track => ({
    component: 'track',
    _uid: `track_${track.position}`,
    position: track.position,
    hour: track.hour,
    artist: track.artist,
    track: track.track,
    spotify_url: '',
    youtube_url: '',
    discogs_url: ''
  }));
}

/**
 * Convert parsed tracks to Mixcloud API format
 * Mixcloud expects sections-X-artist and sections-X-song fields
 */
export function tracksToMixcloudFormat(tracks: ParsedTrack[]): Record<string, string> {
  const mixcloudData: Record<string, string> = {};

  tracks.forEach((track, index) => {
    // Mixcloud uses 0-based indexing for sections
    mixcloudData[`sections-${index}-artist`] = track.artist;
    mixcloudData[`sections-${index}-song`] = track.track;
  });

  return mixcloudData;
}

/**
 * Generate a summary of the parsing results
 */
export function generateParseSummary(result: PlaylistParseResult): string {
  const { tracks, hours, errors, warnings } = result;

  let summary = `Parsed ${tracks.length} tracks`;

  if (hours.length > 0) {
    summary += ` across ${hours.length} hour(s) (${hours.join(', ')})`;
  }

  if (errors.length > 0) {
    summary += `\n❌ ${errors.length} error(s)`;
  }

  if (warnings.length > 0) {
    summary += `\n⚠️ ${warnings.length} warning(s)`;
  }

  return summary;
}