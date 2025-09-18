// Test the playlist parser with sample data
// Run with: node test-playlist-parser.js

const { parsePlaylistText, generateParseSummary, tracksToDbFormat } = require('./lib/playlist-parser.ts');

// Sample playlist text (typical radio show format)
const samplePlaylist = `
HOUR 1
Bonobo - Black Sands
Thievery Corporation - Lebanese Blonde
Nujabes - Aruarian Dance
Emancipator - Soon It Will Be Cold Enough

HOUR 2
RJD2 - Ghostwriter
Blockhead - The Music Scene
Prefuse 73 - One Word Extinguisher
Boards of Canada - Roygbiv

# Some comments and empty lines

HOUR 3
Tycho - A Walk
Helios - Halving the Compass
Kiasmos - Blurred EP
Nils Frahm - Says
`.trim();

console.log('🎵 Testing Playlist Parser\n');

try {
  const result = parsePlaylistText(samplePlaylist);

  console.log('📊 Parse Results:');
  console.log(generateParseSummary(result));
  console.log('');

  console.log('🎧 Parsed Tracks:');
  result.tracks.forEach((track, index) => {
    console.log(`  ${track.position}. [Hour ${track.hour}] ${track.artist} - ${track.track}`);
  });
  console.log('');

  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach(error => console.log(`  ${error}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️ Warnings:');
    result.warnings.forEach(warning => console.log(`  ${warning}`));
    console.log('');
  }

  console.log('🗃️ Database Format Sample (first 3 tracks):');
  const dbFormat = tracksToDbFormat(result.tracks);
  console.log(JSON.stringify(dbFormat.slice(0, 3), null, 2));

  console.log('\n✅ Parser test completed successfully!');

} catch (error) {
  console.error('❌ Parser test failed:', error.message);
  process.exit(1);
}