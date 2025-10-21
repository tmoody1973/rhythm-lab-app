# Thesys C1 Integration - Development Journal
## Rhythm Lab Radio AI-Powered Music Discovery

**Project Start Date:** October 8, 2025
**Developer:** Tarik Moody
**Project Goal:** Integrate Thesys C1 Generative UI to create interactive, AI-powered music discovery experiences

---

## 📋 Project Overview

We're building 5 major AI-powered features that transform Rhythm Lab Radio into an interactive music discovery platform:

1. **Interactive Music Discovery Assistant** - Conversational music recommendations
2. **Artist Deep Dive Explorer** - Interactive artist profile exploration
3. **Event & Live Show Finder** - Live event discovery with Ticketmaster + web search
4. **Smart Album/Release Explorer** - Conversational discography browsing
5. **Personalized Playlist Generator** - Multi-platform streaming playlist creation
6. **Artist Connection Graph** - Visual artist relationship mapping

---

## 🔌 Understanding C1's Data Access Model

**IMPORTANT:** Thesys C1 works through **function calling (tools)** - it doesn't directly access your databases or the internet. Here's how it works:

### How C1 Accesses Data:

1. **Your Backend Creates Tools** - You define functions that C1 can call
   ```typescript
   // Example: Tool that searches Storyblok
   const tools = [{
     name: "searchArtists",
     description: "Search for artists by genre, mood, or name",
     parameters: { genre: "string", mood: "string" }
   }]
   ```

2. **User Asks Question** → C1 decides which tool to call
   - User: "Find me chill jazz artists"
   - C1 thinks: "I should call searchArtists with genre='jazz' and mood='chill'"

3. **Your Server Executes the Tool** → Returns data to C1
   - Your backend queries Storyblok
   - Returns artist data as JSON
   - C1 receives the data

4. **C1 Generates Interactive UI** with that data
   - Creates artist cards, filters, etc.
   - Returns UI components to your frontend

### Data Sources Flow:

```
User Question
    ↓
Thesys C1 API (decides what data is needed)
    ↓
Your Backend Tools (you build these):
    ├── searchStoryblok() → Queries Storyblok
    ├── searchSupabase() → Queries Supabase
    ├── searchWeb() → Calls Tavily/Perplexity API
    ├── searchTicketmaster() → Calls Ticketmaster API
    └── searchSpotify() → Calls Spotify API
    ↓
Data returned to C1
    ↓
C1 generates interactive UI
    ↓
Your frontend renders the UI
```

### You Will Build These Tool Categories:

**1. Content Tools** (Storyblok)
- `searchArtists(query, genres, mood)`
- `getArtistProfile(artistId)`
- `getRelatedArtists(artistId)`
- `searchBlogPosts(topic)`

**2. User Data Tools** (Supabase)
- `getUserFavorites(userId)`
- `saveToFavorites(userId, artistId)`
- `getUserListeningHistory(userId)`
- `savePlaylist(userId, playlist)`

**3. Web Search Tools** (Tavily/Perplexity)
- `searchWebForArtistInfo(artistName)`
- `findEventReviews(eventName, venue)`
- `searchMusicNews(topic, dateRange)`
- `getVenueInformation(venueName, city)`

**4. Event Tools** (Ticketmaster)
- `searchUpcomingEvents(city, genre, dateRange)`
- `getEventDetails(eventId)`
- `getArtistTourDates(artistName)`

**5. Streaming Tools** (Spotify, YouTube, etc.)
- `searchTrackOnSpotify(trackName, artist)`
- `searchYouTubeVideos(query)`
- `getSpotifyArtistInfo(artistName)`

### Example Flow for Feature #8 (Event Finder):

```
User: "Any jazz shows in Chicago this month?"
    ↓
C1 receives question + available tools
    ↓
C1 decides to call: searchUpcomingEvents({
  city: "Chicago",
  genre: "jazz",
  dateRange: "2025-10"
})
    ↓
Your backend executes:
  1. Call Ticketmaster API for events
  2. Call searchWebForArtistInfo() for each artist
  3. Return combined data to C1
    ↓
C1 generates interactive EventCard components with:
  - Event details from Ticketmaster
  - Artist info from web search
  - Venue details
  - Buy tickets button
    ↓
User sees beautiful, interactive event cards
```

---

## 🎯 Feature Breakdown & Task List

### Feature #1: Interactive Music Discovery Assistant
**Goal:** Users ask for music recommendations and get interactive cards they can play, save, and explore

**Technical Stack:**
- Thesys C1 API (Generative UI)
- Storyblok (Artist data, profiles, genres)
- Supabase (User favorites, listening history)
- Your existing radio player integration

**Tasks:**

#### Phase 1: Foundation (Week 1)
- [ ] **Task 1.1:** Set up Thesys C1 account and API keys
  - Sign up at thesys.dev
  - Generate API key
  - Store in `.env.local` as `THESYS_API_KEY`

