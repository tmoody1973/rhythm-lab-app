"use client"

import { useAuth } from '@/hooks/auth/use-clerk-auth'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthTestNew() {
  const {
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    signOut,
    refreshProfile
  } = useAuth()

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>New Auth System</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>New Auth System - Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error.message}</p>
          <Button onClick={refreshProfile} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>New Auth System ✅</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
        </div>

        {user && (
          <div>
            <strong>Email:</strong> {user.emailAddresses[0]?.emailAddress || 'No email'}
          </div>
        )}

        {profile && (
          <>
            <div>
              <strong>Username:</strong> {profile.username || 'None'}
            </div>
            <div>
              <strong>Role:</strong> {profile.role}
            </div>
            <div>
              <strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}
            </div>
          </>
        )}

        {isAuthenticated && (
          <div className="flex gap-2 pt-2">
            <Button onClick={refreshProfile} variant="outline" size="sm">
              Refresh Profile
            </Button>
            <Button onClick={signOut} variant="destructive" size="sm">
              Sign Out
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}