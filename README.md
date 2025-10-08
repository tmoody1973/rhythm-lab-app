# Rhythm Lab Radio Web App

A modern web platform for Rhythm Lab Radio, featuring AI-powered music discovery, real-time show streaming, and comprehensive music exploration tools.

## Overview

Rhythm Lab Radio is a Next.js 15 web application that combines traditional radio show hosting with AI  to create an immersive music discovery experience. The platform integrates with multiple music APIs (Discogs, Spotify, YouTube) and uses AI to surface deep musical connections and insights.

## Key Features

### 🎵 **Live Radio & Show Archive**
- Real-time streaming of live shows via Spinitron integration
- Complete archive of past shows from Mixcloud
- Track-by-track show details with rich metadata
- Embedded audio players with visual waveforms
- Favorite tracking for shows and tracks

### 🤖 **AI-Powered Music Discovery**
- **Musical Network Analysis**: AI discovers connections between artists through collaborations, samples, and influences
- **Perplexity AI Integration**: Real-time streaming analysis providing context about artists, tracks, and scenes
- **Smart Recommendations**: AI suggests related artists based on musical style, era, and connections
- **Discovery Insights**: Detailed breakdowns of musical lineage, scene connections, and sampling history

### 🔍 **Advanced Search**
- Multi-index search across archive tracks, live songs, and artist profiles
- Powered by Algolia for instant, typo-tolerant results
- Filter by artist, track, show, date, and genre
- Recently played tracks and artist name search
- Automatic search indexing via cron jobs

### 👥 **Artist Profiles**
- Rich artist biographies pulled from Discogs
- Complete discography with album artwork
- Expandable release cards showing:
  - Full track listings
  - Label information and catalog numbers
  - Release formats and pressing details
  - YouTube video integration
  - Direct links to Discogs
- Genre tags and musical connections

### 📝 **Content Management**
- **Blog Posts**: Long-form articles about music, culture, and shows
- **Deep Dives**: Episodic content exploring specific artists or genres
- **Profiles**: Curated artist spotlights
- All content managed through Storyblok CMS with rich text editing
- Citation system with source references
- Featured images and custom layouts

### 🎨 **Interactive Features**
- Track favoriting and collection management (Clerk authentication)
- Social sharing for shows and tracks
- Dynamic genre tag system
- Mobile-responsive design throughout
- Smooth animations and transitions

### 🔧 **Admin Tools**
- Mixcloud show import with AI-generated descriptions
- Manual Algolia index syncing
- Show slug management and content updates
- Storyblok content creation and editing
- Podcast audio generation from show archives

## Tech Stack

### Frontend
- **Next.js 15.5.3** with App Router
- **React 19** with Server Components
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Shadcn UI** components

### Backend & APIs
- **Supabase** - PostgreSQL database with Row Level Security
- **Clerk** - User authentication and management
- **Storyblok** - Headless CMS for content
- **Discogs API** - Music database and artist info
- **Spotify API** - Track metadata and playback
- **YouTube Data API** - Video search and embedding
- **Perplexity AI** - Intelligent music analysis
- **Spinitron** - Live show tracking
- **Mixcloud** - Show archive and streaming
- **Algolia** - Search indexing and queries

### Infrastructure
- **Vercel** - Hosting and deployment
- **Vercel Cron** - Scheduled jobs for data syncing
- **Edge Runtime** - Fast API responses
- **Server-Sent Events** - Real-time AI streaming

## Project Structure

```
rhythm-lab-app/
├── app/
│   ├── (pages)/           # Main application pages
│   │   ├── page.tsx       # Homepage with featured content
│   │   ├── live/          # Live show streaming
│   │   ├── archive/       # Show archive
│   │   ├── search/        # Advanced search interface
│   │   ├── blog/          # Blog posts
│   │   ├── deep-dives/    # Deep dive episodes
│   │   └── profiles/      # Artist profiles
│   ├── api/               # API routes
│   │   ├── ai-enhanced-discovery/  # AI music discovery
│   │   ├── discogs/       # Discogs integration
│   │   ├── algolia/       # Search indexing
│   │   ├── cron/          # Scheduled jobs
│   │   └── storyblok/     # CMS integration
│   └── admin/             # Admin dashboard
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── search-modal.tsx   # Quick search
│   ├── unified-ai-insights.tsx  # AI analysis display
│   └── expandable-release-card.tsx  # Album detail cards
├── lib/
│   ├── external-apis/     # API integrations
│   ├── auth/              # Authentication utilities
│   └── utils/             # Shared utilities
└── public/
    └── images/            # Static assets
```

## Environment Variables

Required environment variables (see `.env.local.example`):

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# CMS
STORYBLOK_PREVIEW_TOKEN=
STORYBLOK_MANAGEMENT_TOKEN=

# Music APIs
DISCOGS_API_TOKEN=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# AI & Search
PERPLEXITY_API_KEY=
ALGOLIA_APP_ID=
ALGOLIA_ADMIN_API_KEY=

# Radio APIs
SPINITRON_API_KEY=
MIXCLOUD_ACCESS_TOKEN=

# YouTube
YOUTUBE_API_KEY=
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- Clerk account
- Storyblok account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tmoody1973/rhythm-lab-app.git
cd rhythm-lab-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your API keys
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Database Setup

1. Create a Supabase project
2. Run the SQL migrations in `supabase/migrations/`
3. Set up Row Level Security policies
4. Configure Clerk webhook for user sync

### Admin Access

To grant admin access to a user:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to Users → Select user
3. Edit **Public metadata** and add:
```json
{
  "role": "admin"
}
```

## Key Features Documentation

### AI Music Discovery
The AI discovery system uses Perplexity's Sonar model to analyze tracks and artists, identifying:
- Collaborations and featured artists
- Production credits and sampling sources
- Musical influences and legacy
- Scene connections and time periods
- Related artists with similarity scores

### Search Architecture
- **Archive Tracks**: Indexed from `mixcloud_tracks` table
- **Live Songs**: Auto-synced every hour from Spinitron
- **Multi-index**: Searches across both indices simultaneously
- **Cron Jobs**: Automated syncing at `/api/cron/sync-live-songs`

### Content Management
All blog posts, deep dives, and profiles are managed through Storyblok:
- Rich text editing with citations
- Image upload and management
- URL slug auto-generation
- Version history and drafts
- Multi-language support ready

## Deployment

The app is configured for Vercel deployment:

```bash
vercel deploy --prod
```

### Cron Jobs
Set up in `vercel.json`:
- Live songs sync: Every hour
- Archive sync: Manual via admin panel

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes with conventional commits
4. Push and create a pull request

## License

Proprietary - Radio Milwaukee / Rhythm Lab Radio

## Support

For issues or questions:
- Email: digital@radiomilwaukee.org
- GitHub Issues: [rhythm-lab-app/issues](https://github.com/tmoody1973/rhythm-lab-app/issues)

---

Built with ❤️ by the Rhythm Lab Radio team