- [ ] **Task 1.2:** Install Thesys C1 SDK
  ```bash
  npm install @thesys/react-sdk openai
  ```

- [ ] **Task 1.3:** Create C1 configuration file
  - Location: `lib/thesys/config.ts`
  - Configure OpenAI-compatible client pointing to Thesys
  - Set up error handling and retry logic

- [ ] **Task 1.4:** Create chat UI components
  - `components/ai-chat/ChatContainer.tsx` - Main chat wrapper
  - `components/ai-chat/ChatMessage.tsx` - Individual messages
  - `components/ai-chat/ChatInput.tsx` - User input field
  - `components/ai-chat/C1UIRenderer.tsx` - Renders C1 generated UI

#### Phase 2: Storyblok Integration (Week 1-2)
- [ ] **Task 1.5:** Create Storyblok query helper
  - Location: `lib/storyblok/ai-queries.ts`
  - Function: `getArtistsByGenre(genres: string[])`
  - Function: `getArtistsByMood(mood: string)`
  - Function: `searchArtists(query: string)`

- [ ] **Task 1.6:** Create AI context builder
  - Location: `lib/ai/context-builder.ts`
  - Build rich context from Storyblok data for C1
  - Include artist bio, genres, discography, similar artists

#### Phase 3: C1 Tool Integration (Week 2)
- [ ] **Task 1.7:** Define C1 tools (function calling)
  ```typescript
  // Tools the AI can call
  - searchArtistsByGenre()
  - getArtistProfile()
  - getUserFavorites()
  - saveToFavorites()
  - getSimilarArtists()
  ```

- [ ] **Task 1.8:** Create UI component schemas
  - Define what interactive components C1 can generate
  - Artist card, playlist card, genre filter chips, etc.

- [ ] **Task 1.9:** Build server actions for C1
  - Location: `app/actions/ai-chat.ts`
  - Handle streaming responses
  - Process tool calls
  - Return formatted UI data

#### Phase 4: Supabase Integration (Week 2-3)
- [ ] **Task 1.10:** Create database schema
  ```sql
  -- Chat history table
  CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    created_at TIMESTAMP
  );

  CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions,
    role TEXT, -- 'user' | 'assistant'
    content JSONB, -- Stores UI data
    created_at TIMESTAMP
  );

  -- User interactions
  CREATE TABLE user_music_interactions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    artist_id TEXT,
    interaction_type TEXT, -- 'favorite', 'play', 'share'
    metadata JSONB,
    created_at TIMESTAMP
  );
  ```

- [ ] **Task 1.11:** Create Supabase query functions
  - Location: `lib/supabase/ai-queries.ts`
  - `saveChatMessage()`
  - `getChatHistory()`
  - `saveUserInteraction()`
  - `getUserRecommendations()`

#### Phase 5: UI Implementation (Week 3)
- [ ] **Task 1.12:** Build interactive artist cards
  - Component: `components/ai-chat/ArtistCard.tsx`
  - Display artist photo, bio, genres
  - "Play", "Save", "Explore" buttons
  - Click to expand for full profile

- [ ] **Task 1.13:** Build playlist preview component
  - Component: `components/ai-chat/PlaylistPreview.tsx`
  - List of tracks with album art
  - Play buttons for each track
  - "Save Playlist" functionality

- [ ] **Task 1.14:** Build genre filter chips
  - Component: `components/ai-chat/GenreFilters.tsx`
  - Clickable chips that refine results
  - Visual feedback for selected filters

#### Phase 6: Testing & Refinement (Week 3-4)
- [ ] **Task 1.15:** Test conversation flows
  - "Find me chill electronic music"
  - "Show jazz artists like Kamasi Washington"
  - "What's good for studying?"

- [ ] **Task 1.16:** Optimize response quality
  - Refine prompts for better UI generation
  - Add examples of good responses
  - Test edge cases

- [ ] **Task 1.17:** Add error handling
  - Network failures
  - Invalid queries
  - Rate limiting

---

### Feature #2: Artist Deep Dive Explorer
**Goal:** Users chat with artist profiles to explore careers, influences, discographies

**Technical Stack:**
- Thesys C1 API
- Storyblok (Full artist profiles with rich content)
- Discogs API (via existing integration)
- Supabase (User notes, bookmarks)

**Tasks:**

#### Phase 1: Data Preparation (Week 4)
- [ ] **Task 2.1:** Enhance Storyblok artist schema
  - Ensure all artists have: bio, influences, discography, timeline
  - Add structured metadata for AI consumption
  - Create relationship fields (influenced_by, similar_to)

- [ ] **Task 2.2:** Create artist profile API endpoint
  - Location: `app/api/ai/artist-profile/route.ts`
  - Returns comprehensive artist data
  - Includes discography from Discogs
  - Includes related artists from Storyblok

