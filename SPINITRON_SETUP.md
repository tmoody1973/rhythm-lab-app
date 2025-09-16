# Spinitron Integration Setup Guide

This guide explains how to set up the Spinitron API integration for real-time "Now Playing" data in the Rhythm Lab Radio app.

## Overview

The Spinitron integration provides:
- **Real-time "Now Playing"** - Current song information
- **Song history** - Recent tracks played
- **Playlist data** - Show information
- **Automatic database sync** - Keeps local database updated
- **Live stream status** - Updates live status in UI

## Environment Variables

Add these to your `.env.local` file:

```env
# Spinitron API Configuration
SPINITRON_API_KEY=your_spinitron_api_key_here
SPINITRON_STATION_ID=rlr-main

# Optional: Override default Spinitron API URL
# SPINITRON_API_URL=https://spinitron.com/api
```

### Getting Your Spinitron API Key

1. Log into your [Spinitron account](https://spinitron.com/)
2. Go to Settings > API
3. Generate a new API key
4. Copy the key to your `.env.local` file

## Architecture

### Components

1. **Spinitron Client** (`/lib/spinitron/client.ts`)
   - Handles API requests to Spinitron
   - Transforms data for our database format
   - Includes error handling and rate limiting

2. **Sync Service** (`/lib/spinitron/sync.ts`)
   - Syncs Spinitron data to local database
   - Updates live stream status
   - Handles batch operations and cleanup

3. **API Routes**
   - `/api/spinitron/current` - Get current song
   - `/api/spinitron/sync` - Manual sync operations
   - `/api/live-stream` - Live stream status

4. **React Components**
   - `NowPlaying` - Reusable now playing widget
   - `LiveStreamSection` - Main homepage live section (updated)

### Database Integration

Spinitron data is stored in these tables:
- `songs` - Real-time song data from Spinitron
- `stations` - Station configuration
- `live_stream` - Current live stream status

## API Endpoints

### GET /api/live-stream
Returns current live stream status and current song.

```json
{
  "success": true,
  "liveStream": {
    "is_live": true,
    "current_track_title": "Weightless",
    "current_track_artist": "Marconi Union",
    "current_show_title": "Ambient Soundscapes",
    "listeners_count": 247
  },
  "currentSong": {
    "id": "uuid",
    "song": "Weightless",
    "artist": "Marconi Union",
    "release": "Weightless",
    "start_time": "2025-01-15T20:30:00Z"
  }
}
```

### POST /api/spinitron/current
Forces sync of current song from Spinitron.

### POST /api/spinitron/sync
Performs various sync operations:

```json
{
  "operation": "full", // "current", "recent", "live-stream", "full"
  "hours": 24 // For "recent" operation
}
```

## Usage Examples

### Manual Sync
```bash
# Sync current song
curl -X POST http://localhost:3000/api/spinitron/current

# Full sync (current + recent + live stream)
curl -X POST http://localhost:3000/api/spinitron/sync \
  -H "Content-Type: application/json" \
  -d '{"operation": "full"}'

# Sync last 12 hours of songs
curl -X POST http://localhost:3000/api/spinitron/sync \
  -H "Content-Type: application/json" \
  -d '{"operation": "recent", "hours": 12}'
```

### Using the NowPlaying Component
```tsx
import { NowPlaying } from '@/components/now-playing'

// Basic usage
<NowPlaying />

// With custom settings
<NowPlaying
  className="my-custom-class"
  showControls={true}
  autoRefresh={true}
  refreshInterval={30000}
/>
```

### Database Queries
```typescript
import { getCurrentlyPlaying, getRecentSongs } from '@/lib/database/queries'

// Get current song from database
const currentSong = await getCurrentlyPlaying('rlr-main')

// Get recent songs
const recentSongs = await getRecentSongs('rlr-main', 10)
```

## Automation

The integration includes several automation features:

### Auto-refresh
- Live components refresh every 30 seconds
- Configurable refresh intervals
- Graceful error handling

### Database Cleanup
```typescript
// Clean up songs older than 30 days
await spinitronSync.cleanupOldSongs(30)
```

### Health Monitoring
```bash
# Check sync health
curl http://localhost:3000/api/spinitron/sync
```

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - Verify `SPINITRON_API_KEY` is set correctly
   - Check Spinitron account API permissions
   - Test API key with curl:
   ```bash
   curl "https://spinitron.com/api/spins?access-token=YOUR_KEY&count=1"
   ```

2. **No Data Syncing**
   - Check database migrations are run
   - Verify station ID matches Spinitron
   - Check API rate limits

3. **Live Stream Not Updating**
   - Ensure live_stream table has data
   - Check if sync service is running
   - Verify API routes are working

### Debugging

Enable debug logging by setting:
```env
DEBUG=spinitron:*
```

Check browser console for client-side errors.

## Performance

### Caching
- Database acts as cache for Spinitron data
- API responses cached for 30 seconds
- Automatic stale data cleanup

### Rate Limiting
- Respects Spinitron API rate limits
- Implements exponential backoff
- Batches requests when possible

## Security

- API key stored securely in environment variables
- RLS policies protect database access
- User permissions for manual song additions

## Development

### Testing Without Spinitron
Use the sample data migrations to test functionality:

```sql
-- Run migration 005 for sample Spinitron data
-- Visit /test-db to verify data is loaded
```

### Mock API for Development
If you don't have a Spinitron API key, the client will gracefully fall back to sample data from the database.

## Production Deployment

1. Set environment variables in production
2. Run all database migrations
3. Set up monitoring for sync health
4. Configure log aggregation
5. Test API endpoints

### Monitoring
- Monitor `/api/spinitron/sync` health endpoint
- Set up alerts for sync failures
- Track API usage against Spinitron limits

## Next Steps

Future enhancements could include:
- Real-time WebSocket updates
- Artist/song recognition and metadata enhancement
- Integration with Spotify/Apple Music APIs
- Analytics and listening statistics
- Automated show scheduling