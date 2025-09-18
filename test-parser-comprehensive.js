// Comprehensive test of the playlist parser
// Run with: node test-parser-comprehensive.js

const { parsePlaylistText, generateParseSummary, tracksToDbFormat, tracksToStoryblokFormat } = require('./lib/playlist-parser.ts');

let testsPassed = 0;
let testsFailed = 0;

function test(name, testFn) {
  try {
    console.log(`\n🧪 ${name}`);
    testFn();
    console.log('   ✅ PASSED');
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    testsFailed++;
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toHaveLength: (length) => {
      if (!actual || actual.length !== length) {
        throw new Error(`Expected length ${length}, got ${actual?.length || 'undefined'}`);
      }
    },
    toContain: (substring) => {
      if (!actual.includes(substring)) {
        throw new Error(`Expected "${actual}" to contain "${substring}"`);
      }
    }
  };
}

console.log('🎵 Comprehensive Playlist Parser Tests\n');

// Test 1: Basic parsing without hours
test('Basic parsing without hours', () => {
  const playlist = `
Artist One - Track One
Artist Two - Track Two
Artist Three - Track Three
  `.trim();

  const result = parsePlaylistText(playlist);

  expect(result.tracks).toHaveLength(3);
  expect(result.errors).toHaveLength(0);
  expect(result.warnings).toHaveLength(0);
  expect(result.tracks[0].artist).toBe('Artist One');
  expect(result.tracks[0].track).toBe('Track One');
  expect(result.tracks[0].position).toBe(1);
  expect(result.tracks[0].hour).toBe(null);
});

// Test 2: Parsing with hour markers
test('Parsing with hour markers', () => {
  const playlist = `
HOUR 1
Artist One - Track One
Artist Two - Track Two

HOUR 2
Artist Three - Track Three
  `.trim();

  const result = parsePlaylistText(playlist);

  expect(result.tracks).toHaveLength(3);
  expect(result.hours).toEqual([1, 2]);
  expect(result.tracks[0].hour).toBe(1);
  expect(result.tracks[1].hour).toBe(1);
  expect(result.tracks[2].hour).toBe(2);
});

// Test 3: Error handling for missing separator
test('Error handling for missing separator', () => {
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

// Test 4: Multiple separators
test('Multiple separators handling', () => {
  const playlist = `
Artist One - Track One - Extended Version
Artist - Two - Track - Two
  `.trim();

  const result = parsePlaylistText(playlist);

  expect(result.tracks).toHaveLength(2);
  expect(result.tracks[0].artist).toBe('Artist One');
  expect(result.tracks[0].track).toBe('Track One - Extended Version');
  expect(result.tracks[1].artist).toBe('Artist');
  expect(result.tracks[1].track).toBe('Two - Track - Two');
});

// Test 5: Comments and empty lines
test('Comments and empty lines handling', () => {
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

// Test 6: Database format conversion
test('Database format conversion', () => {
  const playlist = `
HOUR 1
Artist One - Track One
Artist Two - Track Two
  `.trim();

  const result = parsePlaylistText(playlist);
  const dbFormat = tracksToDbFormat(result.tracks);

  expect(dbFormat).toHaveLength(2);
  expect(dbFormat[0]).toEqual({
    position: 1,
    hour: 1,
    artist: 'Artist One',
    track: 'Track One'
  });
});

// Test 7: Storyblok format conversion
test('Storyblok format conversion', () => {
  const playlist = `
HOUR 2
Artist One - Track One
  `.trim();

  const result = parsePlaylistText(playlist);
  const storyblokFormat = tracksToStoryblokFormat(result.tracks);

  expect(storyblokFormat).toHaveLength(1);
  expect(storyblokFormat[0]).toEqual({
    component: 'track',
    _uid: 'track_1',
    position: 1,
    hour: 2,
    artist: 'Artist One',
    track: 'Track One',
    spotify_url: '',
    youtube_url: '',
    discogs_url: ''
  });
});

// Test 8: Parse summary generation
test('Parse summary generation', () => {
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

// Test 9: Custom hour pattern
test('Custom hour pattern', () => {
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

// Test 10: Allow missing track option
test('Allow missing track option', () => {
  const playlist = `
Artist One - Track One
Artist Two No Separator
Artist Three - Track Three
  `.trim();

  const result = parsePlaylistText(playlist, { allowMissingTrack: true });

  expect(result.tracks).toHaveLength(3);
  expect(result.warnings).toHaveLength(1);
  expect(result.tracks[1].artist).toBe('Artist Two No Separator');
  expect(result.tracks[1].track).toBe('');
});

// Final results
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results:`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed! The playlist parser is working perfectly.');
} else {
  console.log('\n⚠️ Some tests failed. Please review the failures above.');
  process.exit(1);
}