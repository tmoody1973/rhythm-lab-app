# Rhythm Lab Radio Web App

A modern music discovery web application built with Next.js for the weekly syndicated radio show, featuring live streaming, AI-curated content feeds, and an extensive archive of electronic music, jazz, and underground tracks. The app provides an immersive listening experience with featured artist profiles, deep-dive music explorations, and a clean, responsive interface designed for show listeners and music enthusiasts.

## About Rhythm Lab Radio

Rhythm Lab Radio is a weekly syndicated radio show that has been broadcasting since **2005**, bringing listeners an eclectic mix of electronic music, jazz, deep house, and underground sounds from around the world. The show is known for its carefully curated playlists, in-depth artist profiles, and exploration of music's cultural and technological evolution.

The syndicated program reaches audiences across multiple stations and platforms, showcasing both established and emerging artists while diving deep into the stories behind the music. Each episode features live sets, exclusive interviews, and deep dives into specific genres, artists, or musical movements.

## Features

### 🎵 **Live Stream Section**
- Real-time display of currently playing tracks with artist and song prominence
- Live stream player with volume controls
- Current show information and listener statistics
- Recent tracks history

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
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **UI Components**: Custom components with [Radix UI](https://radix-ui.com) primitives
- **Language**: TypeScript
- **Icons**: Lucide React
- **Fonts**: Geist font family

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

## Project Structure

```
rhythm-lab-app/
├── app/                    # Next.js App Router pages
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
│   ├── live-stream-section.tsx
│   ├── ai-content-feed.tsx
│   └── archive-discovery-section.tsx
├── lib/                  # Utility functions
├── public/               # Static assets
└── styles/              # Global styles
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

### Live Stream Integration
The app is designed to integrate with radio streaming APIs (like Spinitron) to display:
- Current playing track and artist
- Show information and host details
- Recent track history
- Live listener statistics

## Future Enhancements

- [ ] Spinitron API integration for live track data
- [ ] Storyblok CMS integration for content management
- [ ] Supabase authentication backend
- [ ] Audio player with playlist functionality
- [ ] Search and filtering capabilities
- [ ] User favorites and playlist creation
- [ ] Social sharing features
- [ ] Mobile app companion

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
