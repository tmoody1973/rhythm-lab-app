"use client"

import { ClerkProvider } from '@clerk/nextjs'
import type React from 'react'

interface ClerkAuthProviderProps {
  children: React.ReactNode
}

// Clerk authentication provider for user auth
// Admin routes will continue to use Supabase auth
export function ClerkAuthProvider({ children }: ClerkAuthProviderProps) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        variables: {
          colorPrimary: '#b12e2e', // Match your red theme
        },
      }}
      // Session configuration to prevent automatic logouts
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      // Clerk automatically refreshes tokens in the background
      // This prevents sessions from expiring while users are active
    >
      {children}
    </ClerkProvider>
  )
}