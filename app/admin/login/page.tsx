"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminLoginPage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()

  useEffect(() => {
    // If user is already signed in, redirect to admin
    if (isLoaded && isSignedIn) {
      router.replace('/admin')
    } else if (isLoaded && !isSignedIn) {
      // Redirect to Clerk sign-in page
      router.replace('/sign-in?redirect_url=/admin')
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Redirecting to sign-in...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-sm text-gray-500">
              {!isLoaded ? 'Loading...' : 'Redirecting to sign-in...'}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Only authorized administrators can access this area.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}