"use client"

import { useEffect, useState } from "react"
import { getAllShows, getFeaturedBlogPosts, getFeaturedArtists, getCurrentlyPlaying, getRecentSongs } from "@/lib/database/queries"
import type { Show, BlogPostWithAuthor, ArtistProfile, Song } from "@/lib/database/types"

export default function TestDatabasePage() {
  const [shows, setShows] = useState<Show[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPostWithAuthor[]>([])
  const [artists, setArtists] = useState<ArtistProfile[]>([])
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [recentSongs, setRecentSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testDatabase() {
      try {
        console.log("Testing database connection...")

        const [showsData, blogPostsData, artistsData, currentSongData, recentSongsData] = await Promise.all([
          getAllShows(),
          getFeaturedBlogPosts(),
          getFeaturedArtists(),
          getCurrentlyPlaying(),
          getRecentSongs('rlr-main', 5)
        ])

        setShows(showsData)
        setBlogPosts(blogPostsData)
        setArtists(artistsData)
        setCurrentSong(currentSongData)
        setRecentSongs(recentSongsData)

        console.log("Database test successful!", {
          shows: showsData.length,
          blogPosts: blogPostsData.length,
          artists: artistsData.length,
          currentSong: currentSongData ? currentSongData.song : 'None',
          recentSongs: recentSongsData.length
        })
      } catch (err) {
        console.error("Database test failed:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    testDatabase()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Testing database connection...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Database Error</h2>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-red-500 mt-2">
              Make sure your Supabase environment variables are set correctly and the database migrations have been run.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>

        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-8">
          <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Database Connected Successfully!</h2>
          <p className="text-green-600">
            Found {shows.length} shows, {blogPosts.length} featured blog posts, {artists.length} featured artists, and {recentSongs.length} recent songs.
            {currentSong && <><br />Currently playing: "{currentSong.song}" by {currentSong.artist}</>}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Shows */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Shows ({shows.length})</h3>
            {shows.slice(0, 3).map((show) => (
              <div key={show.id} className="mb-3 pb-3 border-b border-gray-100 last:border-b-0">
                <h4 className="font-medium text-sm">{show.title}</h4>
                <p className="text-xs text-gray-600">{show.show_date}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {show.genre_tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="bg-gray-100 text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Blog Posts */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Featured Blog Posts ({blogPosts.length})</h3>
            {blogPosts.map((post) => (
              <div key={post.id} className="mb-3 pb-3 border-b border-gray-100 last:border-b-0">
                <h4 className="font-medium text-sm">{post.title}</h4>
                <p className="text-xs text-gray-600">{post.excerpt}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {post.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="bg-blue-100 text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Artists */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Featured Artists ({artists.length})</h3>
            {artists.map((artist) => (
              <div key={artist.id} className="mb-3 pb-3 border-b border-gray-100 last:border-b-0">
                <h4 className="font-medium text-sm">{artist.name}</h4>
                <p className="text-xs text-gray-600">{artist.origin_city}, {artist.origin_country}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {artist.genres?.slice(0, 2).map((genre) => (
                    <span key={genre} className="bg-purple-100 text-xs px-2 py-1 rounded">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Songs */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Songs ({recentSongs.length})</h3>
            {recentSongs.map((song) => (
              <div key={song.id} className="mb-3 pb-3 border-b border-gray-100 last:border-b-0">
                <h4 className="font-medium text-sm">{song.song}</h4>
                <p className="text-xs text-gray-600">{song.artist}</p>
                <p className="text-xs text-gray-500">{new Date(song.start_time).toLocaleTimeString()}</p>
                {song.release && (
                  <span className="bg-orange-100 text-xs px-2 py-1 rounded mt-1 inline-block">
                    {song.release}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Next Steps:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Run the SQL migrations in your Supabase dashboard</li>
            <li>• Verify Row Level Security policies are working</li>
            <li>• Test user authentication and profile creation</li>
            <li>• Test user favorites and listening history features</li>
            <li>• Remove this test page before production</li>
          </ul>
        </div>
      </div>
    </div>
  )
}