# Mixcloud to Storyblok Sync Setup

## Required Environment Variables

Add these to your `.env.local` (development) and Vercel environment settings (production):

```bash
# Storyblok Management API (required for creating/updating stories)
STORYBLOK_MANAGEMENT_TOKEN=your_management_token_here
STORYBLOK_SPACE_ID=your_space_id_here

# Optional: Storyblok folder organization
STORYBLOK_SHOWS_FOLDER_ID=12345  # ID of the /shows/ folder in Storyblok

# Existing required variables (should already be configured)
NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN=your_content_api_token
STORYBLOK_REGION=eu  # or 'us' if your space is in US
```

## How to Get Storyblok Management Token

1. Go to your Storyblok space → **Settings** → **Access Tokens**
2. Click **"Generate new token"**
3. Select **Management API** scope
4. Copy the token and add to environment variables

## How to Find Your Space ID

1. In Storyblok, look at the URL when you're in your space
2. URL format: `https://app.storyblok.com/#!/me/spaces/[SPACE_ID]/dashboard`
3. Copy the SPACE_ID number from the URL

## How to Find Shows Folder ID (Optional)

1. In Storyblok, navigate to your **Content** section
2. Create or find the `/shows/` folder
3. Click on the folder
4. Look at the URL: `https://app.storyblok.com/#!/me/spaces/[SPACE_ID]/stories/0/0/[FOLDER_ID]`
5. Copy the FOLDER_ID number

## How It Works

1. **User uploads** show to Mixcloud via admin interface
2. **After successful upload**, system calls `/api/mixcloud/create-show`
3. **API endpoint**:
   - Creates show record in Supabase database
   - Parses playlist text into structured track data
   - Creates Storyblok story with proper Blocks format
   - Links database record to Storyblok story ID

## Storyblok Content Structure

The sync creates stories with this structure:

```json
{
  "component": "mixcloud_show",
  "title": "Show Title",
  "description": "Show description...",
  "mixcloud_url": "https://www.mixcloud.com/rhythmlab/show-name/",
  "mixcloud_embed": "<iframe>...</iframe>",
  "mixcloud_picture": "https://...",
  "published_date": "2024-01-15 14:30",
  "tracklist": [
    {
      "component": "track",
      "_uid": "abc12345",
      "position": 1,
      "hour": 1,
      "artist": "Artist Name",
      "track": "Song Title",
      "spotify_url": "",
      "youtube_url": "",
      "discogs_url": ""
    }
  ],
  "show_id": "uuid-from-database"
}
```

## Error Handling

- If Mixcloud upload succeeds but Storyblok sync fails, show is still saved to database
- Admin interface shows sync status
- Manual sync option available via `/api/mixcloud/sync` endpoint
- Detailed error messages logged for debugging