# YouTube Video Caching - Plain English Guide

## 🚨 The Problem

**Why you keep hitting the 10,000 rate limit so fast:**

1. **YouTube's Quota System:**
   - You get 10,000 "quota points" per day
   - Each video search costs 100 points
   - **That's only 100 searches per day!**

2. **What's Been Happening:**
   - Every time someone views a track, the app searches YouTube
   - If 100 different tracks are viewed = quota exhausted
   - No caching = same video searched over and over

## ✅ The Solution - Database Caching

**How it works:**
1. Search YouTube ONCE for each track
2. Save the results in your database
3. Next time = read from database (NO API call!)
4. Videos stay available forever

## 📝 Setup Steps

### Step 1: Add Database Columns

Run this SQL in your Supabase dashboard:

```bash
# The migration file is already created at:
supabase/migrations/add_youtube_caching_columns.sql
```

**To apply it:**
1. Go to Supabase Dashboard
2. SQL Editor
3. Copy/paste the contents of `add_youtube_caching_columns.sql`
4. Click "Run"

### Step 2: Build Your YouTube Cache

**Option A: Using the Admin API**

```bash
# Cache 50 tracks at a time
curl -X POST https://www.rhythmlabradio.com/api/cache-youtube-videos \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source": "both", "limit": 50, "offset": 0}'
```

**Option B: Create an Admin Page** (Recommended)

I can create a simple admin page where you:
1. Click "Cache YouTube Videos"
2. See progress bar
3. Track how many videos are cached

### Step 3: Monitor Your Cache

**Check status:**
```bash
curl https://www.rhythmlabradio.com/api/cache-youtube-videos
```

**Response shows:**
- Total tracks: 421
- Tracks with YouTube videos: X
- Progress percentage

## 🎯 Best Practices

### Smart Caching Strategy

**Daily Quota = 100 searches**

Run caching in batches:
- **Day 1:** Cache 50 tracks (leaves 50 quota for live searches)
- **Day 2:** Cache next 50 tracks
- **Day 3:** Cache next 50 tracks
- Continue until all tracks are cached

### What Gets Cached

For each track, we save:
- ✅ Video URL
- ✅ Video ID
- ✅ Thumbnail image
- ✅ Video title
- ✅ Channel name
- ✅ Duration
- ✅ View count
- ✅ Cache timestamp

### Handling New Tracks

When new tracks are added:
1. They won't have YouTube data yet
2. Run caching API to fill them in
3. Takes 1 day per 100 new tracks

## 🔍 Why This Happens

**YouTube API Quota Costs:**
- Search = 100 points
- Video details = 1 point
- Playlist items = 1 point

**Your app mainly uses search** (the expensive one!)

## 📊 Current Status Check

To see how many videos you have cached:

```bash
GET /api/cache-youtube-videos
```

Returns:
```json
{
  "current_data": {
    "archive_tracks": {
      "total": 421,
      "with_youtube": 0,
      "progress": "0/421"
    },
    "live_songs": {
      "total": X,
      "with_youtube": 0,
      "progress": "0/X"
    }
  }
}
```

## 🛠️ Troubleshooting

### "No videos showing up"
- **Cause:** Database columns missing
- **Fix:** Run the migration SQL

### "Still hitting rate limit"
- **Cause:** Not enough tracks cached yet
- **Fix:** Run caching in batches over multiple days

### "Some videos not found"
- **Normal!** Not every track has a YouTube video
- These are marked with `youtube_cached_at` timestamp but `youtube_url` stays null
- Won't be searched again (saves quota)

## 📈 Long-term Benefits

Once fully cached:
1. **Zero API calls** for existing tracks
2. **Instant video loading** (no API delay)
3. **Consistent experience** (videos don't disappear)
4. **Save your quota** for new tracks only

## 🎉 Next Steps

1. **Run the database migration**
2. **Cache 50 tracks per day** until complete
3. **Monitor progress** weekly
4. **Re-cache failed tracks** occasionally (some videos might appear later)

---

**Questions?**
- Check API status: `GET /api/cache-youtube-videos`
- Monitor quota: Console logs show daily usage
- Need help: Email digital@radiomilwaukee.org