#### Phase 2: Conversational Interface (Week 4-5)
- [ ] **Task 2.3:** Build artist chat component
  - Component: `components/artist/ArtistChat.tsx`
  - Embedded in existing artist profile pages
  - Contextually aware of current artist

- [ ] **Task 2.4:** Create artist-specific C1 tools
  ```typescript
  - getArtistTimeline()
  - getDiscography(filters)
  - getInfluences()
  - getCollaborations()
  - findRelatedArticles()
  ```

- [ ] **Task 2.5:** Build timeline visualization component
  - Component: `components/ai-chat/ArtistTimeline.tsx`
  - Interactive timeline of career milestones
  - Expandable events with details
  - Click to explore specific periods

#### Phase 3: Discography Explorer (Week 5)
- [ ] **Task 2.6:** Enhanced album cards
  - Component: `components/ai-chat/AlbumDetailCard.tsx`
  - Album art, tracklist, release info
  - Critical reception, reviews
  - Links to streaming platforms

- [ ] **Task 2.7:** Influence map visualization
  - Component: `components/ai-chat/InfluenceMap.tsx`
  - Visual graph of musical influences
  - Clickable nodes to explore connections
  - Filter by type (inspired_by, collaborated_with, etc.)

#### Phase 4: Integration (Week 5-6)
- [ ] **Task 2.8:** Add chat to artist profile pages
  - Update `app/profiles/[slug]/page.tsx`
  - Add chat toggle button
  - Slide-out chat panel

- [ ] **Task 2.9:** Implement context persistence
  - Remember conversation within artist profile
  - Clear context when switching artists
  - Save interesting conversations to Supabase

---

### Feature #8: Event & Live Show Finder
**Goal:** Conversational event discovery with real-time data from Ticketmaster + web search

**Technical Stack:**
- Thesys C1 API
- Ticketmaster Discovery API
- Tavily/Perplexity (Web search for event context)
- Supabase (Event reminders, user preferences)
- Google Maps API (Venue locations)

**Tasks:**

#### Phase 1: API Setup (Week 6)
- [ ] **Task 8.1:** Set up Ticketmaster API
  - Register at developer.ticketmaster.com
  - Get API key
  - Store in `.env.local` as `TICKETMASTER_API_KEY`

- [ ] **Task 8.2:** Set up web search API
  - Choose: Tavily or Perplexity
  - Get API key
  - Test search capabilities

- [ ] **Task 8.3:** Create Ticketmaster query functions
  - Location: `lib/ticketmaster/queries.ts`
  - `searchEvents(query, location, dateRange)`
  - `getEventDetails(eventId)`
  - `getVenueInfo(venueId)`
  - `getArtistEvents(artistName)`

#### Phase 2: Event Discovery (Week 6-7)
- [ ] **Task 8.4:** Build event search tools for C1
  ```typescript
  - findUpcomingShows(genre, location, date)
  - getArtistTourDates(artistName)
  - searchVenueEvents(venueName)
  - getEventsByCity(city, genres)
  ```

- [ ] **Task 8.5:** Create web search enrichment
  - Search for event reviews, venue info
  - Get transportation/parking details
  - Find related events nearby

- [ ] **Task 8.6:** Build event card components
  - Component: `components/ai-chat/EventCard.tsx`
  - Event details: date, time, venue
  - Artist lineup with photos from Storyblok
  - Ticket purchase button (Ticketmaster link)
  - "Add to Calendar" functionality

#### Phase 3: Location Features (Week 7)
- [ ] **Task 8.7:** Implement location detection
  - Get user's location (with permission)
  - Default to major cities
  - Allow manual location input

- [ ] **Task 8.8:** Add map visualization
  - Component: `components/ai-chat/EventMap.tsx`
  - Show venues on interactive map
  - Click markers to see event details
  - Distance from user location

#### Phase 4: User Features (Week 7-8)
- [ ] **Task 8.9:** Event reminders & notifications
  - Supabase table: `event_reminders`
  - Email notifications (optional)
  - In-app notifications

- [ ] **Task 8.10:** Ticket tracking
  - Save events user is interested in
  - Price tracking alerts
  - On-sale notifications

---

### Feature #7: Smart Album/Release Explorer
**Goal:** Conversational exploration of artist discographies with rich metadata

**Technical Stack:**
- Thesys C1 API
- Existing Discogs integration
- Storyblok (Album reviews, editorial content)
- Supabase (User reviews, ratings)

**Tasks:**

#### Phase 1: Discogs Enhancement (Week 8)
- [ ] **Task 7.1:** Expand Discogs data fetching
  - Location: `lib/discogs/enhanced-queries.ts`
  - Fetch: tracklists, credits, release notes
  - Cache responses in Supabase

- [ ] **Task 7.2:** Create release comparison tools
  - Compare different releases/pressings
  - Show differences in tracklists
  - Price/rarity information

