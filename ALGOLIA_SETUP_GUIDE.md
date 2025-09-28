# 🚀 COMPLETE ALGOLIA SEARCH SETUP GUIDE

## 📋 OVERVIEW

This guide walks you through setting up powerful search for Rhythm Lab Radio. You'll transform your current generic search results into rich, contextual search with proper titles, show information, and metadata.

**What You're Building:**
- **Archive Tracks Search**: Mixcloud songs with show context, host names, and schedules
- **Live Songs Search**: Spinitron tracks with episode context and real-time information
- **Content Search**: Storyblok blogs, deep dives, and artist profiles with proper titles

---

## 🎯 PHASE 1: ALGOLIA DASHBOARD SETUP

### **Step 1: Create Your Indices**

Log into your Algolia dashboard and create these **3 indices**:

```
rhythm_lab_archive_tracks    (for Mixcloud tracks + show context)
rhythm_lab_live_songs       (for Spinitron live stream songs)
rhythm_lab_content          (for Storyblok content)
```

**How to create indices:**
1. Go to **Search → Indices**
2. Click **"Create Index"**
3. Enter the index name exactly as shown above
4. Repeat for all 3 indices

---

### **Step 2: Configure Search Settings**

For **EACH index**, you need to configure these settings:

#### **A) Searchable Attributes** (Search → Configuration → Searchable Attributes)

**For `rhythm_lab_archive_tracks`:**
```json
[
  "track",
  "artist",
  "show_title",
  "host_name",
  "unordered(show_genres)",
  "unordered(show_tags)",
  "unordered(weekly_schedule)"
]
```

**For `rhythm_lab_live_songs`:**
```json
[
  "song",
  "artist",
  "release",
  "episode_title",
  "unordered(label)"
]
```

**For `rhythm_lab_content`:**
```json
[
  "title",
  "heading",
  "description",
  "content",
  "unordered(tags)",
  "unordered(categories)"
]
```

#### **B) Custom Ranking** (Search → Configuration → Custom Ranking)

**For `rhythm_lab_archive_tracks`:**
```json
["desc(publish_timestamp)", "asc(position)"]
```

**For `rhythm_lab_live_songs`:**
```json
["desc(start_timestamp)", "desc(is_recent)"]
```

**For `rhythm_lab_content`:**
```json
["desc(publish_timestamp)", "desc(word_count)"]
```

#### **C) Facets** (Search → Configuration → Facets)

**For `rhythm_lab_archive_tracks`:**
```json
["show_title", "host_name", "show_genres", "year", "show_type"]
```

**For `rhythm_lab_live_songs`:**
```json
["artist", "episode_title", "label", "year", "is_recent"]
```

**For `rhythm_lab_content`:**
```json
["content_type", "author", "tags", "categories", "year"]
```

---

## 🔧 PHASE 2: ENVIRONMENT SETUP

### **Step 3: Update Your Environment Variables**

Add these to your `.env.local` file:

```env
# Algolia Configuration (you already have app ID and keys)
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=your_search_key
ALGOLIA_ADMIN_API_KEY=your_admin_key

# New index names
ALGOLIA_ARCHIVE_TRACKS_INDEX=rhythm_lab_archive_tracks
ALGOLIA_LIVE_SONGS_INDEX=rhythm_lab_live_songs
ALGOLIA_CONTENT_INDEX=rhythm_lab_content

# Admin token for indexing (you can use any secure string)
NEXT_PUBLIC_ADMIN_TOKEN=your_secure_admin_token_here
```

---

## 📊 PHASE 3: INDEXING YOUR DATA

### **Step 4: Use the Admin Interface**

I've created a beautiful admin interface for you at `/admin/algolia`. Here's how to use it:

1. **Visit**: `http://localhost:3000/admin/algolia` (or your production URL)

2. **You'll see 3 indexing options:**
   - **Archive Tracks**: Indexes mixcloud_tracks + shows + Storyblok show data
   - **Live Songs**: Indexes songs table from Spinitron
   - **Content**: Indexes all Storyblok content (blogs, deep dives, profiles)

3. **Click "Index All Content"** or index each type individually

4. **Watch the progress** - you'll see:
   - ✅ Success messages with counts
   - ❌ Error messages if something fails
   - 🔄 Loading indicators during processing

### **Step 5: What Happens During Indexing**

**Archive Tracks Indexing:**
```
Fetches: mixcloud_tracks → joins with shows → fetches Storyblok show data
Creates: Rich objects with track, artist, show context, host names, schedules
Result: "Deep House Journey" by DJ Pro from Saturday Sessions • Host: DJ Mike
```

**Live Songs Indexing:**
```
Fetches: songs table (Spinitron data)
Creates: Objects with song, artist, episode context, time information
Result: "Jazz Fusion Track" by Live Artist • Live on Morning Show • 2 hours ago
```

