import {
  parsePlaylistText,
  tracksToDbFormat,
  tracksToStoryblokFormat,
  generateParseSummary
} from '../playlist-parser';

describe('Playlist Parser', () => {
  describe('Basic parsing', () => {
    test('parses simple playlist without hours', () => {
      const playlist = `
Artist One - Track One
Artist Two - Track Two
Artist Three - Track Three
      `.trim();

      const result = parsePlaylistText(playlist);

      expect(result.tracks).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);

      expect(result.tracks[0]).toEqual({
        position: 1,
        hour: null,
        artist: 'Artist One',
        track: 'Track One',
        raw: 'Artist One - Track One'
      });

      expect(result.tracks[2]).toEqual({
        position: 3,
        hour: null,
        artist: 'Artist Three',
        track: 'Track Three',
        raw: 'Artist Three - Track Three'
      });
    });

    test('parses playlist with hour markers', () => {
      const playlist = `
HOUR 1
Artist One - Track One
Artist Two - Track Two

HOUR 2
Artist Three - Track Three
Artist Four - Track Four
      `.trim();

      const result = parsePlaylistText(playlist);

      expect(result.tracks).toHaveLength(4);
      expect(result.hours).toEqual([1, 2]);
      expect(result.errors).toHaveLength(0);

      expect(result.tracks[0].hour).toBe(1);
      expect(result.tracks[1].hour).toBe(1);
      expect(result.tracks[2].hour).toBe(2);
      expect(result.tracks[3].hour).toBe(2);

      expect(result.tracks[2]).toEqual({
        position: 3,
        hour: 2,
        artist: 'Artist Three',
        track: 'Track Three',
        raw: 'Artist Three - Track Three'
      });
    });

    test('handles mixed case hour markers', () => {
      const playlist = `
hour 1
Artist One - Track One
HOUR 2
Artist Two - Track Two
Hour 3
Artist Three - Track Three
      `.trim();

      const result = parsePlaylistText(playlist);

      expect(result.tracks).toHaveLength(3);
      expect(result.hours).toEqual([1, 2, 3]);
      expect(result.tracks[0].hour).toBe(1);
      expect(result.tracks[1].hour).toBe(2);
      expect(result.tracks[2].hour).toBe(3);
    });
  });

  describe('Edge cases and error handling', () => {
    test('handles missing separator gracefully', () => {
      const playlist = `
Artist One - Track One
Artist Two No Separator
Artist Three - Track Three
      `.trim();

      const result = parsePlaylistText(playlist);

      expect(result.tracks).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Missing track separator');
    });

    test('allows missing track with option', () => {
      const playlist = `
Artist One - Track One
Artist Two No Separator
Artist Three - Track Three
      `.trim();

      const result = parsePlaylistText(playlist, { allowMissingTrack: true });

      expect(result.tracks).toHaveLength(3);
      expect(result.warnings).toHaveLength(1);
      expect(result.tracks[1]).toEqual({
        position: 2,
        hour: null,
        artist: 'Artist Two No Separator',
        track: '',
        raw: 'Artist Two No Separator'
      });
    });

    test('handles empty artist names', () => {
      const playlist = `
Artist One - Track One
 - Track Two
Artist Three - Track Three
      `.trim();

      const result = parsePlaylistText(playlist);

      expect(result.tracks).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Empty artist name');
    });

    test('handles empty track names', () => {
      const playlist = `
Artist One - Track One
Artist Two -
Artist Three - Track Three
      `.trim();

      const result = parsePlaylistText(playlist);

      expect(result.tracks).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Empty track name');
    });

    test('handles multiple separators correctly', () => {
      const playlist = `
Artist One - Track One - Extended Version
Artist - Two - Track - Two
      `.trim();

      const result = parsePlaylistText(playlist);

      expect(result.tracks).toHaveLength(2);
      expect(result.tracks[0]).toEqual({
        position: 1,
        hour: null,
        artist: 'Artist One',
        track: 'Track One - Extended Version',
        raw: 'Artist One - Track One - Extended Version'
      });

      expect(result.tracks[1]).toEqual({
        position: 2,
        hour: null,
        artist: 'Artist',
        track: 'Two - Track - Two',
        raw: 'Artist - Two - Track - Two'
      });
    });

    test('handles whitespace properly', () => {
      const playlist = `
   Artist One   -   Track One
  Artist Two-Track Two
      `.trim();

      const result = parsePlaylistText(playlist);

      expect(result.tracks).toHaveLength(2);
      expect(result.tracks[0]).toEqual({
        position: 1,
        hour: null,
        artist: 'Artist One',
        track: 'Track One',
        raw: 'Artist One   -   Track One'
      });
    });

    test('skips comments and empty lines', () => {
      const playlist = `
# This is a comment
Artist One - Track One

# Another comment
Artist Two - Track Two

      `.trim();

      const result = parsePlaylistText(playlist);

      expect(result.tracks).toHaveLength(2);
      expect(result.tracks[0].artist).toBe('Artist One');
      expect(result.tracks[1].artist).toBe('Artist Two');
    });

    test('handles invalid hour numbers', () => {
      const playlist = `
HOUR 0
Artist One - Track One
HOUR abc
Artist Two - Track Two
HOUR -1
Artist Three - Track Three
      `.trim();

      const result = parsePlaylistText(playlist);

      expect(result.tracks).toHaveLength(3);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0]).toContain('Invalid hour number "0"');
      expect(result.errors[1]).toContain('Invalid hour number "abc"');
      expect(result.errors[2]).toContain('Invalid hour number "-1"');

      // All tracks should have null hour due to invalid markers
      expect(result.tracks.every(track => track.hour === null)).toBe(true);
    });
  });

  describe('Output formatters', () => {
    test('converts to database format', () => {
      const playlist = `
HOUR 1
Artist One - Track One
Artist Two - Track Two
      `.trim();

      const result = parsePlaylistText(playlist);
      const dbFormat = tracksToDbFormat(result.tracks);

      expect(dbFormat).toEqual([
        {
          position: 1,
          hour: 1,
          artist: 'Artist One',
          track: 'Track One'
        },
        {
          position: 2,
          hour: 1,
          artist: 'Artist Two',
          track: 'Track Two'
        }
      ]);
    });

    test('converts to Storyblok format', () => {
      const playlist = `
HOUR 2
Artist One - Track One
      `.trim();

      const result = parsePlaylistText(playlist);
      const storyblokFormat = tracksToStoryblokFormat(result.tracks);

      expect(storyblokFormat).toEqual([
        {
          component: 'track',
          _uid: 'track_1',
          position: 1,
          hour: 2,
          artist: 'Artist One',
          track: 'Track One',
          spotify_url: '',
          youtube_url: '',
          discogs_url: ''
        }
      ]);
    });

    test('generates parse summary', () => {
      const playlist = `
HOUR 1
Artist One - Track One
Artist Two - Track Two
HOUR 2
Artist Three - Track Three
      `.trim();

      const result = parsePlaylistText(playlist);
      const summary = generateParseSummary(result);

      expect(summary).toContain('Parsed 3 tracks');
      expect(summary).toContain('across 2 hour(s) (1, 2)');
    });

    test('generates summary with errors and warnings', () => {
      const playlist = `
Artist One - Track One
Artist Two No Separator
 - Empty Artist
      `.trim();

      const result = parsePlaylistText(playlist, { allowMissingTrack: true });
      const summary = generateParseSummary(result);

      expect(summary).toContain('Parsed 2 tracks');
      expect(summary).toContain('❌ 1 error(s)');
      expect(summary).toContain('⚠️ 1 warning(s)');
    });
  });

  describe('Custom options', () => {
    test('respects custom hour pattern', () => {
      const playlist = `
SET 1
Artist One - Track One
SET 2
Artist Two - Track Two
      `.trim();

      const result = parsePlaylistText(playlist, {
        hourPattern: /^SET\s+(\d+)/i
      });

      expect(result.tracks).toHaveLength(2);
      expect(result.hours).toEqual([1, 2]);
      expect(result.tracks[0].hour).toBe(1);
      expect(result.tracks[1].hour).toBe(2);
    });

    test('handles skipInvalidLines option', () => {
      const playlist = `
Artist One - Track One
Invalid Line No Separator
Artist Two - Track Two
      `.trim();

      const resultSkip = parsePlaylistText(playlist, { skipInvalidLines: true });
      const resultNoSkip = parsePlaylistText(playlist, { skipInvalidLines: false });

      expect(resultSkip.tracks).toHaveLength(2);
      expect(resultNoSkip.tracks).toHaveLength(3);
      expect(resultNoSkip.tracks[1].artist).toBe('PARSE_ERROR');
    });
  });
});