#### Phase 2: Conversational Discography (Week 8-9)
- [ ] **Task 7.3:** Build discography C1 tools
  ```typescript
  - getAlbumsByYear(artistId, year)
  - getExperimentalReleases(artistId)
  - getCollaborativeAlbums(artistId)
  - getAlbumReviews(albumId)
  - compareAlbums(albumId1, albumId2)
  ```

- [ ] **Task 7.4:** Enhanced album cards
  - Component: `components/ai-chat/AlbumExplorer.tsx`
  - Detailed tracklist
  - Personnel/credits
  - User reviews from Supabase
  - Streaming links

#### Phase 3: Review System (Week 9)
- [ ] **Task 7.5:** User review database
  ```sql
  CREATE TABLE album_reviews (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    album_id TEXT,
    rating INTEGER,
    review_text TEXT,
    created_at TIMESTAMP
  );
  ```

- [ ] **Task 7.6:** Review UI components
  - Component: `components/ai-chat/AlbumReview.tsx`
  - Star rating system
  - Review text input
  - Display community reviews

---

### Feature #3: Personalized Playlist Generator
**Goal:** Create custom playlists with links to YouTube, Spotify, Apple Music, etc.

**Technical Stack:**
- Thesys C1 API
- YouTube Data API
- Spotify Web API
- Apple Music API
- Supabase (Playlist storage)

**Tasks:**

#### Phase 1: Streaming API Setup (Week 9-10)
- [ ] **Task 3.1:** Set up YouTube Data API
  - Get API key from Google Cloud Console
  - Create search functions
  - Build embed player component

- [ ] **Task 3.2:** Set up Spotify API
  - Register app at developer.spotify.com
  - OAuth flow for user authentication
  - Search & playlist creation

- [ ] **Task 3.3:** Set up Apple Music API
  - MusicKit JS integration
  - Search capabilities
  - Link generation

#### Phase 2: Playlist Generation (Week 10)
- [ ] **Task 3.4:** Build playlist C1 tools
  ```typescript
  - generatePlaylist(mood, genres, duration)
  - findTrackOnPlatforms(trackName, artist)
  - addTrackToPlaylist(playlistId, trackId)
  - optimizePlaylistFlow(tracks) // AI-powered track ordering
  ```

- [ ] **Task 3.5:** Create playlist UI
  - Component: `components/ai-chat/PlaylistBuilder.tsx`
  - Drag-to-reorder tracks
  - Platform availability indicators
  - "Open in..." buttons for each platform

#### Phase 3: Multi-Platform Integration (Week 10-11)
- [ ] **Task 3.6:** Universal track matching
  - Match tracks across platforms
  - Handle different versions/remasters
  - Show availability status

- [ ] **Task 3.7:** Export functionality
  - Export to Spotify playlist (OAuth required)
  - Generate YouTube Music queue link
  - Apple Music playlist sharing
  - M3U file export for offline use

#### Phase 4: Playlist Intelligence (Week 11)
- [ ] **Task 3.8:** Mood/energy analysis
  - Analyze track energy levels
  - Smart track ordering (flow)
  - Transition optimization

- [ ] **Task 3.9:** Playlist storage
  ```sql
  CREATE TABLE user_playlists (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    name TEXT,
    tracks JSONB,
    mood_tags TEXT[],
    created_at TIMESTAMP
  );
  ```

---

### Feature #5: Artist Connection Graph
**Goal:** Visual exploration of artist relationships, influences, and musical connections

**Technical Stack:**
- Thesys C1 API
- D3.js or Vis.js (Graph visualization)
- Storyblok (Artist relationships)
- Supabase (Cache graph data)

**Tasks:**

#### Phase 1: Relationship Data (Week 11-12)
- [ ] **Task 5.1:** Enhance artist relationship data
  - Add fields in Storyblok: influenced_by, collaborated_with, similar_to
  - Create bidirectional relationships
  - Weight relationships (strong/weak influence)

- [ ] **Task 5.2:** Build graph data API
  - Location: `app/api/ai/artist-graph/route.ts`
  - Return graph nodes and edges
  - Filter by relationship type
  - Limit depth for performance

#### Phase 2: Visualization (Week 12)
- [ ] **Task 5.3:** Install graph library
  ```bash
  npm install @visx/network d3
  # or
  npm install vis-network
  ```

- [ ] **Task 5.4:** Build graph component
  - Component: `components/ai-chat/ArtistGraph.tsx`
  - Interactive node network
  - Zoom, pan, drag nodes
  - Highlight paths between artists

- [ ] **Task 5.5:** Style the graph
  - Node size = artist popularity
  - Node color = primary genre
  - Edge style = relationship type
  - Animated transitions

#### Phase 3: Interactive Features (Week 12-13)
- [ ] **Task 5.6:** Node interactions
  - Click node → show artist card
  - Double-click → expand connections
  - Right-click → context menu (explore, play, etc.)

