# Database Setup Guide - Rhythm Lab Radio

This guide will help you set up the Supabase database for the Rhythm Lab Radio application.

## Prerequisites

1. Supabase account and project created
2. Environment variables configured in `.env.local`
3. Supabase CLI installed (optional, for local development)

## Database Schema Overview

The database includes the following main tables:

### Core Tables
- **profiles** - User profiles (extends auth.users)
- **shows** - Radio show episodes
- **tracks** - Individual songs from shows
- **blog_posts** - Blog content
- **artist_profiles** - Featured artists
- **deep_dives** - Long-form content

### Supporting Tables
- **user_favorites** - User saved content
- **listening_history** - User listening analytics
- **news_ticker** - Dynamic ticker content
- **live_stream** - Live stream status

### Spinitron Integration Tables
- **stations** - Radio stations configuration
- **songs** - Real-time song data from Spinitron API

## Setup Instructions

### Step 1: Run Migrations

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the migration files in order:

#### Migration 1: Initial Schema
```sql
-- Copy and paste content from supabase/migrations/001_initial_schema.sql
```

#### Migration 2: RLS Policies
```sql
-- Copy and paste content from supabase/migrations/002_rls_policies.sql
```

#### Migration 3: Sample Data (Optional)
```sql
-- Copy and paste content from supabase/migrations/003_sample_data.sql
```

#### Migration 4: Spinitron Tables
```sql
-- Copy and paste content from supabase/migrations/004_spinitron_tables.sql
```

#### Migration 5: Spinitron Sample Data (Optional)
```sql
-- Copy and paste content from supabase/migrations/005_spinitron_sample_data.sql
```

### Step 2: Verify Setup

1. Visit `/test-db` in your application
2. Check that the database connection works
3. Verify sample data is loaded correctly

### Step 3: Configure Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Ensure "Enable email confirmations" is configured as needed
3. Set up any OAuth providers if required

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **Public content** (shows, published blog posts, artist profiles) - readable by everyone
- **User content** (favorites, listening history) - only accessible by the owner
- **Admin content** - only accessible by admin users
- **Draft content** - only accessible by authors

### Admin Users

Admin users are identified by:
- Email domain: `@rhythmlabradio.com`
- Or specific admin email in the `is_admin()` function

To make a user admin, update the function in migration 002 or manually grant admin privileges.

## Database Relationships

```
auth.users (Supabase)
  ↓ (1:1)
profiles
  ↓ (1:many)
blog_posts, deep_dives (as author)

shows
  ↓ (1:many)
tracks

users
  ↓ (many:many via user_favorites)
shows, blog_posts, artist_profiles, deep_dives

users
  ↓ (1:many)
listening_history
```

## Environment Variables Required

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API Usage Examples

### Fetching Shows
```typescript
import { getAllShows, getFeaturedShows } from '@/lib/database/queries'

// Get all published shows
const shows = await getAllShows()

// Get featured shows only
const featured = await getFeaturedShows()
```

### User Favorites
```typescript
import { addToFavorites, getUserFavorites } from '@/lib/database/queries'

// Add a show to favorites (requires authentication)
await addToFavorites('show', showId)

// Get user's favorites
const favorites = await getUserFavorites('show')
```

### Spinitron Integration
```typescript
import { getCurrentlyPlaying, getRecentSongs, addManualSong } from '@/lib/database/queries'

// Get currently playing song
const currentSong = await getCurrentlyPlaying('rlr-main')

// Get recent songs from station
const recentSongs = await getRecentSongs('rlr-main', 10)

// Add manual song (requires authentication)
await addManualSong({
  song: 'Song Title',
  artist: 'Artist Name',
  release: 'Album Name',
  station_id: 'rlr-main',
  start_time: new Date().toISOString()
})
```

### Search
```typescript
import { searchContent } from '@/lib/database/queries'

// Search across all content types
const results = await searchContent('jazz fusion')
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check RLS policies are correctly set up
   - Verify user authentication status
   - Ensure admin function is configured for admin operations

2. **Migration Errors**
   - Run migrations in the correct order
   - Check for syntax errors in SQL
   - Verify all required extensions are enabled

3. **Connection Issues**
   - Verify environment variables are correct
   - Check Supabase project status
   - Ensure database is not paused

### Testing Database

Use the test page at `/test-db` to verify:
- Database connection works
- Sample data is loaded
- Queries return expected results
- No permission errors

## Performance Considerations

The schema includes indexes on commonly queried fields:
- Show dates (for chronological ordering)
- Featured content flags
- Published status
- User IDs for personal content

## Next Steps

After database setup:
1. Test all database operations
2. Set up real content (replace sample data)
3. Configure admin users
4. Set up database backups
5. Monitor query performance
6. Remove the test page (`/test-db`) before production