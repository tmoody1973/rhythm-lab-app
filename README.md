# Rhythm Lab Radio Web App

A modern music discovery web application built with Next.js for the weekly syndicated radio show, featuring live streaming, AI-curated content feeds, and an extensive archive of electronic music, jazz, and underground tracks. The app provides an immersive listening experience with featured artist profiles, deep-dive music explorations, and a clean, responsive interface designed for show listeners and music enthusiasts.

## About Rhythm Lab Radio

Rhythm Lab Radio is a weekly syndicated radio show that has been broadcasting since **2005**, bringing listeners an eclectic mix of electronic music, jazz, deep house, and underground sounds from around the world. The show is known for its carefully curated playlists, in-depth artist profiles, and exploration of music's cultural and technological evolution.

The syndicated program reaches audiences across multiple stations and platforms, showcasing both established and emerging artists while diving deep into the stories behind the music. Each episode features live sets, exclusive interviews, and deep dives into specific genres, artists, or musical movements.

## Features

### 🎵 **Live Radio Streaming**
- **24/7 Live Stream**: Direct integration with Rhythm Lab Radio live stream
- **Real-time Metadata**: Live track information from Spinitron API
- **Persistent Audio Player**: Fixed footer player with volume controls and play/pause
- **Live Animations**: Smooth visual feedback for track changes and live updates
- **Current Track Display**: Large album artwork with artist and song information
- **Recent Tracks**: Historical playlist with album artwork and timestamps
- **Live Indicators**: Visual status showing when radio is broadcasting

### 📰 **Content Discovery**
- **Blog**: Featured articles and music journalism with hierarchy layout
- **Deep Dives**: In-depth explorations of artists, genres, and musical movements
- **Profiles**: Comprehensive artist profiles and interviews
- **Archive**: Searchable archive of past episodes and tracks

### 🎨 **Modern Design**
- Responsive 3-column dashboard layout
- Featured content sections with prominent display
- Mobile-first responsive design
- Clean, music-focused interface with beige/warm color scheme

### 🔐 **User Experience**
- Authentication system (login/signup)
- Search functionality
- Persistent audio player
- Mobile hamburger navigation

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) with App Router
- **Database**: [Supabase](https://supabase.com) with PostgreSQL
- **Real-time Data**: Spinitron API integration with Edge Functions
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **UI Components**: Custom components with [Radix UI](https://radix-ui.com) primitives
- **Audio Streaming**: HTML5 Audio with React state management
- **Language**: TypeScript
- **Icons**: Lucide React
- **Fonts**: Geist font family
- **Edge Computing**: Supabase Edge Functions (Deno runtime)

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tmoody1973/rhythm-lab-app.git
cd rhythm-lab-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Setup

Copy the example environment file and configure your settings:
```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for server operations)
- `SPINITRON_API_KEY`: API key for Spinitron radio data

See `DATABASE_SETUP.md` and `SPINITRON_SETUP.md` for detailed setup instructions.

## Project Structure

```
rhythm-lab-app/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes for data fetching
│   ├── blog/              # Blog posts and articles
│   ├── deep-dives/        # In-depth music explorations
│   ├── profiles/          # Artist profiles and interviews
│   ├── live/              # Live stream page
│   ├── archive/           # Episode and track archive
│   ├── login/             # Authentication pages
│   └── signup/
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── header.tsx        # Navigation header
│   ├── live-stream-section.tsx  # Live radio display
│   ├── persistent-audio-player.tsx  # Footer audio player
│   ├── ai-content-feed.tsx
│   └── archive-discovery-section.tsx
├── lib/                  # Utility functions and integrations
│   ├── database/         # Database types and queries
│   ├── radio/           # Radio context and state management
│   └── spinitron/       # Spinitron API client and sync
├── supabase/            # Database and edge functions
│   ├── functions/       # Edge Functions (Deno)
│   └── migrations/      # Database schema and RLS policies
├── public/              # Static assets
└── styles/             # Global styles
```

## Features in Detail

### Dashboard Layout
The main dashboard features a responsive 3-column layout:
- **Left**: Live stream with current track information
- **Center**: AI-curated content feed and exploration
- **Right**: Archive discovery and recent content

### Content Hierarchy
Each content section (Blog, Deep Dives, Profiles) uses a featured layout:
- **Featured Section**: 2 large cards highlighting important content
- **Grid Section**: 4-column responsive grid for additional content

### Live Radio Integration
The app features complete integration with Rhythm Lab Radio's live stream:

#### **Spinitron API Integration**
- Real-time track metadata fetching every 15 seconds
- Intelligent caching via Supabase Edge Functions
- Database storage for historical track data
- API error handling and fallback mechanisms

#### **Audio Streaming**
- Direct connection to `https://wyms.streamguys1.com/rhythmLabRadio`
- HTML5 Audio with React state management
- Persistent player that works across all pages
- Volume controls and play/pause functionality

#### **Live Features**
- Song change animations and visual feedback
- Live broadcasting indicators with status
- Current track display with large album artwork
- Recent tracks with thumbnails and timestamps
- Automatic updates without page refresh

## Future Enhancements

- [x] Spinitron API integration for live track data ✅ **COMPLETED**
- [x] Supabase backend with authentication ✅ **COMPLETED**
- [x] Live audio streaming with persistent player ✅ **COMPLETED**
- [ ] Storyblok CMS integration for content management
- [ ] Search and filtering capabilities across tracks and episodes
- [ ] User favorites and custom playlist creation
- [ ] Social sharing features with track snippets
- [ ] Mobile app companion with offline listening
- [ ] Artist submission portal for music discovery
- [ ] Integration with additional streaming platforms

## Contributing

This project was built for the Rhythm Lab Radio syndicated show. Contributions are welcome for bug fixes and feature enhancements.

## License

This project is built for Rhythm Lab Radio. Please contact the show for licensing and usage rights.

## Deployment

The app can be deployed on various platforms:

### Vercel (Recommended)
The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Other Platforms
- Netlify
- AWS Amplify
- Railway
- Digital Ocean App Platform

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

**Rhythm Lab Radio** - Exploring the intersection of music, technology, and culture since 2005.