- [ ] **Task 5.7:** Path finding
  - "How are Artist A and Artist B connected?"
  - Highlight shortest path
  - Show intermediate connections

- [ ] **Task 5.8:** Graph filters
  - Filter by: genre, time period, relationship type
  - Search within graph
  - Collapse/expand clusters

---

## 🏗️ Project Architecture

### Directory Structure
```
rhythm-lab-app/
├── app/
│   ├── api/
│   │   └── ai/
│   │       ├── chat/route.ts           # Main chat endpoint
│   │       ├── artist-profile/route.ts # Artist deep dive
│   │       ├── events/route.ts         # Event search
│   │       ├── discography/route.ts    # Album explorer
│   │       ├── playlist/route.ts       # Playlist generation
│   │       └── graph/route.ts          # Artist graph
│   ├── ai-chat/
│   │   └── page.tsx                    # Main chat interface
│   └── actions/
│       └── ai-chat.ts                  # Server actions
├── components/
│   └── ai-chat/
│       ├── ChatContainer.tsx
│       ├── ChatMessage.tsx
│       ├── ChatInput.tsx
│       ├── C1UIRenderer.tsx
│       ├── ArtistCard.tsx
│       ├── EventCard.tsx
│       ├── AlbumExplorer.tsx
│       ├── PlaylistBuilder.tsx
│       ├── ArtistGraph.tsx
│       └── ... (more components)
├── lib/
│   ├── thesys/
│   │   ├── config.ts
│   │   └── client.ts
│   ├── ai/
│   │   ├── context-builder.ts
│   │   ├── tools.ts
│   │   └── prompts.ts
│   ├── storyblok/
│   │   └── ai-queries.ts
│   ├── supabase/
│   │   └── ai-queries.ts
│   ├── ticketmaster/
│   │   └── queries.ts
│   ├── spotify/
│   │   └── api.ts
│   └── youtube/
│       └── api.ts
└── supabase/
    └── migrations/
        ├── 001_chat_tables.sql
        ├── 002_user_interactions.sql
        ├── 003_playlists.sql
        └── 004_reviews.sql
```

---

## 💻 Practical Implementation Guide

### Step-by-Step: Building Your First C1 Tool (Music Discovery)

**Step 1: Create the Tool Definition**

```typescript
// lib/ai/tools.ts

export const musicDiscoveryTools = [
  {
    type: "function",
    function: {
      name: "searchArtistsByGenre",
      description: "Search for artists in Storyblok by genre and mood",
      parameters: {
        type: "object",
        properties: {
          genres: {
            type: "array",
            items: { type: "string" },
            description: "Music genres to search for (e.g., ['jazz', 'electronic'])"
          },
          mood: {
            type: "string",
            description: "The mood or vibe (e.g., 'chill', 'energetic', 'dark')"
          },
          limit: {
            type: "number",
            description: "Number of artists to return",
            default: 5
          }
        },
        required: ["genres"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchWebForArtist",
      description: "Search the web for recent information about an artist",
      parameters: {
        type: "object",
        properties: {
          artistName: {
            type: "string",
            description: "Name of the artist to search for"
          },
          query: {
            type: "string",
            description: "Specific aspect to search for (e.g., 'recent releases', 'tour dates', 'biography')"
          }
        },
        required: ["artistName"]
      }
    }
  }
]
```

**Step 2: Implement the Tool Functions**

```typescript
// lib/storyblok/ai-queries.ts

import { sb } from '@/src/lib/storyblok'

export async function searchArtistsByGenre(
  genres: string[],
  mood?: string,
  limit: number = 5
) {
  const storyblokApi = sb()

  try {
    // Build search filter
    const filterQuery: any = {
      version: 'published',
      starts_with: 'profiles/',
      per_page: limit,
    }

    // Search in content for genre tags
    if (genres.length > 0) {
      filterQuery.filter_query = {
        tags: {
          in_array: genres.join(',')
        }
      }
    }

    const response = await storyblokApi.get('cdn/stories', filterQuery)

    // Transform data for C1
    return response.data.stories.map((story: any) => ({
      id: story.id,
      slug: story.slug,
      name: story.name,
      artist_name: story.content?.artist_name || story.name,
      photo: story.content?.artist_photo?.filename,
      bio: story.content?.short_bio || story.content?.intro,
      genres: story.content?.tags || [],
      spotify_url: story.content?.spotify_url,
      youtube_url: story.content?.youtube_url,
      profile_url: `/profiles/${story.slug}`
    }))
  } catch (error) {
    console.error('Error searching artists:', error)
    return []
  }
}
```

