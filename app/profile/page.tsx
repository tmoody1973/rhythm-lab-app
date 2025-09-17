"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/favorite-button"
import { useAuth } from "@/contexts/auth-context"
import { Heart, Music } from "lucide-react"

interface Favorite {
  id: string
  item_type: string
  item_id: string
  track_data?: {
    artist: string
    title: string
    type: string
  }
  created_at: string
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Fetch user favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user || loading) {
        setFavoritesLoading(false)
        return
      }

      try {
        const response = await fetch('/api/favorites')

        if (response.ok) {
          const { favorites: userFavorites } = await response.json()
          setFavorites(userFavorites || [])
        } else {
          console.error('Failed to fetch favorites')
          setFavorites([])
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
        setFavorites([])
      } finally {
        setFavoritesLoading(false)
      }
    }

    fetchFavorites()
  }, [user, loading])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your Rhythm Lab Radio account</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                  <p className="text-green-600 font-medium">Active</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Music Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Favorite Genres</label>
                  <p className="text-foreground">Electronic, Jazz, Deep House</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Saved Tracks</label>
                  <p className="text-foreground">
                    {favoritesLoading ? 'Loading...' : `${favorites.length} track${favorites.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Playlists</label>
                  <p className="text-foreground">0 playlists</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Listening Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Shows Listened</label>
                  <p className="text-foreground">0 episodes</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Listening Time</label>
                  <p className="text-foreground">0 minutes</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Active</label>
                  <p className="text-foreground">Today</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement edit profile
                    alert("Edit profile coming soon!")
                  }}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement preferences
                    alert("Manage preferences coming soon!")
                  }}
                >
                  Manage Preferences
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Favorites Section */}
          {favorites.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Heart size={20} className="text-red-500" />
                  <CardTitle>Your Favorite Tracks</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {favorites.slice(0, 5).map((favorite) => {
                    const trackData = favorite.track_data
                    const displayTitle = trackData?.title || 'Unknown Track'
                    const displayArtist = trackData?.artist || 'Unknown Artist'

                    return (
                    <div key={favorite.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center">
                          <Music size={16} className="text-muted-foreground" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm truncate">
                            {displayTitle}
                          </h4>
                          <p className="text-muted-foreground text-xs truncate">
                            {displayArtist}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {favorite.item_type === 'live_track' ? 'Live' : favorite.item_type}
                          </Badge>
                          <FavoriteButton
                            track={{
                              title: displayTitle,
                              artist: displayArtist
                            }}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  )})}
                  {favorites.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        and {favorites.length - 5} more favorite{favorites.length - 5 !== 1 ? 's' : ''}...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}