**Content Indexing:**
```
Fetches: All Storyblok stories
Creates: Objects with proper titles, descriptions, author info, categories
Result: "The Evolution of Deep House" by Music Journalist • Blog Post • Sept 20, 2025
```

---

## 🎨 PHASE 4: SEARCH INTERFACE IMPROVEMENTS

### **Step 6: Updated Search Experience**

After indexing, your search will show:

**Before:**
```
❌ "ARTIST PROFILES | RHYTHM LAB RADIO"
❌ Generic titles, no context
❌ Missing metadata
```

**After:**
```
🎵 [ARCHIVE TRACK]
"Deep House Journey" by DJ SoulMaster
From Saturday Night Deep Sessions (Hour 2) • Host: DJ Mike
📅 Sept 28, 2025 • 🔗 Spotify | YouTube | Discogs
🎯 Genres: Deep House, Progressive • 📻 Saturdays at 9 PM

🎵 [LIVE SONG]
"Jazz Fusion Track" by Live Artist
Album: Album Name • Label: Record Label
📺 Morning Jazz Show • ⏰ Today 8:15 AM

📄 [BLOG POST]
"The Evolution of Deep House"
by Music Journalist
📅 Sept 20, 2025 • 🏷️ deep house, electronic, history
⏱️ 5 min read
```

---

## 🚀 PHASE 5: DEPLOYMENT & TESTING

### **Step 7: Deploy to Production**

1. **Deploy your changes:**
   ```bash
   vercel --prod
   ```

2. **Update production environment variables** in Vercel dashboard

3. **Test the admin interface** on production:
   - Visit `https://yoursite.com/admin/algolia`
   - Index all content types
   - Verify success messages

### **Step 8: Test Your Search**

1. **Visit your search page**: `https://yoursite.com/search`

2. **Try these test searches:**
   - Artist names (should find both tracks and profiles)
   - Song titles (should show proper track info with show context)
   - Show names (should find both tracks and show pages)
   - Blog topics (should show articles with proper titles)

3. **Verify the improvements:**
   - ✅ Proper titles instead of generic ones
   - ✅ Rich context (show names, hosts, dates)
   - ✅ Multiple content types in results
   - ✅ Relevant metadata and links

---

## 📅 PHASE 6: ONGOING MAINTENANCE

### **When to Re-Index:**

**Daily (Automated - Future Enhancement):**
- Live Songs (after Spinitron sync)

**Weekly:**
- Archive Tracks (after adding new Mixcloud shows)

**As Needed:**
- Content (after publishing new Storyblok content)

### **How to Re-Index:**

1. **Visit** `/admin/algolia`
2. **Click** the relevant index button
3. **Wait** for completion confirmation
4. **Test** search results

---

## 🔍 TROUBLESHOOTING

### **Common Issues:**

**🚨 "Algolia admin client not configured"**
- Check your `ALGOLIA_ADMIN_API_KEY` in environment variables

**🚨 "Index does not exist"**
- Verify you created the indices in Algolia dashboard with exact names

**🚨 "Failed to fetch from database"**
- Check your Supabase connection and table permissions

**🚨 "Storyblok API timeout"**
- Check your Storyblok token and API access

### **Testing Your Setup:**

1. **Check API endpoints directly:**
   ```bash
   curl -X GET http://localhost:3000/api/algolia/index-archive-tracks
   curl -X GET http://localhost:3000/api/algolia/index-live-songs
   curl -X GET http://localhost:3000/api/algolia/index-content
   ```

2. **Verify in Algolia dashboard:**
   - Go to **Search → Indices**
   - Click each index
   - Check **Browse** tab for indexed records
   - Verify record structure matches expected format

---

## ✅ SUCCESS CHECKLIST

- [ ] Created 3 indices in Algolia dashboard
- [ ] Configured searchable attributes for all indices
- [ ] Set up custom ranking for all indices
- [ ] Configured facets for all indices
- [ ] Updated environment variables
- [ ] Successfully indexed archive tracks
- [ ] Successfully indexed live songs
- [ ] Successfully indexed content
- [ ] Deployed to production
- [ ] Tested search with improved results
- [ ] Verified proper titles and context display

---

## 🎉 WHAT YOU'VE ACCOMPLISHED

You now have a **professional-grade search system** that:

✅ **Searches across all your content types** (archive tracks, live songs, content)
✅ **Shows proper titles and context** instead of generic page titles
✅ **Provides rich metadata** (show names, hosts, schedules, dates)
✅ **Includes external links** (Spotify, YouTube, Discogs)
✅ **Supports advanced filtering** by content type, date, artist, etc.
✅ **Delivers instant results** with Algolia's speed
✅ **Scales automatically** as you add more content

Your users can now find exactly what they're looking for with meaningful, contextual search results!