```typescript
// lib/web-search/tavily.ts

export async function searchWebForArtist(
  artistName: string,
  query?: string
) {
  const searchQuery = query
    ? `${artistName} ${query}`
    : `${artistName} music artist biography recent`

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: searchQuery,
        search_depth: 'basic',
        max_results: 3,
        include_answer: true
      })
    })

    const data = await response.json()

    return {
      answer: data.answer,
      sources: data.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score
      }))
    }
  } catch (error) {
    console.error('Web search error:', error)
    return { answer: null, sources: [] }
  }
}
```

**Step 3: Create the C1 Chat Endpoint**

```typescript
// app/api/ai/chat/route.ts

import { OpenAI } from 'openai'
import { musicDiscoveryTools } from '@/lib/ai/tools'
import { searchArtistsByGenre } from '@/lib/storyblok/ai-queries'
import { searchWebForArtist } from '@/lib/web-search/tavily'

// Initialize C1 client (OpenAI-compatible)
const client = new OpenAI({
  apiKey: process.env.THESYS_API_KEY!,
  baseURL: 'https://api.thesys.dev/v1/embed'
})

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json()

    // Call C1 with tools
    const response = await client.chat.completions.create({
      model: 'claude-3-5-sonnet-20241022', // or gpt-4
      messages: [
        {
          role: 'system',
          content: `You are a music discovery assistant for Rhythm Lab Radio.
          Help users find amazing artists, albums, and live shows.
          Generate beautiful, interactive UI components to display results.
          Always be enthusiastic about music!`
        },
        ...messages
      ],
      tools: musicDiscoveryTools,
      stream: true
    })

    // Handle streaming response
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const delta = chunk.choices[0]?.delta

          // Check if AI wants to call a tool
          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              const functionName = toolCall.function.name
              const args = JSON.parse(toolCall.function.arguments)

              // Execute the tool
              let result
              if (functionName === 'searchArtistsByGenre') {
                result = await searchArtistsByGenre(
                  args.genres,
                  args.mood,
                  args.limit
                )
              } else if (functionName === 'searchWebForArtist') {
                result = await searchWebForArtist(
                  args.artistName,
                  args.query
                )
              }

              // Send tool result back to C1
              // C1 will use this data to generate UI
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    type: 'tool_result',
                    tool_call_id: toolCall.id,
                    result
                  })
                )
              )
            }
          }

          // Send UI content to frontend
          if (delta?.content) {
            controller.enqueue(
              new TextEncoder().encode(delta.content)
            )
          }
        }

        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Chat error:', error)
    return new Response('Error processing chat', { status: 500 })
  }
}
```

**Step 4: Create the Frontend Chat Component**

```typescript
// components/ai-chat/ChatContainer.tsx

'use client'

import { useState } from 'react'
import { C1Component } from '@thesys/react-sdk'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'

export function ChatContainer() {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  async function sendMessage(userMessage: string) {
    // Add user message
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage }
    ]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      // Call your API endpoint
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      })

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantMessage += chunk

        // Update UI in real-time
        setMessages([
          ...newMessages,
          { role: 'assistant', content: assistantMessage }
        ])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message, i) => (
          <ChatMessage key={i} message={message} />
        ))}
        {isLoading && <div>Thinking...</div>}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  )
}
```

```typescript
// components/ai-chat/ChatMessage.tsx

'use client'

import { C1Component } from '@thesys/react-sdk'

export function ChatMessage({ message }: { message: any }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-white rounded-lg px-4 py-2 max-w-md">
          {message.content}
        </div>
      </div>
    )
  }

  // Assistant message with C1 generated UI
  return (
    <div className="flex justify-start">
      <div className="bg-card rounded-lg px-4 py-2 max-w-2xl">
        {/* C1Component renders the interactive UI */}
        <C1Component content={message.content} />
      </div>
    </div>
  )
}
```

**Step 5: Testing Your First Conversation**

```
User: "Find me some chill electronic music"
    ↓
C1 calls: searchArtistsByGenre(["electronic"], "chill", 5)
    ↓
Your backend queries Storyblok
    ↓
Returns: [Floating Points, Burial, Four Tet, Boards of Canada, Aphex Twin]
    ↓
C1 generates interactive UI:
```

```jsx
<div className="space-y-4">
  <h3>Here are some chill electronic artists:</h3>

  <div className="grid grid-cols-2 gap-4">
    {artists.map(artist => (
      <ArtistCard
        key={artist.id}
        name={artist.name}
        image={artist.photo}
        genres={artist.genres}
        onPlay={() => playArtist(artist)}
        onSave={() => saveToFavorites(artist)}
      />
    ))}
  </div>

  <Button onClick={refineSearch}>
    Show me more like this
  </Button>
</div>
```

This is actual interactive UI - buttons work, cards are clickable, everything is functional!

---

## 📊 Development Timeline

### Month 1: Foundation & Discovery Assistant
- Week 1: Thesys C1 setup + basic chat UI
- Week 2: Storyblok integration + tool calling
- Week 3: Supabase integration + interactive cards
- Week 4: Artist Deep Dive Explorer

