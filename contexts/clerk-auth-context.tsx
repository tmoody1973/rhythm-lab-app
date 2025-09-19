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
    >
      {children}
    </ClerkProvider>
  )
}