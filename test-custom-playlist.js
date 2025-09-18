// Test with your own playlist data
// Run with: node test-custom-playlist.js

const { parsePlaylistText, generateParseSummary } = require('./lib/playlist-parser.ts');

// Replace this with your actual playlist text
const yourPlaylist = `
HOUR 1
Artist Name - Track Title
Another Artist - Another Track

HOUR 2
Third Artist - Third Track
Fourth Artist - Fourth Track
`;

console.log('🎵 Testing Your Custom Playlist\n');

const result = parsePlaylistText(yourPlaylist);

console.log('📊 Results:');
console.log(generateParseSummary(result));
console.log('\n🎧 Parsed Tracks:');
result.tracks.forEach(track => {
  console.log(`  ${track.position}. [Hour ${track.hour}] ${track.artist} - ${track.track}`);
});

if (result.errors.length > 0) {
  console.log('\n❌ Errors:');
  result.errors.forEach(error => console.log(`  ${error}`));
}

if (result.warnings.length > 0) {
  console.log('\n⚠️ Warnings:');
  result.warnings.forEach(warning => console.log(`  ${warning}`));
}

console.log('\n✅ Test complete!');