### Month 2: Events & Discography
- Week 5-6: Artist Deep Dive completion
- Week 6-7: Event Finder with Ticketmaster
- Week 8-9: Album/Release Explorer

### Month 3: Playlists & Graphs
- Week 9-11: Playlist Generator with multi-platform
- Week 11-13: Artist Connection Graph

### Month 4: Polish & Launch
- Week 13-14: Testing, bug fixes, optimization
- Week 15: Beta testing with users
- Week 16: Production launch

---

## 🔑 Environment Variables

Add to `.env.local`:
```bash
# Thesys C1
THESYS_API_KEY=your_thesys_key

# Ticketmaster
TICKETMASTER_API_KEY=your_ticketmaster_key

# Web Search (choose one)
TAVILY_API_KEY=your_tavily_key
# OR
PERPLEXITY_API_KEY=your_perplexity_key

# Spotify
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret

# YouTube
YOUTUBE_API_KEY=your_youtube_key

# Apple Music (optional)
APPLE_MUSIC_TOKEN=your_apple_music_token

# Existing
NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN=existing
NEXT_PUBLIC_SUPABASE_URL=existing
NEXT_PUBLIC_SUPABASE_ANON_KEY=existing
```

---

## 📝 Development Notes

### Success Metrics
- [ ] Users spend 3+ minutes in chat per session
- [ ] 40%+ of chat interactions lead to music playback
- [ ] 25%+ of users save artists/playlists from chat
- [ ] Chat generates 50+ interactions per day

### Performance Goals
- [ ] C1 UI generation: < 2 seconds
- [ ] Chat response streaming: < 500ms to first token
- [ ] Artist graph rendering: < 1 second for 50 nodes
- [ ] Event search: < 3 seconds (including Ticketmaster API)

### User Experience Principles
1. **Conversational First:** Make everything feel like a natural conversation
2. **Visual Feedback:** Always show loading states, animations
3. **Graceful Errors:** Handle API failures gracefully with fallbacks
4. **Mobile-First:** All components must work on mobile
5. **Progressive Enhancement:** Basic features work, AI enhances

---

## 🐛 Known Challenges & Solutions

### Challenge 1: C1 Response Consistency
**Problem:** AI might generate inconsistent UI structures
**Solution:**
- Provide strict schema examples
- Validate responses before rendering
- Have fallback UI components

### Challenge 2: Multi-API Coordination
**Problem:** Combining Ticketmaster + Web Search + Storyblok in one response
**Solution:**
- Parallel API calls where possible
- Cache frequently accessed data
- Progressive rendering (show what's ready)

### Challenge 3: Real-time Streaming Performance
**Problem:** Streaming large UI updates might lag
**Solution:**
- Chunk responses intelligently
- Use React Server Components
- Implement virtual scrolling for large lists

### Challenge 4: User Authentication Across Platforms
**Problem:** Spotify/Apple Music require OAuth
**Solution:**
- Implement OAuth flow once, reuse
- Store tokens securely in Supabase
- Provide guest mode with limited features

---

## 🎨 Design System for C1 Components

All C1-generated components should follow these patterns:

### Color Palette
```css
--ai-primary: #8b5cf6      /* Purple for AI actions */
--ai-accent: #ec4899       /* Pink for highlights */
--ai-success: #10b981      /* Green for confirmations */
--ai-neutral: #6b7280      /* Gray for secondary info */
```

### Component Patterns
1. **Cards:** Always rounded-xl, shadow-lg, hover effects
2. **Buttons:** Consistent sizing (sm, md, lg), clear actions
3. **Animations:** Subtle fade-ins, smooth transitions
4. **Typography:** Match existing NTS-style caps for headers

---

## 📚 Learning Resources

- [Thesys C1 Docs](https://docs.thesys.dev)
- [Ticketmaster API Docs](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [D3.js Graph Tutorials](https://observablehq.com/@d3/gallery)

---

## ✅ Pre-Flight Checklist

Before starting development:
- [ ] All API keys obtained
- [ ] Thesys C1 account verified
- [ ] Supabase project ready
- [ ] Development environment set up
- [ ] Team aligned on features
- [ ] Design mockups reviewed

---

## 🚀 Next Steps

**Start with:** Feature #1 (Music Discovery Assistant)
**Why:** It's the foundation for all other features. Once you have chat working, everything else builds on top.

**First Development Session:**
1. Set up Thesys C1 account
2. Install dependencies
3. Create basic chat UI
4. Test with simple prompts
5. Get first C1 response rendering

---

## 🎓 Quick Reference: Key Concepts

### What is Thesys C1?
An AI API that generates interactive UI components instead of just text. It's like ChatGPT, but instead of responding with markdown, it responds with React components.

### How does it work?
1. You send a user question to C1
2. C1 decides what data it needs (calls your "tools")
3. Your backend executes those tools (query Storyblok, Supabase, web, etc.)
4. C1 receives the data and generates interactive UI
5. Your frontend renders the beautiful, functional components

### What are "tools"?
Functions that you define for C1 to call. Think of them as API endpoints that the AI can trigger when it needs specific data.

Example tools:
- `searchArtists(genre)` → Queries Storyblok
- `searchWeb(query)` → Calls Tavily/Perplexity
- `findEvents(city)` → Calls Ticketmaster
- `saveToFavorites(artistId)` → Saves to Supabase

### Do I need web search for every feature?
**No!** Here's when you need it:

- **Feature #1 (Music Discovery):** Optional - for current artist news
- **Feature #2 (Artist Deep Dive):** YES - for recent info, tour updates
- **Feature #8 (Events):** YES - for venue reviews, event details
- **Feature #7 (Albums):** Optional - for reviews, critical reception
- **Feature #3 (Playlists):** No - uses streaming APIs
- **Feature #5 (Graph):** No - uses Storyblok relationships

### What APIs do I absolutely need?

**Must Have:**
- Thesys C1 API (the core)
- Your existing Storyblok
- Your existing Supabase

**Highly Recommended:**
- Tavily or Perplexity (web search) - $20-50/month
- Ticketmaster API (free tier available)

**Optional/Future:**
- Spotify API (free)
- YouTube Data API (free tier)
- Apple Music API

### How much will this cost?

**Thesys C1:**
- Pay-per-use pricing
- Estimate: $50-200/month for 1000 users
- Cheaper than building custom UI generation

**Web Search (Tavily/Perplexity):**
- ~$0.005-0.01 per search
- Estimate: $20-100/month depending on usage

**Ticketmaster:**
- Free tier: 5,000 API calls/day (plenty for most apps)

**Total estimated monthly cost:** $70-300 depending on traffic

### Can I start small?
**YES!** Recommended approach:

**Phase 1:** Just Feature #1 (Music Discovery)
- Thesys C1 + Storyblok only
- No web search needed initially
- Cost: ~$50/month

**Phase 2:** Add web search + Ticketmaster
- Enables Features #2 and #8
- Cost: +$50-100/month

**Phase 3:** Add streaming APIs
- Enables Feature #3 and #7
- Cost: Free APIs, just dev time

**Phase 4:** Add graph visualization
- Feature #5
- Cost: Just dev time

### What if C1 generates bad UI?
You can:
1. Improve your system prompts
2. Provide UI examples in prompts
3. Add validation to tool outputs
4. Have fallback components
5. Fine-tune with C1's customization options

### How do I debug issues?

**Common Issues & Solutions:**

| Issue | Solution |
|-------|----------|
| C1 not calling tools | Check tool descriptions are clear |
| Tools returning no data | Test your Storyblok/Supabase queries independently |
| UI not rendering | Check C1Component is properly imported |
| Slow responses | Cache frequent queries, use parallel API calls |
| Web search failing | Check API keys, verify rate limits |

### Development Best Practices

1. **Start Simple:** Get one tool working before adding more
2. **Test Tools Separately:** Make sure your Storyblok queries work before connecting to C1
3. **Use Console Logs:** Log tool calls and responses during development
4. **Cache Everything:** Don't hit APIs repeatedly for the same data
5. **Handle Errors Gracefully:** Always have fallback UI
6. **Mobile First:** Test on mobile, C1 UI should be responsive

---

## 📞 Support & Resources

### When Stuck:
1. Read Thesys docs: https://docs.thesys.dev
2. Check this journal's code examples
3. Test your tools independently first
4. Verify API keys are correct
5. Check browser console for errors

### Community:
- Thesys Discord: https://discord.gg/thesys
- PostHog for analytics: Track what users ask
- GitHub Issues: Document problems and solutions

### Next Steps After Reading This:

1. [ ] Sign up for Thesys C1 account
2. [ ] Get API key and test it works
3. [ ] Install dependencies (`npm install openai @thesys/react-sdk`)
4. [ ] Copy the example code from "Practical Implementation Guide"
5. [ ] Test your first tool (searchArtistsByGenre)
6. [ ] Get your first C1 response working
7. [ ] Celebrate! 🎉
8. [ ] Build the rest incrementally

---

*Last Updated: October 8, 2025*
*Next Review: After Feature #1 completion*

**Remember:** You don't need to build everything at once. Start with Feature #1, get it working, learn from it, then expand. The beauty of this architecture is that each feature is independent - you can ship incrementally!

**Questions to answer before starting:**
- [ ] Have I signed up for Thesys C1?
- [ ] Do I have all required API keys?
- [ ] Do I understand how tools work?
- [ ] Have I tested my Storyblok queries?
- [ ] Am I ready to start with Feature #1?

**When ready to code, start here:** Task 1.1 in Feature #1 section above.
